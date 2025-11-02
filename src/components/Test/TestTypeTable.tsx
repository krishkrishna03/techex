import React from 'react';
import { BookOpen, Target, Activity, Briefcase } from 'lucide-react';

const TestTypeTable: React.FC = () => {
  const testTypes = [
    {
      icon: <BookOpen className="w-6 h-6 text-blue-600" />,
      type: 'Assessment',
      meaning: 'Tasks or questions given by teachers or mentors to test your understanding of a topic.',
      purpose: 'To apply what you learned and get marks or feedback.',
      difficulty: 'Usually easy to moderate.',
      evaluation: 'Checked by teacher or auto-graded.',
      color: 'bg-blue-50 border-blue-200'
    },
    {
      icon: <Target className="w-6 h-6 text-green-600" />,
      type: 'Practice Test',
      meaning: 'A set of questions to help you prepare for upcoming tests or exams.',
      purpose: 'To improve skills and identify weak areas.',
      difficulty: 'Moderate, similar to real exam level.',
      evaluation: 'Usually for self-evaluation.',
      color: 'bg-green-50 border-green-200'
    },
    {
      icon: <Activity className="w-6 h-6 text-orange-600" />,
      type: 'Mock Test',
      meaning: 'A full-length simulation of the actual exam (same pattern, time, and marking).',
      purpose: 'To experience real exam conditions and manage time.',
      difficulty: 'High, same as or slightly tougher than the real exam.',
      evaluation: 'Auto-evaluated or scored like the actual test.',
      color: 'bg-orange-50 border-orange-200'
    },
    {
      icon: <Briefcase className="w-6 h-6 text-red-600" />,
      type: 'Company Exam',
      meaning: 'The official test conducted by companies for hiring (aptitude, coding, etc.).',
      purpose: 'To select candidates for job roles.',
      difficulty: 'Tough, competitive.',
      evaluation: 'Evaluated by company recruiters or automated systems.',
      color: 'bg-red-50 border-red-200'
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Understanding Test Types</h3>
        <p className="text-sm text-gray-600">Learn what each test type means and how it helps your learning journey.</p>
      </div>

      <div className="space-y-4">
        {testTypes.map((testType, index) => (
          <div
            key={index}
            className={`border rounded-lg p-4 ${testType.color}`}
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 mt-1">
                {testType.icon}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-2">{testType.type}</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="font-medium text-gray-700 mb-1">What is it?</p>
                    <p className="text-gray-600">{testType.meaning}</p>
                  </div>

                  <div>
                    <p className="font-medium text-gray-700 mb-1">Purpose</p>
                    <p className="text-gray-600">{testType.purpose}</p>
                  </div>

                  <div>
                    <p className="font-medium text-gray-700 mb-1">Difficulty Level</p>
                    <p className="text-gray-600">{testType.difficulty}</p>
                  </div>

                  <div>
                    <p className="font-medium text-gray-700 mb-1">Evaluation</p>
                    <p className="text-gray-600">{testType.evaluation}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TestTypeTable;
