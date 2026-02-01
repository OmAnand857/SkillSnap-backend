const axios = require('axios');

const SPHERE_BASE_URL = process.env.SPHERE_BASE_URL;
const SPHERE_TOKEN = process.env.SPHERE_TOKEN;

if (!SPHERE_BASE_URL) console.warn('SPHERE_BASE_URL not set. Sphere Engine calls will fail.');
if (!SPHERE_TOKEN) console.warn('SPHERE_TOKEN not set. Sphere Engine calls may be rejected.');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Map Sphere Engine status codes to Judge0-like descriptions
 * Common Sphere codes:
 * 0  -> queued
 * 1  -> running
 * 11 -> compilation error
 * 12 -> runtime error
 * 13 -> time limit exceeded
 * 15 -> accepted
 * 17 -> wrong answer
 */
function mapSphereStatus(code) {
  switch (code) {
    case 15: return 'Accepted';
    case 11: return 'Compilation Error';
    case 12: return 'Runtime Error';
    case 13: return 'Time Limit Exceeded';
    case 17: return 'Wrong Answer';
    default: return 'Unknown';
  }
}

/**
 * Submit source code to Sphere Engine and wait for result (polling)
 * Returns Judge0-like object:
 * {
 *   status: { description },
 *   stdout,
 *   stderr,
 *   compile_output,
 *   time,
 *   memory
 * }
 */
async function submitToSphere({
  source_code,
  language_id,
  stdin = '',
  timeout = 120000
}) {
  if (!SPHERE_BASE_URL) {
    throw new Error('Sphere Engine not configured (SPHERE_BASE_URL)');
  }
  if (!SPHERE_TOKEN) {
    throw new Error('Sphere Engine not configured (SPHERE_TOKEN)');
  }

  const base = SPHERE_BASE_URL.replace(/\/$/, '');
  const token = encodeURIComponent(SPHERE_TOKEN);

  // Sphere expects: source + compilerId
  const payload = {
    source: source_code,
    compilerId: parseInt(language_id, 10),
    stdin
  };

  // 1️⃣ Create submission
  const createRes = await axios.post(
    `${base}/submissions?access_token=${token}`,
    payload,
    { timeout: 15000 }
  );

  const submissionId = createRes.data?.id;
  if (!submissionId) {
    throw new Error('No submission id returned from Sphere Engine');
  }

  const start = Date.now();

  // 2️⃣ Poll until execution finishes
  while (Date.now() - start < timeout) {
    await sleep(1000);

    let res;
    try {
      res = await axios.get(
        `${base}/submissions/${submissionId}?access_token=${token}`,
        { timeout: 15000 }
      );
    } catch {
      continue; // transient error, retry
    }

    const data = res.data || {};
    const result = data.result || {};

    // Status code/name can appear in multiple places depending on Sphere version
    const statusCode = result.status?.code ?? data.status?.code ?? data.status?.id ?? null;
    const statusName = (result.status?.name || data.status?.name || '').toString().toLowerCase();

    // 0 = queued, 1 = running → keep polling
    if (statusCode === null || statusCode === 0 || statusCode === 1 || statusName === 'queued' || statusName === 'running') {
      continue;
    }

    // helper to robustly read stream/output shapes
    function readStreamField(field) {
      if (!field) return '';
      if (typeof field === 'string') return field;
      if (Array.isArray(field)) return field.map(f => (typeof f === 'string' ? f : JSON.stringify(f))).join('\n');
      if (typeof field === 'object') {
        // Sphere uses nested objects for streams like { output: '...', error: null }
        if (typeof field.output === 'string') return field.output;
        if (typeof field.text === 'string') return field.text;
        // fallback to JSON
        return JSON.stringify(field);
      }
      return '';
    }

    // Prefer result.streams where available (more detailed), then top-level fields
    const stdout = readStreamField(result.streams?.output) || data.stdout || result.output || data.output || '';
    const stderr = readStreamField(result.streams?.error) || data.stderr || result.error || data.error || '';
    const compile_output = readStreamField(result.streams?.cmpinfo) || data.compile_output || data.build?.stderr || result.compile_output || '';

    const time = (result.time ?? data.time ?? 0);
    const memory = (result.memory ?? data.memory ?? 0);

    // map status to normalized description (prefer code, but fall back to name)
    let description = 'Unknown';
    if (typeof statusCode === 'number') description = mapSphereStatus(statusCode);
    else if (statusName) {
      if (statusName.includes('accept')) description = 'Accepted';
      else if (statusName.includes('compil')) description = 'Compilation Error';
      else if (statusName.includes('runtime')) description = 'Runtime Error';
      else if (statusName.includes('time')) description = 'Time Limit Exceeded';
      else if (statusName.includes('wrong')) description = 'Wrong Answer';
    }

    return {
      status: { description },
      stdout,
      stderr,
      compile_output,
      time,
      memory
    };
  }

  throw new Error('Sphere Engine submission timed out');
}

module.exports = { submitToSphere };
