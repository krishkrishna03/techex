import React, { useState, useEffect, useRef } from 'react';
import {
  Clock, CheckCircle, AlertCircle, ChevronRight, X, Monitor, Shield
} from 'lucide-react';
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

interface Section {
  _id: string;
  sectionName: string;
  sectionDuration: number;
  numberOfQuestions: number;
  marksPerQuestion: number;
  questions: Question[];
}

interface Test {
  _id: string;
  testName: string;
  testDescription: string;
  subject: string;
  testType?: string;
  hasSections?: boolean;
  sections?: Section[];
  numberOfQuestions: number;
  totalMarks: number;
  duration: number;
  questions: Question[];
}

interface CleanTestInterfaceProps {
  test: Test;
  startTime: Date;
  onSubmit: (answers: any[], timeSpent: number) => Promise<void>;
  onExit: () => void;
}

const CleanTestInterface: React.FC<CleanTestInterfaceProps> = ({
  test,
  startTime,
  onSubmit,
  onExit
}) => {
  const [showInstructions, setShowInstructions] = useState(true);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [questionId: string]: string }>({});
  const [timeLeft, setTimeLeft] = useState(test.duration * 60);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showInstructions) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showInstructions]);

  const enterFullscreen = async () => {
    try {
      if (containerRef.current) {
        await containerRef.current.requestFullscreen();
      }
    } catch (error) {
      console.error('Error entering fullscreen:', error);
    }
  };

  const handleStartTest = async () => {
    if (!agreedToTerms) {
      alert('Please accept the terms and conditions to proceed.');
      return;
    }
    await enterFullscreen();
    setShowInstructions(false);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentSection = (): Section | null => {
    if (test.hasSections && test.sections) {
      return test.sections[currentSectionIndex];
    }
    return null;
  };

  const getAllQuestions = (): Question[] => {
    if (test.hasSections && test.sections) {
      return test.sections.flatMap(s => s.questions);
    }
    return test.questions;
  };

  const getCurrentQuestion = (): Question | null => {
    const allQuestions = getAllQuestions();
    return allQuestions[currentQuestionIndex] || null;
  };

  const getTotalQuestions = (): number => {
    return getAllQuestions().length;
  };

  const getAnsweredCount = (): number => {
    return Object.keys(answers).length;
  };

  const handleAnswerSelect = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleNext = () => {
    const totalQuestions = getTotalQuestions();
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setShowSubmitConfirm(true);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleAutoSubmit = async () => {
    if (submitting) return;
    await handleSubmit(true);
  };

  const handleSubmit = async (isAutoSubmit = false) => {
    if (submitting) return;

    const unansweredCount = getTotalQuestions() - getAnsweredCount();

    if (!isAutoSubmit && unansweredCount > 0) {
      const confirmMessage = `You have ${unansweredCount} unanswered questions. Are you sure you want to submit?`;
      if (!window.confirm(confirmMessage)) {
        return;
      }
    }

    try {
      setSubmitting(true);

      const allQuestions = getAllQuestions();
      const submissionAnswers = allQuestions.map(question => ({
        questionId: question._id,
        selectedAnswer: answers[question._id] || 'A',
        timeSpent: 0
      }));

      const timeSpent = Math.floor((Date.now() - startTime.getTime()) / 1000 / 60);

      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }

      await onSubmit(submissionAnswers, timeSpent);
    } catch (error) {
      console.error('Submit error:', error);
      alert('Failed to submit test. Please try again.');
      setSubmitting(false);
    }
  };

  const currentQuestion = getCurrentQuestion();
  const currentSection = getCurrentSection();
  const totalQuestions = getTotalQuestions();
  const answeredCount = getAnsweredCount();

  if (showInstructions) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full bg-white rounded-xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">{test.testName}</h1>
                <p className="text-blue-100 text-lg">{test.subject}</p>
              </div>
              <Shield className="w-20 h-20 text-blue-200 opacity-50" />
            </div>
          </div>

          <div className="p-8">
            <div className="mb-8 grid grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl text-center border-2 border-blue-200">
                <div className="text-3xl font-bold text-blue-700">{test.numberOfQuestions}</div>
                <div className="text-sm text-gray-600 mt-1 font-medium">Questions</div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl text-center border-2 border-green-200">
                <div className="text-3xl font-bold text-green-700">{test.duration}</div>
                <div className="text-sm text-gray-600 mt-1 font-medium">Minutes</div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl text-center border-2 border-purple-200">
                <div className="text-3xl font-bold text-purple-700">{test.totalMarks}</div>
                <div className="text-sm text-gray-600 mt-1 font-medium">Total Marks</div>
              </div>
            </div>

            <div className="mb-8 space-y-4">
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-5 rounded-r-lg">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <AlertCircle className="text-yellow-600" />
                  Important Instructions
                </h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 text-sm">
                  <li>The test will be conducted in <strong>FULLSCREEN MODE</strong></li>
                  <li>Navigate through questions one at a time using Next/Previous buttons</li>
                  <li>You can change your answers before final submission</li>
                  <li>The test will auto-submit when time expires</li>
                  <li>Ensure stable internet connection throughout the test</li>
                </ul>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-400 p-5 rounded-r-lg">
                <h3 className="font-bold text-gray-900 mb-3">Navigation Guide</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 text-sm">
                  <li><strong>Next Button:</strong> Proceed to the next question</li>
                  <li><strong>Previous Button:</strong> Go back to review previous questions</li>
                  <li>Progress is automatically saved as you answer</li>
                  <li>You must answer questions in order (sequential navigation)</li>
                </ul>
              </div>
            </div>

            <div className="mb-6">
              <label className="flex items-start gap-3 cursor-pointer p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-gray-700 text-sm">
                  I have read and understood all the instructions. I agree to follow all the rules and guidelines during the test.
                </span>
              </label>
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={onExit}
                className="px-8 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleStartTest}
                disabled={!agreedToTerms}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-colors flex items-center gap-2"
              >
                <Monitor className="w-5 h-5" />
                Start Test
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="fixed inset-0 bg-gray-50 flex flex-col">
      <div className="bg-white shadow-md border-b-2 border-blue-600">
        <div className="max-w-6xl mx-auto px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{test.testName}</h1>
              {currentSection && (
                <p className="text-sm text-gray-600 mt-1">
                  Section {currentSectionIndex + 1}: {currentSection.sectionName}
                </p>
              )}
            </div>

            <div className="flex items-center gap-6">
              <div className={`flex items-center gap-3 px-5 py-3 rounded-lg font-bold ${
                timeLeft <= 300 ? 'bg-red-100 text-red-700' :
                timeLeft <= 600 ? 'bg-orange-100 text-orange-700' :
                'bg-green-100 text-green-700'
              }`}>
                <Clock className="w-6 h-6" />
                <span className="font-mono text-2xl">{formatTime(timeLeft)}</span>
              </div>

              <button
                onClick={() => setShowSubmitConfirm(true)}
                disabled={submitting}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center gap-2 disabled:opacity-50"
              >
                <CheckCircle className="w-5 h-5" />
                Submit
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-8 py-8">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold mb-1">
                    Question {currentQuestionIndex + 1} of {totalQuestions}
                  </h2>
                  <p className="text-blue-100 text-sm">
                    Progress: {answeredCount} answered
                  </p>
                </div>
                <div className="bg-white bg-opacity-20 px-4 py-2 rounded-lg">
                  <span className="text-xl font-bold">{currentQuestion.marks}</span>
                  <span className="text-sm ml-1">mark{currentQuestion.marks !== 1 ? 's' : ''}</span>
                </div>
              </div>
              <div className="mt-4 bg-white bg-opacity-20 rounded-full h-2">
                <div
                  className="bg-white h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
                />
              </div>
            </div>

            <div className="p-8">
              <div className="mb-8">
                <h3 className="text-xl text-gray-900 mb-6 leading-relaxed font-medium">
                  {currentQuestion.questionText}
                </h3>

                {currentQuestion.questionImageUrl && (
                  <div className="mb-6">
                    <img
                      src={currentQuestion.questionImageUrl}
                      alt="Question"
                      className="max-w-full h-auto rounded-lg border-2 border-gray-200 shadow-sm"
                      style={{ maxHeight: '400px' }}
                    />
                  </div>
                )}

                <div className="space-y-4">
                  {Object.entries(currentQuestion.options).map(([key, value]) => (
                    <label
                      key={key}
                      className={`flex items-start gap-4 p-5 border-2 rounded-xl cursor-pointer transition-all ${
                        answers[currentQuestion._id] === key
                          ? 'border-blue-600 bg-blue-50 shadow-md'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${currentQuestion._id}`}
                        value={key}
                        checked={answers[currentQuestion._id] === key}
                        onChange={(e) => handleAnswerSelect(currentQuestion._id, e.target.value)}
                        className="mt-1 w-5 h-5 text-blue-600 focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-start">
                          <span className="font-bold text-gray-900 text-lg mr-3">{key}.</span>
                          <span className="text-gray-800 text-base leading-relaxed">{value}</span>
                        </div>
                        {currentQuestion.optionImages?.[key as keyof typeof currentQuestion.optionImages] && (
                          <img
                            src={currentQuestion.optionImages[key as keyof typeof currentQuestion.optionImages]}
                            alt={`Option ${key}`}
                            className="mt-3 max-w-full h-auto rounded-lg border-2 border-gray-200"
                            style={{ maxHeight: '250px' }}
                          />
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="border-t pt-6">
                <div className="flex justify-between items-center">
                  <button
                    onClick={handlePrevious}
                    disabled={currentQuestionIndex === 0}
                    className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-colors"
                  >
                    Previous
                  </button>

                  <div className="text-center">
                    <p className="text-sm text-gray-600">
                      Question {currentQuestionIndex + 1} of {totalQuestions}
                    </p>
                  </div>

                  <button
                    onClick={handleNext}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2 transition-colors"
                  >
                    {currentQuestionIndex === totalQuestions - 1 ? 'Finish' : 'Next'}
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showSubmitConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <AlertCircle className="text-orange-500 w-10 h-10" />
              <h3 className="text-2xl font-bold text-gray-900">Submit Test?</h3>
            </div>

            <div className="mb-6 space-y-4">
              <div className="bg-gray-50 p-5 rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">Total Questions:</span>
                  <span className="font-bold text-gray-900 text-lg">{totalQuestions}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">Answered:</span>
                  <span className="font-bold text-green-600 text-lg">{answeredCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">Not Answered:</span>
                  <span className="font-bold text-red-600 text-lg">{totalQuestions - answeredCount}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t">
                  <span className="text-gray-700 font-medium">Time Remaining:</span>
                  <span className="font-bold text-blue-600 text-lg">{formatTime(timeLeft)}</span>
                </div>
              </div>

              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                <p className="text-sm text-red-800 font-medium">
                  Once submitted, you cannot change your answers.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                disabled={submitting}
                className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSubmit()}
                disabled={submitting}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-medium flex items-center gap-2 transition-colors"
              >
                {submitting ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Submit Final
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

export default CleanTestInterface;
