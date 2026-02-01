const { options } = require('pdfkit');
const { getAdmin } = require('../config/firebase');
const admin = getAdmin();
const db = admin.firestore();

async function getSkills() {
  const snapshot = await db.collection('skills').get();
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function getAssessment(skillId) {
  // assumes assessments are stored under 'assessments' collection with skillId
  const doc = await db.collection('assessments').doc(skillId).get();
  if (!doc.exists) return null;
  const data = doc.data();

  // Build a sanitized assessment object to send to the frontend
  const assessment = {
    id: doc.id,
    title: data.title,
    timeLimit: data.timeLimit,
    questions: []
  };

  if (Array.isArray(data.questions)) {
    assessment.questions = data.questions.map(q => {
      const base = {
        id: q.id,
        type: q.type,
        title: q.title,
        text: q.text || q.description || ''
      };

      if (q.difficulty) base.difficulty = q.difficulty;

      // MCQ questions: include only options (do NOT include 'correct')
      if (q.type === 'mcq') {
        base.options = q.options || [];
      }

      // Code questions: include code template / examples / constraints, but NOT testcases
      if (q.type === 'code') {
        base.initialCode = q.initialCode || q.template_code || q.initial_code || '';
        base.examples = q.examples || [];
        base.constraints = q.constraints || [];
      }

      return base;
    });
  }

  return assessment;
}

async function getHiddenTestCases(problemId) {
  // assumes testcases are stored as subcollection under problems/{id}/testcases
  const snapshot = await db.collection('problems').doc(problemId).collection('testcases').where('is_hidden', '==', true).get();
  if (snapshot.empty) return [];
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function getProblem(problemId) {
  const doc = await db.collection('problems').doc(problemId).get();
  return doc.exists ? { id: doc.id, ...doc.data() } : null;
}

// Fetch all testcases (visible and hidden) for a problem
async function getAllTestCases(problemId) {
  const snapshot = await db.collection('problems').doc(problemId).collection('testcases').get();
  if (snapshot.empty) return [];
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Return the raw assessment document (including answers/testcases) for grading
async function getAssessmentRaw(skillId) {
  const doc = await db.collection('assessments').doc(skillId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

module.exports = { getSkills, getAssessment, getHiddenTestCases, getProblem, getAssessmentRaw, getAllTestCases }; 
