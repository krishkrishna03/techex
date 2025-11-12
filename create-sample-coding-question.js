/**
 * Sample Script to Create a Coding Question
 *
 * Run this to add a sample coding question to your database
 * Usage: node create-sample-coding-question.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const CodingQuestion = require('./server/models/CodingQuestion');
const CodingTestCase = require('./server/models/CodingTestCase');

const sampleQuestion = {
  title: "Sum of Two Numbers",
  description: `Write a function that takes two numbers as input and returns their sum.

This is a simple problem to test the coding interface.`,
  difficulty: "easy",
  points: 50,
  time_limit: 5000,
  memory_limit: 256,
  constraints: "1 <= a, b <= 1000",
  input_format: "Two integers on separate lines",
  output_format: "Single integer (sum of the two numbers)",
  sample_input: "5\n10",
  sample_output: "15",
  explanation: "5 + 10 = 15",
  supported_languages: ["javascript", "python"],
  tags: ["easy", "math", "basics"],
  created_by: null
};

const testCases = [
  {
    input: "5\n10",
    expected_output: "15",
    is_sample: true,
    weight: 20
  },
  {
    input: "100\n200",
    expected_output: "300",
    is_sample: false,
    weight: 20
  },
  {
    input: "0\n0",
    expected_output: "0",
    is_sample: false,
    weight: 20
  },
  {
    input: "999\n1",
    expected_output: "1000",
    is_sample: false,
    weight: 20
  },
  {
    input: "50\n50",
    expected_output: "100",
    is_sample: false,
    weight: 20
  }
];

async function createSampleQuestion() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('Connected to MongoDB');

    // Check if question already exists
    const existing = await CodingQuestion.findOne({ title: sampleQuestion.title });
    if (existing) {
      console.log('Sample question already exists with ID:', existing._id);
      console.log('You can use this ID in your test setup');
      process.exit(0);
    }

    // Create the question
    const question = new CodingQuestion(sampleQuestion);
    await question.save();

    console.log('✅ Coding Question Created!');
    console.log('Question ID:', question._id);
    console.log('Title:', question.title);

    // Create test cases
    const testCasesData = testCases.map(tc => ({
      question_id: question._id,
      ...tc
    }));

    await CodingTestCase.insertMany(testCasesData);
    console.log(`✅ ${testCases.length} test cases created`);

    console.log('\n=================================');
    console.log('Sample JavaScript Solution:');
    console.log('=================================');
    console.log(`
// Read input
const a = parseInt(readline());
const b = parseInt(readline());

// Calculate sum
const sum = a + b;

// Output result
console.log(sum);
    `);

    console.log('\n=================================');
    console.log('How to use this question:');
    console.log('=================================');
    console.log('1. Copy this question ID:', question._id);
    console.log('2. When creating a test, add to codingQuestions array:');
    console.log(`   {
     "_id": "${question._id}",
     "title": "${question.title}",
     "points": ${question.points}
   }`);
    console.log('3. Students can now attempt this coding question!');

    process.exit(0);
  } catch (error) {
    console.error('Error creating sample question:', error);
    process.exit(1);
  }
}

createSampleQuestion();
