import React, { useState, useEffect } from 'react';
import { Clock, AlertCircle, CheckCircle, Send, ChevronRight, ChevronLeft, List } from 'lucide-react';
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

interface SectionedTestInterfaceProps {
  test: Test;
  startTime: Date;
  onSubmit: (answers: any[], timeSpent: number) => Promise<void>;
  onExit: () => void;
}

const SectionedTestInterface: React.FC<SectionedTestInterfaceProps> = ({
  test,
  startTime,
  onSubmit,
  onExit
}) => {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentQuestionInSection, setCurrentQuestionInSection] = useState(0);
  const [answers, setAnswers] = useState<{ [questionId: string]: string }>({});
  const [sectionTimeLeft, setSectionTimeLeft] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [showSectionSummary, setShowSectionSummary] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);


  useEffect(() => {
    if (test.hasSections && test.sections) {
      setSectionTimeLeft(test.sections.map(section => section.sectionDuration * 60));
    } else {
      setSectionTimeLeft([test.duration * 60]);
    }
  }, [test]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSectionTimeLeft(prev => {
        const newTimes = [...prev];
        if (newTimes[currentSectionIndex] > 0) {
          newTimes[currentSectionIndex] -= 1;
        } else {
          if (test.hasSections && test.sections && currentSectionIndex < test.sections.length - 1) {
            setCurrentSectionIndex(currentSectionIndex + 1);
            setCurrentQuestionInSection(0);
            setShowSectionSummary(false);
          } else {
            handleAutoSubmit();
          }
        }
        return newTimes;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentSectionIndex]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
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

  const getTotalQuestionsAnswered = () => {
    return Object.keys(answers).length;
  };

  const getSectionQuestionsAnswered = (sectionIndex: number) => {
    if (!test.hasSections || !test.sections) return 0;
    const section = test.sections[sectionIndex];
    return section.questions.filter(q => answers[q._id]).length;
  };

  const handleNextQuestion = () => {
    const questions = getCurrentQuestions();
    if (currentQuestionInSection < questions.length - 1) {
      setCurrentQuestionInSection(currentQuestionInSection + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionInSection > 0) {
      setCurrentQuestionInSection(currentQuestionInSection - 1);
    }
  };

  const handleNextSection = () => {
    if (test.hasSections && test.sections && currentSectionIndex < test.sections.length - 1) {
      setShowSectionSummary(true);
    } else {
      setShowConfirmSubmit(true);
    }
  };

  const confirmNextSection = () => {
    setCurrentSectionIndex(currentSectionIndex + 1);
    setCurrentQuestionInSection(0);
    setShowSectionSummary(false);
  };

  const handleAutoSubmit = async () => {
    await handleSubmit();
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const formattedAnswers = Object.entries(answers).map(([questionId, selectedAnswer]) => ({
        questionId,
        selectedAnswer,
        timeSpent: 0
      }));

      const timeSpent = Math.floor((Date.now() - new Date(startTime).getTime()) / 1000);
      await onSubmit(formattedAnswers, timeSpent);
    } catch (error) {
      console.error('Submit error:', error);
      alert('Failed to submit test. Please try again.');
      setSubmitting(false);
    }
  };

  const currentSection = getCurrentSection();
  const currentQuestions = getCurrentQuestions();
  const currentQuestion = currentQuestions[currentQuestionInSection];
  const isLastQuestionInSection = currentQuestionInSection === currentQuestions.length - 1;
  const isLastSection = !test.hasSections || (test.sections && currentSectionIndex === test.sections.length - 1);

  if (showSectionSummary) {
    const section = test.sections![currentSectionIndex];
    const answeredCount = getSectionQuestionsAnswered(currentSectionIndex);

    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Section Complete!</h2>
            <p className="text-gray-600">You have completed {section.sectionName}</p>
          </div>

          <div className="bg-blue-50 p-6 rounded-lg mb-6">
            <h3 className="font-semibold mb-4">Section Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Questions Answered</p>
                <p className="text-2xl font-bold text-blue-600">
                  {answeredCount} / {section.numberOfQuestions}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Time Remaining</p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatTime(sectionTimeLeft[currentSectionIndex])}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <AlertCircle className="text-yellow-600 mr-3" />
              <div>
                <p className="font-medium text-yellow-800">Important Note</p>
                <p className="text-sm text-yellow-700">
                  Once you proceed to the next section, you cannot return to this section.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <button
              onClick={() => {
                setShowSectionSummary(false);
              }}
              className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              Review Answers
            </button>
            <button
              onClick={confirmNextSection}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              Proceed to Next Section
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showConfirmSubmit) {
    const totalAnswered = getTotalQuestionsAnswered();
    const totalQuestions = test.hasSections && test.sections
      ? test.sections.reduce((sum, s) => sum + s.numberOfQuestions, 0)
      : test.numberOfQuestions;

    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Submit Test?</h2>
            <p className="text-gray-600">Are you sure you want to submit your test?</p>
          </div>

          <div className="bg-blue-50 p-6 rounded-lg mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">Questions Answered</p>
                <p className="text-2xl font-bold text-blue-600">
                  {totalAnswered} / {totalQuestions}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Questions Unanswered</p>
                <p className="text-2xl font-bold text-red-600">
                  {totalQuestions - totalAnswered}
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <button
              onClick={() => setShowConfirmSubmit(false)}
              className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              disabled={submitting}
            >
              Go Back
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              disabled={submitting}
            >
              {submitting ? <LoadingSpinner size="sm" /> : <Send size={20} />}
              Submit Test
            </button>
          </div>
        </div>
      </div>
    );
  }
if (showExitConfirm) {
  return (
    <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
      <div className="max-w-md bg-white rounded-lg shadow-lg p-8 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Exit Test?</h2>
        <p className="text-gray-600 mb-6">
          Are you sure you want to exit the test? Your progress will not be saved.
        </p>

        <div className="flex justify-center gap-4">
          <button
            onClick={() => setShowExitConfirm(false)}
            className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={onExit}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
          >
            <AlertCircle size={18} />
            Exit Test
          </button>
        </div>
      </div>
    </div>
  );
}

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold">{test.testName}</h1>
              {currentSection && (
                <p className="text-sm text-gray-600">{currentSection.sectionName}</p>
              )}
            </div>
              {/* Exit Test Button */}
  <button
    onClick={() => setShowExitConfirm(true)}
    className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg shadow hover:bg-red-700 transition"
  >
    <AlertCircle size={18} />
    Exit Test
  </button>

            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Time Left</p>
                <p className={`text-2xl font-bold ${
                  sectionTimeLeft[currentSectionIndex] < 60 ? 'text-red-600' : 'text-blue-600'
                }`}>
                  <Clock className="inline w-5 h-5 mr-1" />
                  {formatTime(sectionTimeLeft[currentSectionIndex])}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Progress</p>
                <p className="text-lg font-semibold">
                  {getTotalQuestionsAnswered()} / {test.hasSections && test.sections
                    ? test.sections.reduce((sum, s) => sum + s.numberOfQuestions, 0)
                    : test.numberOfQuestions}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-9">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">
                    Question {currentQuestionInSection + 1} of {currentQuestions.length}
                  </h3>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {currentQuestion.marks} {currentQuestion.marks === 1 ? 'Mark' : 'Marks'}
                  </span>
                </div>
                <p className="text-gray-800 text-lg mb-6">{currentQuestion.questionText}</p>

                <div className="space-y-3">
                  {Object.entries(currentQuestion.options).map(([key, value]) => (
                    <label
                      key={key}
                      className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        answers[currentQuestion._id] === key
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name={currentQuestion._id}
                        value={key}
                        checked={answers[currentQuestion._id] === key}
                        onChange={(e) => handleAnswerChange(currentQuestion._id, e.target.value)}
                        className="mr-3"
                      />
                      <span className="font-medium">{key}.</span> {value}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-6 border-t">
                <button
                  onClick={handlePreviousQuestion}
                  disabled={currentQuestionInSection === 0}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <ChevronLeft size={20} />
                  Previous
                </button>

                {isLastQuestionInSection ? (
                  <button
                    onClick={handleNextSection}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                  >
                    {isLastSection ? (
                      <>
                        <Send size={20} />
                        Submit Test
                      </>
                    ) : (
                      <>
                        Next Section
                        <ChevronRight size={20} />
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleNextQuestion}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    Next
                    <ChevronRight size={20} />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="col-span-3">
            <div className="bg-white rounded-lg shadow p-4 sticky top-24">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <List size={18} />
                Questions
              </h4>

              {test.hasSections && test.sections ? (
                <div className="space-y-4">
                  {test.sections.map((section, sIndex) => (
                    <div key={sIndex}>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">
                        {section.sectionName}
                      </h5>
                      <div className="grid grid-cols-5 gap-2">
                        {section.questions.map((q, qIndex) => {
                          const isCurrentSection = sIndex === currentSectionIndex;
                          const isCurrentQuestion = isCurrentSection && qIndex === currentQuestionInSection;
                          const isAnswered = !!answers[q._id];

                          return (
                            <button
                              key={qIndex}
                              onClick={() => {
                                if (isCurrentSection) {
                                  setCurrentQuestionInSection(qIndex);
                                }
                              }}
                              disabled={!isCurrentSection}
                              className={`w-10 h-10 rounded flex items-center justify-center text-sm font-medium ${
                                isCurrentQuestion
                                  ? 'bg-blue-600 text-white'
                                  : isAnswered
                                  ? 'bg-green-100 text-green-800'
                                  : isCurrentSection
                                  ? 'bg-gray-100 text-gray-700'
                                  : 'bg-gray-50 text-gray-400'
                              } ${isCurrentSection ? 'cursor-pointer hover:bg-blue-100' : 'cursor-not-allowed'}`}
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
                    const isCurrentQuestion = index === currentQuestionInSection;
                    const isAnswered = !!answers[q._id];

                    return (
                      <button
                        key={index}
                        onClick={() => setCurrentQuestionInSection(index)}
                        className={`w-10 h-10 rounded flex items-center justify-center text-sm font-medium ${
                          isCurrentQuestion
                            ? 'bg-blue-600 text-white'
                            : isAnswered
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-700'
                        } cursor-pointer hover:bg-blue-100`}
                      >
                        {index + 1}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SectionedTestInterface;