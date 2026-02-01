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
        id: 'javascript',
        name: 'JavaScript',
        icon: 'JS',
        difficulty: 'Intermediate',
        duration: 45,
        questions: 15,
        description: 'Test your knowledge of ES6+, closures, promises, and async programming.'
    },
    {
        id: 'python',
        name: 'Python',
        icon: 'PY',
        difficulty: 'Beginner',
        duration: 30,
        questions: 15,
        description: 'Assess your understanding of Python syntax, data structures, and algorithms.'
    },
    {
        id: 'java',
        name: 'Java',
        icon: '☕',
        difficulty: 'Intermediate',
        duration: 45,
        questions: 20,
        description: 'Test object-oriented programming, streams, and concurrency in Java.'
    },
    {
        id: 'cpp',
        name: 'C++',
        icon: 'C++',
        difficulty: 'Advanced',
        duration: 50,
        questions: 20,
        description: 'Memory management, pointers, STL, and object-oriented concepts.'
    },
    {
        id: 'c',
        name: 'C',
        icon: 'C',
        difficulty: 'Advanced',
        duration: 45,
        questions: 15,
        description: 'Low-level programming, pointers, memory addressing, and structures.'
    },
    {
        id: 'go',
        name: 'Go',
        icon: 'GO',
        difficulty: 'Intermediate',
        duration: 40,
        questions: 15,
        description: 'Goroutines, channels, interfaces, and concurrent programming.'
    },
    {
        id: 'rust',
        name: 'Rust',
        icon: '🦀',
        difficulty: 'Advanced',
        duration: 55,
        questions: 20,
        description: 'Ownership, borrowing, lifetimes, and safe concurrency.'
    },
    {
        id: 'typescript',
        name: 'TypeScript',
        icon: 'TS',
        difficulty: 'Intermediate',
        duration: 40,
        questions: 20,
        description: 'Static typing, interfaces, generics, and modern JS features.'
    },
    {
        id: 'php',
        name: 'PHP',
        icon: '🐘',
        difficulty: 'Beginner',
        duration: 35,
        questions: 20,
        description: 'Server-side scripting, array manipulation, and web integration.'
    },
    {
        id: 'csharp',
        name: 'C#',
        icon: 'C#',
        difficulty: 'Intermediate',
        duration: 45,
        questions: 20,
        description: 'Events, delegates, LINQ, and object-oriented design patterns.'
    },
    {
        id: 'react',
        name: 'React',
        icon: '⚛️',
        difficulty: 'Advanced',
        duration: 60,
        questions: 25,
        description: 'Validate your expertise in hooks, context, state management, and performance.'
    },
    {
        id: 'node',
        name: 'Node.js',
        icon: '🟢',
        difficulty: 'Advanced',
        duration: 50,
        questions: 35,
        description: 'Server-side JavaScript, APIs, event loop, and file system operations.'
    },
    {
        id: 'sql',
        name: 'SQL',
        icon: '🗃️',
        difficulty: 'Intermediate',
        duration: 45,
        questions: 30,
        description: 'Querying databases, joins, normalization, and optimization techniques.'
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
                examples: [{ input: "\"hello\"", output: "\"olleh\"" }],
                constraints: ["Input string will not be empty."],
                testcases: [{ input: "hello", expected_output: "olleh" }]
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
                examples: [{ input: "[1, 2, 3]", output: "6" }],
                constraints: ["List can be empty."],
                testcases: [{ input: "[1, 2, 3]", expected_output: "6" }]
            }
        ]
    },
    {
        id: "java",
        title: "Java Assessment",
        timeLimit: 2700,
        questions: [
            {
                id: "java_q1",
                type: "mcq",
                title: "Java Type",
                text: "Which of these is NOT a primitive type in Java?",
                options: ["int", "boolean", "String", "char"],
                correct: 2
            },
            {
                id: "java_q2",
                type: "code",
                title: "Add Two Numbers",
                text: "Write a method `public int add(int a, int b)` that returns the sum of a and b.",
                initialCode: "public class Solution {\n    public int add(int a, int b) {\n        // Your code here\n        return 0;\n    }\n}",
                examples: [{ input: "1, 2", output: "3" }],
                constraints: ["Values are integers."],
                testcases: [{ input: "1 2", expected_output: "3" }]
            }
        ]
    },
    {
        id: "cpp",
        title: "C++ Assessment",
        timeLimit: 3000,
        questions: [
            {
                id: "cpp_q1",
                type: "mcq",
                title: "Pointers",
                text: "What operator is used to get the address of a variable?",
                options: ["*", "&", "->", "."],
                correct: 1
            },
            {
                id: "cpp_q2",
                type: "code",
                title: "Max of Two",
                text: "Write a function `int max_of_two(int a, int b)` that returns the larger value.",
                initialCode: "int max_of_two(int a, int b) {\n    // Your code here\n}",
                examples: [{ input: "10, 20", output: "20" }],
                constraints: ["Integers only."],
                testcases: [{ input: "10 20", expected_output: "20" }]
            }
        ]
    },
    {
        id: "c",
        title: "C Assessment",
        timeLimit: 2700,
        questions: [
            {
                id: "c_q1",
                type: "mcq",
                title: "Preprocessor",
                text: "Which directive is used to include a header file?",
                options: ["#include", "#import", "#define", "#using"],
                correct: 0
            },
            {
                id: "c_q2",
                type: "code",
                title: "Multiply",
                text: "Write a function `int multiply(int a, int b)`.",
                initialCode: "int multiply(int a, int b) {\n    // Your code here\n}",
                examples: [{ input: "3, 4", output: "12" }],
                constraints: ["Integers."],
                testcases: [{ input: "3 4", expected_output: "12" }]
            }
        ]
    },
    {
        id: "go",
        title: "Go Assessment",
        timeLimit: 2400,
        questions: [
            {
                id: "go_q1",
                type: "mcq",
                title: "Exported Names",
                text: "How do you export a function in Go?",
                options: ["Capitalize first letter", "Use 'export' keyword", "Use 'public' keyword", "Annotate with @Export"],
                correct: 0
            },
            {
                id: "go_q2",
                type: "code",
                title: "Hello World",
                text: "Write a program that prints 'Hello World'.",
                initialCode: "package main\nimport \"fmt\"\nfunc main() {\n    // Your code here\n}",
                examples: [{ input: "", output: "Hello World" }],
                constraints: ["Exact string match."],
                testcases: [{ input: "", expected_output: "Hello World" }]
            }
        ]
    },
    {
        id: "rust",
        title: "Rust Assessment",
        timeLimit: 3300,
        questions: [
            {
                id: "rust_q1",
                type: "mcq",
                title: "Variables",
                text: "Variables in Rust are ___ by default.",
                options: ["Mutable", "Immutable", "Static", "Global"],
                correct: 1
            },
            {
                id: "rust_q2",
                type: "code",
                title: "Return 10",
                text: "Write a function `fn return_ten() -> i32`.",
                initialCode: "fn return_ten() -> i32 {\n    // Your code here\n}",
                examples: [{ input: "", output: "10" }],
                constraints: ["Return integer 10."],
                testcases: [{ input: "", expected_output: "10" }]
            }
        ]
    },
    {
        id: "typescript",
        title: "TypeScript Assessment",
        timeLimit: 2400,
        questions: [
            {
                id: "ts_q1",
                type: "mcq",
                title: "Type Annotation",
                text: "How do you specify a string type for variable `name`?",
                options: ["let name: string", "let name :: string", "string name", "var name(string)"],
                correct: 0
            },
            {
                id: "ts_q2",
                type: "code",
                title: "Typed Function",
                text: "Write a function `greet(name: string): string` that returns 'Hello ' + name.",
                initialCode: "function greet(name: string): string {\n  // Your code here\n}",
                examples: [{ input: "\"Alice\"", output: "\"Hello Alice\"" }],
                constraints: ["Strict types."],
                testcases: [{ input: "Alice", expected_output: "Hello Alice" }]
            }
        ]
    },
    {
        id: "php",
        title: "PHP Assessment",
        timeLimit: 2100,
        questions: [
            {
                id: "php_q1",
                type: "mcq",
                title: "Variables",
                text: "All variables in PHP start with which symbol?",
                options: ["$", "@", "%", "&"],
                correct: 0
            },
            {
                id: "php_q2",
                type: "code",
                title: "Echo",
                text: "Write a script that prints 'Hello PHP'.",
                initialCode: "<?php\n// Your code here\n?>",
                examples: [{ input: "", output: "Hello PHP" }],
                constraints: ["Exact string match."],
                testcases: [{ input: "", expected_output: "Hello PHP" }]
            }
        ]
    },
    {
        id: "csharp",
        title: "C# Assessment",
        timeLimit: 2700,
        questions: [
            {
                id: "cs_q1",
                type: "mcq",
                title: "Inheritance",
                text: "Which symbol is used to inherit from a class?",
                options: [":", "extends", "inherits", "->"],
                correct: 0
            },
            {
                id: "cs_q2",
                type: "code",
                title: "Add",
                text: "Write a method `public static int Add(int a, int b)`.",
                initialCode: "public class Program {\n    public static int Add(int a, int b) {\n        // Your code here\n        return 0;\n    }\n}",
                examples: [{ input: "5, 7", output: "12" }],
                constraints: ["Integers."],
                testcases: [{ input: "5 7", expected_output: "12" }]
            }
        ]
    },
    {
        id: "react",
        title: "React Assessment",
        timeLimit: 3600,
        questions: [
            {
                id: "react_q1",
                type: "mcq",
                title: "useEffect Dependency",
                text: "When does `useEffect` run if the dependency array is empty `[]`?",
                options: ["Every render", "Only on mount", "On mount and unmount", "Never"],
                correct: 1
            },
            {
                id: "react_q2",
                type: "mcq",
                title: "React State",
                text: "Which hook is used to manage state in a functional component?",
                options: ["useReducer", "useEffect", "useState", "useContext"],
                correct: 2
            }
        ]
    },
    {
        id: "node",
        title: "Node.js Assessment",
        timeLimit: 3000,
        questions: [
            {
                id: "node_q1",
                type: "mcq",
                title: "Event Loop",
                text: "Which phase of the event loop executes `setTimeout` callbacks?",
                options: ["Poll", "Check", "Timers", "Pending callbacks"],
                correct: 2
            },
            {
                id: "node_q2",
                type: "code",
                title: "Simple Server",
                text: "Write a function `createServerHandler(req, res)` that sends 'Hello World' as response.",
                initialCode: "function createServerHandler(req, res) {\n  // Your code here\n}",
                examples: [{ input: "GET /", output: "Hello World" }],
                constraints: ["Use res.end() to send response."],
                testcases: [{ input: "GET /", expected_output: "Hello World" }]
            }
        ]
    },
    {
        id: "sql",
        title: "SQL Assessment",
        timeLimit: 2700,
        questions: [
            {
                id: "sql_q1",
                type: "mcq",
                title: "Select Statement",
                text: "Which keyword is used to retrieve unique records?",
                options: ["UNIQUE", "DISTINCT", "DIFFERENT", "SINGLE"],
                correct: 1
            },
            {
                id: "sql_q2",
                type: "code",
                title: "Count Users",
                text: "Write a query to count the number of users in the 'users' table.",
                initialCode: "-- Write your SQL query here\nSELECT ...",
                examples: [{ input: "Table users exists", output: "Count of users" }],
                constraints: ["Return a single number."],
                testcases: [{ input: "generic_test", expected_output: "generic_result" }]
            }
        ]
    }
];
const PROBLEMS = [
    { id: "js_q2", time_limit: 2, memory_limit: 128000, testcases: [{ input: "hello", expected_output: "olleh" }] },
    { id: "py_q2", time_limit: 2, memory_limit: 128000, testcases: [{ input: "[1, 2, 3]", expected_output: "6" }] },
    { id: "java_q2", time_limit: 2, memory_limit: 128000, testcases: [{ input: "1 2", expected_output: "3" }] },
    { id: "cpp_q2", time_limit: 2, memory_limit: 128000, testcases: [{ input: "10 20", expected_output: "20" }] },
    { id: "c_q2", time_limit: 2, memory_limit: 128000, testcases: [{ input: "3 4", expected_output: "12" }] },
    { id: "go_q2", time_limit: 2, memory_limit: 128000, testcases: [{ input: "", expected_output: "Hello World" }] },
    { id: "rust_q2", time_limit: 2, memory_limit: 128000, testcases: [{ input: "", expected_output: "10" }] },
    { id: "ts_q2", time_limit: 2, memory_limit: 128000, testcases: [{ input: "Alice", expected_output: "Hello Alice" }] },
    { id: "php_q2", time_limit: 2, memory_limit: 128000, testcases: [{ input: "", expected_output: "Hello PHP" }] },
    { id: "cs_q2", time_limit: 2, memory_limit: 128000, testcases: [{ input: "5 7", expected_output: "12" }] },
    { id: "node_q2", time_limit: 2, memory_limit: 128000, testcases: [{ input: "GET /", expected_output: "Hello World" }] },
    { id: "sql_q2", time_limit: 2, memory_limit: 128000, testcases: [{ input: "SELECT count(*) FROM users", expected_output: "10" }] }
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
            const tcDoc = { stdin: tc.input, expected_output: tc.expected_output, is_hidden: tc.is_hidden || false };
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