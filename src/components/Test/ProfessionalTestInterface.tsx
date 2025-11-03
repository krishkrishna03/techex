import React, { useState, useEffect, useRef } from 'react';
import {
  Clock, CheckCircle, AlertTriangle, Bookmark,
  ChevronRight, ChevronLeft, List, X,
  Monitor, Shield, Eye, AlertCircle, Code
} from 'lucide-react';
import LoadingSpinner from '../UI/LoadingSpinner';
import CodingInterface from '../Coding/CodingInterface';

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
  hasCodingSection?: boolean;
  codingQuestions?: any[];
}

interface ProfessionalTestInterfaceProps {
  test: Test;
  startTime: Date;
  onSubmit: (answers: any[], timeSpent: number, violations?: number) => Promise<void>;
  onExit: () => void;
}

const ProfessionalTestInterface: React.FC<ProfessionalTestInterfaceProps> = ({
  test,
  startTime,
  onSubmit,
  onExit
}) => {
  const [showInstructions, setShowInstructions] = useState(true);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [, setIsFullscreen] = useState(false);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentQuestionInSection, setCurrentQuestionInSection] = useState(0);
  const [answers, setAnswers] = useState<{ [questionId: string]: string }>({});
  const [markedForReview, setMarkedForReview] = useState<{ [questionId: string]: boolean }>({});
  const [visitedQuestions, setVisitedQuestions] = useState<{ [questionId: string]: boolean }>({});
  const [timeLeft, setTimeLeft] = useState(test.duration * 60);
  const [sectionTimeLeft, setSectionTimeLeft] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [showQuestionPalette, setShowQuestionPalette] = useState(true);
  const [selectedCodingQuestionId, setSelectedCodingQuestionId] = useState<string | null>(null);
  const codingInterfaceRef = useRef<HTMLDivElement | null>(null);
  const [tabSwitches, setTabSwitches] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (test.hasSections && test.sections) {
      setSectionTimeLeft(test.sections.map(section => section.sectionDuration * 60));
    }
  }, [test]);

  useEffect(() => {
    if (showInstructions) return;

    const timer = setInterval(() => {
      if (test.hasSections && test.sections) {
        setSectionTimeLeft(prev => {
          const newTimes = [...prev];
          if (newTimes[currentSectionIndex] > 0) {
            newTimes[currentSectionIndex] -= 1;
          } else {
            if (currentSectionIndex < test.sections!.length - 1) {
              setCurrentSectionIndex(currentSectionIndex + 1);
              setCurrentQuestionInSection(0);
            } else {
              handleAutoSubmit();
            }
          }
          return newTimes;
        });
      } else {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [showInstructions, currentSectionIndex, test.hasSections]);

  useEffect(() => {
    if (showInstructions) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitches(prev => prev + 1);
        alert('⚠️ Warning: You switched tabs! This activity is being monitored.');
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && !showInstructions) {
        setIsFullscreen(false);
        alert('⚠️ Warning: You exited fullscreen! Please stay in fullscreen mode.');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [showInstructions]);

  const enterFullscreen = async () => {
    try {
      if (containerRef.current) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      }
    } catch (error) {
      console.error('Error entering fullscreen:', error);
      alert('Please allow fullscreen mode to continue with the test.');
    }
  };

  const handleStartTest = async () => {
    if (!agreedToTerms) {
      alert('Please accept the terms and conditions to proceed.');
      return;
    }

    await enterFullscreen();
    setShowInstructions(false);
    const currentQs = getCurrentQuestions();
    if (currentQs && currentQs.length > 0) {
      const firstQuestion = currentQs[0];
      setVisitedQuestions({ [firstQuestion._id]: true });
    } else {
      // No MCQ questions (coding-only test). Initialize visitedQuestions empty.
      setVisitedQuestions({});
    }
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

  const getCurrentSection = () => {
    if (test.hasSections && test.sections) {
      return test.sections[currentSectionIndex];
    }
    return null;
  };

  const getCurrentQuestions = () => {
    if (test.hasSections && test.sections) {
      return test.sections[currentSectionIndex].questions;
    }
    return test.questions;
  };

  const getCurrentTime = () => {
    if (test.hasSections && test.sections) {
      return sectionTimeLeft[currentSectionIndex];
    }
    return timeLeft;
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleClearResponse = () => {
    const currentQ = getCurrentQuestions()[currentQuestionInSection];
    if (!currentQ) return;
    setAnswers(prev => {
      const newAnswers = { ...prev };
      delete newAnswers[currentQ._id];
      return newAnswers;
    });
  };

  const handleMarkForReview = () => {
    const currentQ = getCurrentQuestions()[currentQuestionInSection];
    if (!currentQ) return;
    setMarkedForReview(prev => ({
      ...prev,
      [currentQ._id]: !prev[currentQ._id]
    }));
  };

  const handleSaveAndNext = () => {
    const questions = getCurrentQuestions();
    if (currentQuestionInSection < questions.length - 1) {
      const nextIndex = currentQuestionInSection + 1;
      setCurrentQuestionInSection(nextIndex);
      setVisitedQuestions(prev => ({ ...prev, [questions[nextIndex]._id]: true }));
    } else if (test.hasSections && test.sections && currentSectionIndex < test.sections.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1);
      setCurrentQuestionInSection(0);
      const nextSectionQuestions = test.sections[currentSectionIndex + 1].questions;
      setVisitedQuestions(prev => ({ ...prev, [nextSectionQuestions[0]._id]: true }));
    }
  };

  const handleMarkForReviewAndNext = () => {
    handleMarkForReview();
    handleSaveAndNext();
  };

  const handleNavigateToQuestion = (questionIndex: number, sectionIndex?: number) => {
    if (sectionIndex !== undefined && sectionIndex !== currentSectionIndex) {
      setCurrentSectionIndex(sectionIndex);
    }
    setCurrentQuestionInSection(questionIndex);
    const questions = sectionIndex !== undefined && test.sections
      ? test.sections[sectionIndex].questions
      : getCurrentQuestions();
    setVisitedQuestions(prev => ({ ...prev, [questions[questionIndex]._id]: true }));
  };

  const getQuestionStatus = (question: Question) => {
    if (answers[question._id] && markedForReview[question._id]) {
      return 'answered-marked';
    }
    if (answers[question._id]) {
      return 'answered';
    }
    if (markedForReview[question._id]) {
      return 'marked';
    }
    if (visitedQuestions[question._id]) {
      return 'not-answered';
    }
    return 'not-visited';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'answered':
        return 'bg-green-500 text-white';
      case 'not-answered':
        return 'bg-red-500 text-white';
      case 'marked':
        return 'bg-purple-500 text-white';
      case 'answered-marked':
        return 'bg-purple-500 text-white';
      case 'not-visited':
        return 'bg-gray-300 text-gray-700';
      default:
        return 'bg-gray-200 text-gray-700';
    }
  };

  const getCounts = () => {
    const allQuestions = test.hasSections && test.sections
      ? test.sections.flatMap(s => s.questions)
      : test.questions;

    return {
      answered: allQuestions.filter(q => answers[q._id] && !markedForReview[q._id]).length,
      notAnswered: allQuestions.filter(q => !answers[q._id] && visitedQuestions[q._id]).length,
      marked: allQuestions.filter(q => markedForReview[q._id]).length,
      notVisited: allQuestions.filter(q => !visitedQuestions[q._id]).length,
    };
  };

  const handleAutoSubmit = async () => {
    if (submitting) return;
    await handleSubmit(true);
  };

  const handleSubmit = async (isAutoSubmit = false) => {
    if (submitting) return;

    const counts = getCounts();

    if (!isAutoSubmit && (counts.notAnswered > 0 || counts.notVisited > 0)) {
      const confirmMessage = `You have ${counts.notAnswered + counts.notVisited} unanswered questions. Are you sure you want to submit?`;
      if (!window.confirm(confirmMessage)) {
        return;
      }
    }

    try {
      setSubmitting(true);

      const allQuestions = test.hasSections && test.sections
        ? test.sections.flatMap(s => s.questions)
        : test.questions;

      const submissionAnswers = allQuestions.map(question => ({
        questionId: question._id,
        selectedAnswer: answers[question._id] || 'A',
        timeSpent: 0
      }));

      const timeSpent = Math.floor((Date.now() - startTime.getTime()) / 1000 / 60);

      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }

      await onSubmit(submissionAnswers, timeSpent, tabSwitches);
    } catch (error) {
      console.error('Submit error:', error);
      alert('Failed to submit test. Please try again.');
      setSubmitting(false);
    }
  };

  const currentQuestions = getCurrentQuestions();
  const currentQuestion = currentQuestions && currentQuestions.length > 0 ? currentQuestions[currentQuestionInSection] : null;
  const currentTime = getCurrentTime();
  const counts = getCounts();
  const hasMCQ = (test.hasSections && test.sections && test.sections.some(s => s.questions && s.questions.length > 0))
    || (test.questions && test.questions.length > 0);

  if (showInstructions) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">{test.testName}</h1>
                <p className="text-blue-100">{test.subject} • {test.testType || 'Assessment'}</p>
              </div>
              <Shield className="w-16 h-16 text-blue-200" />
            </div>
          </div>

          <div className="p-8">
            <div className="mb-8 grid grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg text-center border border-blue-200">
                <div className="text-2xl font-bold text-blue-600">{test.numberOfQuestions}</div>
                <div className="text-sm text-gray-600">Questions</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center border border-green-200">
                <div className="text-2xl font-bold text-green-600">{test.duration}</div>
                <div className="text-sm text-gray-600">Minutes</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg text-center border border-purple-200">
                <div className="text-2xl font-bold text-purple-600">{test.totalMarks}</div>
                <div className="text-sm text-gray-600">Total Marks</div>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <AlertCircle className="text-orange-500" />
                Important Instructions
              </h2>

              <div className="space-y-4">
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                  <h3 className="font-semibold text-gray-900 mb-2">General Instructions:</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700 text-sm">
                    <li>The test will be conducted in <strong>FULLSCREEN MODE</strong></li>
                    <li>Do not switch tabs or minimize the window during the test</li>
                    <li>Any suspicious activity will be recorded and may result in test termination</li>
                    <li>The test will auto-submit when time expires</li>
                    <li>Ensure stable internet connection throughout the test</li>
                  </ul>
                </div>

                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                  <h3 className="font-semibold text-gray-900 mb-2">Navigation & Controls:</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700 text-sm">
                    <li><strong>Save & Next:</strong> Save your answer and move to next question</li>
                    <li><strong>Mark for Review & Next:</strong> Mark question for later review and move to next</li>
                    <li><strong>Clear Response:</strong> Clear your selected answer for current question</li>
                    <li><strong>Question Palette:</strong> Click on question numbers to navigate directly</li>
                  </ul>
                </div>

                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                  <h3 className="font-semibold text-gray-900 mb-2">Question Status Legend:</h3>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-green-500"></div>
                      <span className="text-sm">Answered</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-red-500"></div>
                      <span className="text-sm">Not Answered</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-purple-500"></div>
                      <span className="text-sm">Marked for Review</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-gray-300"></div>
                      <span className="text-sm">Not Visited</span>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <AlertTriangle className="text-red-500" />
                    Prohibited Activities:
                  </h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700 text-sm">
                    <li>Switching to other tabs or applications</li>
                    <li>Using external resources or materials</li>
                    <li>Taking screenshots or recording the screen</li>
                    <li>Communicating with others during the test</li>
                    <li>Using mobile phones or other devices</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-gray-700">
                  I have read and understood all the instructions. I agree to follow all the rules and guidelines during the test.
                  I understand that any violation may result in disqualification.
                </span>
              </label>
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={onExit}
                className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleStartTest}
                disabled={!agreedToTerms}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-colors flex items-center gap-2"
              >
                <Monitor />
                Start Test in Fullscreen
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="fixed inset-0 bg-gray-100 flex flex-col">
      <div className="bg-white shadow-md border-b-2 border-blue-600">
        <div className="px-6 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-gray-900">{test.testName}</h1>
              {test.hasSections && test.sections && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  Section {currentSectionIndex + 1}: {getCurrentSection()?.sectionName}
                </span>
              )}
            </div>

            <div className="flex items-center gap-6">
              {tabSwitches > 0 && (
                <div className="flex items-center gap-2 px-3 py-1 bg-red-100 border border-red-300 rounded-lg">
                  <Eye className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium text-red-700">
                    Violations: {tabSwitches}
                  </span>
                </div>
              )}

              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                currentTime <= 300 ? 'bg-red-100 text-red-700' :
                currentTime <= 600 ? 'bg-orange-100 text-orange-700' :
                'bg-green-100 text-green-700'
              }`}>
                <Clock className="w-5 h-5" />
                <span className="font-mono text-lg font-bold">{formatTime(currentTime)}</span>
              </div>

              <button
                onClick={() => setShowConfirmSubmit(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                Submit
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* MCQ Section */}
        <div className={`${!hasMCQ ? 'hidden' : 'flex-1'} overflow-y-auto p-6`}>
          <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
                <div className="flex justify-between items-center mb-4 pb-4 border-b">
                  <div>
                    <span className="text-sm text-gray-600">Question {currentQuestionInSection + 1} of {currentQuestions.length}</span>
                    {test.hasSections && (
                      <span className="ml-4 text-sm text-gray-600">
                        Section {currentSectionIndex + 1} of {test.sections!.length}
                      </span>
                    )}
                  </div>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {currentQuestion ? currentQuestion.marks : 0} {currentQuestion && currentQuestion.marks === 1 ? 'Mark' : 'Marks'}
                  </span>
                </div>

                <h3 className="text-lg font-medium text-gray-900 mb-6 leading-relaxed">
                  {currentQuestion ? currentQuestion.questionText : 'Question not available'}
                </h3>
                {currentQuestion?.questionImageUrl && (
                  <div className="mb-6">
                    <img
                      src={currentQuestion.questionImageUrl}
                      alt="Question"
                      className="max-w-full h-auto rounded-lg border shadow-sm"
                      style={{ maxHeight: '400px' }}
                    />
                  </div>
                )}

                <div className="space-y-3">
                  {currentQuestion && Object.entries(currentQuestion.options).map(([key, value]) => (
                    <label
                      key={key}
                      className={`flex items-start gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        answers[currentQuestion._id] === key
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${currentQuestion._id}`}
                        value={key}
                        checked={answers[currentQuestion._id] === key}
                        onChange={(e) => handleAnswerChange(currentQuestion._id, e.target.value)}
                        className="mt-1 w-5 h-5 text-blue-600 focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <span className="font-semibold text-gray-900 mr-2">{key}.</span>
                        <span className="text-gray-700">{value}</span>
                        {currentQuestion.optionImages?.[key as keyof typeof currentQuestion.optionImages] && (
                          <img
                            src={currentQuestion.optionImages[key as keyof typeof currentQuestion.optionImages]}
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

            {hasMCQ && (
              <div className="bg-white rounded-lg shadow-lg p-4">
                <div className="flex justify-between items-center">
                  <button
                    onClick={() => {
                      if (currentQuestionInSection > 0) {
                        handleNavigateToQuestion(currentQuestionInSection - 1);
                      }
                    }}
                    disabled={!currentQuestion || currentQuestionInSection === 0}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <ChevronLeft className="w-5 h-5" />
                    Previous
                  </button>

                  <div className="flex gap-2">
                    <button
                      onClick={handleMarkForReviewAndNext}
                      disabled={!currentQuestion}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 disabled:opacity-60"
                    >
                      <Bookmark className="w-5 h-5" />
                      Mark for Review & Next
                    </button>

                    <button
                      onClick={handleClearResponse}
                      disabled={!currentQuestion || !answers[currentQuestion._id]}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      Clear Response
                    </button>

                    <button
                      onClick={handleSaveAndNext}
                      disabled={!currentQuestion}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium disabled:opacity-60"
                    >
                      Save & Next
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {hasMCQ && showQuestionPalette && (
          <div className="w-80 bg-white border-l shadow-lg overflow-y-auto">
            <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
              <div className="flex items-center gap-2">
                <List className="w-5 h-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">Questions</h3>
              </div>
              <button
                onClick={() => setShowQuestionPalette(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4">
              <div className="mb-4 space-y-2 text-xs">
                <div className="flex justify-between py-2 px-3 bg-green-50 rounded">
                  <span>Answered</span>
                  <span className="font-bold">{counts.answered}</span>
                </div>
                <div className="flex justify-between py-2 px-3 bg-red-50 rounded">
                  <span>Not Answered</span>
                  <span className="font-bold">{counts.notAnswered}</span>
                </div>
                <div className="flex justify-between py-2 px-3 bg-purple-50 rounded">
                  <span>Marked for Review</span>
                  <span className="font-bold">{counts.marked}</span>
                </div>
                <div className="flex justify-between py-2 px-3 bg-gray-50 rounded">
                  <span>Not Visited</span>
                  <span className="font-bold">{counts.notVisited}</span>
                </div>
              </div>

              {test.hasSections && test.sections ? (
                <div className="space-y-4">
                  {test.sections.map((section, sIndex) => (
                    <div key={sIndex}>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 pb-1 border-b">
                        {section.sectionName}
                      </h4>
                      <div className="grid grid-cols-5 gap-2">
                        {section.questions.map((q, qIndex) => {
                          const status = getQuestionStatus(q);
                          const isCurrent = sIndex === currentSectionIndex && qIndex === currentQuestionInSection;

                          return (
                            <button
                              key={qIndex}
                              onClick={() => handleNavigateToQuestion(qIndex, sIndex)}
                              className={`w-10 h-10 rounded font-medium text-sm ${getStatusColor(status)} ${
                                isCurrent ? 'ring-4 ring-yellow-400' : ''
                              }`}
                            >
                              {qIndex + 1}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-5 gap-2">
                  {currentQuestions.map((q, index) => {
                    const status = getQuestionStatus(q);
                    const isCurrent = index === currentQuestionInSection;

                    return (
                      <button
                        key={index}
                        onClick={() => handleNavigateToQuestion(index)}
                        className={`w-10 h-10 rounded font-medium text-sm ${getStatusColor(status)} ${
                          isCurrent ? 'ring-4 ring-yellow-400' : ''
                        }`}
                      >
                        {index + 1}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {hasMCQ && !showQuestionPalette && (
          <button
            onClick={() => setShowQuestionPalette(true)}
            className="fixed right-4 top-24 bg-blue-600 text-white p-3 rounded-l-lg shadow-lg hover:bg-blue-700"
          >
            <List className="w-6 h-6" />
          </button>
        )}

        {/* Coding section: show list of coding questions and embedded coding UI */}
        {test.hasCodingSection && test.codingQuestions && test.codingQuestions.length > 0 && (
          <div className={`${hasMCQ ? 'w-[75%]' : 'flex-1'} bg-white border-l flex flex-col h-full`}>
            <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">Coding Questions</h3>
              </div>
            </div>

            <div className="flex flex-col flex-1 overflow-hidden">
              <div className="p-2 space-y-1 border-b">
                {test.codingQuestions.map((cq: any, idx: number) => (
                  <div key={cq._id || cq.questionId || idx} className="p-2 border rounded hover:bg-gray-50">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium text-sm text-gray-800">{cq.title || cq.questionId || `Coding ${idx + 1}`}</div>
                        <div className="text-xs text-gray-500">Points: {cq.points || cq.points === 0 ? cq.points : 100}</div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const id = cq._id || cq.questionId || cq.id;
                            setSelectedCodingQuestionId(id);
                          }}
                          className={`px-3 py-1 ${selectedCodingQuestionId === (cq._id || cq.questionId || cq.id) 
                            ? 'bg-green-600' 
                            : 'bg-blue-600'} text-white rounded text-sm`}
                        >
                          {selectedCodingQuestionId === (cq._id || cq.questionId || cq.id) ? 'Selected' : 'Open'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {selectedCodingQuestionId && (
                <div ref={el => (codingInterfaceRef.current = el)} className="flex-1 border-t overflow-hidden">
                  <div className="h-[calc(100vh-180px)] w-full">
                    <CodingInterface
                      questionId={selectedCodingQuestionId}
                      isPractice={test.testType === 'Practice'}
                      onSubmit={async (submissionId: string, score: number) => {
                        // Optionally notify user and refresh state
                        alert(`Coding submission ${submissionId} scored ${score}`);
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showConfirmSubmit && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <AlertCircle className="text-orange-500 w-8 h-8" />
              <h3 className="text-xl font-bold text-gray-900">Submit Test?</h3>
            </div>

            <div className="mb-6 space-y-3">
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Answered:</span>
                  <span className="font-bold text-green-600">{counts.answered}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Not Answered:</span>
                  <span className="font-bold text-red-600">{counts.notAnswered}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Marked for Review:</span>
                  <span className="font-bold text-purple-600">{counts.marked}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Not Visited:</span>
                  <span className="font-bold text-gray-600">{counts.notVisited}</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-gray-600">Time Remaining:</span>
                  <span className="font-bold text-blue-600">{formatTime(currentTime)}</span>
                </div>
              </div>

              <p className="text-sm text-red-600 font-medium">
                ⚠️ Once submitted, you cannot change your answers.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmSubmit(false)}
                disabled={submitting}
                className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium"
              >
                Review Again
              </button>
              <button
                onClick={() => handleSubmit()}
                disabled={submitting}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-medium flex items-center gap-2"
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

export default ProfessionalTestInterface;