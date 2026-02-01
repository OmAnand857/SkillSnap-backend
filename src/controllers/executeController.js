const { validationResult } = require('express-validator');
const { getHiddenTestCases, getProblem } = require('../models/problemModel');
const { submitToJudge0 } = require('../services/judge0');

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
    // fetch hidden testcases
    const problem = await getProblem(question_id);
    if (!problem) return res.status(404).json({ error: 'Question not found' });

    const hidden = await getHiddenTestCases(question_id);
    if (!hidden || hidden.length === 0) return res.status(400).json({ error: 'No hidden test cases found for this question' });

    // run each hidden testcase and aggregate
    const results = [];
    for (const tc of hidden) {
      const stdin = tc.stdin || '';
      const jRes = await submitToJudge0({ source_code, language_id, stdin });
      // decode outputs
      const stdout = decodeBase64(jRes.stdout);
      const stderr = decodeBase64(jRes.stderr);
      const compile_output = decodeBase64(jRes.compile_output);

      results.push({
        testcase_id: tc.id,
        status: unifyStatus(jRes.status),
        stdout,
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
