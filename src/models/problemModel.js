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
  // For each question, do not include hidden test cases
  if (data.questions && Array.isArray(data.questions)) {
    data.questions = data.questions.map(q => ({
      id: q.id,
      title: q.title,
      description: q.description,
      difficulty: q.difficulty,
      template_code: q.template_code,
      // do not include hidden test cases
      testcases: (q.testcases || []).filter(t => !t.is_hidden).map(t => ({ stdin: t.stdin, expected_output: t.expected_output }))
    }));
  }
  return data;
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

module.exports = { getSkills, getAssessment, getHiddenTestCases, getProblem };
