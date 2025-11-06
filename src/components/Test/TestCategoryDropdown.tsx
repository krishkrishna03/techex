import React, { useState } from 'react';
import { ChevronDown, FileText, BookOpen, Brain, Building } from 'lucide-react';

interface TestCategoryDropdownProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  testCounts?: {
    assessment: number;
    practice: number;
    mockTest: number;
    company: number;
  };
}

const TestCategoryDropdown: React.FC<TestCategoryDropdownProps> = ({
  activeCategory,
  onCategoryChange,
  testCounts
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const categories = [
    { id: 'assessment', label: 'Assessment', icon: FileText, value: 'Assessment' },
    { id: 'practice', label: 'Practice', icon: BookOpen, value: 'Practice' },
    { id: 'mockTest', label: 'Mock Test', icon: Brain, value: 'Mock Test' },
    { id: 'company', label: 'Company Test', icon: Building, value: 'Specific Company Test' }
  ];

  const getActiveLabel = () => {
    const category = categories.find(c => c.value === activeCategory);
    return category ? category.label : 'Select Category';
  };

  const getActiveIcon = () => {
    const category = categories.find(c => c.value === activeCategory);
    return category ? category.icon : FileText;
  };

  const handleSelect = (categoryValue: string) => {
    onCategoryChange(categoryValue);
    setIsOpen(false);
  };

  const ActiveIcon = getActiveIcon();

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full md:w-64 flex items-center justify-between px-4 py-3 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-400 transition-all shadow-sm hover:shadow-md"
      >
        <div className="flex items-center gap-2">
          <ActiveIcon className="h-5 w-5 text-blue-600" />
          <span className="font-semibold text-gray-900">{getActiveLabel()}</span>
          {testCounts && (
            <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
              {testCounts[activeCategory.toLowerCase().replace(' ', '') as keyof typeof testCounts] || 0}
            </span>
          )}
        </div>
        <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full mt-2 w-full md:w-64 bg-white border-2 border-gray-200 rounded-xl shadow-xl z-20 overflow-hidden">
            {categories.map((category) => {
              const Icon = category.icon;
              const isActive = category.value === activeCategory;
              const count = testCounts?.[category.id as keyof typeof testCounts] || 0;

              return (
                <button
                  key={category.id}
                  onClick={() => handleSelect(category.value)}
                  className={`w-full flex items-center justify-between px-4 py-3 transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                    <span>{category.label}</span>
                  </div>
                  {testCounts && (
                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default TestCategoryDropdown;
