import React, { useState } from 'react';
import { Search, Filter, SlidersHorizontal, Grid3x3, List, Calendar, TrendingUp, X } from 'lucide-react';
import AdvancedTestCard from './AdvancedTestCard';

interface Test {
  _id: string;
  testName: string;
  testDescription: string;
  subject: string;
  testType?: string;
  topics?: string[];
  difficulty?: string;
  numberOfQuestions: number;
  totalMarks: number;
  duration: number;
  startDateTime: string;
  endDateTime: string;
  createdAt: string;
  assignmentCount?: number;
  completionRate?: number;
  averageScore?: number;
}

interface AdvancedTestGridProps {
  tests: Test[];
  onView: (testId: string) => void;
  onAssign: (testId: string) => void;
  onEdit?: (testId: string) => void;
  onDelete?: (testId: string) => void;
  onReport?: (testId: string) => void;
  showActions?: boolean;
  loading?: boolean;
}

const AdvancedTestGrid: React.FC<AdvancedTestGridProps> = ({
  tests,
  onView,
  onAssign,
  onEdit,
  onDelete,
  onReport,
  showActions = true,
  loading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedTestType, setSelectedTestType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'upcoming'>('recent');
  const [showFilters, setShowFilters] = useState(false);

  const subjects = ['Verbal', 'Reasoning', 'Technical', 'Arithmetic', 'Communication'];
  const difficulties = ['Easy', 'Medium', 'Hard'];
  const testTypes = ['Assessment', 'Practice', 'Assignment', 'Mock Test', 'Specific Company Test'];
  const statuses = ['Active', 'Upcoming', 'Ended'];

  const getTestStatus = (test: Test) => {
    const now = new Date();
    const start = new Date(test.startDateTime);
    const end = new Date(test.endDateTime);

    if (now < start) return 'Upcoming';
    if (now > end) return 'Ended';
    return 'Active';
  };

  const filteredTests = tests
    .filter(test => {
      const matchesSearch = test.testName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           test.testDescription.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSubject = selectedSubject === 'all' || test.subject === selectedSubject;
      const matchesDifficulty = selectedDifficulty === 'all' || test.difficulty === selectedDifficulty;
      const matchesTestType = selectedTestType === 'all' || test.testType === selectedTestType;
      const matchesStatus = selectedStatus === 'all' || getTestStatus(test) === selectedStatus;

      return matchesSearch && matchesSubject && matchesDifficulty && matchesTestType && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.testName.localeCompare(b.testName);
        case 'upcoming':
          return new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime();
        case 'recent':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  const activeFiltersCount = [
    selectedSubject !== 'all',
    selectedDifficulty !== 'all',
    selectedStatus !== 'all',
    selectedTestType !== 'all'
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSelectedSubject('all');
    setSelectedDifficulty('all');
    setSelectedStatus('all');
    setSelectedTestType('all');
    setSearchTerm('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search tests by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-3 rounded-lg font-semibold flex items-center gap-2 transition-all ${
                showFilters
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <SlidersHorizontal size={20} />
              Filters
              {activeFiltersCount > 0 && (
                <span className="bg-white text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${
                  viewMode === 'grid'
                    ? 'bg-white text-blue-600 shadow'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Grid3x3 size={20} />
              </button>
              <button
                onClick={() => setViewMode('compact')}
                className={`p-2 rounded ${
                  viewMode === 'compact'
                    ? 'bg-white text-blue-600 shadow'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List size={20} />
              </button>
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-6 border-2 border-gray-200 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Filter size={20} />
                Filter Tests
              </h3>
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-red-600 hover:text-red-700 font-semibold flex items-center gap-1"
                >
                  <X size={16} />
                  Clear All
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none bg-white"
                >
                  <option value="all">All Subjects</option>
                  {subjects.map(subject => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Test Type</label>
                <select
                  value={selectedTestType}
                  onChange={(e) => setSelectedTestType(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none bg-white"
                >
                  <option value="all">All Types</option>
                  {testTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Difficulty</label>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none bg-white"
                >
                  <option value="all">All Levels</option>
                  {difficulties.map(difficulty => (
                    <option key={difficulty} value={difficulty}>{difficulty}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none bg-white"
                >
                  <option value="all">All Statuses</option>
                  {statuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Showing <span className="font-bold text-gray-900">{filteredTests.length}</span> of <span className="font-bold text-gray-900">{tests.length}</span> tests
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-700">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none bg-white text-sm font-medium"
            >
              <option value="recent">Recently Created</option>
              <option value="name">Name (A-Z)</option>
              <option value="upcoming">Upcoming First</option>
            </select>
          </div>
        </div>
      </div>

      {filteredTests.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-12 text-center">
          <div className="text-gray-400 mb-4">
            <Calendar size={64} className="mx-auto" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No tests found</h3>
          <p className="text-gray-600">
            {searchTerm || activeFiltersCount > 0
              ? 'Try adjusting your search or filters'
              : 'No tests available at the moment'}
          </p>
        </div>
      ) : (
        <div className={`grid gap-6 ${
          viewMode === 'compact'
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
        }`}>
          {filteredTests.map((test) => (
            <AdvancedTestCard
              key={test._id}
              test={test}
              onView={onView}
              onAssign={onAssign}
              onEdit={onEdit}
              onDelete={onDelete}
              onReport={onReport}
              showActions={showActions}
              variant={viewMode === 'compact' ? 'compact' : 'default'}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AdvancedTestGrid;
