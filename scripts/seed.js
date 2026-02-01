/*
  Full seeding script for development. Seeds `skills`, `assessments`, and `problems`.
  Usage: `node scripts/seed.js` (ensure `.env` + Firebase creds are present and Firestore reachable)
*/
require('dotenv').config();
const { getAdmin } = require('../src/config/firebase');
const admin = getAdmin();
const db = admin.firestore();

// --- DATA DEFINITIONS ---
const SKILLS = [
  {
    id: "javascript",
    name: "JavaScript",
    icon: "JS",
    difficulty: "Intermediate",
    duration: 45,
    questions: 10,
    description: "Test your knowledge of ES6+, closures, promises, and async programming."
  },
  {
    id: "python",
    name: "Python",
    icon: "PY",
    difficulty: "Beginner",
    duration: 30,
    questions: 10,
    description: "Assess your understanding of Python syntax, data structures, and algorithms."
  },
  {
    id: "react",
    name: "React",
    icon: "⚛️",
    difficulty: "Advanced",
    duration: 60,
    questions: 25,
    description: "Validate your expertise in hooks, context, and state management."
  }
];

const ASSESSMENTS = [
  {
    id: "javascript",
    title: "JavaScript Assessment",
    timeLimit: 2700,
    questions: [
      {
        id: "js_q1",
        type: "mcq",
        title: "Array Methods",
        text: "Which method creates a new array with all elements that pass the test implemented by the provided function?",
        options: ["forEach()", "map()", "filter()", "reduce()"],
        correct: 2
      },
      {
        id: "js_q2",
        type: "code",
        title: "Reverse String",
        text: "Write a function `reverseString(str)` that returns the reversed string.",
        initialCode: "function reverseString(str) {\n  // Your code here\n}",
        examples: [ { input: "\"hello\"", output: "\"olleh\"" } ],
        constraints: ["Input string will not be empty."],
        testcases: [ { input: "hello", expected_output: "olleh", is_hidden: false } ]
      }
    ]
  },
  {
    id: "python",
    title: "Python Assessment",
    timeLimit: 1800,
    questions: [
      {
        id: "py_q1",
        type: "mcq",
        title: "List Comprehension",
        text: "What is the output of `[x*2 for x in range(3)]`?",
        options: ["[0, 1, 2]", "[0, 2, 4]", "[2, 4, 6]", "Syntax Error"],
        correct: 1
      },
      {
        id: "py_q2",
        type: "code",
        title: "Sum of List",
        text: "Write a function `sum_list(nums)` that returns the sum of all numbers in the list.",
        initialCode: "def sum_list(nums):\n    # Your code here\n    pass",
        examples: [ { input: "[1, 2, 3]", output: "6" } ],
        constraints: ["List can be empty."],
        testcases: [ { input: "[1, 2, 3]", expected_output: "6", is_hidden: false } ]
      }
    ]
  }
];

const PROBLEMS = [
  {
    id: "js_q2",
    time_limit: 2.0,
    memory_limit: 128000,
    testcases: [
      { input: "hello", expected_output: "olleh", is_hidden: false },
      { input: "world", expected_output: "dlrow", is_hidden: true },
      { input: "12345", expected_output: "54321", is_hidden: true }
    ]
  },
  {
    id: "py_q2",
    time_limit: 2.0,
    memory_limit: 128000,
    testcases: [
      { input: "[1, 2, 3]", expected_output: "6", is_hidden: false },
      { input: "[10, -5, 5]", expected_output: "10", is_hidden: true },
      { input: "[]", expected_output: "0", is_hidden: true }
    ]
  }
];

// --- SEEDING LOGIC ---
async function seedCollection(collectionName, data) {
  const batch = db.batch();
  console.log(`Seeding ${collectionName}...`);
  data.forEach(item => {
    const docRef = db.collection(collectionName).doc(item.id);
    batch.set(docRef, item);
  });
  await batch.commit();
  console.log(`✅ ${collectionName} seeded successfully.`);
}

async function seedProblems(problems) {
  console.log('Seeding problems and testcases...');
  for (const p of problems) {
    const { testcases = [], ...meta } = p;
    const docRef = db.collection('problems').doc(p.id);
    await docRef.set(meta);

    for (const tc of testcases) {
      // normalize to expected field names used by the execution flow
      const tcDoc = { stdin: tc.input, expected_output: tc.expected_output, is_hidden: tc.is_hidden };
      await docRef.collection('testcases').add(tcDoc);
    }
  }
  console.log('✅ problems seeded successfully.');
}

async function run() {
  try {
    await seedCollection('skills', SKILLS);
    await seedCollection('assessments', ASSESSMENTS);
    await seedProblems(PROBLEMS);
    console.log('🎉 Database seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

run();