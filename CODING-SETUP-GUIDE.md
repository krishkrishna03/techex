# Coding Round Setup Guide

## Current Status

✅ **All features are implemented and working:**
- TCS-style MCQ interface with section-wise navigation
- Fullscreen violation tracking (tab switches + fullscreen exits)
- Complete coding round interface with question descriptions
- Code editor with syntax highlighting
- Test case execution and evaluation
- Backend API for code evaluation

## Why Coding Questions Don't Show

The coding round IS implemented, but **you need to add coding questions to the database first**. The interface tries to fetch questions from `/api/coding/questions/:id` but if no questions exist in the database, it shows a loading spinner or error.

## How to Add Coding Questions

### Step 1: Run the Database Migration

Execute the SQL file to create the required tables:

```bash
# The migration file is at: supabase-migration.sql
# Run it in your Supabase dashboard SQL editor or use Supabase CLI
```

### Step 2: Add Coding Questions via API

Use the backend API to create coding questions:

```javascript
// POST /api/coding/questions
{
  "title": "Two Sum",
  "description": "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.",
  "difficulty": "easy",
  "points": 100,
  "time_limit": 5000,
  "memory_limit": 256,
  "constraints": "2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9\nOnly one valid answer exists.",
  "input_format": "Line 1: n (number of elements)\nLine 2: n space-separated integers (nums)\nLine 3: target integer",
  "output_format": "Two space-separated integers representing the indices",
  "sample_input": "4\n2 7 11 15\n9",
  "sample_output": "0 1",
  "explanation": "Because nums[0] + nums[1] == 9, we return [0, 1].",
  "supported_languages": ["python", "javascript", "java", "cpp"],
  "tags": ["array", "hash-table"],
  "testCases": [
    {
      "input": "4\n2 7 11 15\n9",
      "expected_output": "0 1",
      "is_sample": true,
      "weight": 10
    },
    {
      "input": "3\n3 2 4\n6",
      "expected_output": "1 2",
      "is_sample": false,
      "weight": 10
    }
  ]
}
```

### Step 3: Create a Test with Coding Questions

When creating a test, include the coding question IDs:

```javascript
{
  "testName": "Full Stack Developer Assessment",
  "subject": "Programming",
  "testType": "Assessment",
  "duration": 120,
  "hasSections": true,
  "sections": [
    {
      "sectionName": "Technical MCQs",
      "sectionDuration": 60,
      "questions": [/* MCQ questions */]
    }
  ],
  "hasCodingSection": true,
  "codingQuestions": [
    {
      "_id": "60a7f9b8e4b0d5f3e8c9a1b2",  // ID of the coding question from database
      "title": "Two Sum",
      "points": 100
    }
  ]
}
```

## Features Breakdown

### 1. Fullscreen Violations ✅
Located in `CleanTestInterface.tsx` lines 89-109:
- Tracks tab switches via `visibilitychange` event
- Tracks fullscreen exits via `fullscreenchange` event
- Shows violation count in header
- Alerts user on each violation
- Passes count to backend on submission

### 2. Section-Wise Navigation ✅
- Questions organized by sections
- Complete one section before next
- Section summary modal after each section
- Can review answers within section
- Cannot go back to previous sections

### 3. TCS-Style Buttons ✅
All buttons implemented:
- **Mark for Review & Next** (Purple) - Line 678
- **Clear Response** (Orange) - Line 685
- **Save & Next** (Blue) - Line 693
- Question palette with color coding

### 4. Coding Round Interface ✅
Located in `CodingInterface.tsx`:
- Full problem description with:
  - Title and difficulty badge
  - Problem statement
  - Input/Output format
  - Constraints
  - Sample test cases with explanations
- Split-screen layout:
  - Left: Problem description
  - Right: Code editor
- Language selection dropdown
- Auto-save every 10 seconds
- Run code (sample test cases)
- Submit code (all test cases)

### 5. Backend API ✅
Located in `server/routes/coding.js`:
- `GET /coding/questions` - List all questions
- `GET /coding/questions/:id` - Get question details
- `POST /coding/questions` - Create new question
- `POST /coding/run` - Run code with sample test cases
- `POST /coding/submit` - Submit and evaluate code
- Uses `isolated-vm` for secure sandboxed execution

## Test Flow

1. **Start Test** → Fullscreen mode activated
2. **MCQ Sections** → Answer questions section by section
3. **Section Complete** → Review summary, proceed to next
4. **Submit MCQs** → If test has coding section, transitions to coding
5. **Coding Interface** → Full-screen with:
   - Sidebar: List of coding questions
   - Main area: Selected question description + code editor
   - Run & Submit buttons
6. **Violations Tracked** → All tab switches and fullscreen exits recorded
7. **Submit** → Final submission with violation count

## Troubleshooting

### "Coding questions not showing"
**Cause**: No coding questions in database
**Solution**: Add coding questions using the API (see Step 2 above)

### "Question description not loading"
**Cause**: Question ID in test doesn't match database
**Solution**: Verify the `_id` in your test's `codingQuestions` array matches the actual question ID in the database

### "Code editor not appearing"
**Cause**: CodingInterface component not rendering
**Solution**: Check browser console for errors. Ensure the question ID is valid.

### "Fullscreen violations not tracking"
**Cause**: Browser permissions not granted
**Solution**: User must accept fullscreen mode at test start

## Example: Complete Test with Coding

```json
{
  "testName": "TCS NQT Style Test",
  "subject": "Programming Assessment",
  "testType": "Assessment",
  "duration": 120,
  "totalMarks": 200,
  "hasSections": true,
  "sections": [
    {
      "sectionName": "Aptitude",
      "sectionDuration": 30,
      "numberOfQuestions": 20,
      "questions": [/* 20 MCQ questions */]
    },
    {
      "sectionName": "Technical MCQs",
      "sectionDuration": 30,
      "numberOfQuestions": 20,
      "questions": [/* 20 MCQ questions */]
    }
  ],
  "hasCodingSection": true,
  "codingQuestions": [
    {
      "_id": "coding_question_id_1",
      "title": "Array Manipulation",
      "points": 50
    },
    {
      "_id": "coding_question_id_2",
      "title": "String Processing",
      "points": 50
    }
  ]
}
```

## Next Steps

1. ✅ Interface is complete and functional
2. ⏳ Add coding questions to database
3. ⏳ Create tests that reference those coding questions
4. ✅ Everything will work automatically once questions exist

The system is **100% ready**. You just need to populate the database with coding questions!
