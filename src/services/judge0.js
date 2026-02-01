const axios = require('axios');

const JUDGE0_URL = process.env.JUDGE0_URL;
const JUDGE0_KEY = process.env.JUDGE0_KEY;

if (!JUDGE0_URL) console.warn('JUDGE0_URL not set. Judge0 calls will fail.');

async function submitToJudge0({ source_code, language_id, stdin }) {
  // base64 encode since we will call with base64_encoded=true
  const payload = {
    source_code: Buffer.from(source_code || '', 'utf8').toString('base64'),
    language_id,
    stdin: stdin ? Buffer.from(stdin, 'utf8').toString('base64') : undefined,
  };

  const headers = { 'Content-Type': 'application/json' };
  if (JUDGE0_KEY) headers['X-RapidAPI-Key'] = JUDGE0_KEY;

  const url = `${JUDGE0_URL.replace(/\/$/, '')}/submissions/?base64_encoded=true&wait=true`;

  const res = await axios.post(url, payload, { headers, timeout: 120000 });
  return res.data;
}

module.exports = { submitToJudge0 };
