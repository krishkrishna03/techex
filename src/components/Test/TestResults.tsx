import React from 'react';
import { CheckCircle, XCircle, Clock, Award, BarChart3 } from 'lucide-react';

interface QuestionAnalysis {
  questionText: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: string;
  studentAnswer: string;
  isCorrect: boolean;
  marksObtained: number;
  marks: number;
}

interface TestResultsProps {
  results: {
    testId: {
      testName: string;
      subject: string;
      totalMarks: number;
    };
    totalMarks: number;
    marksObtained: number;
    percentage: number;
    correctAnswers: number;
    incorrectAnswers: number;
    timeSpent: number;
    submittedAt: string;
    questionAnalysis: QuestionAnalysis[];
  };
  onClose: () => void;
}

const TestResults: React.FC<TestResultsProps> = ({ results, onClose }) => {
  const getGrade = (percentage: number) => {
    if (percentage >= 90) return { grade: 'A+', color: 'text-green-600' };
    if (percentage >= 80) return { grade: 'A', color: 'text-green-600' };
    if (percentage >= 70) return { grade: 'B+', color: 'text-blue-600' };
    if (percentage >= 60) return { grade: 'B', color: 'text-blue-600' };
    if (percentage >= 50) return { grade: 'C', color: 'text-yellow-600' };
    return { grade: 'F', color: 'text-red-600' };
  };

  const grade = getGrade(results.percentage);

  const getPerformanceMessage = (percentage: number) => {
    if (percentage >= 90) return "Excellent performance! Outstanding work!";
    if (percentage >= 80) return "Great job! Very good performance!";
    if (percentage >= 70) return "Good work! Keep it up!";
    if (percentage >= 60) return "Satisfactory performance. Room for improvement.";
    if (percentage >= 50) return "Average performance. More practice needed.";
    return "Below average. Significant improvement required.";
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <div className="mb-4">
            <Award className={`w-16 h-16 mx-auto ${grade.color}`} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Test Results</h1>
          <h2 className="text-xl text-gray-700 mb-4">{results.testId.testName}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{results.marksObtained}</div>
              <div className="text-sm text-gray-600">Marks Obtained</div>
              <div className="text-xs text-gray-500">out of {results.totalMarks}</div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className={`text-2xl font-bold ${grade.color}`}>{results.percentage.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Percentage</div>
              <div className={`text-xs font-medium ${grade.color}`}>Grade: {grade.grade}</div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{results.correctAnswers}</div>
              <div className="text-sm text-gray-600">Correct Answers</div>
              <div className="text-xs text-gray-500">out of {results.questionAnalysis.length}</div>
            </div>
            
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{results.timeSpent}</div>
              <div className="text-sm text-gray-600">Time Spent</div>
              <div className="text-xs text-gray-500">minutes</div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-lg font-medium text-gray-800">
              {getPerformanceMessage(results.percentage)}
            </p>
          </div>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <BarChart3 size={20} />
          Performance Summary
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Answer Distribution</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-600" />
                  <span className="text-sm">Correct Answers</span>
                </div>
                <span className="font-medium text-green-600">{results.correctAnswers}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle size={16} className="text-red-600" />
                  <span className="text-sm">Incorrect Answers</span>
                </div>
                <span className="font-medium text-red-600">{results.incorrectAnswers}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Test Information</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subject:</span>
                <span className="font-medium">{results.testId.subject}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Questions:</span>
                <span className="font-medium">{results.questionAnalysis.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Submitted:</span>
                <span className="font-medium">
                  {new Date(results.submittedAt).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Question-wise Analysis */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Question-wise Analysis</h3>
        
        <div className="space-y-4">
          {results.questionAnalysis.map((question, index) => (
            <div
              key={index}
              className={`border rounded-lg p-4 ${
                question.isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <h4 className="font-medium text-gray-900">
                  {index + 1}. {question.questionText}
                </h4>
                <div className="flex items-center gap-2">
                  {question.isCorrect ? (
                    <CheckCircle size={20} className="text-green-600" />
                  ) : (
                    <XCircle size={20} className="text-red-600" />
                  )}
                  <span className="text-sm font-medium">
                    {question.marksObtained}/{question.marks}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                {Object.entries(question.options).map(([key, value]) => (
                  <div
                    key={key}
                    className={`p-2 rounded text-sm ${
                      key === question.correctAnswer
                        ? 'bg-green-100 border border-green-300'
                        : key === question.studentAnswer && !question.isCorrect
                        ? 'bg-red-100 border border-red-300'
                        : 'bg-white border border-gray-200'
                    }`}
                  >
                    <span className="font-medium">{key})</span> {value}
                    {key === question.correctAnswer && (
                      <span className="ml-2 text-green-600 text-xs">✓ Correct</span>
                    )}
                    {key === question.studentAnswer && key !== question.correctAnswer && (
                      <span className="ml-2 text-red-600 text-xs">✗ Your answer</span>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="text-sm">
                <span className="text-gray-600">Your answer: </span>
                <span className={`font-medium ${question.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                  {question.studentAnswer}
                </span>
                {!question.isCorrect && (
                  <>
                    <span className="text-gray-600 ml-4">Correct answer: </span>
                    <span className="font-medium text-green-600">{question.correctAnswer}</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Button */}
      <div className="text-center">
        <button
          onClick={onClose}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default TestResults;