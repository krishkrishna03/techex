import React, { useState, useEffect } from 'react';
import { Send, Paperclip, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api';
import LoadingSpinner from '../UI/LoadingSpinner';

interface NotificationFormProps {
  onSubmit: (data: FormData) => Promise<void>;
  loading: boolean;
  onClose: () => void;
}

const NotificationForm: React.FC<NotificationFormProps> = ({ onSubmit, loading, onClose }): JSX.Element => {
  const { state } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'general',
    priority: 'medium',
    targetType: 'students',
    targetGroup: 'students',
    targetColleges: [] as string[],
    targetUsers: [] as string[],
    filters: {
      branches: [] as string[],
      batches: [] as string[],
      sections: [] as string[],
      roles: [] as string[],
    },
    scheduledFor: '',
    expiresAt: ''
  });

  const [colleges, setColleges] = useState<any[]>([]);
  const [filterOptions, setFilterOptions] = useState({
    branches: [] as string[],
    batches: [] as string[],
    sections: [] as string[]
  });
  const [targetedUsersList, setTargetedUsersList] = useState<any[]>([]);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<any>({});

  useEffect(() => {
    if (state.user?.role === 'master_admin') {
      loadColleges();
    } else if (state.user?.role === 'college_admin') {
      loadCollegeUsers();
    }
  }, [state.user?.role, formData.targetType]);

  const loadColleges = async () => {
    try {
      const data = await apiService.getColleges() as any[];
      setColleges(data.filter((college: any) => college.isActive));
    } catch (error) {
      console.error('Failed to load colleges:', error);
    }
  };

  const loadCollegeUsers = async () => {
    try {
      if (formData.targetType === 'faculty') {
        const data = await apiService.getCollegeUsers('faculty') as any[];
        extractFilterOptions(data);
      } else if (formData.targetType === 'students') {
        const data = await apiService.getCollegeUsers('student') as any[];
        extractFilterOptions(data);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const extractFilterOptions = (userData: any[]) => {
    const branches = [...new Set(userData.map(u => u.branch))];
    const batches = [...new Set(userData.map(u => u.batch))];
    const sections = [...new Set(userData.map(u => u.section))];
    
    setFilterOptions({ branches, batches, sections });
  };

  // Load targeted users for master admin when specific target type is selected
  useEffect(() => {
    const loadTargetedUsers = async () => {
      if (formData.targetType !== 'specific' || formData.targetColleges.length === 0) {
        setTargetedUsersList([]);
        return;
      }

      try {
        const role = formData.targetGroup === 'faculty' ? 'faculty' : 'student';
        const requests = formData.targetColleges.map((collegeId) => apiService.getCollegeUsers(role, collegeId));
        const results = await Promise.all(requests);
        // api returns either an array of users or { users, total, page, limit }
  const resultsAny = results as any[];
  const users = resultsAny.flatMap(r => Array.isArray(r) ? r : (r.users || []));

        // apply simple client-side filters
        let filtered = users;
        if (formData.filters.branches.length) filtered = filtered.filter(u => formData.filters.branches.includes(u.branch));
        if (formData.filters.batches.length) filtered = filtered.filter(u => formData.filters.batches.includes(u.batch));
        if (formData.filters.sections.length) filtered = filtered.filter(u => formData.filters.sections.includes(u.section));

        // dedupe by id
        const map: Record<string, any> = {};
        filtered.forEach(u => { map[String(u._id || u.id)] = u; });
        setTargetedUsersList(Object.values(map));
      } catch (error) {
        console.error('Failed to load targeted users:', error);
        setTargetedUsersList([]);
      }
    };

    loadTargetedUsers();
  }, [formData.targetType, JSON.stringify(formData.targetColleges), formData.targetGroup, JSON.stringify(formData.filters)]);

  const validateForm = () => {
    const newErrors: any = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.message.trim()) newErrors.message = 'Message is required';
    if (formData.title.length > 200) newErrors.title = 'Title must be less than 200 characters';
    if (formData.message.length > 2000) newErrors.message = 'Message must be less than 2000 characters';

    if (state.user?.role === 'master_admin' && formData.targetType !== 'specific') {
      if (formData.targetType === 'colleges' && formData.targetColleges.length === 0) {
        newErrors.targetColleges = 'Please select at least one college';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const submitData = new FormData();
    
    // Map client-only values to server-expected values
    const payload: any = { ...formData };
    if (payload.targetType === 'specific_college') {
      // server expects targetType 'colleges' and targetColleges to contain the selected college id
      payload.targetType = 'colleges';
    }

    // Add form fields
    Object.entries(payload).forEach(([key, value]) => {
      if (key === 'filters' || key === 'targetColleges' || key === 'targetUsers') {
        submitData.append(key, JSON.stringify(value));
      } else {
        submitData.append(key, value as string);
      }
    });

    // Add attachment if present
    if (attachment) {
      submitData.append('attachment', attachment);
    }

    try {
      await onSubmit(submitData);
            // Reset form
      setFormData({
        title: '',
        message: '',
        type: 'general',
        priority: 'medium',
        targetType: 'students',
        targetGroup: 'students',
        targetColleges: [],
        targetUsers: [],
        filters: { branches: [], batches: [], sections: [], roles: [] },
        scheduledFor: '',
        expiresAt: ''
      });
      setAttachment(null);
      setErrors({});
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors((prev: any) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleMultiSelect = (field: string, value: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked
        ? [...prev[field as keyof typeof prev] as string[], value]
        : (prev[field as keyof typeof prev] as string[]).filter(item => item !== value)
    }));
  };

  const handleFilterChange = (filterType: string, value: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        [filterType]: checked
          ? [...prev.filters[filterType as keyof typeof prev.filters], value]
          : prev.filters[filterType as keyof typeof prev.filters].filter(item => item !== value)
      }
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      setAttachment(file);
    }
  };

  useEffect(() => {
    if (attachment && attachment.type.startsWith('image/')) {
      const url = URL.createObjectURL(attachment);
      setPreviewUrl(url);
      return () => {
        URL.revokeObjectURL(url);
        setPreviewUrl(null);
      };
    }
    setPreviewUrl(null);
  }, [attachment]);

  const removeAttachment = () => {
    setAttachment(null);
    const fileInput = document.getElementById('attachment') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
              errors.title ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter notification title"
            disabled={loading}
            maxLength={200}
          />
          {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
          <p className="mt-1 text-xs text-gray-500">{formData.title.length}/200 characters</p>
        </div>

        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
            Type
          </label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          >
            <option value="general">📢 General</option>
            <option value="urgent">🚨 Urgent</option>
            <option value="announcement">📣 Announcement</option>
            <option value="reminder">⏰ Reminder</option>
          </select>
        </div>

        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
            Priority
          </label>
          <select
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          >
            <option value="low">🟢 Low</option>
            <option value="medium">🟡 Medium</option>
            <option value="high">🔴 High</option>
          </select>
        </div>

        <div>
          <label htmlFor="targetType" className="block text-sm font-medium text-gray-700 mb-2">
            Send To
          </label>
          <select
            id="targetType"
            name="targetType"
            value={formData.targetType}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          >
            {state.user?.role === 'master_admin' && (
              <>
          <option value="colleges">🏢 All Colleges</option>
            {/* 'specific_college' is a client-side helper (mapped to 'colleges' on submit) */}
            <option value="specific_college">🎯 Specific College</option>
                <option value="faculty">👨‍🏫 All Faculty</option>
                <option value="students">🎓 All Students</option>
                {/* server expects 'specific' for targeting specific user ids */}
                <option value="specific">🎯 Targeted Users</option>
              </>
            )}
            {state.user?.role === 'college_admin' && (
              <>
                <option value="faculty">👨‍🏫 Faculty</option>
                <option value="students">🎓 Students</option>
              </>
            )}
          </select>
        </div>
      </div>

      {/* Message */}
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
          Message *
        </label>
        <textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          rows={6}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
            errors.message ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter your notification message..."
          disabled={loading}
          maxLength={2000}
        />
        {errors.message && <p className="mt-1 text-sm text-red-600">{errors.message}</p>}
        <p className="mt-1 text-xs text-gray-500">{formData.message.length}/2000 characters</p>
      </div>

      {/* Target Selection for Master Admin */}
      {state.user?.role === 'master_admin' && formData.targetType === 'colleges' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Colleges
          </label>
          <div className="max-h-40 overflow-y-auto border rounded-lg p-3 space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.targetColleges.length === colleges.length}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFormData(prev => ({ ...prev, targetColleges: colleges.map(c => c.id) }));
                  } else {
                    setFormData(prev => ({ ...prev, targetColleges: [] }));
                  }
                }}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">Select All</span>
            </label>
            {colleges.map((college) => (
              <label key={college.id} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.targetColleges.includes(college.id)}
                  onChange={(e) => handleMultiSelect('targetColleges', college.id, e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">{college.name}</span>
              </label>
            ))}
          </div>
          {errors.targetColleges && <p className="mt-1 text-sm text-red-600">{errors.targetColleges}</p>}
        </div>
      )}

      {/* Filters for Master Admin - College Selection */}
  {state.user?.role === 'master_admin' && formData.targetType === 'colleges' && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Select College</h3>
          <div className="max-h-48 overflow-y-auto border rounded-lg bg-white p-2 space-y-1">
            {colleges.map((college) => (
              <label key={college.id} className="flex items-center p-2 hover:bg-gray-50">
                <input
                  type="radio"
                  checked={formData.targetColleges.includes(college.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData(prev => ({...prev, targetColleges: [college.id]}));
                    }
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">{college.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Filters for Master Admin - Targeted Users */}
      {state.user?.role === 'master_admin' && formData.targetType === 'specific' && formData.targetColleges.length > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">User Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target Group</label>
                <select
                  value={formData.targetGroup}
                  onChange={(e) => setFormData(prev => ({...prev, targetGroup: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="faculty">Faculty Members</option>
                  <option value="students">Students</option>
                </select>
              </div>
            </div>
          </div>

          {formData.targetGroup === 'students' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Branches (Optional)
                </label>
                <div className="max-h-32 overflow-y-auto border rounded-lg bg-white p-2 space-y-1">
                  {filterOptions.branches.map((branch) => (
                    <label key={branch} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.filters.branches.includes(branch)}
                        onChange={(e) => handleFilterChange('branches', branch, e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">{branch}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Batches (Optional)
                </label>
                <div className="max-h-32 overflow-y-auto border rounded-lg bg-white p-2 space-y-1">
                  {filterOptions.batches.map((batch) => (
                    <label key={batch} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.filters.batches.includes(batch)}
                        onChange={(e) => handleFilterChange('batches', batch, e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">{batch}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sections (Optional)
                </label>
                <div className="max-h-32 overflow-y-auto border rounded-lg bg-white p-2 space-y-1">
                  {filterOptions.sections.map((section) => (
                    <label key={section} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.filters.sections.includes(section)}
                        onChange={(e) => handleFilterChange('sections', section, e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">{section}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* User selection list for targeted users */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Select Users</h4>
            <div className="max-h-48 overflow-y-auto border rounded-lg bg-white p-2 space-y-1">
              {targetedUsersList.length === 0 && (
                <div className="text-sm text-gray-500 p-2">No users found for selected colleges/filters.</div>
              )}
              {targetedUsersList.map((u) => (
                <label key={u._id || u.id} className="flex items-center p-2 hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={formData.targetUsers.includes(String(u._id || u.id))}
                    onChange={(e) => handleMultiSelect('targetUsers', String(u._id || u.id), e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">{u.name || u.fullName || u.email}</span>
                  <span className="ml-auto text-xs text-gray-400">{u.email}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters for College Admin */}
      {state.user?.role === 'college_admin' && (formData.targetType === 'faculty' || formData.targetType === 'students') && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Branches (Optional)
            </label>
            <div className="max-h-32 overflow-y-auto border rounded-lg p-2 space-y-1">
              {filterOptions.branches.map((branch) => (
                <label key={branch} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.filters.branches.includes(branch)}
                    onChange={(e) => handleFilterChange('branches', branch, e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">{branch}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Batches (Optional)
            </label>
            <div className="max-h-32 overflow-y-auto border rounded-lg p-2 space-y-1">
              {filterOptions.batches.map((batch) => (
                <label key={batch} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.filters.batches.includes(batch)}
                    onChange={(e) => handleFilterChange('batches', batch, e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">{batch}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sections (Optional)
            </label>
            <div className="max-h-32 overflow-y-auto border rounded-lg p-2 space-y-1">
              {filterOptions.sections.map((section) => (
                <label key={section} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.filters.sections.includes(section)}
                    onChange={(e) => handleFilterChange('sections', section, e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">{section}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* File Attachment */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Attachment (Optional)
        </label>
        <div className="flex items-center space-x-4">
          <label className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-200">
            <Paperclip size={16} className="mr-2" />
            Choose File
            <input
              type="file"
              id="attachment"
              onChange={handleFileChange}
              className="hidden"
              accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt"
              disabled={loading}
            />
          </label>
          {attachment && (
            <div className="flex items-center space-x-2">
              {previewUrl ? (
                <img src={previewUrl} alt="attachment preview" className="w-16 h-16 object-cover rounded" />
              ) : (
                <span className="text-sm text-gray-600">{attachment.name}</span>
              )}
              <button
                type="button"
                onClick={removeAttachment}
                className="text-red-500 hover:text-red-700"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Supported formats: Images, PDF, Documents (Max 5MB)
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={onClose}
          className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? (
            <>
              <LoadingSpinner size="sm" />
              Sending...
            </>
          ) : (
            <>
              <Send size={16} />
              Send Notification
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default NotificationForm;
