import React, { useState } from 'react';
import { Building, Mail, MapPin, Hash } from 'lucide-react';
import LoadingSpinner from '../UI/LoadingSpinner';

interface CollegeFormData {
  name: string;
  code: string;
  email: string;
  address: string;
}

interface CollegeFormProps {
  onSubmit: (data: CollegeFormData) => Promise<void>;
  loading: boolean;
  initialData?: CollegeFormData;
}

const CollegeForm: React.FC<CollegeFormProps> = ({ onSubmit, loading, initialData }) => {
  const [formData, setFormData] = useState<CollegeFormData>({
    name: initialData?.name || '',
    code: initialData?.code || '',
    email: initialData?.email || '',
    address: initialData?.address || '',
  });

  const [errors, setErrors] = useState<Partial<CollegeFormData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<CollegeFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'College name is required';
    }

    if (!formData.code.trim()) {
      newErrors.code = 'College code is required';
    } else if (formData.code.length < 2) {
      newErrors.code = 'College code must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    } else if (formData.address.length < 10) {
      newErrors.address = 'Please enter a complete address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      await onSubmit(formData);
      setFormData({ name: '', code: '', email: '', address: '' });
      setErrors({});
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name as keyof CollegeFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
          <Building className="inline w-4 h-4 mr-1" />
          College Name
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
          placeholder="Enter college name"
          disabled={loading}
        />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
      </div>

      <div>
        <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
          <Hash className="inline w-4 h-4 mr-1" />
          College Code
        </label>
        <input
          type="text"
          id="code"
          name="code"
          value={formData.code}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.code ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="e.g., MIT, HARV"
          disabled={loading}
          style={{ textTransform: 'uppercase' }}
        />
        {errors.code && <p className="mt-1 text-sm text-red-600">{errors.code}</p>}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
          <Mail className="inline w-4 h-4 mr-1" />
          College Email
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
          placeholder="admin@college.edu"
          disabled={loading}
        />
        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
      </div>

      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
          <MapPin className="inline w-4 h-4 mr-1" />
          College Address
        </label>
        <textarea
          id="address"
          name="address"
          value={formData.address}
          onChange={handleChange}
          rows={3}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.address ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter complete college address"
          disabled={loading}
        />
        {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
      >
        {loading ? (
          <>
            <LoadingSpinner size="sm" className="mr-2" />
            Creating College...
          </>
        ) : (
          'Create College'
        )}
      </button>
    </form>
  );
};

export default CollegeForm;