const { getAssessment } = require('../models/problemModel');
const { admin } = require('../config/firebase');
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

async function submitAssessment(req, res) {
  const { skillId } = req.params;
  const uid = req.user && req.user.uid;
  if (!uid) return res.status(401).json({ error: 'Auth required' });
  const { answers } = req.body;
  try {
    const docRef = await db.collection('submissions').add({ userId: uid, skillId, answers: answers || {}, createdAt: new Date() });
    return res.json({ ok: true, id: docRef.id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to save submission' });
  }
}

module.exports = { getAssessmentHandler, submitAssessment };
