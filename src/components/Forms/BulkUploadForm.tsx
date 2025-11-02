import React, { useState } from 'react';
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle, X } from 'lucide-react';
import LoadingSpinner from '../UI/LoadingSpinner';
import Loader3D from '../UI/Loader3D';

interface BulkUploadFormProps {
  role: 'faculty' | 'student';
  onSubmit: (file: File, role: string) => Promise<any>;
  onClose: () => void;
  loading: boolean;
}

interface UploadResult {
  total: number;
  successful: number;
  failed: number;
  errors: Array<{
    row: number;
    field: string;
    message: string;
  }>;
}

const BulkUploadForm: React.FC<BulkUploadFormProps> = ({ role, onSubmit, onClose, loading }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadResult(null);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      setSelectedFile(file);
      setUploadResult(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    try {
      setUploading(true);
      const result = await onSubmit(selectedFile, role);
      setUploadResult(result.results);
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiUrl}/college/users/sample-template/${role}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${role}_template.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Template download error:', error);
    }
  };

  const requiredFields = role === 'faculty' 
    ? ['Name', 'Faculty ID', 'Branch', 'Email']
    : ['Name', 'Roll Number', 'Branch', 'Batch', 'Section', 'Email'];

  const optionalFields = role === 'faculty'
    ? ['Batch', 'Section', 'Phone']
    : ['Phone'];

  if (uploadResult) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
            uploadResult.failed === 0 ? 'bg-green-100' : 'bg-yellow-100'
          }`}>
            {uploadResult.failed === 0 ? (
              <CheckCircle className="w-8 h-8 text-green-600" />
            ) : (
              <AlertCircle className="w-8 h-8 text-yellow-600" />
            )}
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Complete</h3>
          <p className="text-gray-600">
            {uploadResult.successful} of {uploadResult.total} accounts created successfully
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{uploadResult.total}</div>
            <div className="text-sm text-gray-600">Total Records</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{uploadResult.successful}</div>
            <div className="text-sm text-gray-600">Successful</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{uploadResult.failed}</div>
            <div className="text-sm text-gray-600">Failed</div>
          </div>
        </div>

        {uploadResult.errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-medium text-red-800 mb-2">Errors Found:</h4>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {uploadResult.errors.map((error, index) => (
                <div key={index} className="text-sm text-red-700">
                  Row {error.row}: {error.field} - {error.message}
                </div>
              ))}
            </div>
          </div>
        )}

        {uploadResult.successful > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800 text-sm">
              ✅ Login credentials have been sent via email to all successfully created accounts.
            </p>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={() => {
              setUploadResult(null);
              setSelectedFile(null);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Upload Another File
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (uploading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader3D size="lg" message={`Creating ${role === 'faculty' ? 'faculty' : 'student'} accounts...`} />
        <div className="text-center text-sm text-gray-600 max-w-md">
          <p>Processing your file. This may take a moment for large uploads.</p>
          <p className="mt-2 text-xs text-gray-500">
            Validating data, checking for duplicates, and creating accounts...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <FileSpreadsheet className="w-12 h-12 mx-auto text-blue-600 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Bulk Upload {role === 'faculty' ? 'Faculty' : 'Students'}
        </h3>
        <p className="text-gray-600">
          Upload an Excel file to create multiple accounts at once
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 mb-2">Required Fields:</h4>
        <div className="flex flex-wrap gap-2">
          {requiredFields.map(field => (
            <span key={field} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
              {field}
            </span>
          ))}
        </div>
        {optionalFields.length > 0 && (
          <>
            <h4 className="font-medium text-blue-800 mt-3 mb-2">Optional Fields:</h4>
            <div className="flex flex-wrap gap-2">
              {optionalFields.map(field => (
                <span key={field} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                  {field}
                </span>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="flex justify-center">
        <button
          onClick={downloadTemplate}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <Download size={16} />
          Download Sample Template
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-blue-400 bg-blue-50'
              : selectedFile
              ? 'border-green-400 bg-green-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {selectedFile ? (
            <div className="space-y-2">
              <CheckCircle className="w-8 h-8 mx-auto text-green-600" />
              <p className="text-green-800 font-medium">{selectedFile.name}</p>
              <p className="text-sm text-gray-600">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Remove file
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="w-8 h-8 mx-auto text-gray-400" />
              <p className="text-gray-600">
                Drag and drop your Excel file here, or{' '}
                <label className="text-blue-600 hover:text-blue-800 cursor-pointer">
                  browse
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              </p>
              <p className="text-xs text-gray-500">
                Supports .xlsx and .xls files (max 5MB)
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            disabled={uploading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!selectedFile || uploading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {uploading ? (
              <>
                <LoadingSpinner size="sm" />
                Uploading...
              </>
            ) : (
              <>
                <Upload size={16} />
                Upload & Create Accounts
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BulkUploadForm;