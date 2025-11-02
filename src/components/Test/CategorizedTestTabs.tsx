import React, { useState } from 'react';
import { FileText, BookOpen, Brain, Building, MessageSquare, Calculator } from 'lucide-react';

interface CategorizedTestTabsProps {
  onFilterChange: (testType: string, subject: string) => void;
  testCounts?: {
    assessment: { [subject: string]: number };
    practice: { [subject: string]: number };
    mockTest: { [subject: string]: number };
    company: { [subject: string]: number };
  };
  loading?: boolean;
}

const CategorizedTestTabs: React.FC<CategorizedTestTabsProps> = ({
  onFilterChange,
  testCounts,
  loading = false
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('assessment');
  const [activeSubject, setActiveSubject] = useState<string>('all');

  const categories = [
    { id: 'assessment', label: 'Assessment', icon: FileText, color: 'blue' },
    { id: 'practice', label: 'Practice', icon: BookOpen, color: 'green' },
    { id: 'mockTest', label: 'Mock Test', icon: Brain, color: 'orange' },
    { id: 'company', label: 'Specific Company', icon: Building, color: 'red' }
  ];

  const subjects = [
    { id: 'all', label: 'All Subjects', icon: BookOpen },
    { id: 'Verbal', label: 'Verbal', icon: MessageSquare },
    { id: 'Reasoning', label: 'Reasoning', icon: Brain },
    { id: 'Technical', label: 'Technical', icon: FileText },
    { id: 'Arithmetic', label: 'Arithmetic', icon: Calculator },
    { id: 'Communication', label: 'Communication', icon: MessageSquare }
  ];

  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId);
    setActiveSubject('all');

    const testTypeMap: { [key: string]: string } = {
      'assessment': 'Assessment',
      'practice': 'Practice',
      'mockTest': 'Mock Test',
      'company': 'Specific Company Test'
    };

    onFilterChange(testTypeMap[categoryId], 'all');
  };

  const handleSubjectChange = (subjectId: string) => {
    setActiveSubject(subjectId);

    const testTypeMap: { [key: string]: string } = {
      'assessment': 'Assessment',
      'practice': 'Practice',
      'mockTest': 'Mock Test',
      'company': 'Specific Company Test'
    };

    onFilterChange(testTypeMap[activeCategory], subjectId === 'all' ? 'all' : subjectId);
  };

  const getSubjectCount = (subject: string) => {
    if (!testCounts) return 0;
    const categoryKey = activeCategory as keyof typeof testCounts;
    const categoryData = testCounts[categoryKey];
    if (!categoryData) return 0;

    if (subject === 'all') {
      return Object.values(categoryData).reduce((sum, count) => sum + count, 0);
    }
    return categoryData[subject] || 0;
  };

  const getCategoryColor = (colorName: string, isActive: boolean) => {
    const colors: { [key: string]: { bg: string, text: string, active: string } } = {
      blue: {
        bg: isActive ? 'bg-blue-500' : 'bg-blue-100',
        text: isActive ? 'text-white' : 'text-blue-700',
        active: 'hover:bg-blue-200'
      },
      green: {
        bg: isActive ? 'bg-green-500' : 'bg-green-100',
        text: isActive ? 'text-white' : 'text-green-700',
        active: 'hover:bg-green-200'
      },
      orange: {
        bg: isActive ? 'bg-orange-500' : 'bg-orange-100',
        text: isActive ? 'text-white' : 'text-orange-700',
        active: 'hover:bg-orange-200'
      },
      red: {
        bg: isActive ? 'bg-red-500' : 'bg-red-100',
        text: isActive ? 'text-white' : 'text-red-700',
        active: 'hover:bg-red-200'
      }
    };
    return colors[colorName];
  };

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-r from-white to-gray-50 rounded-2xl shadow-lg border-2 border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-2">
          <FileText className="h-6 w-6 text-blue-600" />
          Test Categories
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((category) => {
            const Icon = category.icon;
            const isActive = activeCategory === category.id;
            const colorScheme = getCategoryColor(category.color, isActive);

            return (
              <button
                key={category.id}
                onClick={() => handleCategoryChange(category.id)}
                disabled={loading}
                className={`${colorScheme.bg} ${colorScheme.text} ${!isActive && colorScheme.active}
                  p-5 rounded-xl transition-all duration-300 transform
                  ${isActive ? 'shadow-xl scale-105 ring-2 ring-offset-2 ring-blue-400' : 'shadow-md hover:shadow-lg hover:scale-102'}
                  ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  flex flex-col items-center gap-3 group relative overflow-hidden`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <Icon size={28} className="relative z-10 group-hover:scale-110 transition-transform" />
                <span className="font-bold text-sm relative z-10">{category.label}</span>
                {testCounts && (
                  <span className={`text-xs px-3 py-1 rounded-full font-semibold relative z-10 ${
                    isActive ? 'bg-white bg-opacity-40 backdrop-blur-sm' : 'bg-white bg-opacity-60'
                  }`}>
                    {getSubjectCount('all')} tests
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-gradient-to-r from-white to-gray-50 rounded-2xl shadow-lg border-2 border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-green-600" />
          Filter by Subject
          <span className="text-sm font-semibold text-blue-600 ml-2 px-3 py-1 bg-blue-50 rounded-full">
            {categories.find(c => c.id === activeCategory)?.label}
          </span>
        </h3>

        <div className="flex flex-wrap gap-3">
          {subjects.map((subject) => {
            const Icon = subject.icon;
            const isActive = activeSubject === subject.id;
            const count = getSubjectCount(subject.id);

            return (
              <button
                key={subject.id}
                onClick={() => handleSubjectChange(subject.id)}
                disabled={loading}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-300 group
                  ${isActive
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105 ring-2 ring-offset-2 ring-blue-400'
                    : 'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 hover:from-gray-200 hover:to-gray-100 border-2 border-gray-200 hover:border-gray-300 hover:shadow-md'
                  }
                  ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <Icon size={18} className={isActive ? 'group-hover:scale-110 transition-transform' : ''} />
                {subject.label}
                {testCounts && (
                  <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold shadow-sm ${
                    isActive ? 'bg-white text-blue-600' : 'bg-white text-gray-700 border border-gray-300'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CategorizedTestTabs;
