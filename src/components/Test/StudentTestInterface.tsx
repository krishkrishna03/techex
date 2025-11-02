import React, { useState, useEffect } from 'react';
import { Clock, AlertCircle, CheckCircle, Send, XCircle, RefreshCw, Award, Bookmark, Eraser } from 'lucide-react';
import LoadingSpinner from '../UI/LoadingSpinner';

interface Question {
  _id: string;
  questionText: string;
  questionImageUrl?: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  optionImages?: {
    A?: string;
    B?: string;
    C?: string;
    D?: string;
  };
  correctAnswer?: 'A' | 'B' | 'C' | 'D';
  marks: number;
}

interface Test {
  _id: string;
  testName: string;
  testDescription: string;
  subject: string;
  testType?: string;
  numberOfQuestions: number;
  totalMarks: number;
  duration: number;
  questions: Question[];
}

interface StudentTestInterfaceProps {
  test: Test;
  startTime: Date;
  onSubmit: (answers: any[], timeSpent: number) => Promise<void>;
  onExit: () => void;
}

const StudentTestInterface: React.FC<StudentTestInterfaceProps> = ({
  test,
  startTime,
  onSubmit,
  onExit
}) => {
  const [answers, setAnswers] = useState<{ [questionId: string]: string }>({});
  const [markedForReview, setMarkedForReview] = useState<{ [questionId: string]: boolean }>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(test.duration * 60); // in seconds
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [showInstantFeedback, setShowInstantFeedback] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState<any>(null);
  const [questionAttempts, setQuestionAttempts] = useState<{ [questionId: string]: number }>({});
  const [isPracticeMode, setIsPracticeMode] = useState(test.testType === 'Practice');
  const [hasAnsweredCurrent, setHasAnsweredCurrent] = useState(false);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Don't auto-submit practice tests
          if (!isPracticeMode) {
            handleAutoSubmit();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPracticeMode]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));

    // Track attempts for practice mode
    if (isPracticeMode) {
      setQuestionAttempts(prev => ({
        ...prev,
        [questionId]: (prev[questionId] || 0) + 1
      }));
    }

    // For Practice tests, show instant feedback
    if (isPracticeMode) {
      const question = test.questions.find(q => q._id === questionId);
      if (question && question.correctAnswer) {
        const isCorrect = question.correctAnswer === answer;
        const attempts = (questionAttempts[questionId] || 0) + 1;

        setCurrentFeedback({
          questionId,
          selectedAnswer: answer,
          correctAnswer: question.correctAnswer,
          isCorrect,
          attempts,
          explanation: isCorrect
            ? `Excellent! You got it ${attempts === 1 ? 'on the first try' : `after ${attempts} attempt(s)`}!`
            : `Not quite right. The correct answer is ${question.correctAnswer}. ${question.options[question.correctAnswer]}`,
          detailedExplanation: generateExplanation(question, answer)
        });
        setShowInstantFeedback(true);
        setHasAnsweredCurrent(true);
        setIsAnswerRevealed(true);
      }
    }
  };

  const generateExplanation = (question: Question, selectedAnswer: string) => {
    if (!question.correctAnswer) return '';

    const correctOption = question.options[question.correctAnswer];
    const selectedOption = question.options[selectedAnswer as keyof typeof question.options];

    return `You selected: ${selectedAnswer}) ${selectedOption}\n\nCorrect Answer: ${question.correctAnswer}) ${correctOption}`;
  };

  const handleRetryQuestion = () => {
    const currentQ = test.questions[currentQuestion];
    setAnswers(prev => {
      const newAnswers = { ...prev };
      delete newAnswers[currentQ._id];
      return newAnswers;
    });
    setShowInstantFeedback(false);
    setCurrentFeedback(null);
    setHasAnsweredCurrent(false);
    setIsAnswerRevealed(false);
  };

  const getAnsweredCount = () => {
    return Object.keys(answers).length;
  };

  const getMarkedForReviewCount = () => {
    return Object.keys(markedForReview).filter(key => markedForReview[key]).length;
  };

  const handleClearResponse = () => {
    const currentQ = test.questions[currentQuestion];
    setAnswers(prev => {
      const newAnswers = { ...prev };
      delete newAnswers[currentQ._id];
      return newAnswers;
    });
    setMarkedForReview(prev => {
      const newMarked = { ...prev };
      delete newMarked[currentQ._id];
      return newMarked;
    });
    setShowInstantFeedback(false);
    setCurrentFeedback(null);
    setHasAnsweredCurrent(false);
    setIsAnswerRevealed(false);
  };

  const handleMarkForReview = () => {
    const currentQ = test.questions[currentQuestion];
    setMarkedForReview(prev => ({
      ...prev,
      [currentQ._id]: !prev[currentQ._id]
    }));
  };

  const handleSaveAndNext = () => {
    if (currentQuestion < test.numberOfQuestions - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setShowInstantFeedback(false);
      setHasAnsweredCurrent(false);
      setIsAnswerRevealed(false);

      const nextQ = test.questions[currentQuestion + 1];
      if (isPracticeMode && answers[nextQ._id]) {
        setHasAnsweredCurrent(true);
      }
    }
  };

  const handleAutoSubmit = async () => {
    if (submitting) return;
    await handleSubmit(true);
  };

  const handleSubmit = async (isAutoSubmit = false) => {
    if (submitting) return;

    const unansweredCount = test.numberOfQuestions - getAnsweredCount();
    
    if (!isAutoSubmit && unansweredCount > 0) {
      const confirmMessage = `You have ${unansweredCount} unanswered questions. Are you sure you want to submit?`;
      if (!window.confirm(confirmMessage)) {
        return;
      }
    }

    try {
      setSubmitting(true);
      
      const submissionAnswers = test.questions.map(question => ({
        questionId: question._id,
        selectedAnswer: answers[question._id] || 'A', // Default to A if not answered
        timeSpent: 0 // Could track per question if needed
      }));

      const timeSpent = Math.floor((Date.now() - startTime.getTime()) / 1000 / 60); // in minutes
      
      await onSubmit(submissionAnswers, timeSpent);
    } catch (error) {
      console.error('Submit error:', error);
      alert('Failed to submit test. Please try again.');
      setSubmitting(false);
    }
  };

  const getTimeColor = () => {
    if (timeLeft <= 300) return 'text-red-600'; // Last 5 minutes
    if (timeLeft <= 600) return 'text-orange-600'; // Last 10 minutes
    return 'text-green-600';
  };

  const handleNextQuestion = () => {
    // In practice mode, must reveal answer before proceeding
    if (isPracticeMode && !isAnswerRevealed && answers[currentQ._id]) {
      alert('Please review the correct answer before proceeding to the next question.');
      return;
    }

    if (currentQuestion < test.numberOfQuestions - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setShowInstantFeedback(false);
      setHasAnsweredCurrent(false);
      setIsAnswerRevealed(false);

      // Check if the next question has already been answered
      const nextQ = test.questions[currentQuestion + 1];
      if (isPracticeMode && answers[nextQ._id]) {
        setHasAnsweredCurrent(true);
      }
    }
  };
  const currentQ = test.questions[currentQuestion];

  return (
    <div className="fixed inset-0 bg-gray-50 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{test.testName}</h1>
              <p className="text-sm text-gray-600">
                {test.subject} • {test.testType || 'Assessment'} • {test.totalMarks} marks
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {!isPracticeMode ? (
                <div className={`flex items-center gap-2 ${getTimeColor()}`}>
                  <Clock size={20} />
                  <span className="font-mono text-lg font-bold">{formatTime(timeLeft)}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-blue-600">
                  <Award size={20} />
                  <span className="text-sm font-medium">Practice Mode</span>
                </div>
              )}
              
              <div className="text-sm text-gray-600">
                {getAnsweredCount()}/{test.numberOfQuestions} answered
              </div>
              
              <button
                onClick={() => setShowConfirmSubmit(true)}
                disabled={submitting}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Send size={16} />
                Submit Test
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="h-full max-w-7xl mx-auto px-4 py-6">
          <div className="h-full grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-4 sticky top-24">
              <h3 className="font-medium text-gray-900 mb-3">Questions</h3>
              <div className="grid grid-cols-5 lg:grid-cols-4 gap-2">
                {test.questions.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      // In practice mode, check if current question needs answer review
                      if (isPracticeMode && currentQuestion !== index && !isAnswerRevealed && answers[currentQ._id]) {
                        alert('Please review the correct answer before navigating to another question.');
                        return;
                      }
                      setCurrentQuestion(index);
                      setShowInstantFeedback(false);
                      setHasAnsweredCurrent(!!answers[test.questions[index]._id]);
                      setIsAnswerRevealed(false);
                    }}
                    className={`w-8 h-8 rounded text-sm font-medium relative ${
                      currentQuestion === index
                        ? 'bg-blue-600 text-white'
                        : markedForReview[test.questions[index]._id]
                        ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-500'
                        : answers[test.questions[index]._id]
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
              
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-100 rounded"></div>
                  <span>Answered ({getAnsweredCount()})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-100 rounded"></div>
                  <span>Not Answered ({test.numberOfQuestions - getAnsweredCount()})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-100 border-2 border-yellow-500 rounded"></div>
                  <span>Review ({getMarkedForReviewCount()})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-600 rounded"></div>
                  <span>Current</span>
                </div>
              </div>
              
              {isPracticeMode && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-4 h-4 text-blue-600" />
                    <p className="text-xs text-blue-800 font-bold">Practice Mode</p>
                  </div>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• Instant feedback on answers</li>
                    <li>• Retry wrong answers</li>
                    <li>• Detailed explanations</li>
                    <li>• No time pressure</li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Question Content */}
          <div className="lg:col-span-3 overflow-y-auto">
            <div className="bg-white rounded-lg shadow p-6 h-full flex flex-col">
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-lg font-medium">
                    Question {currentQuestion + 1} of {test.numberOfQuestions}
                  </h2>
                  <span className="text-sm text-gray-600">
                    {currentQ.marks} mark{currentQ.marks !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((currentQuestion + 1) / test.numberOfQuestions) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg text-gray-900 mb-4 leading-relaxed">
                  {currentQ.questionText}
                </h3>
                {currentQ.questionImageUrl && (
                  <div className="mb-4">
                    <img
                      src={currentQ.questionImageUrl}
                      alt="Question"
                      className="max-w-full h-auto rounded-lg border shadow-sm"
                      style={{ maxHeight: '400px' }}
                    />
                  </div>
                )}

                <div className="space-y-3">
                  {Object.entries(currentQ.options).map(([key, value]) => (
                    <label
                      key={key}
                      className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                        answers[currentQ._id] === key
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${currentQ._id}`}
                        value={key}
                        checked={answers[currentQ._id] === key}
                        onChange={(e) => handleAnswerChange(currentQ._id, e.target.value)}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <span className="font-medium text-gray-900">{key})</span>
                        <span className="ml-2 text-gray-700">{value}</span>
                        {currentQ.optionImages?.[key as keyof typeof currentQ.optionImages] && (
                          <img
                            src={currentQ.optionImages[key as keyof typeof currentQ.optionImages]}
                            alt={`Option ${key}`}
                            className="mt-2 max-w-full h-auto rounded border"
                            style={{ maxHeight: '200px' }}
                          />
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Instant Feedback for Practice Tests */}
              {isPracticeMode && showInstantFeedback && currentFeedback && currentFeedback.questionId === currentQ._id && (
                <div className={`mb-6 p-5 rounded-xl border-2 shadow-lg ${
                  currentFeedback.isCorrect
                    ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-400'
                    : 'bg-gradient-to-br from-red-50 to-red-100 border-red-400'
                }`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {currentFeedback.isCorrect ? (
                        <div className="bg-green-500 rounded-full p-2">
                          <CheckCircle className="w-6 h-6 text-white" />
                        </div>
                      ) : (
                        <div className="bg-red-500 rounded-full p-2">
                          <XCircle className="w-6 h-6 text-white" />
                        </div>
                      )}
                      <div>
                        <span className={`font-bold text-lg ${
                          currentFeedback.isCorrect ? 'text-green-800' : 'text-red-800'
                        }`}>
                          {currentFeedback.isCorrect ? 'Correct!' : 'Incorrect'}
                        </span>
                        {currentFeedback.attempts > 1 && (
                          <p className="text-xs text-gray-600 mt-0.5">
                            Attempt {currentFeedback.attempts}
                          </p>
                        )}
                      </div>
                    </div>
                    {!currentFeedback.isCorrect && (
                      <button
                        onClick={handleRetryQuestion}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white border-2 border-red-300 text-red-700 rounded-lg hover:bg-red-50 font-medium text-sm transition-colors"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Retry
                      </button>
                    )}
                  </div>

                  <div className={`mb-3 p-3 rounded-lg ${
                    currentFeedback.isCorrect ? 'bg-white/70' : 'bg-white/70'
                  }`}>
                    <p className={`font-medium mb-1 ${
                      currentFeedback.isCorrect ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {currentFeedback.explanation}
                    </p>
                  </div>

                  {currentFeedback.detailedExplanation && (
                    <div className="mt-3 p-3 bg-white/90 rounded-lg border border-gray-200">
                      <p className="text-sm font-medium text-gray-700 mb-1">Explanation:</p>
                      <p className="text-sm text-gray-600 whitespace-pre-line">
                        {currentFeedback.detailedExplanation}
                      </p>
                    </div>
                  )}

                  {currentFeedback.isCorrect && currentFeedback.attempts === 1 && (
                    <div className="mt-3 flex items-center gap-2 p-2 bg-yellow-100 rounded-lg">
                      <Award className="w-4 h-4 text-yellow-600" />
                      <span className="text-xs font-medium text-yellow-800">Perfect! First try!</span>
                    </div>
                  )}

                  {/* Continue Button for Practice Mode */}
                  {currentFeedback.isCorrect && (
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => {
                          setIsAnswerRevealed(true);
                          if (currentQuestion < test.numberOfQuestions - 1) {
                            setTimeout(() => handleNextQuestion(), 300);
                          }
                        }}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
                      >
                        {currentQuestion < test.numberOfQuestions - 1 ? 'Continue to Next' : 'Finish Practice'}
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
              {/* Navigation Buttons */}
              <div className="mt-auto pt-4 border-t">
                <div className="flex justify-between items-center gap-3">
                  <button
                    onClick={() => {
                      if (isPracticeMode && !isAnswerRevealed && answers[currentQ._id]) {
                        alert('Please review the correct answer before navigating away.');
                        return;
                      }
                      if (currentQuestion > 0) {
                        const prevIndex = currentQuestion - 1;
                        setCurrentQuestion(prevIndex);
                        setShowInstantFeedback(false);
                        setHasAnsweredCurrent(!!answers[test.questions[prevIndex]._id]);
                        setIsAnswerRevealed(false);
                      }
                    }}
                    disabled={currentQuestion === 0}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>

                  <div className="flex gap-2">
                    <button
                      onClick={handleClearResponse}
                      disabled={!answers[currentQ._id]}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      title="Clear your response for this question"
                    >
                      <Eraser size={16} />
                      Clear Response
                    </button>

                    <button
                      onClick={handleMarkForReview}
                      className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                        markedForReview[currentQ._id]
                          ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                          : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                      }`}
                      title="Mark this question for later review"
                    >
                      <Bookmark size={16} />
                      {markedForReview[currentQ._id] ? 'Marked for Review' : 'Mark for Review'}
                    </button>

                    {currentQuestion < test.numberOfQuestions - 1 ? (
                      <button
                        onClick={handleSaveAndNext}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                      >
                        Save & Next
                        <CheckCircle size={16} />
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowConfirmSubmit(true)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                      >
                        <Send size={16} />
                        Submit Test
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="text-orange-500" size={24} />
              <h3 className="text-lg font-medium">Confirm Submission</h3>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-3">
                Are you sure you want to submit your test?
              </p>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm">
                  <strong>Answered:</strong> {getAnsweredCount()}/{test.numberOfQuestions} questions
                </p>
                <p className="text-sm">
                  <strong>Time Remaining:</strong> {formatTime(timeLeft)}
                </p>
                {test.testType && (
                  <p className="text-sm">
                    <strong>Test Type:</strong> {test.testType}
                  </p>
                )}
                {isPracticeMode && (
                  <p className="text-sm text-blue-600 font-medium">
                    Note: This is a practice test with instant feedback and retry options.
                  </p>
                )}
              </div>
              <p className="text-sm text-red-600 mt-2">
                ⚠️ You cannot change your answers after submission.
              </p>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmSubmit(false)}
                disabled={submitting}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Continue Test
              </button>
              <button
                onClick={() => handleSubmit()}
                disabled={submitting}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    Submit Now
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentTestInterface;
