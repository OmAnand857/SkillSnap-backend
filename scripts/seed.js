/*
  Quick script to add a sample problem and hidden test cases to Firestore for local testing.
  Run with: node scripts/seed.js (ensure .env + Firebase creds are present)
*/
require('dotenv').config();
const { initFirebase, admin } = require('../src/config/firebase');
initFirebase();

async function run() {
  const db = admin.firestore();
  const probRef = db.collection('problems').doc('sample-1');
  await probRef.set({ title: 'Echo', description: 'Print input', difficulty: 'easy' });
  const tcs = [
    { stdin: 'hello', expected_output: 'hello\n', is_hidden: true },
    { stdin: 'world', expected_output: 'world\n', is_hidden: true }
  ];
  for (const tc of tcs) {
    await probRef.collection('testcases').add(tc);
  }
  console.log('Seeded sample-1 problem');
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
