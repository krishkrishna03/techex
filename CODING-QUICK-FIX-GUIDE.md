# Coding Interface - Quick Fix Guide

## ✅ Issues Fixed

### 1. **Default Code Problem** - FIXED
**Issue**: Clicking a coding question showed hardcoded "Two Sum" solution code
**Fix**: Now shows clean starter template based on selected language

### 2. **Code Not Running** - FIXED
**Issue**: Code execution wasn't working properly
**Fix**:
- Improved JavaScript execution with proper input/output handling
- Better error messages for unsupported languages
- Fixed console.log() capture

### 3. **Output Not Showing** - FIXED
**Issue**: Output panel wasn't displaying execution results
**Fix**: Backend now properly returns output and test results

## 🚀 How to Test Coding Interface

### Step 1: Create a Sample Coding Question

Run this command in the project root:

```bash
node create-sample-coding-question.js
```

This will:
- Create a simple "Sum of Two Numbers" coding question
- Add 5 test cases (1 sample, 4 hidden)
- Give you the question ID to use in tests

### Step 2: Use the Question ID in Your Test

When creating a test with coding section:

```javascript
{
  "testName": "Programming Test",
  "hasCodingSection": true,
  "codingQuestions": [
    {
      "_id": "PASTE_THE_ID_FROM_STEP_1_HERE",
      "title": "Sum of Two Numbers",
      "points": 50
    }
  ]
}
```

### Step 3: Test the Coding Interface

1. Start the test
2. Complete MCQ sections (if any)
3. Coding round will open automatically
4. Click on the coding question
5. You'll see:
   - Clean editor with just starter comments
   - Problem description on the left
   - Code editor on the right

### Step 4: Write and Run Code

**Sample Solution (JavaScript):**

```javascript
// Read two numbers
const a = parseInt(readline());
const b = parseInt(readline());

// Calculate sum
const sum = a + b;

// Print result
console.log(sum);
```

**How to use:**
1. Paste the code in the editor
2. Click "Run Code" to test with sample input
3. See output: "15" (for input 5 and 10)
4. Click "Submit" to run all test cases

## 📝 Supported Languages

### ✅ JavaScript (Fully Working)
- Input: Use `readline()` function
- Output: Use `console.log()`
- Execution: Runs in isolated VM with 5-second timeout

### ⏳ Python (Placeholder)
- Shows message: "Python execution requires Python runtime"
- To enable: Need to install Python runtime on server
- Alternative: Students can use JavaScript

### ⏳ Java/C++ (Placeholder)
- Shows message: "Requires runtime"
- To enable: Need compiler/runtime setup

## 🎨 UI Improvements

### Before:
- ❌ Hardcoded solution code appeared
- ❌ Confusing default code
- ❌ No clear starter template

### After:
- ✅ Clean editor with language-specific comments
- ✅ Clear starter template
- ✅ Problem title in comments
- ✅ Language changes update starter code

### Code Editor Features:
- Syntax highlighting
- Line numbers
- Auto-save every 10 seconds
- Fullscreen mode support
- Multi-language dropdown

## 🔧 Backend API Endpoints

### GET `/api/coding/questions/:id`
Fetches question details with test cases

### POST `/api/coding/run`
Runs code against sample test cases
```json
{
  "questionId": "question_id",
  "code": "your code here",
  "language": "javascript"
}
```

### POST `/api/coding/submit`
Submits code for evaluation
```json
{
  "questionId": "question_id",
  "code": "your code here",
  "language": "javascript",
  "testAttemptId": "optional_test_id",
  "isPractice": false
}
```

## 🐛 Troubleshooting

### Problem: "Loading coding question..." stays forever
**Cause**: Question doesn't exist in database
**Solution**: Run `create-sample-coding-question.js` first

### Problem: "Error fetching question"
**Cause**: Invalid question ID or database connection issue
**Solution**:
1. Check MongoDB connection
2. Verify question ID is correct
3. Check browser console for errors

### Problem: Code runs but shows no output
**Cause**: Code doesn't use console.log()
**Solution**: Make sure to use `console.log()` for output

### Problem: "Runtime Error" message
**Cause**: Syntax error or runtime exception in code
**Solution**:
1. Check for syntax errors
2. Make sure `readline()` is used for input
3. Check browser console for details

## 📊 Test Case Format

### Sample Test Case (Visible to students):
```javascript
{
  "input": "5\n10",           // Two numbers on separate lines
  "expected_output": "15",    // Expected result
  "is_sample": true,          // Visible to students
  "weight": 20               // 20% of total score
}
```

### Hidden Test Case:
```javascript
{
  "input": "100\n200",
  "expected_output": "300",
  "is_sample": false,        // Hidden from students
  "weight": 20
}
```

## ✨ New Features

1. **Smart Starter Code**: Different template for each language
2. **Language Switching**: Change language and get new starter code
3. **Better Error Messages**: Clear alerts when things go wrong
4. **Loading States**: Shows what's happening
5. **Input/Output Documentation**: Comments explain how to read input

## 🎯 Next Steps

1. ✅ JavaScript execution working
2. ⏳ Add Python support (requires server-side Python runtime)
3. ⏳ Add Java support (requires JDK)
4. ⏳ Add C++ support (requires g++)
5. ✅ Improve error handling
6. ✅ Clean UI with proper starter code

## 💡 Quick Test Checklist

- [ ] Run `create-sample-coding-question.js`
- [ ] Copy the question ID
- [ ] Create a test with that question ID
- [ ] Start the test as a student
- [ ] Complete MCQ sections
- [ ] Click on coding question
- [ ] Verify clean editor (no hardcoded solution)
- [ ] Write sample code
- [ ] Click "Run Code"
- [ ] See output "15"
- [ ] Click "Submit"
- [ ] See score and results

**Everything should work smoothly now!** 🎉
