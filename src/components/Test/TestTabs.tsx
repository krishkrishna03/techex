import React, { useState } from 'react';
import { FileText, BookOpen, GraduationCap, Calculator, MessageSquare, Brain, Building } from 'lucide-react';

interface TestTabsProps {
  activeTestType: string;
  activeSubject: string;
  onTestTypeChange: (testType: string) => void;
  onSubjectChange: (subject: string) => void;
  testCounts?: {
    byType: { [key: string]: number };
    bySubject: { [key: string]: number };
  };
}

const TestTabs: React.FC<TestTabsProps> = ({
  activeTestType,
  activeSubject,
  onTestTypeChange,
  onSubjectChange,
  testCounts
}) => {
  const [activeTabGroup, setActiveTabGroup] = useState<'type' | 'subject'>('type');

  const testTypes = [
    { id: 'all', label: 'All Tests', icon: FileText },
    { id: 'Assessment', label: 'Assessment', icon: FileText },
    { id: 'Practice', label: 'Practice', icon: BookOpen },
    { id: 'Assignment', label: 'Assignment', icon: GraduationCap },
    { id: 'Mock Test', label: 'Mock Test', icon: Brain },
    { id: 'Specific Company Test', label: 'Company Test', icon: Building }
  ];

  const subjects = [
    { id: 'all', label: 'All Subjects', icon: BookOpen },
    { id: 'Verbal', label: 'Verbal', icon: MessageSquare },
    { id: 'Reasoning', label: 'Reasoning', icon: Brain },
    { id: 'Technical', label: 'Technical', icon: FileText },
    { id: 'Arithmetic', label: 'Arithmetic', icon: Calculator },
    { id: 'Communication', label: 'Communication', icon: MessageSquare }
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg mb-6 border border-gray-100">
      <div className="border-b border-gray-200 bg-gray-50 rounded-t-xl">
        <div className="flex">
          <button
            onClick={() => setActiveTabGroup('type')}
            className={`px-6 py-4 font-semibold text-sm border-b-3 transition-all duration-300 ${
              activeTabGroup === 'type'
                ? 'border-blue-500 text-blue-600 bg-white shadow-sm'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            📋 Filter by Test Type
          </button>
          <button
            onClick={() => setActiveTabGroup('subject')}
            className={`px-6 py-4 font-semibold text-sm border-b-3 transition-all duration-300 ${
              activeTabGroup === 'subject'
                ? 'border-blue-500 text-blue-600 bg-white shadow-sm'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            📚 Filter by Subject
          </button>
        </div>
      </div>

      <div className="p-6">
        {activeTabGroup === 'type' ? (
          <div className="flex flex-wrap gap-2">
            {testTypes.map((type) => {
              const Icon = type.icon;
              const count = testCounts?.byType[type.id] || 0;
              const isActive = activeTestType === type.id;
              
              return (
                <button
                  key={type.id}
                  onClick={() => onTestTypeChange(type.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md transform scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200 hover:shadow-sm'
                  }`}
                >
                  <Icon size={16} />
                  {type.label}
                  {testCounts && (
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      isActive ? 'bg-white text-blue-600' : 'bg-gray-300 text-gray-700'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {subjects.map((subject) => {
              const Icon = subject.icon;
              const count = testCounts?.bySubject[subject.id] || 0;
              const isActive = activeSubject === subject.id;
              
              return (
                <button
                  key={subject.id}
                  onClick={() => onSubjectChange(subject.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md transform scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200 hover:shadow-sm'
                  }`}
                >
                  <Icon size={16} />
                  {subject.label}
                  {testCounts && (
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      isActive ? 'bg-white text-green-600' : 'bg-gray-300 text-gray-700'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TestTabs;