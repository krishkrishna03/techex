import React from 'react';
import { Clock, AlertCircle, Building, CheckCircle } from 'lucide-react';

interface PendingActionsProps {
  data: {
    collegeAssignments?: number;
    newCollegeCredentials?: number;
    testsCompletedToday: number;
  };
  onActionClick?: (action: string) => void;
}

const PendingActions: React.FC<PendingActionsProps> = ({ data, onActionClick }) => {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-medium">Pending Actions</h3>
        </div>
      </div>
      <div className="p-6 space-y-4">
        <div 
          className="flex items-center justify-between p-4 bg-orange-50 rounded-lg cursor-pointer hover:bg-orange-100 transition-colors"
          onClick={() => onActionClick?.('test-assignments')}
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            <div>
              <p className="font-medium text-gray-900">Test Assignments</p>
              <p className="text-sm text-gray-600">{data.collegeAssignments || 0} pending college responses</p>
            </div>
          </div>
          <div className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
            {(data.collegeAssignments || 0) > 0 ? 'Action Required' : 'All Clear'}
          </div>
        </div>
        
        <div 
          className="flex items-center justify-between p-4 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
          onClick={() => onActionClick?.('college-credentials')}
        >
          <div className="flex items-center gap-3">
            <Building className="h-5 w-5 text-blue-600" />
            <div>
              <p className="font-medium text-gray-900">New College Credentials</p>
              <p className="text-sm text-gray-600">{data.newCollegeCredentials || 0} colleges haven't logged in yet</p>
            </div>
          </div>
          <button 
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            onClick={(e) => {
              e.stopPropagation();
              onActionClick?.('resend-credentials');
            }}
          >
            Resend
          </button>
        </div>
        
        <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-gray-900">Tests Completed Today</p>
              <p className="text-sm text-gray-600">{data.testsCompletedToday} tests completed</p>
            </div>
          </div>
          <div className="text-green-600 text-sm font-medium">
            ✓ Done
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendingActions;