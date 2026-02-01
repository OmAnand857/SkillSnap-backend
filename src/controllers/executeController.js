const { validationResult } = require('express-validator');
const { getHiddenTestCases, getAllTestCases, getProblem } = require('../models/problemModel');
const { submitToSphere } = require('../services/sphere');

function decodeBase64(str) {
  if (!str) return null;
  try {
    return Buffer.from(str, 'base64').toString('utf8');
  } catch (e) {
    return null;
  }
}

function unifyStatus(statusObj) {
  // judge0 status descriptions: Accepted, Wrong Answer, Compilation Error, Runtime Error
  return statusObj && statusObj.description ? statusObj.description : 'Unknown';
}

async function execute(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { language_id, source_code, question_id } = req.body;
  if (!source_code || source_code.length > 100000) return res.status(400).json({ error: 'source_code required and must be <100k chars' });
  try {
    // fetch hidden testcases (fallback to visible testcases if none configured)
    const problem = await getProblem(question_id);
    if (!problem) return res.status(404).json({ error: 'Question not found' });

    const hidden = await getHiddenTestCases(question_id);
    let testcases = hidden;
    if (!hidden || hidden.length === 0) {
      const all = await getAllTestCases(question_id);
      if (!all || all.length === 0) return res.status(400).json({ error: 'No test cases found for this question' });
      testcases = all;
    }
    // run each testcase and aggregate
    const results = [];
    for (const tc of testcases) {
      console.log('Executing testcase', tc);
      const stdin = tc.stdin || '';
      console.log(source_code, language_id, stdin);
      const jRes = await submitToSphere({ source_code, language_id, stdin });
      console.log('Sphere response', jRes);
      // Sphere returns plaintext fields (not base64 encoded). Normalize them.
      // NOTE: we intentionally DO NOT include stdout in the response payload to the client.
      const stderr = jRes.stderr || '';
      const compile_output = jRes.compile_output || '';

      results.push({
        testcase_id: tc.id,
        status: unifyStatus(jRes.status),
        // stdout intentionally omitted
        stderr,
        compile_output,
        execution_time: jRes.time,
        memory: jRes.memory,
      });
    }

    // determine overall status
    const allAccepted = results.every(r => r.status === 'Accepted');
    const overall = allAccepted ? 'Accepted' : 'Wrong Answer';

    return res.json({ status: overall, results });
  } catch (err) {
    console.error('execute error', err.response ? err.response.data : err.message);
    return res.status(500).json({ error: 'Execution failed' });
  }
}

module.exports = { execute };
