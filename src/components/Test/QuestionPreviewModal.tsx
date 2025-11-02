import React, { useState } from 'react';
import { Eye, Edit2, Trash2, X, Save, XCircle } from 'lucide-react';

interface Question {
  questionText: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  marks: number;
}

interface QuestionPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: Question[];
  sectionName: string;
  onEditQuestion: (index: number, updatedQuestion: Question) => void;
  onDeleteQuestion: (index: number) => void;
  readOnly?: boolean;
}

const QuestionPreviewModal: React.FC<QuestionPreviewModalProps> = ({
  isOpen,
  onClose,
  questions,
  sectionName,
  onEditQuestion,
  onDeleteQuestion,
  readOnly = false
}) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  if (!isOpen) return null;

  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
    setEditingQuestion({ ...questions[index] });
  };

  const handleSaveEdit = () => {
    if (editingIndex !== null && editingQuestion) {
      if (!validateQuestion(editingQuestion)) {
        alert('Please fill all fields correctly');
        return;
      }
      onEditQuestion(editingIndex, editingQuestion);
      setEditingIndex(null);
      setEditingQuestion(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditingQuestion(null);
  };

  const handleDelete = (index: number) => {
    if (confirm(`Are you sure you want to delete question ${index + 1}?`)) {
      onDeleteQuestion(index);
      if (editingIndex === index) {
        setEditingIndex(null);
        setEditingQuestion(null);
      }
    }
  };

  const validateQuestion = (question: Question): boolean => {
    return (
      question.questionText.trim() !== '' &&
      question.options.A.trim() !== '' &&
      question.options.B.trim() !== '' &&
      question.options.C.trim() !== '' &&
      question.options.D.trim() !== '' &&
      ['A', 'B', 'C', 'D'].includes(question.correctAnswer)
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Eye className="w-6 h-6" />
              Question Preview: {sectionName}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Total Questions: {questions.length}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {questions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No questions in this section yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((question, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-4 ${
                    editingIndex === index
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  {editingIndex === index && editingQuestion ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium text-blue-900">
                          Editing Question {index + 1}
                        </h4>
                        <div className="flex gap-2">
                          <button
                            onClick={handleCancelEdit}
                            className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 flex items-center gap-1"
                          >
                            <XCircle size={14} />
                            Cancel
                          </button>
                          <button
                            onClick={handleSaveEdit}
                            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"
                          >
                            <Save size={14} />
                            Save
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Question Text
                        </label>
                        <textarea
                          value={editingQuestion.questionText}
                          onChange={(e) =>
                            setEditingQuestion({
                              ...editingQuestion,
                              questionText: e.target.value
                            })
                          }
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {(['A', 'B', 'C', 'D'] as const).map((option) => (
                          <div key={option}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Option {option}
                            </label>
                            <input
                              type="text"
                              value={editingQuestion.options[option]}
                              onChange={(e) =>
                                setEditingQuestion({
                                  ...editingQuestion,
                                  options: {
                                    ...editingQuestion.options,
                                    [option]: e.target.value
                                  }
                                })
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        ))}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Correct Answer
                        </label>
                        <select
                          value={editingQuestion.correctAnswer}
                          onChange={(e) =>
                            setEditingQuestion({
                              ...editingQuestion,
                              correctAnswer: e.target.value as 'A' | 'B' | 'C' | 'D'
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="C">C</option>
                          <option value="D">D</option>
                        </select>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-bold text-sm">
                              {index + 1}
                            </span>
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                              {question.marks} {question.marks === 1 ? 'mark' : 'marks'}
                            </span>
                          </div>
                          <p className="text-gray-900 font-medium mb-3">
                            {question.questionText}
                          </p>
                        </div>
                        {!readOnly && (
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => handleStartEdit(index)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Edit question"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(index)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Delete question"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {Object.entries(question.options).map(([key, value]) => (
                          <div
                            key={key}
                            className={`p-3 rounded-lg border transition-colors ${
                              question.correctAnswer === key
                                ? 'bg-green-50 border-green-300'
                                : 'bg-gray-50 border-gray-200'
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              <span
                                className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-sm font-bold ${
                                  question.correctAnswer === key
                                    ? 'bg-green-200 text-green-800'
                                    : 'bg-gray-200 text-gray-700'
                                }`}
                              >
                                {key}
                              </span>
                              <span className="flex-1 text-sm text-gray-700">
                                {value}
                              </span>
                              {question.correctAnswer === key && (
                                <span className="text-green-600 text-xs font-medium">
                                  ✓
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t bg-gray-50">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionPreviewModal;
