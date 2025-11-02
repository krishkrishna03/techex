import React, { useState, useEffect } from 'react';
import { Code, Trophy, Clock, CheckCircle, BookMarked, Search, Filter } from 'lucide-react';
import api from '../../services/api';
import CodingInterface from './CodingInterface';

interface PracticeQuestion {
  id: string;
  title: string;
  difficulty: string;
  tags: string[];
  status?: 'not_attempted' | 'attempted' | 'solved';
  best_score?: number;
  attempts?: number;
}

const PracticeCoding: React.FC = () => {
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<PracticeQuestion[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    solved: 0,
    attempted: 0,
    easy: 0,
    medium: 0,
    hard: 0
  });

  useEffect(() => {
    fetchQuestions();
  }, []);

  useEffect(() => {
    filterQuestions();
  }, [questions, searchTerm, difficultyFilter, statusFilter]);

  const fetchQuestions = async () => {
    try {
      const response = await api.get('/api/coding/practice/questions');
      setQuestions(response.data.questions);
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching practice questions:', error);
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

    if (statusFilter !== 'all') {
      filtered = filtered.filter(q => q.status === statusFilter);
    }

    setFilteredQuestions(filtered);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'solved': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'attempted': return <Clock className="w-5 h-5 text-yellow-600" />;
      default: return null;
    }
  };

  const handleSubmit = async (submissionId: string, score: number) => {
    fetchQuestions();
  };

  if (selectedQuestion) {
    return (
      <div className="relative">
        <button
          onClick={() => setSelectedQuestion(null)}
          className="absolute top-4 left-4 z-10 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 shadow-md"
        >
          ← Back to Problems
        </button>
        <CodingInterface
          questionId={selectedQuestion}
          isPractice={true}
          onSubmit={handleSubmit}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Code className="w-8 h-8 text-blue-600" />
          Practice Coding Problems
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Total Problems</span>
            <Code className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-gray-800">{stats.total}</div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Solved</span>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-green-600">{stats.solved}</div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Attempted</span>
            <Clock className="w-5 h-5 text-yellow-600" />
          </div>
          <div className="text-3xl font-bold text-yellow-600">{stats.attempted}</div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Success Rate</span>
            <Trophy className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-3xl font-bold text-purple-600">
            {stats.total > 0 ? Math.round((stats.solved / stats.total) * 100) : 0}%
          </div>
        </div>
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

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="solved">Solved</option>
              <option value="attempted">Attempted</option>
              <option value="not_attempted">Not Attempted</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Title</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Difficulty</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Tags</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Best Score</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Attempts</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuestions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-500">
                    {questions.length === 0 ? 'No practice questions available yet.' : 'No questions match your filters.'}
                  </td>
                </tr>
              ) : (
                filteredQuestions.map((question) => (
                  <tr key={question.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      {getStatusIcon(question.status)}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => setSelectedQuestion(question.id)}
                        className="font-medium text-blue-600 hover:text-blue-800"
                      >
                        {question.title}
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(question.difficulty)}`}>
                        {question.difficulty.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {question.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs">
                            {tag}
                          </span>
                        ))}
                        {question.tags.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                            +{question.tags.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-700">
                      {question.best_score !== undefined ? `${question.best_score}%` : '-'}
                    </td>
                    <td className="py-3 px-4 text-gray-700">
                      {question.attempts || 0}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => setSelectedQuestion(question.id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                      >
                        Solve
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PracticeCoding;
