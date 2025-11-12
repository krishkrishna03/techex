import React, { useState, useEffect } from 'react';
import { Building, Send } from 'lucide-react';
import LoadingSpinner from '../UI/LoadingSpinner';
import apiService from '../../services/api';

interface College {
  id: string;
  name: string;
  code: string;
  email: string;
  isActive: boolean;
  isAssigned?: boolean;
}

interface TestAssignmentModalProps {
  testId: string;
  testName: string;
  onClose: () => void;
  onAssign: (testId: string, collegeIds: string[]) => Promise<void>;
}

const TestAssignmentModal: React.FC<TestAssignmentModalProps> = ({
  testId,
  testName,
  onClose,
  onAssign
}) => {
  const [colleges, setColleges] = useState<College[]>([]);
  const [selectedColleges, setSelectedColleges] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadColleges();
  }, []);

const loadColleges = async () => {
  try {
    setLoading(true);

    const [allColleges, assignedData]: [College[], { collegeId: string | { _id: string } }[]] = await Promise.all([
      apiService.getColleges() as Promise<College[]>,
      apiService.getTestAssignedColleges(testId) as Promise<{ collegeId: string | { _id: string } }[]>
    ]);

    const assignedCollegeIds = new Set(
      assignedData.map((c) => (typeof c.collegeId === 'object' ? c.collegeId._id : c.collegeId))
    );

    const collegesWithStatus: College[] = allColleges
      .filter((college: College) => college.isActive)
      .map((college: College) => ({
        ...college,
        isAssigned: assignedCollegeIds.has(college.id),
      }));

    setColleges(collegesWithStatus);

    const alreadyAssigned = collegesWithStatus
      .filter((c: College) => c.isAssigned)
      .map((c: College) => c.id);

    setSelectedColleges(alreadyAssigned);
  } catch (error) {
    setError(error instanceof Error ? error.message : 'Failed to load colleges');
  } finally {
    setLoading(false);
  }
};
;

  const handleCollegeToggle = (collegeId: string) => {
    setSelectedColleges(prev => 
      prev.includes(collegeId)
        ? prev.filter(id => id !== collegeId)
        : [...prev, collegeId]
    );
  };

  const handleSelectAll = () => {
    if (selectedColleges.length === colleges.length) {
      setSelectedColleges([]);
    } else {
      setSelectedColleges(colleges.map(college => college.id));
    }
  };

  const handleAssign = async () => {
    if (selectedColleges.length === 0) {
      alert('Please select at least one college');
      return;
    }

    try {
      setAssigning(true);
      await onAssign(testId, selectedColleges);
      onClose();
    } catch (error) {
      console.error('Assignment error:', error);
    } finally {
      setAssigning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 py-12">
        <p>{error}</p>
        <button 
          onClick={loadColleges}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Assign Test to Colleges</h3>
        <p className="text-sm text-gray-600">
          Select colleges to assign the test: <strong>{testName}</strong>
        </p>
      </div>

      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          {selectedColleges.length} of {colleges.length} colleges selected
        </p>
        <button
          onClick={handleSelectAll}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {selectedColleges.length === colleges.length ? 'Deselect All' : 'Select All'}
        </button>
      </div>

      <div className="max-h-96 overflow-y-auto border rounded-lg">
        {colleges.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Building className="mx-auto h-12 w-12 text-gray-300 mb-2" />
            <p>No active colleges found</p>
          </div>
        ) : (
          <div className="divide-y">
            {colleges.map((college) => (
              <div key={college.id} className="p-4 hover:bg-gray-50">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedColleges.includes(college.id)}
                    onChange={() => handleCollegeToggle(college.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-medium text-gray-900">{college.name}</h4>
                          {college.isAssigned && (
                            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                              Assigned
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{college.email}</p>
                      </div>
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                        {college.code}
                      </span>
                    </div>
                  </div>
                </label>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
          disabled={assigning}
        >
          Cancel
        </button>
        <button
          onClick={handleAssign}
          disabled={selectedColleges.length === 0 || assigning}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          {assigning ? (
            <>
              <LoadingSpinner size="sm" />
              Assigning...
            </>
          ) : (
            <>
              <Send size={16} />
              Assign to {selectedColleges.length} College{selectedColleges.length !== 1 ? 's' : ''}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default TestAssignmentModal;