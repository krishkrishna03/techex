import React, { useState, useEffect } from 'react';
import {
  Home,
  Users,
  GraduationCap,
  Building,
  BookOpen,
  UserPlus,
  BarChart3,
  FileText,
  ClipboardList,
  Bell,
  TrendingUp,
  Target,
  ChevronDown,
  ChevronRight,
  Brain,
  Code
} from 'lucide-react';
import apiService from '../../services/api';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  roles?: string[];
  subItems?: SubItem[];
}

interface SubItem {
  id: string;
  label: string;
  testType?: string;
}

interface SidebarProps {
  userRole: string;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ userRole, activeTab, onTabChange }) => {
  const [openDropdowns, setOpenDropdowns] = useState<Set<string>>(new Set());
  const [testCounts, setTestCounts] = useState<any>(null);

  useEffect(() => {
    loadTestCounts();
  }, [userRole]);

  // Auto-open the dropdown when navigating to a test-related tab
  useEffect(() => {
    if (activeTab === 'my-tests' || activeTab === 'tests' || activeTab === 'assigned-tests') {
      const dropdownId = userRole === 'student' ? 'my-tests' : 'tests';
      setOpenDropdowns(prev => new Set(prev).add(dropdownId));
    }
  }, [activeTab, userRole]);

  const loadTestCounts = async () => {
    try {
      let counts = { assessment: 0, practice: 0, mockTest: 0, company: 0 };

      if (userRole === 'master_admin') {
        const allTests = await apiService.getTests();
        counts = {
          assessment: allTests.filter((t: any) => t.testType === 'Assessment').length,
          practice: allTests.filter((t: any) => t.testType === 'Practice').length,
          mockTest: allTests.filter((t: any) => t.testType === 'Mock Test').length,
          company: allTests.filter((t: any) => t.testType === 'Specific Company Test').length
        };
      } else if (userRole === 'student') {
        const allTests = await apiService.getStudentAssignedTests();
        counts = {
          assessment: allTests.filter((t: any) => t.testId.testType === 'Assessment').length,
          practice: allTests.filter((t: any) => t.testId.testType === 'Practice').length,
          mockTest: allTests.filter((t: any) => t.testId.testType === 'Mock Test').length,
          company: allTests.filter((t: any) => t.testId.testType === 'Specific Company Test').length
        };
      } else if (userRole === 'college_admin') {
        const allTests = await apiService.getAssignedTests();
        counts = {
          assessment: allTests.filter((t: any) => t.testId.testType === 'Assessment').length,
          practice: allTests.filter((t: any) => t.testId.testType === 'Practice').length,
          mockTest: allTests.filter((t: any) => t.testId.testType === 'Mock Test').length,
          company: allTests.filter((t: any) => t.testId.testType === 'Specific Company Test').length
        };
      }

      setTestCounts(counts);
    } catch (error) {
      console.error('Failed to load test counts:', error);
    }
  };

  const menuItems: SidebarItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <Home size={20} />,
      roles: ['master_admin', 'college_admin', 'faculty', 'student'],
    },
    {
      id: 'colleges',
      label: 'Colleges',
      icon: <Building size={20} />,
      roles: ['master_admin'],
    },
    {
      id: 'stats',
      label: 'Statistics',
      icon: <BarChart3 size={20} />,
      roles: ['master_admin'],
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: <Bell size={20} />,
      roles: ['master_admin', 'college_admin', 'faculty', 'student'],
    },
    {
      id: 'create-notification',
      label: 'Create Notification',
      icon: <Bell size={20} />,
      roles: ['master_admin', 'college_admin'],
    },
    {
      id: 'notification-analytics',
      label: 'Notification Analytics',
      icon: <TrendingUp size={20} />,
      roles: ['master_admin'],
    },
    {
      id: 'faculty',
      label: 'Faculty',
      icon: <Users size={20} />,
      roles: ['college_admin'],
    },
    {
      id: 'students',
      label: 'Students',
      icon: <GraduationCap size={20} />,
      roles: ['college_admin'],
    },
    {
      id: 'student-hierarchy',
      label: 'Student Hierarchy',
      icon: <Users size={20} />,
      roles: ['college_admin'],
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: <BarChart3 size={20} />,
      roles: ['college_admin', 'student'],
    },
    {
      id: 'assigned-tests',
      label: 'Assigned Tests',
      icon: <ClipboardList size={20} />,
      roles: ['college_admin'],
    },
    {
      id: 'tests',
      label: 'Tests',
      icon: <FileText size={20} />,
      roles: ['faculty'],
      subItems: [
        { id: 'assessment-tests-faculty', label: 'Assessment', testType: 'Assessment' },
        { id: 'practice-tests-faculty', label: 'Practice', testType: 'Practice' },
        { id: 'mock-tests-faculty', label: 'Mock Test', testType: 'Mock Test' },
        { id: 'company-tests-faculty', label: 'Company Test', testType: 'Specific Company Test' }
      ]
    },
    {
      id: 'test-reports',
      label: 'Test Reports',
      icon: <BarChart3 size={20} />,
      roles: ['faculty'],
    },
    {
      id: 'student-reports',
      label: 'Student Reports',
      icon: <ClipboardList size={20} />,
      roles: ['faculty'],
    },
    {
      id: 'my-tests',
      label: 'Tests',
      icon: <FileText size={20} />,
      roles: ['student'],
      subItems: [
        { id: 'assessment-tests', label: 'Assessment', testType: 'Assessment' },
        { id: 'practice-tests', label: 'Practice', testType: 'Practice' },
        { id: 'mock-tests', label: 'Mock Test', testType: 'Mock Test' },
        { id: 'company-tests', label: 'Company Test', testType: 'Specific Company Test' }
      ]
    },
    {
      id: 'tests',
      label: 'Tests',
      icon: <FileText size={20} />,
      roles: ['master_admin', 'college_admin'],
      subItems: [
        { id: 'assessment-tests-admin', label: 'Assessment', testType: 'Assessment' },
        { id: 'practice-tests-admin', label: 'Practice', testType: 'Practice' },
        { id: 'mock-tests-admin', label: 'Mock Test', testType: 'Mock Test' },
        { id: 'company-tests-admin', label: 'Company Test', testType: 'Specific Company Test' }
      ]
    },
    {
      id: 'coding-questions',
      label: 'Coding Questions',
      icon: <Code size={20} />,
      roles: ['master_admin'],
    },
    {
      id: 'practice-coding',
      label: 'Practice Coding',
      icon: <Code size={20} />,
      roles: ['student'],
    },
    {
      id: 'performance',
      label: 'My Performance',
      icon: <Target size={20} />,
      roles: ['student'],
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: <UserPlus size={20} />,
      roles: ['faculty', 'student'],
    },
  ];

  const visibleItems = menuItems.filter(item =>
    !item.roles || item.roles.includes(userRole)
  );

  const handleTestsClick = (itemId: string) => {
    const item = visibleItems.find(i => i.id === itemId);
    if (item && item.subItems) {
      setOpenDropdowns(prev => {
        const newSet = new Set(prev);
        if (newSet.has(itemId)) {
          newSet.delete(itemId);
        } else {
          newSet.add(itemId);
        }
        return newSet;
      });
    } else {
      onTabChange(itemId);
    }
  };

  const handleSubItemClick = (testType: string, parentId: string) => {
    // Navigate to appropriate tab based on role and parent
    let targetTab = 'tests';

    if (parentId === 'my-tests') {
      targetTab = 'my-tests';
    } else if (userRole === 'master_admin') {
      targetTab = 'tests';
    } else if (userRole === 'college_admin') {
      targetTab = 'assigned-tests';
    } else if (userRole === 'faculty') {
      targetTab = 'tests';
    }

    onTabChange(targetTab);
    // Store the selected test type in sessionStorage for the dashboard to read
    sessionStorage.setItem('selectedTestType', testType);
    // Trigger a custom event that the dashboard can listen to
    window.dispatchEvent(new CustomEvent('testTypeChanged', { detail: { testType } }));
  };

  const getTestCount = (testType: string) => {
    if (!testCounts) return 0;
    const typeMap: { [key: string]: keyof typeof testCounts } = {
      'Assessment': 'assessment',
      'Practice': 'practice',
      'Mock Test': 'mockTest',
      'Specific Company Test': 'company'
    };
    return testCounts[typeMap[testType]] || 0;
  };

  return (
    <div className="bg-gray-900 text-white w-64 min-h-screen p-4">
      <div className="mb-8">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <BookOpen size={24} />
          Academic System
        </h2>
      </div>

      <nav className="space-y-2">
        {visibleItems.map((item) => (
          <div key={item.id}>
            {item.subItems ? (
              <>
                <button
                  onClick={() => handleTestsClick(item.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === item.id || (item.id === 'tests' && (activeTab === 'tests' || activeTab === 'assigned-tests')) || (item.id === 'my-tests' && activeTab === 'my-tests')
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    {item.label}
                  </div>
                  {openDropdowns.has(item.id) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                {openDropdowns.has(item.id) && item.subItems && (
                  <div className="ml-4 mt-1 space-y-1">
                    {item.subItems.map((subItem) => {
                      const count = getTestCount(subItem.testType || '');
                      return (
                        <button
                          key={subItem.id}
                          onClick={() => handleSubItemClick(subItem.testType || '', item.id)}
                          className="w-full flex items-center justify-between px-4 py-2 rounded-lg text-left text-sm transition-colors text-gray-400 hover:text-white hover:bg-gray-800"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-gray-600"></div>
                            {subItem.label}
                          </div>
                          {testCounts && (
                            <span className="px-2 py-0.5 bg-gray-700 text-gray-300 text-xs font-bold rounded-full">
                              {count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <button
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === item.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-gray-800'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            )}
          </div>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
