import React, { useState, useEffect } from 'react';
import {
  Home,
  Users,
  GraduationCap,
  Building,
  UserPlus,
  BarChart3,
  FileText,
  ClipboardList,
  Bell,
  TrendingUp,
  Target,
  ChevronDown,
  ChevronRight,
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

interface Test {
  testType: string;
  testId?: {
    testType: string;
  };
}

interface SidebarProps {
  userRole: string;
  activeTab: string;
  onTabChange: (tab: string) => void;
  collapsed?: boolean;
  drawerOpen?: boolean;
  onCloseDrawer?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ userRole, activeTab, onTabChange, collapsed = false, drawerOpen = false, onCloseDrawer }) : JSX.Element => {
  const [openDropdowns, setOpenDropdowns] = useState<Set<string>>(new Set());
  const [testCounts, setTestCounts] = useState<any>(null);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [activeFlyout, setActiveFlyout] = useState<string | null>(null);

  useEffect(() => {
    loadTestCounts();
  }, [userRole]);

  // Auto-open the dropdown when navigating to a test-related tab
  useEffect(() => {
    if (activeTab === 'my-tests' || activeTab === 'tests' || activeTab === 'assigned-tests') {
      const dropdownId = userRole === 'student' ? 'my-tests' : 'tests';
      setOpenDropdowns(prev => {
        const newSet = new Set(prev);
        newSet.add(dropdownId);
        return newSet;
      });
    }
  }, [activeTab, userRole]);

  const loadTestCounts = async () => {
    try {
      let counts = { assessment: 0, practice: 0, mockTest: 0, company: 0 };

      if (userRole === 'master_admin') {
        const allTests = await apiService.getTests() as Test[];
        counts = {
          assessment: allTests.filter((t: Test) => t.testType === 'Assessment').length,
          practice: allTests.filter((t: Test) => t.testType === 'Practice').length,
          mockTest: allTests.filter((t: Test) => t.testType === 'Mock Test').length,
          company: allTests.filter((t: Test) => t.testType === 'Specific Company Test').length
        };
      } else if (userRole === 'student') {
        const allTests = await apiService.getStudentAssignedTests() as Test[];
        counts = {
          assessment: allTests.filter((t: Test) => t.testId?.testType === 'Assessment').length,
          practice: allTests.filter((t: Test) => t.testId?.testType === 'Practice').length,
          mockTest: allTests.filter((t: Test) => t.testId?.testType === 'Mock Test').length,
          company: allTests.filter((t: Test) => t.testId?.testType === 'Specific Company Test').length
        };
      } else if (userRole === 'college_admin') {
        const allTests = await apiService.getAssignedTests() as Test[];
        counts = {
          assessment: allTests.filter((t: Test) => t.testId?.testType === 'Assessment').length,
          practice: allTests.filter((t: Test) => t.testId?.testType === 'Practice').length,
          mockTest: allTests.filter((t: Test) => t.testId?.testType === 'Mock Test').length,
          company: allTests.filter((t: Test) => t.testId?.testType === 'Specific Company Test').length
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
      roles: ['college_admin'],
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

  // compute classes for off-canvas drawer on small screens and static sidebar on md+
  const drawerVisible = drawerOpen;
  const containerClass = `fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out
    ${drawerVisible ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static`;

  return (
    <>
      {/* Backdrop for mobile drawer */}
      {drawerVisible && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => onCloseDrawer && onCloseDrawer()}
          aria-hidden="true"
        />
      )}

      <aside
        className={`${containerClass} bg-gray-900 text-white h-full w-64 md:w-64`}
        style={{ width: collapsed ? '4rem' : undefined }}
        role="navigation"
        aria-label="Main navigation"
        onKeyDown={(e) => {
          if (e.key === 'Escape' && drawerVisible) {
            onCloseDrawer && onCloseDrawer();
          }
        }}
      >
      <div className="p-4 h-full flex flex-col overflow-hidden">
        <div className="mb-6 shrink-0">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <img
              src="/logo.png"
              alt="Logo"
              className={`w-8 h-8 ${collapsed ? 'mx-auto' : 'mr-2'} transition-all duration-300`}
            />
            {!collapsed && <span className="transition-opacity duration-300">PlanTechx</span>}
          </h2>
        </div>

        <nav className="space-y-2 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
          {visibleItems.map((item: SidebarItem) => {
            const isTestParent = !!item.subItems;
            return (
              <div key={item.id}>
                {isTestParent ? (
                  <>
                    <div
                      className="relative"
                      onMouseEnter={() => collapsed && setHoveredItem(item.id)}
                      onMouseLeave={() => collapsed && setHoveredItem(null)}
                    >
                      <button
                        onClick={() => {
                          // Touch/click friendly: toggle flyout when collapsed or toggle openDropdowns when expanded
                          if (collapsed) {
                            setActiveFlyout(prev => (prev === item.id ? null : item.id));
                          } else {
                            handleTestsClick(item.id);
                          }
                        }}
                        aria-expanded={openDropdowns.has(item.id) || activeFlyout === item.id}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-all duration-200 ${
                          activeTab === item.id ||
                          (item.id === 'tests' && (activeTab === 'tests' || activeTab === 'assigned-tests')) ||
                          (item.id === 'my-tests' && activeTab === 'my-tests')
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-300 hover:text-white hover:bg-gray-800'
                        }`}
                        title={collapsed ? item.label : undefined}
                      >
                        <div className={`flex items-center gap-3 ${collapsed ? 'justify-center w-full' : ''}`}>
                          <span className={`${collapsed ? 'w-6 h-6 flex items-center justify-center' : ''}`}>
                            {item.icon}
                          </span>
                          {!collapsed && <span className="transition-opacity duration-200">{item.label}</span>}
                        </div>
                        {!collapsed && (openDropdowns.has(item.id) ? <ChevronDown size={16} /> : <ChevronRight size={16} />)}
                      </button>

                      {/* Flyout: show when collapsed & (hovered or activeFlyout) */}
                      {(collapsed && (hoveredItem === item.id || activeFlyout === item.id)) && item.subItems && (
                        <div className="absolute left-full top-0 ml-2 w-48 bg-gray-800 text-white rounded shadow-lg z-50">
                          {item.subItems.map((sub) => (
                            <button
                              key={sub.id}
                              onClick={() => {
                                handleSubItemClick(sub.testType || '', item.id);
                                setActiveFlyout(null);
                                // close drawer on mobile
                                onCloseDrawer && onCloseDrawer();
                              }}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-700"
                            >
                              {sub.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {openDropdowns.has(item.id) && item.subItems && !collapsed && (
                      <div className="ml-4 mt-1 space-y-1">
                        {item.subItems.map((subItem: SubItem) => {
                          const count = getTestCount(subItem.testType || '');
                          return (
                            <button
                              key={subItem.id}
                              onClick={() => handleSubItemClick(subItem.testType || '', item.id)}
                              className="w-full flex items-center justify-between px-4 py-2 rounded-lg text-left text-sm transition-colors text-gray-400 hover:text-white hover:bg-gray-800"
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-gray-600" />
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
                    onClick={() => {
                      onTabChange(item.id);
                      onCloseDrawer && onCloseDrawer();
                    }}
                    className={`w-full flex items-center px-3 py-2.5 rounded-lg text-left transition-all duration-200 ${
                      activeTab === item.id
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:text-white hover:bg-gray-800'
                    }`}
                    title={collapsed ? item.label : undefined}
                  >
                    <div className={`flex items-center gap-3 ${collapsed ? 'justify-center w-full' : ''}`}>
                      <span className={`${collapsed ? 'w-6 h-6 flex items-center justify-center' : ''}`}>
                        {item.icon}
                      </span>
                      {!collapsed && <span className="transition-opacity duration-200">{item.label}</span>}
                    </div>
                  </button>
                )}
              </div>
            );
          })}
        </nav>
      </div>
    </aside>
    </>
  );
};

export default Sidebar;
