import React, { useState, useEffect } from 'react';
import { Code, Plus, Trash2, Search } from 'lucide-react';
import api from '../../services/api';

interface CodingQuestion {
  id: string;
  title: string;
  difficulty: string;
  tags: string[];
  points?: number;
  timeLimit?: number;
}

interface CodingSectionConfigProps {
  selectedQuestions: CodingQuestion[];
  onQuestionsChange: (questions: CodingQuestion[]) => void;
}

const CodingSectionConfig: React.FC<CodingSectionConfigProps> = ({
  selectedQuestions,
  onQuestionsChange
}) => {
  const [availableQuestions, setAvailableQuestions] = useState<CodingQuestion[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<CodingQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [showQuestionSelector, setShowQuestionSelector] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, []);

  useEffect(() => {
    filterQuestions();
  }, [availableQuestions, searchTerm, difficultyFilter]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const questions = await api.get<CodingQuestion[]>('/coding/questions');
      setAvailableQuestions(questions);
    } catch (error) {
      console.error('Error fetching coding questions:', error);
      // Show a user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch coding questions';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const filterQuestions = () => {
    let filtered = [...availableQuestions];

    if (searchTerm) {
      filtered = filtered.filter(q =>
        q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (difficultyFilter !== 'all') {
      filtered = filtered.filter(q => q.difficulty === difficultyFilter);
    }

    const selectedIds = new Set(selectedQuestions.map(q => q.id));
    filtered = filtered.filter(q => !selectedIds.has(q.id));

    setFilteredQuestions(filtered);
  };

  const addQuestion = (question: CodingQuestion) => {
    onQuestionsChange([...selectedQuestions, { ...question, points: 100, timeLimit: 3600 }]);
  };

  const removeQuestion = (questionId: string) => {
    onQuestionsChange(selectedQuestions.filter(q => q.id !== questionId));
  };

  const updatePoints = (questionId: string, points: number) => {
    onQuestionsChange(
      selectedQuestions.map(q => q.id === questionId ? { ...q, points } : q)
    );
  };

  const updateTimeLimit = (questionId: string, timeLimit: number) => {
    onQuestionsChange(
      selectedQuestions.map(q => q.id === questionId ? { ...q, timeLimit } : q)
    );
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Code className="w-5 h-5 text-blue-600" />
          Coding Questions
        </h3>
        <button
          type="button"
          onClick={() => setShowQuestionSelector(!showQuestionSelector)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add Question
        </button>
      </div>

      {selectedQuestions.length > 0 && (
        <div className="space-y-3">
          {selectedQuestions.map((question, index) => (
            <div key={question.id} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-medium text-gray-600">#{index + 1}</span>
                    <h4 className="font-medium text-gray-800">{question.title}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(question.difficulty)}`}>
                      {question.difficulty.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {question.tags.map(tag => (
                      <span key={tag} className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600">Points:</label>
                      <input
                        type="number"
                        value={question.points || 100}
                        onChange={(e) => updatePoints(question.id, parseInt(e.target.value))}
                        className="w-24 px-3 py-1 border rounded focus:ring-2 focus:ring-blue-500"
                        min="1"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600">Time Limit (sec):</label>
                      <input
                        type="number"
                        value={question.timeLimit || 3600}
                        onChange={(e) => updateTimeLimit(question.id, parseInt(e.target.value))}
                        className="w-24 px-3 py-1 border rounded focus:ring-2 focus:ring-blue-500"
                        min="60"
                        step="60"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => removeQuestion(question.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedQuestions.length === 0 && (
        <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
          No coding questions added yet. Click "Add Question" to select questions.
        </div>
      )}

      {showQuestionSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-bold text-gray-800">Select Coding Questions</h3>
              <button
                onClick={() => setShowQuestionSelector(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <div className="p-6 border-b">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search questions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <select
                  value={difficultyFilter}
                  onChange={(e) => setDifficultyFilter(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Difficulties</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : filteredQuestions.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No questions available
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredQuestions.map(question => (
                    <div
                      key={question.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => addQuestion(question)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-medium text-gray-800">{question.title}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(question.difficulty)}`}>
                              {question.difficulty.toUpperCase()}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {question.tags.map(tag => (
                              <span key={tag} className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            addQuestion(question);
                          }}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t flex justify-end">
              <button
                onClick={() => setShowQuestionSelector(false)}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CodingSectionConfig;
