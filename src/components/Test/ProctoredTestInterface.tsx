import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Clock,
  AlertTriangle,
  Send,
  Bookmark,
  X,
  Maximize,
  Eye,
  EyeOff
} from 'lucide-react';
import LoadingSpinner from '../UI/LoadingSpinner';

interface Question {
  _id: string;
  questionText: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  marks: number;
}

interface Test {
  _id: string;
  testName: string;
  testDescription: string;
  subject: string;
  testType?: string;
  companyName?: string;
  numberOfQuestions: number;
  totalMarks: number;
  duration: number;
  questions: Question[];
  instructions?: string[];
}

interface ProctoredTestInterfaceProps {
  test: Test;
  onSubmit: (answers: any[], timeSpent: number, violations: number) => Promise<void>;
  onExit: () => void;
}

interface QuestionStatus {
  answered: boolean;
  markedForReview: boolean;
  visited: boolean;
}

const DEFAULT_INSTRUCTIONS = [
  'This is a proctored test. Any suspicious activity will be recorded.',
  'Switching tabs or minimizing the browser will be considered a violation.',
  'The test will auto-submit if you switch tabs more than 3 times.',
  'You cannot go back once you navigate to the next question in some test types.',
  'Make sure you have a stable internet connection.',
  'Click "Start Test" when you are ready. The test will open in fullscreen mode.',
  'You can mark questions for review and come back to them later.',
  'Clear Response button will remove your selected answer for current question.',
  'Save & Next will save your answer and move to next question.',
  'The timer will count down. Test auto-submits when time expires.'
];

const ProctoredTestInterface: React.FC<ProctoredTestInterfaceProps> = ({
  test,
  onSubmit,
  onExit
}) => {
  const [testStarted, setTestStarted] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [answers, setAnswers] = useState<{ [questionId: string]: string }>({});
  const [questionStatus, setQuestionStatus] = useState<{ [questionId: string]: QuestionStatus }>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(test.duration * 60);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [violations, setViolations] = useState(0);
  const [showViolationWarning, setShowViolationWarning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const startTimeRef = useRef<Date | null>(null);
  const violationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const MAX_VIOLATIONS = 3;

  const instructions = test.instructions || DEFAULT_INSTRUCTIONS;

  useEffect(() => {
    if (!test.questions || test.questions.length === 0) {
      return;
    }

    const initialStatus: { [key: string]: QuestionStatus } = {};
    test.questions.forEach((q) => {
      initialStatus[q._id] = {
        answered: false,
        markedForReview: false,
        visited: false
      };
    });
    setQuestionStatus(initialStatus);
  }, [test.questions]);

  const enterFullscreen = async () => {
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      }
      setIsFullscreen(true);
    } catch (error) {
      console.error('Error entering fullscreen:', error);
    }
  };

  const exitFullscreen = async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      }
      setIsFullscreen(false);
    } catch (error) {
      console.error('Error exiting fullscreen:', error);
    }
  };

  const handleStartTest = async () => {
    await enterFullscreen();
    setShowInstructions(false);
    setTestStarted(true);
    startTimeRef.current = new Date();
  };

  useEffect(() => {
    if (!testStarted) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleAutoSubmit('timeout');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [testStarted]);

  const handleViolation = useCallback(() => {
    setViolations((prev) => {
      const newCount = prev + 1;
      setShowViolationWarning(true);

      if (violationTimeoutRef.current) {
        clearTimeout(violationTimeoutRef.current);
      }

      violationTimeoutRef.current = setTimeout(() => {
        setShowViolationWarning(false);
      }, 5000);

      if (newCount >= MAX_VIOLATIONS) {
        handleAutoSubmit('violations');
      }

      return newCount;
    });
  }, []);

  useEffect(() => {
    if (!testStarted) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleViolation();
      }
    };

    const handleBlur = () => {
      handleViolation();
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && testStarted && !submitting) {
        setIsFullscreen(false);
        handleViolation();
        enterFullscreen();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (violationTimeoutRef.current) {
        clearTimeout(violationTimeoutRef.current);
      }
    };
  }, [testStarted, submitting, handleViolation]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (timeLeft <= 300) return 'text-red-600';
    if (timeLeft <= 600) return 'text-orange-600';
    return 'text-green-600';
  };

  const updateQuestionStatus = (questionId: string, updates: Partial<QuestionStatus>) => {
    setQuestionStatus((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], ...updates }
    }));
  };

  const handleAnswerSelect = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
    updateQuestionStatus(questionId, { answered: true });
  };

  const handleClearResponse = () => {
    const currentQ = test.questions[currentQuestion];
    setAnswers((prev) => {
      const newAnswers = { ...prev };
      delete newAnswers[currentQ._id];
      return newAnswers;
    });
    updateQuestionStatus(currentQ._id, { answered: false });
  };

  const handleSaveAndNext = () => {
    const currentQ = test.questions[currentQuestion];
    updateQuestionStatus(currentQ._id, { visited: true });

    if (currentQuestion < test.numberOfQuestions - 1) {
      setCurrentQuestion(currentQuestion + 1);
      const nextQ = test.questions[currentQuestion + 1];
      updateQuestionStatus(nextQ._id, { visited: true });
    }
  };

  const handleMarkForReview = () => {
    const currentQ = test.questions[currentQuestion];
    const isMarked = questionStatus[currentQ._id]?.markedForReview;
    updateQuestionStatus(currentQ._id, { markedForReview: !isMarked });
  };

  const handleMarkForReviewAndNext = () => {
    handleMarkForReview();
    handleSaveAndNext();
  };

  const navigateToQuestion = (index: number) => {
    setCurrentQuestion(index);
    const q = test.questions[index];
    updateQuestionStatus(q._id, { visited: true });
  };

  const getQuestionCounts = () => {
    const answered = Object.values(questionStatus).filter((s) => s.answered).length;
    const notAnswered = Object.values(questionStatus).filter((s) => s.visited && !s.answered).length;
    const markedForReview = Object.values(questionStatus).filter((s) => s.markedForReview).length;
    const notVisited = Object.values(questionStatus).filter((s) => !s.visited).length;

    return { answered, notAnswered, markedForReview, notVisited };
  };

  const handleAutoSubmit = async (reason: 'timeout' | 'violations') => {
    if (submitting) return;
    await handleSubmit(true, reason);
  };

  const handleSubmit = async (isAutoSubmit = false, reason?: 'timeout' | 'violations') => {
    if (submitting) return;

    const { answered, notAnswered } = getQuestionCounts();
    const unansweredCount = test.numberOfQuestions - answered;

    if (!isAutoSubmit && unansweredCount > 0) {
      if (!window.confirm(`You have ${unansweredCount} unanswered questions. Are you sure you want to submit?`)) {
        return;
      }
    }

    try {
      setSubmitting(true);

      const submissionAnswers = test.questions.map((question) => ({
        questionId: question._id,
        selectedAnswer: answers[question._id] || 'A',
        timeSpent: 0
      }));

      const timeSpent = startTimeRef.current
        ? Math.floor((Date.now() - startTimeRef.current.getTime()) / 1000 / 60)
        : test.duration;

      await exitFullscreen();
      await onSubmit(submissionAnswers, timeSpent, violations);
    } catch (error) {
      console.error('Submit error:', error);
      alert('Failed to submit test. Please try again.');
      setSubmitting(false);
    }
  };

  if (showInstructions) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <Eye className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {test.testName}
            </h1>
            {test.companyName && (
              <p className="text-lg text-blue-600 font-semibold">
                {test.companyName} - Online Assessment
              </p>
            )}
            <div className="flex items-center justify-center gap-6 mt-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {test.duration} minutes
              </span>
              <span>•</span>
              <span>{test.numberOfQuestions} Questions</span>
              <span>•</span>
              <span>{test.totalMarks} Marks</span>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Important Instructions
            </h2>
            <div className="bg-gray-50 rounded-lg p-6 space-y-3">
              {instructions.map((instruction, index) => (
                <div key={index} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  <p className="text-gray-700 flex-1">{instruction}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-orange-900 mb-1">Proctoring Active</h3>
                <p className="text-sm text-orange-800">
                  This test is proctored. Tab switches and window changes are monitored.
                  After {MAX_VIOLATIONS} violations, the test will auto-submit.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={onExit}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleStartTest}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Maximize className="w-5 h-5" />
              I Understand, Start Test
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!test.questions || test.questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const currentQ = test.questions[currentQuestion];
  const counts = getQuestionCounts();
  const currentStatus = questionStatus[currentQ?._id] || { answered: false, markedForReview: false, visited: true };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {showViolationWarning && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
          <div className="bg-red-600 text-white px-6 py-3 rounded-lg shadow-xl flex items-center gap-3">
            <AlertTriangle className="w-6 h-6" />
            <div>
              <p className="font-bold">Warning: Tab Switch Detected!</p>
              <p className="text-sm">Violations: {violations}/{MAX_VIOLATIONS}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow-md border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{test.testName}</h1>
              <p className="text-sm text-gray-600">
                {test.companyName || test.subject} {test.testType && `• ${test.testType}`}
              </p>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 bg-red-50 px-3 py-2 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-red-600">
                  Violations: {violations}/{MAX_VIOLATIONS}
                </span>
              </div>

              <div className={`flex items-center gap-2 font-mono text-lg font-bold ${getTimeColor()}`}>
                <Clock className="w-5 h-5" />
                {formatTime(timeLeft)}
              </div>

              <button
                onClick={() => setShowConfirmSubmit(true)}
                disabled={submitting}
                className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 font-medium"
              >
                <Send className="w-4 h-4" />
                Submit
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-6">
        <div className="grid grid-cols-12 gap-6 h-full">
          <div className="col-span-9 bg-white rounded-lg shadow-md p-6 flex flex-col">
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-semibold text-gray-900">
                  Question {currentQuestion + 1} of {test.numberOfQuestions}
                </h2>
                <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                  {currentQ?.marks} Mark{currentQ?.marks !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentQuestion + 1) / test.numberOfQuestions) * 100}%` }}
                />
              </div>
            </div>

            <div className="flex-1 mb-6">
              <h3 className="text-lg text-gray-900 mb-6 leading-relaxed font-medium">
                {currentQ?.questionText}
              </h3>

              <div className="space-y-3">
                {currentQ && Object.entries(currentQ.options).map(([key, value]) => (
                  <label
                    key={key}
                    className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      answers[currentQ._id] === key
                        ? 'border-blue-500 bg-blue-50 shadow-sm'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${currentQ._id}`}
                      value={key}
                      checked={answers[currentQ._id] === key}
                      onChange={(e) => handleAnswerSelect(currentQ._id, e.target.value)}
                      className="mt-1 h-5 w-5 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <span className="font-semibold text-gray-900 text-lg">{key}.</span>
                      <span className="ml-2 text-gray-800">{value}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <div className="flex gap-3">
                  <button
                    onClick={handleMarkForReviewAndNext}
                    className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors flex items-center gap-2 font-medium"
                  >
                    <Bookmark className="w-4 h-4" />
                    Mark for Review & Next
                  </button>
                  <button
                    onClick={handleClearResponse}
                    disabled={!answers[currentQ?._id]}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    <X className="w-4 h-4 inline mr-1" />
                    Clear Response
                  </button>
                </div>

                <button
                  onClick={handleSaveAndNext}
                  disabled={currentQuestion === test.numberOfQuestions - 1}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  Save & Next
                </button>
              </div>
            </div>
          </div>

          <div className="col-span-3">
            <div className="bg-white rounded-lg shadow-md p-4 sticky top-6">
              <h3 className="font-semibold text-gray-900 mb-4">Question Palette</h3>

              <div className="grid grid-cols-5 gap-2 mb-4">
                {test.questions.map((q, index) => {
                  const status = questionStatus[q._id] || { answered: false, markedForReview: false, visited: false };
                  let bgColor = 'bg-gray-200 text-gray-700';

                  if (currentQuestion === index) {
                    bgColor = 'bg-blue-600 text-white';
                  } else if (status.markedForReview) {
                    bgColor = 'bg-yellow-500 text-white';
                  } else if (status.answered) {
                    bgColor = 'bg-green-500 text-white';
                  } else if (status.visited) {
                    bgColor = 'bg-red-400 text-white';
                  }

                  return (
                    <button
                      key={q._id}
                      onClick={() => navigateToQuestion(index)}
                      className={`w-10 h-10 rounded-lg text-sm font-bold ${bgColor} hover:opacity-90 transition-opacity`}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>

              <div className="space-y-2 text-xs border-t pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-green-500 rounded"></div>
                    <span>Answered</span>
                  </div>
                  <span className="font-bold">{counts.answered}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-red-400 rounded"></div>
                    <span>Not Answered</span>
                  </div>
                  <span className="font-bold">{counts.notAnswered}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-gray-200 rounded"></div>
                    <span>Not Visited</span>
                  </div>
                  <span className="font-bold">{counts.notVisited}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-yellow-500 rounded"></div>
                    <span>Marked for Review</span>
                  </div>
                  <span className="font-bold">{counts.markedForReview}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showConfirmSubmit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="text-orange-500 w-6 h-6" />
              <h3 className="text-xl font-bold text-gray-900">Confirm Submission</h3>
            </div>

            <div className="mb-6 space-y-3">
              <p className="text-gray-700">Are you sure you want to submit your test?</p>

              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Answered:</span>
                  <span className="font-bold text-green-600">{counts.answered}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Not Answered:</span>
                  <span className="font-bold text-red-600">{counts.notAnswered}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Marked for Review:</span>
                  <span className="font-bold text-yellow-600">{counts.markedForReview}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Time Remaining:</span>
                  <span className="font-bold">{formatTime(timeLeft)}</span>
                </div>
              </div>

              <p className="text-sm text-red-600 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                You cannot change answers after submission.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmSubmit(false)}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
              >
                Continue Test
              </button>
              <button
                onClick={() => handleSubmit()}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
              >
                {submitting ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
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

export default ProctoredTestInterface;
