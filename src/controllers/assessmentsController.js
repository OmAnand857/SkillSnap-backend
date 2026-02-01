const { getAssessment, getAssessmentRaw, getHiddenTestCases, getAllTestCases } = require('../models/problemModel');
const { submitToSphere } = require('../services/sphere');
const { admin } = require('../config/firebase');
const { uploadCertificate, createSignedUrl, getPublicUrl } = require('../services/supabase');
const PDFDocument = require('pdfkit');

const db = admin.firestore();

async function getAssessmentHandler(req, res) {
  const { skillId } = req.params;
  try {
    const assessment = await getAssessment(skillId);
    if (!assessment) return res.status(404).json({ error: 'Assessment not found' });
    return res.json({ assessment });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch assessment' });
  }
}

function generateCertificatePdf({ userName, skillName, dateIssued, verifiedId }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.fontSize(20).text('SkillSnap Certificate', { align: 'center' });
    doc.moveDown(2);
    doc.fontSize(14).text(`Awarded to: ${userName}`, { align: 'center' });
    doc.moveDown(1);
    doc.fontSize(12).text(`For skill: ${skillName}`, { align: 'center' });
    doc.moveDown(1);
    doc.text(`Date: ${dateIssued}`, { align: 'center' });
    doc.moveDown(2);
    doc.fontSize(10).text(`Verified ID: ${verifiedId}`, { align: 'center' });
    doc.end();
  });
}

async function submitAssessment(req, res) {
  const { skillId } = req.params;
  const uid = req.user && req.user.uid;
  if (!uid) return res.status(401).json({ error: 'Auth required' });
  const { answers } = req.body;

  if (!answers || typeof answers !== 'object') return res.status(400).json({ error: 'answers object is required' });

  try {
    // fetch raw assessment (includes correct answers / meta)
    const assessment = await getAssessmentRaw(skillId);
    if (!assessment) return res.status(404).json({ error: 'Assessment not found' });

    const totalQuestions = Array.isArray(assessment.questions) ? assessment.questions.length : 0;
    const results = [];
    let score = 0;

    for (const q of (assessment.questions || [])) {
      const qId = q.id;
      const userAnswer = answers[qId];

      if (q.type === 'mcq') {
        const correctIndex = typeof q.correct !== 'undefined' ? q.correct : null;
        const correct = typeof userAnswer !== 'undefined' && correctIndex !== null && userAnswer === correctIndex;
        if (correct) score += 1;
        results.push({ questionId: qId, correct });
      } else if (q.type === 'code') {
        // userAnswer can be string (source) or object { source, language_id }
        let source_code = null;
        let language_id = null;
        if (!userAnswer) {
          results.push({ questionId: qId, correct: false, message: 'No code submitted' });
          continue;
        }

        if (typeof userAnswer === 'string') {
          source_code = userAnswer;
          // allow default language from env per skill/question (optional)
          language_id = process.env.DEFAULT_LANGUAGE_ID ? parseInt(process.env.DEFAULT_LANGUAGE_ID) : null;
        } else if (typeof userAnswer === 'object') {
          source_code = userAnswer.source || userAnswer.code || userAnswer.source_code || null;
          language_id = userAnswer.language_id || null;
        }

        if (!source_code) {
          results.push({ questionId: qId, correct: false, message: 'Submitted answer missing source code' });
          continue;
        }

        if (!language_id) {
          return res.status(400).json({ error: `Missing language_id for code question ${qId}. Provide { source, language_id } for code answers or set DEFAULT_LANGUAGE_ID in env.` });
        }

        // run against hidden testcases (fallback to visible testcases if none configured)
        const hidden = await getHiddenTestCases(qId);
        let testcases = hidden;
        if (!hidden || hidden.length === 0) {
          const all = await getAllTestCases(qId);
          if (!all || all.length === 0) {
            results.push({ questionId: qId, correct: false, message: 'No test cases configured for this question' });
            continue;
          }
          testcases = all;
        }

        let allPassed = true;
        let failMessage = null;

        for (let i = 0; i < testcases.length; i++) {
          const tc = testcases[i];
          try {
            const jRes = await submitToSphere({ source_code, language_id, stdin: tc.stdin || '' });
            const statusDesc = jRes && jRes.status && jRes.status.description ? jRes.status.description : 'Unknown';
            if (statusDesc !== 'Accepted') {
              allPassed = false;
              failMessage = `Failed on test case ${i + 1} (${statusDesc})`;
              break;
            }
          } catch (e) {
            console.error('Sphere Engine error', e.response ? e.response.data : e.message);
            allPassed = false;
            failMessage = `Execution error: ${e.message || 'sphere engine error'}`;
            break;
          }
        }

        if (allPassed) score += 1;
        const entry = { questionId: qId, correct: allPassed };
        if (failMessage) entry.message = failMessage;
        results.push(entry);
      } else {
        // unknown question type - mark as incorrect
        results.push({ questionId: qId, correct: false, message: 'Unknown question type' });
      }
    }

    const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

    // persist submission
    const savedRef = await db.collection('submissions').add({ userId: uid, skillId, answers: answers || {}, score, totalQuestions, percentage, results, createdAt: new Date() });

    let cert = null;
    const threshold = process.env.CERTIFICATE_THRESHOLD ? parseInt(process.env.CERTIFICATE_THRESHOLD) : 70;
    if (percentage >= threshold) {
      try {
        const userName = req.user && (req.user.name || req.user.email) ? (req.user.name || req.user.email) : 'Anonymous';
        const skillName = assessment.title || skillId;
        const issuedAt = new Date().toISOString();
        const verifiedId = `${skillId}-${uid}-${Date.now().toString(36)}`;

        // create Firestore cert doc
        const certRef = await db.collection('certificates').add({ userId: uid, userName, skillId, skillName, issuedAt, verifiedId, storagePath: null });
        const certId = certRef.id;
        const pdfBuffer = await generateCertificatePdf({ userName, skillName, dateIssued: issuedAt, verifiedId });

        const bucket = process.env.SUPABASE_CERT_BUCKET || 'certificates';
        const path = `certificates/${certId}.pdf`;
        await uploadCertificate(bucket, path, pdfBuffer);

        let url = null;
        try {
          url = await createSignedUrl(bucket, path, 60 * 60 * 24 * 7);
        } catch (e) {
          url = getPublicUrl(bucket, path);
        }

        await certRef.update({ storagePath: path, url });
        cert = { id: certId, url, verifiedId };
      } catch (e) {
        console.error('certificate generation failed', e);
      }
    }

    return res.json({ score, totalQuestions, percentage, results, submissionId: savedRef.id, certificate: cert });
  } catch (err) {
    console.error(err.response ? err.response.data : err.message || err);
    return res.status(500).json({ error: 'Failed to process submission' });
  }
}

module.exports = { getAssessmentHandler, submitAssessment };
