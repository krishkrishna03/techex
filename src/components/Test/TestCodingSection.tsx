import React, { useState } from 'react';
import { Code, CheckCircle, Clock, ChevronRight, ChevronLeft } from 'lucide-react';
import CodingInterface from '../Coding/CodingInterface';
import LoadingSpinner from '../UI/LoadingSpinner';

interface CodingQuestion {
  _id: string;
  title: string;
  description: string;
  difficulty: string;
  constraints: string;
  input_format: string;
  output_format: string;
  sample_input: string;
  sample_output: string;
  explanation: string;
  time_limit: number;
  memory_limit: number;
  supported_languages: string[];
  tags: string[];
  points: number;
  timeLimit: number;
}

interface TestCodingSectionProps {
  codingQuestions: CodingQuestion[];
  testAttemptId: string;
  onComplete: (submissions: any[]) => void;
  onBack?: () => void;
}

const TestCodingSection: React.FC<TestCodingSectionProps> = ({
  codingQuestions,
  testAttemptId,
  onComplete,
  onBack
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [completedQuestions, setCompletedQuestions] = useState<Set<number>>(new Set());
  const [showConfirmComplete, setShowConfirmComplete] = useState(false);

  const currentQuestion = codingQuestions[currentQuestionIndex];

  const handleSubmission = (questionIndex: number, submissionId: string, score: number) => {
    const newSubmissions = [...submissions];
    newSubmissions[questionIndex] = { submissionId, score, questionId: codingQuestions[questionIndex]._id };
    setSubmissions(newSubmissions);

    const newCompleted = new Set(completedQuestions);
    newCompleted.add(questionIndex);
    setCompletedQuestions(newCompleted);
  };

  const handleNext = () => {
    if (currentQuestionIndex < codingQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleComplete = () => {
    setShowConfirmComplete(true);
  };

  const confirmComplete = () => {
    onComplete(submissions);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-10 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Code className="w-6 h-6 text-blue-600" />
              <div>
                <h2 className="text-xl font-bold text-gray-800">Coding Section</h2>
                <p className="text-sm text-gray-600">
                  Question {currentQuestionIndex + 1} of {codingQuestions.length}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-gray-700">
                  {completedQuestions.size} / {codingQuestions.length} Submitted
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              currentQuestion.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
              currentQuestion.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {currentQuestion.difficulty.toUpperCase()}
            </span>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
              {currentQuestion.points} Points
            </span>
            {completedQuestions.has(currentQuestionIndex) && (
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Submitted
              </span>
            )}
          </div>

          <div className="flex gap-2">
            {onBack && currentQuestionIndex === 0 && (
              <button
                onClick={onBack}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center gap-2"
              >
                Back to MCQs
              </button>
            )}
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            {currentQuestionIndex < codingQuestions.length - 1 ? (
              <button
                onClick={handleNext}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleComplete}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Complete Coding Section
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
          <div className="flex flex-wrap gap-2 mb-4">
            {codingQuestions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`w-10 h-10 rounded-lg flex items-center justify-center font-medium ${
                  index === currentQuestionIndex
                    ? 'bg-blue-600 text-white'
                    : completedQuestions.has(index)
                    ? 'bg-green-100 text-green-800 border border-green-300'
                    : 'bg-gray-100 text-gray-600 border border-gray-300'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>

        <CodingInterface
          questionId={currentQuestion._id}
          testAttemptId={testAttemptId}
          isPractice={false}
          onSubmit={(submissionId, score) => handleSubmission(currentQuestionIndex, submissionId, score)}
        />
      </div>

      {showConfirmComplete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Complete Coding Section?</h3>
            <p className="text-gray-600 mb-6">
              You have submitted {completedQuestions.size} out of {codingQuestions.length} coding questions.
              {completedQuestions.size < codingQuestions.length && (
                <span className="block mt-2 text-orange-600 font-medium">
                  Warning: {codingQuestions.length - completedQuestions.size} question(s) not submitted yet.
                </span>
              )}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmComplete(false)}
                className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={confirmComplete}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Complete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestCodingSection;
