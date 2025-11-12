import React, { useState, useEffect, useRef } from 'react';
import {
  Clock, CheckCircle, AlertCircle, Monitor, Shield, AlertTriangle,
  ChevronLeft, ChevronRight, List, X, Code, Bookmark
} from 'lucide-react';
import CodingInterface from '../Coding/CodingInterface';

interface Question {
  _id: string;
  questionText: string;
  questionImageUrl?: string;
  options: { A: string; B: string; C: string; D: string };
  optionImages?: { A?: string; B?: string; C?: string; D?: string };
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

interface TCSTestInterfaceProps {
  test: Test;
  startTime: Date;
  onSubmit: (answers: any[], timeSpent: number, violations?: number) => Promise<void>;
  onExit: () => void;
}

type QuestionStatus = 'not-visited' | 'not-answered' | 'answered' | 'marked';

const TCSTestInterface: React.FC<TCSTestInterfaceProps> = ({
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
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(new Set());
  const [visited, setVisited] = useState<Set<string>>(new Set());
  const [sectionTimeLeft, setSectionTimeLeft] = useState(0);
  const [violations, setViolations] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showSectionComplete, setShowSectionComplete] = useState(false);
  const [showQuestionPalette, setShowQuestionPalette] = useState(true);
  const [mcqCompleted, setMcqCompleted] = useState(false);
  const [selectedCodingQuestionId, setSelectedCodingQuestionId] = useState<string | null>(null);

  const hasMCQ = (test.hasSections && test.sections && test.sections.length > 0) || test.questions.length > 0;
  const currentSection = test.hasSections && test.sections ? test.sections[currentSectionIndex] : null;
  const currentQuestions = currentSection ? currentSection.questions : test.questions;
  const currentQuestion = currentQuestions[currentQuestionIndex];

  useEffect(() => {
    if (showInstructions || mcqCompleted) return;

    if (currentSection) {
      setSectionTimeLeft(currentSection.sectionDuration * 60);
    } else {
      setSectionTimeLeft(test.duration * 60);
    }
  }, [currentSectionIndex, showInstructions, mcqCompleted]);

  useEffect(() => {
    if (showInstructions || mcqCompleted || sectionTimeLeft === 0) return;

    const timer = setInterval(() => {
      setSectionTimeLeft(prev => {
        if (prev <= 1) {
          handleSectionAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [sectionTimeLeft, showInstructions, mcqCompleted]);

  useEffect(() => {
    if (showInstructions) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setViolations(prev => prev + 1);
        alert('⚠️ Warning: Tab switching detected! This violation has been recorded.');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [showInstructions]);

  useEffect(() => {
    if (currentQuestion && !visited.has(currentQuestion._id)) {
      setVisited(new Set(visited).add(currentQuestion._id));
    }
  }, [currentQuestionIndex, currentSectionIndex]);


  const handleStartTest = () => {
    if (!agreedToTerms) {
      alert('Please accept the terms and conditions to proceed.');
      return;
    }
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

  const getQuestionStatus = (question: Question): QuestionStatus => {
    if (markedForReview.has(question._id)) return 'marked';
    if (answers[question._id]) return 'answered';
    if (visited.has(question._id)) return 'not-answered';
    return 'not-visited';
  };

  const getStatusColor = (status: QuestionStatus): string => {
    switch (status) {
      case 'answered': return 'bg-green-500 text-white';
      case 'not-answered': return 'bg-red-500 text-white';
      case 'marked': return 'bg-purple-500 text-white';
      case 'not-visited': return 'bg-gray-300 text-gray-700';
    }
  };

  const getCounts = () => {
    let answered = 0, notAnswered = 0, marked = 0, notVisited = 0;
    currentQuestions.forEach(q => {
      const status = getQuestionStatus(q);
      if (status === 'answered') answered++;
      else if (status === 'not-answered') notAnswered++;
      else if (status === 'marked') marked++;
      else notVisited++;
    });
    return { answered, notAnswered, marked, notVisited };
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
    if (markedForReview.has(questionId)) {
      const newMarked = new Set(markedForReview);
      newMarked.delete(questionId);
      setMarkedForReview(newMarked);
    }
  };

  const handleClearResponse = () => {
    if (currentQuestion) {
      const newAnswers = { ...answers };
      delete newAnswers[currentQuestion._id];
      setAnswers(newAnswers);
    }
  };

  const handleMarkForReview = () => {
    if (currentQuestion) {
      const newMarked = new Set(markedForReview);
      if (newMarked.has(currentQuestion._id)) {
        newMarked.delete(currentQuestion._id);
      } else {
        newMarked.add(currentQuestion._id);
      }
      setMarkedForReview(newMarked);
    }
  };

  const handleNavigateQuestion = (direction: 'next' | 'prev') => {
    if (direction === 'next' && currentQuestionIndex < currentQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else if (direction === 'prev' && currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSaveAndNext = () => {
    if (currentQuestionIndex < currentQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setShowSectionComplete(true);
    }
  };

  const handleMarkForReviewAndNext = () => {
    handleMarkForReview();
    handleSaveAndNext();
  };

  const handleSectionAutoSubmit = () => {
    setShowSectionComplete(true);
  };

  const handleNextSection = () => {
    setShowSectionComplete(false);
    if (test.hasSections && test.sections && currentSectionIndex < test.sections.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1);
      setCurrentQuestionIndex(0);
      setSectionTimeLeft(test.sections[currentSectionIndex + 1].sectionDuration * 60);
    } else {
      if (test.hasCodingSection && test.codingQuestions && test.codingQuestions.length > 0) {
        setMcqCompleted(true);
        if (test.codingQuestions.length > 0) {
          setSelectedCodingQuestionId(test.codingQuestions[0]._id || test.codingQuestions[0].questionId);
        }
      } else {
        setShowSubmitConfirm(true);
      }
    }
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);

    try {
      const answerArray = Object.entries(answers).map(([questionId, selectedAnswer]) => ({
        questionId,
        selectedAnswer
      }));

      const timeSpent = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
      await onSubmit(answerArray, timeSpent, violations);
    } catch (error) {
      console.error('Error submitting test:', error);
      alert('Error submitting test. Please try again.');
      setSubmitting(false);
    }
  };

  if (showInstructions) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
        <div className="max-w-4xl w-full bg-white rounded-xl sm:rounded-2xl shadow-2xl max-h-[95vh] overflow-y-auto">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 sm:px-6 md:px-8 py-4 md:py-6 rounded-t-xl sm:rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2">{test.testName}</h1>
                <p className="text-blue-100">{test.testDescription}</p>
              </div>
              <Shield className="w-12 h-12 sm:w-16 sm:h-16 opacity-80" />
            </div>
          </div>

          <div className="p-4 sm:p-6 md:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">{test.numberOfQuestions}</div>
                <div className="text-sm text-gray-600">Questions</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">{test.duration} min</div>
                <div className="text-sm text-gray-600">Total Duration</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-purple-600">{test.totalMarks}</div>
                <div className="text-sm text-gray-600">Total Marks</div>
              </div>
            </div>

            {test.hasSections && test.sections && (
              <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">Test Sections:</h3>
                <div className="space-y-2">
                  {test.sections.map((section, index) => (
                    <div key={index} className="flex justify-between items-center bg-white p-3 rounded">
                      <span className="font-medium text-gray-800">{index + 1}. {section.sectionName}</span>
                      <div className="flex gap-4 text-sm text-gray-600">
                        <span>{section.numberOfQuestions} Questions</span>
                        <span>{section.sectionDuration} min</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4 mb-6">
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <AlertTriangle className="text-yellow-500" />
                  Important Instructions:
                </h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 text-sm">
                  <li>Read each question carefully before answering</li>
                  <li>All sections must be completed in sequence</li>
                  <li>You cannot go back to previous sections</li>
                  <li>Each section has its own time limit</li>
                  <li>Test will auto-submit when time expires</li>
                  <li>Do not refresh the page or close the browser</li>
                </ul>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <h3 className="font-semibold text-gray-900 mb-2">Navigation Buttons:</h3>
                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-medium">Save & Next</div>
                    <span>Save answer and move to next question</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="px-3 py-1 bg-purple-600 text-white rounded text-xs font-medium">Mark for Review</div>
                    <span>Mark question for later review</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="px-3 py-1 bg-orange-600 text-white rounded text-xs font-medium">Clear</div>
                    <span>Clear your selected answer</span>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                <h3 className="font-semibold text-gray-900 mb-2">Question Status Colors:</h3>
                <div className="grid grid-cols-2 gap-3">
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
                  <li>Switching tabs or minimizing browser</li>
                  <li>Exiting fullscreen mode</li>
                  <li>Using external resources</li>
                  <li>All violations will be tracked and recorded</li>
                </ul>
              </div>
            </div>

            <div className="mb-6">
              <label className="flex items-start gap-3 cursor-pointer p-4 border-2 border-gray-200 rounded-lg hover:border-blue-400">
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
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed font-medium transition-colors flex items-center gap-2"
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

  if (mcqCompleted && test.hasCodingSection) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <div className="bg-white shadow-md border-b-2 border-green-600 px-6 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Code className="w-6 h-6 text-green-600" />
              <h1 className="text-xl font-bold text-gray-900">Coding Round</h1>
              {violations > 0 && (
                <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {violations} Violations
                </span>
              )}
            </div>
            <button
              onClick={() => setShowSubmitConfirm(true)}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              Submit Test
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          <div className="w-full md:w-64 bg-white md:border-r overflow-y-auto">
            <div className="p-3 md:p-4 bg-gray-50 border-b">
              <h3 className="font-semibold text-gray-900 text-sm md:text-base">Coding Questions</h3>
            </div>
            <div className="p-2 flex md:flex-col gap-2 overflow-x-auto md:overflow-x-visible">
              {test.codingQuestions?.map((cq: any, idx: number) => (
                <button
                  key={cq._id || cq.questionId || idx}
                  onClick={() => setSelectedCodingQuestionId(cq._id || cq.questionId || cq.id)}
                  className={`flex-shrink-0 md:flex-shrink md:w-full text-left p-3 md:mb-2 rounded-lg border-2 transition-all ${
                    selectedCodingQuestionId === (cq._id || cq.questionId || cq.id)
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium text-sm text-gray-800 whitespace-nowrap md:whitespace-normal">{cq.title || `Question ${idx + 1}`}</div>
                  <div className="text-xs text-gray-500 mt-1">Points: {cq.points || 100}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-hidden min-h-[500px] md:min-h-0">
            {selectedCodingQuestionId ? (
              <CodingInterface
                questionId={selectedCodingQuestionId}
                fullscreen={true}
                isPractice={test.testType === 'Practice'}
                onSubmit={async (submissionId: string, score: number) => {
                  alert(`Submission ${submissionId} scored ${score} points`);
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <Code className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium">Select a coding question to begin</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const counts = getCounts();

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="bg-white shadow-md border-b-2 border-blue-600 px-4 md:px-6 py-3">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
            <h1 className="text-lg md:text-xl font-bold text-gray-900">{test.testName}</h1>
            {currentSection && (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                Section {currentSectionIndex + 1}: {currentSection.sectionName}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 md:gap-6">
            <button
              onClick={() => setShowQuestionPalette(!showQuestionPalette)}
              className="lg:hidden px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm font-medium"
            >
              <List className="w-4 h-4" />
              Palette
            </button>
            {violations > 0 && (
              <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {violations} Violations
              </span>
            )}
            <div className="flex items-center gap-2 text-base md:text-lg font-bold text-gray-900">
              <Clock className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
              {formatTime(sectionTimeLeft)}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <div className="flex-1 flex items-start justify-center p-4 md:p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-4xl w-full">
            <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 lg:p-8 mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-6 pb-4 border-b">
                <div>
                  <span className="text-lg font-semibold text-gray-900">
                    Question {currentQuestionIndex + 1} of {currentQuestions.length}
                  </span>
                </div>
                <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm font-bold">
                  {currentQuestion?.marks || 0} {currentQuestion?.marks === 1 ? 'Mark' : 'Marks'}
                </span>
              </div>

              <h3 className="text-lg md:text-xl font-medium text-gray-900 mb-6 leading-relaxed">
                {currentQuestion?.questionText || 'Question not available'}
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

            <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4">
                <button
                  onClick={() => handleNavigateQuestion('prev')}
                  disabled={currentQuestionIndex === 0}
                  className="px-4 md:px-6 py-2 md:py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium text-sm md:text-base"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Previous
                </button>

                <div className="flex flex-wrap gap-2 sm:gap-3">
                  <button
                    onClick={handleMarkForReviewAndNext}
                    className="px-3 md:px-5 py-2 md:py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2 font-medium text-sm md:text-base"
                  >
                    <Bookmark className="w-5 h-5" />
                    Mark for Review
                  </button>

                  <button
                    onClick={handleClearResponse}
                    disabled={!answers[currentQuestion?._id]}
                    className="px-3 md:px-5 py-2 md:py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium text-sm md:text-base"
                  >
                    Clear
                  </button>

                  <button
                    onClick={handleSaveAndNext}
                    className="px-4 md:px-6 py-2 md:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 font-medium text-sm md:text-base"
                  >
                    Save & Next
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {showQuestionPalette && (
          <div className="fixed lg:relative inset-0 lg:inset-auto z-50 lg:z-auto w-full lg:w-80 bg-white lg:border-l shadow-lg overflow-y-auto">
            <div className="p-4 bg-gray-50 border-b flex justify-between items-center sticky top-0">
              <div className="flex items-center gap-2">
                <List className="w-5 h-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">Question Palette</h3>
              </div>
              <button
                onClick={() => setShowQuestionPalette(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4">
              <div className="mb-4 space-y-2 text-sm">
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
                  <span className="text-gray-600">Not Visited</span>
                  <span className="font-bold text-gray-600">{counts.notVisited}</span>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {currentQuestions.map((q, index) => {
                  const status = getQuestionStatus(q);
                  const isCurrent = index === currentQuestionIndex;
                  return (
                    <button
                      key={index}
                      onClick={() => setCurrentQuestionIndex(index)}
                      className={`w-12 h-12 rounded font-medium text-sm ${getStatusColor(status)} ${
                        isCurrent ? 'ring-4 ring-yellow-400 ring-offset-2' : ''
                      }`}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {!showQuestionPalette && (
          <button
            onClick={() => setShowQuestionPalette(true)}
            className="fixed right-0 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white p-3 rounded-l-lg shadow-lg hover:bg-blue-700"
          >
            <List className="w-6 h-6" />
          </button>
        )}
      </div>

      {showSectionComplete && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-lg w-full mx-4 shadow-2xl">
            <div className="text-center mb-6">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Section Complete!</h3>
              <p className="text-gray-600">
                {currentSection ? `You have completed ${currentSection.sectionName}` : 'Section completed'}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600">{counts.answered}</div>
                  <div className="text-xs text-gray-600">Answered</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">{counts.notAnswered}</div>
                  <div className="text-xs text-gray-600">Not Answered</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">{counts.marked}</div>
                  <div className="text-xs text-gray-600">Marked</div>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleNextSection}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 font-medium flex items-center gap-2"
              >
                {test.hasSections && currentSectionIndex < test.sections!.length - 1 ? (
                  <>Next Section <ChevronRight /></>
                ) : test.hasCodingSection ? (
                  <>Start Coding Round <Code /></>
                ) : (
                  <>Submit Test <CheckCircle /></>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showSubmitConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <AlertCircle className="text-orange-500 w-8 h-8" />
              <h3 className="text-xl font-bold text-gray-900">Submit Test?</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to submit your test? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                disabled={submitting}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? 'Submitting...' : 'Submit Test'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TCSTestInterface;
