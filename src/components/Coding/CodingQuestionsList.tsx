import React, { useState, useEffect } from 'react';
import { Code, Plus, Edit, Trash2, Search, Filter } from 'lucide-react';
import api from '../../services/api';
import CodingQuestionForm from './CodingQuestionForm';

interface CodingQuestion {
  id: string;
  title: string;
  difficulty: string;
  tags: string[];
  created_at: string;
  test_cases_count?: number;
}

const CodingQuestionsList: React.FC = () => {
  const [questions, setQuestions] = useState<CodingQuestion[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<CodingQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');

  useEffect(() => {
    fetchQuestions();
  }, []);

  useEffect(() => {
    filterQuestions();
  }, [questions, searchTerm, difficultyFilter]);

  const fetchQuestions = async () => {
    try {
      const data = await api.get<CodingQuestion[]>('/coding/questions');
      setQuestions(data);
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterQuestions = () => {
    let filtered = [...questions];

    if (searchTerm) {
      filtered = filtered.filter(q =>
        q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (difficultyFilter !== 'all') {
      filtered = filtered.filter(q => q.difficulty === difficultyFilter);
    }

    setFilteredQuestions(filtered);
  };

  const handleCreateQuestion = async (questionData: any) => {
    try {
      await api.post('/coding/questions', questionData);
      setShowForm(false);
      fetchQuestions();
    } catch (error) {
      console.error('Error creating question:', error);
      alert('Failed to create question');
    }
  };

  const handleUpdateQuestion = async (questionData: any) => {
    try {
      await api.put(`/coding/questions/${editingQuestion.id}`, questionData);
      setShowForm(false);
      setEditingQuestion(null);
      fetchQuestions();
    } catch (error) {
      console.error('Error updating question:', error);
      alert('Failed to update question');
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;

    try {
      await api.delete(`/coding/questions/${id}`);
      fetchQuestions();
    } catch (error) {
      console.error('Error deleting question:', error);
      alert('Failed to delete question');
    }
  };

  const handleEdit = async (question: CodingQuestion) => {
    try {
      const data = await api.get<CodingQuestion>(`/coding/questions/${question.id}`);
      setEditingQuestion(data);
      setShowForm(true);
    } catch (error) {
      console.error('Error fetching question details:', error);
      alert('Failed to load question details');
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Code className="w-8 h-8 text-blue-600" />
          Coding Questions Bank
        </h2>
        <button
          onClick={() => {
            setEditingQuestion(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Add Question
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by title or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="text-gray-400 w-5 h-5" />
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

        <div className="space-y-3">
          {filteredQuestions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {questions.length === 0 ? 'No coding questions yet. Create your first one!' : 'No questions match your filters.'}
            </div>
          ) : (
            filteredQuestions.map((question) => (
              <div
                key={question.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-800">
                        {question.title}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(question.difficulty)}`}>
                        {question.difficulty.toUpperCase()}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      {question.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>
                        {question.test_cases_count || 0} test cases
                      </span>
                      <span>
                        Created {new Date(question.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(question)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="Edit"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(question.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showForm && (
        <CodingQuestionForm
          onClose={() => {
            setShowForm(false);
            setEditingQuestion(null);
          }}
          onSubmit={editingQuestion ? handleUpdateQuestion : handleCreateQuestion}
          initialData={editingQuestion}
        />
      )}
    </div>
  );
};

export default CodingQuestionsList;
