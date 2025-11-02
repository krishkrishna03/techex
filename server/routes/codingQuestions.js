const express = require('express');
const router = express.Router();
const multer = require('multer');
const csvParser = require('csv-parser');
const { Readable } = require('stream');
const { auth, authorize } = require('../middleware/auth');
const CodingQuestion = require('../models/CodingQuestion');
const CodingTestCase = require('../models/CodingTestCase');

const upload = multer({
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Bulk upload coding questions
router.post('/bulk-upload', auth, authorize('master_admin'), upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Please upload a CSV or JSON file' });
  }

  try {
    let questions;
    
    if (req.file.originalname.endsWith('.json')) {
      // Parse JSON file
      const jsonContent = req.file.buffer.toString();
      questions = JSON.parse(jsonContent);
      
      if (!Array.isArray(questions)) {
        questions = [questions];
      }
    } else if (req.file.originalname.endsWith('.csv')) {
      // Parse CSV file
      questions = [];
      await new Promise((resolve, reject) => {
        const stream = Readable.from(req.file.buffer.toString());
        stream
          .pipe(csvParser())
          .on('data', (row) => {
            // Convert CSV row to question object
            const question = {
              title: row.title,
              description: row.description,
              difficulty: row.difficulty?.toLowerCase() || 'medium',
              constraints: row.constraints,
              input_format: row.input_format,
              output_format: row.output_format,
              sample_input: row.sample_input,
              sample_output: row.sample_output,
              explanation: row.explanation,
              tags: row.tags?.split(',').map(tag => tag.trim()) || [],
              time_limit: parseInt(row.time_limit) || 3000,
              memory_limit: parseInt(row.memory_limit) || 512,
              test_cases: []
            };

            // Parse test cases if provided
            if (row.test_cases) {
              try {
                question.test_cases = JSON.parse(row.test_cases);
              } catch (e) {
                console.warn(`Invalid test cases JSON for question: ${row.title}`);
              }
            }

            questions.push(question);
          })
          .on('end', resolve)
          .on('error', reject);
      });
    } else {
      return res.status(400).json({ error: 'Invalid file format. Please upload CSV or JSON file.' });
    }

    // Validate and save questions
    const results = {
      total: questions.length,
      successful: 0,
      failed: 0,
      errors: []
    };

    for (const q of questions) {
      try {
        // Basic validation
        if (!q.title || !q.description) {
          throw new Error('Title and description are required');
        }

        // Create question
        const question = new CodingQuestion({
          title: q.title,
          description: q.description,
          difficulty: q.difficulty || 'medium',
          constraints: q.constraints,
          input_format: q.input_format,
          output_format: q.output_format,
          sample_input: q.sample_input,
          sample_output: q.sample_output,
          explanation: q.explanation,
          tags: q.tags || [],
          time_limit: q.time_limit || 3000,
          memory_limit: q.memory_limit || 512,
          created_by: req.user.id
        });

        await question.save();

        // Add test cases if provided
        if (q.test_cases && Array.isArray(q.test_cases)) {
          const testCases = q.test_cases.map(tc => ({
            question_id: question._id,
            input: tc.input,
            expected_output: tc.expected_output,
            is_sample: tc.is_sample || false,
            weight: tc.weight || 1
          }));

          await CodingTestCase.insertMany(testCases);
        }

        results.successful++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          title: q.title || 'Unknown question',
          error: error.message
        });
      }
    }

    res.json({
      message: 'Bulk upload completed',
      results
    });
  } catch (error) {
    console.error('Bulk upload error:', error);
    res.status(500).json({ error: 'Failed to process file' });
  }
});

// Get coding question by ID with test cases
router.get('/:id/edit', auth, authorize(['master_admin', 'college_admin']), async (req, res) => {
  try {
    const question = await CodingQuestion.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    const testCases = await CodingTestCase.find({ question_id: question._id });

    res.json({
      question: {
        id: question._id,
        title: question.title,
        description: question.description,
        difficulty: question.difficulty,
        constraints: question.constraints,
        input_format: question.input_format,
        output_format: question.output_format,
        sample_input: question.sample_input,
        sample_output: question.sample_output,
        explanation: question.explanation,
        tags: question.tags,
        time_limit: question.time_limit,
        memory_limit: question.memory_limit
      },
      testCases: testCases.map(tc => ({
        id: tc._id,
        input: tc.input,
        expected_output: tc.expected_output,
        is_sample: tc.is_sample,
        weight: tc.weight
      }))
    });
  } catch (error) {
    console.error('Get question error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;