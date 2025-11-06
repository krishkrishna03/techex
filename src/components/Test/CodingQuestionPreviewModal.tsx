import React from 'react';
import { Eye, X, Code, Clock } from 'lucide-react';

interface CodingQuestion {
  _id?: string;
  id?: string;
  title: string;
  description?: string;
  difficulty: string;
  constraints?: string;
  input_format?: string;
  output_format?: string;
  sample_input?: string;
  sample_output?: string;
  explanation?: string;
  time_limit?: number;
  timeLimit?: number;
  memory_limit?: number;
  supported_languages?: string[];
  tags?: string[];
  points?: number;
}

interface CodingQuestionPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: CodingQuestion[];
  sectionName: string;
}

const CodingQuestionPreviewModal: React.FC<CodingQuestionPreviewModalProps> = ({
  isOpen,
  onClose,
  questions,
  sectionName
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Eye className="w-6 h-6" />
              Coding Questions Preview: {sectionName}
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
              <p>No coding questions in this section yet.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {questions.map((question, index) => (
                <div key={question._id} className="border rounded-lg p-6 bg-white space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-bold text-sm">
                          {index + 1}
                        </span>
                        <h3 className="text-lg font-semibold text-gray-800">
                          {question.title}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium
                          ${question.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                            question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'}`}>
                          {question.difficulty.toUpperCase()}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <span className="flex items-center gap-1">
                          <Code className="w-4 h-4" />
                          {question.supported_languages?.join(', ') || 'Python, JavaScript'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {(question.timeLimit || question.time_limit || 3600)}s
                        </span>
                      </div>

                      <div className="prose max-w-none">
                        <div className="mb-4">
                          <h4 className="text-base font-medium text-gray-900 mb-2">Description</h4>
                          <p className="text-gray-700">{question.description}</p>
                        </div>

                        <div className="mb-4">
                          <h4 className="text-base font-medium text-gray-900 mb-2">Constraints</h4>
                          <p className="text-gray-700 whitespace-pre-line">{question.constraints}</p>
                        </div>

                        <div className="mb-4">
                          <h4 className="text-base font-medium text-gray-900 mb-2">Input Format</h4>
                          <p className="text-gray-700">{question.input_format}</p>
                        </div>

                        <div className="mb-4">
                          <h4 className="text-base font-medium text-gray-900 mb-2">Output Format</h4>
                          <p className="text-gray-700">{question.output_format}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-base font-medium text-gray-900 mb-2">Sample Input</h4>
                            <pre className="bg-gray-50 p-3 rounded-lg text-sm font-mono">{question.sample_input}</pre>
                          </div>
                          <div>
                            <h4 className="text-base font-medium text-gray-900 mb-2">Sample Output</h4>
                            <pre className="bg-gray-50 p-3 rounded-lg text-sm font-mono">{question.sample_output}</pre>
                          </div>
                        </div>

                        {question.explanation && (
                          <div className="mt-4">
                            <h4 className="text-base font-medium text-gray-900 mb-2">Explanation</h4>
                            <p className="text-gray-700">{question.explanation}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
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

export default CodingQuestionPreviewModal;