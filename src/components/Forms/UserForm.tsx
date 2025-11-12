import React, { useState } from 'react';
import { User, Mail, Hash, BookOpen, Calendar, Users, Phone } from 'lucide-react';
import LoadingSpinner from '../UI/LoadingSpinner';

interface UserFormData {
  name: string;
  email: string;
  role: 'faculty' | 'student';
  idNumber: string;
  branch: string;
  batch: string;
  section: string;
  phoneNumber: string;
}

interface UserFormProps {
  onSubmit: (data: UserFormData) => Promise<void>;
  loading: boolean;
  defaultRole?: 'faculty' | 'student';
  initialData?: UserFormData;
}

const UserForm: React.FC<UserFormProps> = ({ onSubmit, loading, defaultRole = 'student', initialData }) => {
  const [formData, setFormData] = useState<UserFormData>({
    name: initialData?.name || '',
    email: initialData?.email || '',
    role: initialData?.role || defaultRole,
    idNumber: initialData?.idNumber || '',
    branch: initialData?.branch || '',
    batch: initialData?.batch || '',
    section: initialData?.section || '',
    phoneNumber: initialData?.phoneNumber || '',
  });

  const [errors, setErrors] = useState<Partial<UserFormData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<UserFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.idNumber.trim()) {
      newErrors.idNumber = `${formData.role === 'student' ? 'Roll Number' : 'ID'} is required`;
    }

    if (!formData.branch.trim()) {
      newErrors.branch = 'Branch is required';
    }

    if (!formData.batch.trim()) {
      newErrors.batch = 'Batch is required';
    }

    if (!formData.section.trim()) {
      newErrors.section = 'Section is required';
    }

    if (formData.phoneNumber && !/^[+]?[\d\s\-\(\)]{10,}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      await onSubmit(formData);
      // Only reset form if it's not an edit (no initialData)
      if (!initialData) {
        setFormData({
          name: '',
          email: '',
          role: defaultRole,
          idNumber: '',
          branch: '',
          batch: '',
          section: '',
          phoneNumber: '',
        });
        setErrors({});
      }
    } catch (error) {
      console.error('Form submission error:', error);
      // Re-throw to let parent handle the error display
      throw error;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name as keyof UserFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            <User className="inline w-4 h-4 mr-1" />
            Full Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter full name"
            disabled={loading}
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            <Mail className="inline w-4 h-4 mr-1" />
            Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="user@email.com"
            disabled={loading}
          />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
            Role
          </label>
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          >
            <option value="student">Student</option>
            <option value="faculty">Faculty</option>
          </select>
        </div>

        <div>
          <label htmlFor="idNumber" className="block text-sm font-medium text-gray-700 mb-2">
            <Hash className="inline w-4 h-4 mr-1" />
            {formData.role === 'student' ? 'Roll Number' : 'ID Number'}
          </label>
          <input
            type="text"
            id="idNumber"
            name="idNumber"
            value={formData.idNumber}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.idNumber ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder={formData.role === 'student' ? 'e.g., 2023001' : 'e.g., FAC001'}
            disabled={loading}
          />
          {errors.idNumber && <p className="mt-1 text-sm text-red-600">{errors.idNumber}</p>}
        </div>

        <div>
          <label htmlFor="branch" className="block text-sm font-medium text-gray-700 mb-2">
            <BookOpen className="inline w-4 h-4 mr-1" />
            Branch/Department
          </label>
          <input
            type="text"
            id="branch"
            name="branch"
            value={formData.branch}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.branch ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="e.g., Computer Science"
            disabled={loading}
          />
          {errors.branch && <p className="mt-1 text-sm text-red-600">{errors.branch}</p>}
        </div>

        <div>
          <label htmlFor="batch" className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="inline w-4 h-4 mr-1" />
            Batch/Year
          </label>
          <input
            type="text"
            id="batch"
            name="batch"
            value={formData.batch}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.batch ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="e.g., 2023-27 or 2023"
            disabled={loading}
          />
          {errors.batch && <p className="mt-1 text-sm text-red-600">{errors.batch}</p>}
        </div>

        <div>
          <label htmlFor="section" className="block text-sm font-medium text-gray-700 mb-2">
            <Users className="inline w-4 h-4 mr-1" />
            Section
          </label>
          <input
            type="text"
            id="section"
            name="section"
            value={formData.section}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.section ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="e.g., A, B1, CSE-1"
            disabled={loading}
          />
          {errors.section && <p className="mt-1 text-sm text-red-600">{errors.section}</p>}
        </div>

        <div>
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
            <Phone className="inline w-4 h-4 mr-1" />
            Phone Number (Optional)
          </label>
          <input
            type="tel"
            id="phoneNumber"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="+1 (555) 123-4567"
            disabled={loading}
          />
          {errors.phoneNumber && <p className="mt-1 text-sm text-red-600">{errors.phoneNumber}</p>}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
      >
        {loading ? (
          <>
            <LoadingSpinner size="sm" className="mr-2" />
            Creating {formData.role}...
          </>
        ) : (
          `Create ${formData.role === 'student' ? 'Student' : 'Faculty'}`
        )}
      </button>
    </form>
  );
};

export default UserForm;