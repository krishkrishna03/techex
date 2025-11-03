import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface GrowthData {
  newColleges: number;
  newFaculty: number;
  newStudents: number;
  collegeGrowthPercentage: number;
  studentGrowthPercentage: number;
  testCompletionGrowthPercentage: number;
}

interface PlatformGrowthProps {
  data: GrowthData;
}

const PlatformGrowth: React.FC<PlatformGrowthProps> = ({ data }) => {
  const GrowthBar: React.FC<{ 
    label: string; 
    percentage: number; 
    color: string;
    newCount?: number;
  }> = ({ label, percentage, color, newCount }) => {
    const isPositive = percentage >= 0;
    const displayPercentage = Math.abs(percentage);
    
    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          <div className="flex items-center gap-1">
            {newCount && (
              <span className="text-xs text-gray-500">+{newCount} new</span>
            )}
            <span className={`text-sm font-medium flex items-center gap-1 ${
              isPositive ? 'text-green-600' : 'text-red-600'
            }`}>
              {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {isPositive ? '+' : ''}{percentage}%
            </span>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ${color}`}
            style={{ width: `${Math.min(displayPercentage, 100)}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-medium">Platform Growth (Last 30 Days)</h3>
        </div>
      </div>
      <div className="p-6 space-y-6">
        <GrowthBar
          label="College Growth"
          percentage={data.collegeGrowthPercentage}
          color="bg-green-600"
          newCount={data.newColleges}
        />
        
        <GrowthBar
          label="Student Enrollment"
          percentage={data.studentGrowthPercentage}
          color="bg-blue-600"
          newCount={data.newStudents}
        />
        
        <GrowthBar
          label="Faculty Addition"
          percentage={data.newFaculty > 0 ? 25 : 0} // Calculate based on your logic
          color="bg-purple-600"
          newCount={data.newFaculty}
        />
        
        <GrowthBar
          label="Test Completion Rate"
          percentage={data.testCompletionGrowthPercentage}
          color="bg-orange-600"
        />
      </div>
    </div>
  );
};

export default PlatformGrowth;