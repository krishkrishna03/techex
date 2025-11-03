import React, { useState } from 'react';
import { Plus, Upload, Eye, Trash2, FileText, Clock, Calendar, Hash, XCircle, CreditCard as Edit2, CreditCard, Code } from 'lucide-react';
import LoadingSpinner from '../UI/LoadingSpinner';
import CodingSectionConfig from './CodingSectionConfig';
import apiService from '../../services/api';

interface Question {
  questionText: string;
  questionImageUrl?: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  optionImages?: {
    A?: string;
    B?: string;
    C?: string;
    D?: string;
  };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  marks: number;
}

interface CodingQuestion {
  id: string;
  title: string;
  difficulty: string;
  tags: string[];
  points?: number;
  timeLimit?: number;
}

interface TestFormData {
  testName: string;
  testDescription: string;
  subject: 'Verbal' | 'Reasoning' | 'Technical' | 'Arithmetic' | 'Communication';
  testType: 'Assessment' | 'Practice' | 'Assignment' | 'Mock Test' | 'Specific Company Test';
  companyName?: string;
  topics: string[];
  difficulty: 'Easy' | 'Medium' | 'Hard';
  numberOfQuestions: number;
  marksPerQuestion: number;
  duration: number;
  startDateTime: string;
  endDateTime: string;
  questions: Question[];
  hasCodingSection?: boolean;
  codingQuestions?: CodingQuestion[];
}

interface TestFormProps {
  onSubmit: (data: TestFormData) => Promise<void>;
  loading: boolean;
  initialData?: any;
}

const TestForm: React.FC<TestFormProps> = ({ onSubmit, loading, initialData }) => {
  const formatDateTimeLocal = (dateString: string) => {
    // Parse the date and format it for datetime-local input
    // datetime-local expects format: YYYY-MM-DDTHH:MM in local timezone
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [formData, setFormData] = useState<TestFormData>({
    testName: initialData?.testName || '',
    testDescription: initialData?.testDescription || '',
    subject: initialData?.subject || 'Technical',
    testType: initialData?.testType || 'Assessment',
    companyName: initialData?.companyName || '',
    topics: initialData?.topics || [],
    difficulty: initialData?.difficulty || 'Medium',
    numberOfQuestions: initialData?.numberOfQuestions || 10,
    marksPerQuestion: initialData?.marksPerQuestion || 1,
    duration: initialData?.duration || 60,
    startDateTime: initialData?.startDateTime ? formatDateTimeLocal(initialData.startDateTime) : '',
    endDateTime: initialData?.endDateTime ? formatDateTimeLocal(initialData.endDateTime) : '',
    questions: initialData?.questions || [],
    hasCodingSection: initialData?.hasCodingSection || false,
    codingQuestions: initialData?.codingQuestions || []
  });

  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    questionText: '',
    questionImageUrl: '',
    options: { A: '', B: '', C: '', D: '' },
    optionImages: { A: '', B: '', C: '', D: '' },
    correctAnswer: 'A',
    marks: 1
  });

  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showCodingConfig, setShowCodingConfig] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const subjects = ['Verbal', 'Reasoning', 'Technical', 'Arithmetic', 'Communication'];
  const testTypes = ['Assessment', 'Practice', 'Assignment', 'Mock Test', 'Specific Company Test'];
  const difficulties = ['Easy', 'Medium', 'Hard'];
  
  // Topic options based on subject
  const topicOptions = {
    'Verbal': ['Vocabulary', 'Grammar', 'Reading Comprehension', 'Synonyms & Antonyms', 'Sentence Completion'],
    'Reasoning': ['Logical Reasoning', 'Analytical Reasoning', 'Verbal Reasoning', 'Non-Verbal Reasoning', 'Critical Thinking'],
    'Technical': ['Programming', 'Data Structures', 'Algorithms', 'Database', 'Networking', 'Operating Systems'],
    'Arithmetic': ['Basic Math', 'Algebra', 'Geometry', 'Statistics', 'Probability', 'Number Systems'],
    'Communication': ['Written Communication', 'Verbal Communication', 'Presentation Skills', 'Business Communication', 'Email Etiquette']
  };

  const handleTopicChange = (topic: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      topics: checked
        ? [...prev.topics, topic]
        : prev.topics.filter(t => t !== topic)
    }));
  };

  const handleImageUpload = async (file: File, type: 'question' | 'option', optionKey?: string) => {
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    setUploadingImage(true);
    try {
      const response = await apiService.uploadQuestionImage(file);

      if (type === 'question') {
        if (editingQuestion) {
          setEditingQuestion(prev => prev ? ({ ...prev, questionImageUrl: response.imageUrl }) : null);
        } else {
          setCurrentQuestion(prev => ({ ...prev, questionImageUrl: response.imageUrl }));
        }
      } else if (type === 'option' && optionKey) {
        if (editingQuestion) {
          setEditingQuestion(prev => prev ? ({
            ...prev,
            optionImages: { ...prev.optionImages, [optionKey]: response.imageUrl }
          }) : null);
        } else {
          setCurrentQuestion(prev => ({
            ...prev,
            optionImages: { ...prev.optionImages, [optionKey]: response.imageUrl }
          }));
        }
      }
    } catch (error) {
      console.error('Image upload error:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: any = {};

    if (!formData.testName.trim()) newErrors.testName = 'Test name is required';
    if (!formData.testDescription.trim()) newErrors.testDescription = 'Description is required';
    if (formData.numberOfQuestions < 1) newErrors.numberOfQuestions = 'Must have at least 1 question';
    if (formData.marksPerQuestion < 1) newErrors.marksPerQuestion = 'Marks must be at least 1';
    if (formData.duration < 5) newErrors.duration = 'Duration must be at least 5 minutes';
    if (!formData.startDateTime) newErrors.startDateTime = 'Start date is required';
    if (!formData.endDateTime) newErrors.endDateTime = 'End date is required';
    
    if (formData.startDateTime && formData.endDateTime) {
      if (new Date(formData.startDateTime) >= new Date(formData.endDateTime)) {
        newErrors.endDateTime = 'End date must be after start date';
      }
    }

    if (formData.testType === 'Practice' && formData.topics.length === 0) {
      newErrors.topics = 'Please select at least one topic for practice tests';
    }
    if (formData.testType === 'Mock Test' && formData.topics.length === 0) {
      newErrors.topics = 'Please select at least one topic for mock tests';
    }
    if (formData.testType === 'Specific Company Test' && formData.topics.length === 0) {
      newErrors.topics = 'Please select at least one topic for company-specific tests';
    }
    if (formData.testType === 'Specific Company Test' && !formData.companyName?.trim()) {
      newErrors.companyName = 'Company name is required for Specific Company tests';
    }
    if (formData.questions.length !== formData.numberOfQuestions) {
      newErrors.questions = `You need exactly ${formData.numberOfQuestions} questions`;
    }

    if (formData.hasCodingSection) {
      if (!formData.codingQuestions || formData.codingQuestions.length === 0) {
        newErrors.codingQuestions = 'At least one coding question is required when coding section is enabled';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateQuestion = (): boolean => {
    return currentQuestion.questionText.trim() !== '' &&
           currentQuestion.options.A.trim() !== '' &&
           currentQuestion.options.B.trim() !== '' &&
           currentQuestion.options.C.trim() !== '' &&
           currentQuestion.options.D.trim() !== '' &&
           ['A', 'B', 'C', 'D'].includes(currentQuestion.correctAnswer);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const payload = {
        ...formData,
        codingQuestions: formData.hasCodingSection ? formData.codingQuestions?.map(q => ({
          questionId: q.id,
          points: q.points || 100,
          timeLimit: q.timeLimit || 3600
        })) : []
      };
      await onSubmit(payload);
      // Reset form
      setFormData({
        testName: '',
        testDescription: '',
        subject: 'Technical',
        testType: 'Assessment',
        companyName: '',
        topics: [],
        difficulty: 'Medium',
        numberOfQuestions: 10,
        marksPerQuestion: 1,
        duration: 60,
        startDateTime: '',
        endDateTime: '',
        questions: [],
        hasCodingSection: false,
        codingQuestions: []
      });
      setErrors({});
    } catch (error) {
      console.error('Form submission error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create test';
      alert(`Test creation failed: ${errorMessage}`);
    }
  };

  const addQuestion = () => {
    if (!validateQuestion()) {
      alert('Please fill all question fields correctly');
      return;
    }

    if (formData.questions.length >= formData.numberOfQuestions) {
      alert(`Maximum ${formData.numberOfQuestions} questions allowed`);
      return;
    }

    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, { ...currentQuestion, marks: formData.marksPerQuestion }]
    }));

    setCurrentQuestion({
      questionText: '',
      questionImageUrl: '',
      options: { A: '', B: '', C: '', D: '' },
      optionImages: { A: '', B: '', C: '', D: '' },
      correctAnswer: 'A',
      marks: formData.marksPerQuestion
    });
  };

  const removeQuestion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
    if (editingQuestionIndex === index) {
      setEditingQuestionIndex(null);
      setEditingQuestion(null);
    }
  };

  const startEditQuestion = (index: number) => {
    setEditingQuestionIndex(index);
    setEditingQuestion({ ...formData.questions[index] });
    setShowQuestionForm(false);
  };

  const saveEditedQuestion = () => {
    if (!editingQuestion || editingQuestionIndex === null) return;

    if (!editingQuestion.questionText.trim() ||
        !editingQuestion.options.A.trim() ||
        !editingQuestion.options.B.trim() ||
        !editingQuestion.options.C.trim() ||
        !editingQuestion.options.D.trim()) {
      alert('Please fill all question fields correctly');
      return;
    }

    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === editingQuestionIndex ? editingQuestion : q
      )
    }));

    setEditingQuestionIndex(null);
    setEditingQuestion(null);
  };

  const cancelEditQuestion = () => {
    setEditingQuestionIndex(null);
    setEditingQuestion(null);
  };

  const handlePDFUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== 'application/pdf') {
      alert('Please select a valid PDF file');
      e.target.value = '';
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      e.target.value = '';
      return;
    }
    setPdfLoading(true);
    const formDataUpload = new FormData();
    formDataUpload.append('pdf', file);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/tests/extract-pdf`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // Don't set Content-Type - let browser set it with boundary for FormData
        },
        body: formDataUpload
      });

      const data = await response.json();

      if (response.ok) {
        if (!data || !data.questions || !Array.isArray(data.questions)) {
          throw new Error('Invalid response from server');
        }

        if (data.questions.length === 0) {
          alert('No questions found in PDF. Please check the file format.');
          return;
        }

        const extractedQuestions = data.questions.map((q: any) => ({
          ...q,
          marks: formData.marksPerQuestion
        }));

        setFormData(prev => ({
          ...prev,
          questions: [...prev.questions, ...extractedQuestions].slice(0, formData.numberOfQuestions)
        }));

        const questionsList = extractedQuestions.map((q: any, idx: number) =>
          `Q${idx + 1}: ${q.questionText.substring(0, 50)}...`
        ).join('\n');

        alert(`Successfully extracted ${data.questions.length} questions from PDF:\n\n${questionsList.substring(0, 500)}${questionsList.length > 500 ? '\n...(and more)' : ''}\n\nScroll down to review all questions before submitting.`);
      } else {
        console.error('PDF extraction error:', data);
        const errorMessage = data.error || 'Failed to extract questions from PDF';
        alert(`${errorMessage}\n\nTips for better PDF extraction:\n• Ensure questions are numbered (1., 2., etc.)\n• Options should be labeled A), B), C), D)\n• Include clear answer indicators (Answer: A, Correct: B, etc.)\n• Use clear formatting with line breaks between questions`);
      }
    } catch (error) {
      console.error('PDF upload error:', error);
      alert('Error uploading PDF. Please check your connection and try again.\n\nIf the problem persists, try using the "Add Sample" or "Add Manual" options instead.');
    } finally {
      setPdfLoading(false);
      e.target.value = '';
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!['json', 'csv'].includes(fileExtension || '')) {
      alert('Please select a valid JSON or CSV file');
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      e.target.value = '';
      return;
    }

    setPdfLoading(true);
    try {
      const data = await apiService.extractQuestionsFromFile(file);

      if (!data || !data.questions || !Array.isArray(data.questions)) {
        throw new Error('Invalid response from server');
      }

      if (data.questions.length === 0) {
        alert(`No questions found in ${fileExtension?.toUpperCase()} file. Please check the file format.`);
        return;
      }

      const extractedQuestions = data.questions.map((q: any) => ({
        ...q,
        marks: formData.marksPerQuestion
      }));

      setFormData(prev => ({
        ...prev,
        questions: [...prev.questions, ...extractedQuestions].slice(0, formData.numberOfQuestions)
      }));

      alert(`Successfully extracted ${data.questions.length} questions from ${fileExtension?.toUpperCase()}`);
    } catch (error) {
      console.error('File upload error:', error);
      alert(`Error processing ${fileExtension?.toUpperCase()} file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setPdfLoading(false);
      e.target.value = '';
    }
  };

  const generateSampleQuestions = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiUrl}/tests/sample-questions/${formData.subject}?count=${Math.min(5, formData.numberOfQuestions - formData.questions.length)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        const sampleQuestions = data.questions.map((q: any) => ({
          ...q,
          marks: formData.marksPerQuestion
        }));
        
        setFormData(prev => ({
          ...prev,
          questions: [...prev.questions, ...sampleQuestions]
        }));
      }
    } catch (error) {
      console.error('Error generating sample questions:', error);
    }
  };

  const isFormValid = () => {
    const newErrors: any = {};

    if (!formData.testName.trim()) newErrors.testName = 'Test name is required';
    if (!formData.testDescription.trim()) newErrors.testDescription = 'Description is required';
    if (formData.numberOfQuestions < 1) newErrors.numberOfQuestions = 'Must have at least 1 question';
    if (formData.marksPerQuestion < 1) newErrors.marksPerQuestion = 'Marks must be at least 1';
    if (formData.duration < 5) newErrors.duration = 'Duration must be at least 5 minutes';
    if (!formData.startDateTime) newErrors.startDateTime = 'Start date is required';
    if (!formData.endDateTime) newErrors.endDateTime = 'End date is required';

    if (formData.startDateTime && formData.endDateTime && new Date(formData.startDateTime) >= new Date(formData.endDateTime)) {
      newErrors.endDateTime = 'End date must be after start date';
    }

    if (formData.testType === 'Practice' && formData.topics.length === 0) {
      newErrors.topics = 'Please select at least one topic for practice tests';
    }
    if (formData.questions.length !== formData.numberOfQuestions) {
      newErrors.questions = `You need exactly ${formData.numberOfQuestions} questions`;
    }

    if (formData.hasCodingSection) {
      if (!formData.codingQuestions || formData.codingQuestions.length === 0) {
        newErrors.codingQuestions = 'At least one coding question is required when coding section is enabled';
      }
    }

    return Object.keys(newErrors).length === 0;
  };

  if (showPreview) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Test Preview</h3>
          <button
            onClick={() => setShowPreview(false)}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            Back to Edit
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-xl font-bold mb-2">{formData.testName}</h2>
          <p className="text-gray-600 mb-4">{formData.testDescription}</p>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="text-center p-3 bg-blue-50 rounded">
              <p className="text-sm text-gray-600">Subject</p>
              <p className="font-medium">{formData.subject}</p>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded">
              <p className="text-sm text-gray-600">Type</p>
              <p className="font-medium">{formData.testType}</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded">
              <p className="text-sm text-gray-600">Questions</p>
              <p className="font-medium">{formData.numberOfQuestions}</p>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded">
              <p className="text-sm text-gray-600">Duration</p>
              <p className="font-medium">{formData.duration} min</p>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded">
              <p className="text-sm text-gray-600">Total Marks</p>
              <p className="font-medium">{formData.numberOfQuestions * formData.marksPerQuestion}</p>
            </div>
          </div>

          {formData.topics.length > 0 && (
            <div className="mb-6">
              <h4 className="font-medium text-gray-700 mb-2">Topics Covered:</h4>
              <div className="flex flex-wrap gap-2">
                {formData.topics.map(topic => (
                  <span key={topic} className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded">
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          <div className="space-y-6">
            {formData.questions.map((question, index) => (
              <div key={index} className="border rounded-lg p-4">
                <h4 className="font-medium mb-3">
                  {index + 1}. {question.questionText}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {Object.entries(question.options).map(([key, value]) => (
                    <div
                      key={key}
                      className={`p-2 rounded border ${
                        question.correctAnswer === key
                          ? 'bg-green-50 border-green-300'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <span className="font-medium">{key})</span> {value}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-green-600 mt-2">
                  Correct Answer: {question.correctAnswer} | Marks: {question.marks}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={loading || !isFormValid()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <LoadingSpinner size="sm" /> : null}
              Create Test
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Test Information */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-medium mb-4">Test Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="inline w-4 h-4 mr-1" />
              Test Name
            </label>
            <input
              type="text"
              value={formData.testName}
              onChange={(e) => setFormData(prev => ({ ...prev, testName: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.testName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter test name"
            />
            {errors.testName && <p className="mt-1 text-sm text-red-600">{errors.testName}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
            <select
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {subjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Test Type</label>
            <select
              value={formData.testType}
              onChange={(e) => setFormData(prev => ({ ...prev, testType: e.target.value as any, topics: [] }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {testTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Company Name field for Specific Company Test */}
          {formData.testType === 'Specific Company Test' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.companyName || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.companyName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter company name (e.g., Google, Amazon)"
              />
              {errors.companyName && <p className="mt-1 text-sm text-red-600">{errors.companyName}</p>}
            </div>
          )}

          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={formData.testDescription}
              onChange={(e) => setFormData(prev => ({ ...prev, testDescription: e.target.value }))}
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.testDescription ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter test description"
            />
            {errors.testDescription && <p className="mt-1 text-sm text-red-600">{errors.testDescription}</p>}
          </div>

          {/* Topics Selection for Practice Tests */}
          {(formData.testType === 'Practice' || formData.testType === 'Mock Test') && (
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Topics (Select specific topics for {formData.testType.toLowerCase()})
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-3 border rounded-lg">
                {topicOptions[formData.subject].map(topic => (
                  <label key={topic} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.topics.includes(topic)}
                      onChange={(e) => handleTopicChange(topic, e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">{topic}</span>
                  </label>
                ))}
              </div>
              {errors.topics && <p className="mt-1 text-sm text-red-600">{errors.topics}</p>}
            </div>
          )}

          {/* Topics Selection for Assignment Tests */}
          {(formData.testType === 'Assignment' || formData.testType === 'Specific Company Test') && (
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {formData.testType === 'Specific Company Test' 
                  ? 'Company-specific Topics (Select relevant areas for company assessment)'
                  : 'Topics (Select multiple topics for comprehensive coverage)'
                }
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-3 border rounded-lg">
                {topicOptions[formData.subject].map(topic => (
                  <label key={topic} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.topics.includes(topic)}
                      onChange={(e) => handleTopicChange(topic, e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">{topic}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty Level</label>
            <select
              value={formData.difficulty}
              onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {difficulties.map(difficulty => (
                <option key={difficulty} value={difficulty}>{difficulty}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Hash className="inline w-4 h-4 mr-1" />
              Number of Questions
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={formData.numberOfQuestions}
              onChange={(e) => setFormData(prev => ({ ...prev, numberOfQuestions: parseInt(e.target.value) || 0 }))}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.numberOfQuestions ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.numberOfQuestions && <p className="mt-1 text-sm text-red-600">{errors.numberOfQuestions}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Marks per Question</label>
            <input
              type="number"
              min="1"
              max="10"
              value={formData.marksPerQuestion}
              onChange={(e) => setFormData(prev => ({ ...prev, marksPerQuestion: parseInt(e.target.value) || 0 }))}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.marksPerQuestion ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.marksPerQuestion && <p className="mt-1 text-sm text-red-600">{errors.marksPerQuestion}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="inline w-4 h-4 mr-1" />
              Duration (minutes)
            </label>
            <input
              type="number"
              min="5"
              max="300"
              value={formData.duration}
              onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.duration ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.duration && <p className="mt-1 text-sm text-red-600">{errors.duration}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Total Marks</label>
            <input
              type="text"
              value={formData.numberOfQuestions * formData.marksPerQuestion}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline w-4 h-4 mr-1" />
              Start Date & Time
            </label>
            <input
              type="datetime-local"
              value={formData.startDateTime}
              onChange={(e) => setFormData(prev => ({ ...prev, startDateTime: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.startDateTime ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.startDateTime && <p className="mt-1 text-sm text-red-600">{errors.startDateTime}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date & Time</label>
            <input
              type="datetime-local"
              value={formData.endDateTime}
              onChange={(e) => setFormData(prev => ({ ...prev, endDateTime: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.endDateTime ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.endDateTime && <p className="mt-1 text-sm text-red-600">{errors.endDateTime}</p>}
          </div>

          <div className="md:col-span-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.hasCodingSection}
                onChange={(e) => setFormData(prev => ({ ...prev, hasCodingSection: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Code className="w-4 h-4 text-blue-600" />
                Include Coding Section
              </span>
            </label>
            <p className="mt-1 text-xs text-gray-500 ml-6">
              Add programming questions to this {formData.testType.toLowerCase()}
            </p>
          </div>
        </div>
      </div>

      {formData.hasCodingSection && (
        <div className="bg-white p-6 rounded-lg border border-green-300 bg-green-50">
          <div className="mb-4">
            <h3 className="text-lg font-medium text-green-900 flex items-center gap-2">
              <Code className="w-5 h-5" />
              Coding Section Configuration
            </h3>
            <p className="text-sm text-green-700">Select coding problems for this test. Students will solve these after completing MCQ questions.</p>
          </div>

          <CodingSectionConfig
            selectedQuestions={formData.codingQuestions || []}
            onQuestionsChange={(questions) => setFormData(prev => ({ ...prev, codingQuestions: questions }))}
          />
          {errors.codingQuestions && <p className="mt-2 text-sm text-red-600">{errors.codingQuestions}</p>}
        </div>
      )}

      {/* Questions Section */}
      <div className="bg-white p-6 rounded-lg border">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">
            Questions ({formData.questions.length}/{formData.numberOfQuestions})
          </h3>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={generateSampleQuestions}
              className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
              disabled={formData.questions.length >= formData.numberOfQuestions}
            >
              Add Sample
            </button>
            <label className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 cursor-pointer flex items-center gap-1">
              <Upload size={14} />
              {pdfLoading ? 'Processing...' : 'Upload PDF'}
              <input
                type="file"
                accept=".pdf"
                onChange={handlePDFUpload}
                className="hidden"
                disabled={pdfLoading}
              />
            </label>
            <label className="px-3 py-1 bg-orange-600 text-white rounded text-sm hover:bg-orange-700 cursor-pointer flex items-center gap-1">
              <Upload size={14} />
              {pdfLoading ? 'Processing...' : 'Upload JSON/CSV'}
              <input
                type="file"
                accept=".json,.csv"
                onChange={handleFileUpload}
                className="hidden"
                disabled={pdfLoading}
              />
            </label>
            <button
              type="button"
              onClick={() => setShowQuestionForm(!showQuestionForm)}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center gap-1"
            >
              <Plus size={14} />
              Add Manual
            </button>
          </div>
        </div>

        {errors.questions && <p className="mb-4 text-sm text-red-600">{errors.questions}</p>}

        {/* Edit Question Form */}
        {editingQuestionIndex !== null && editingQuestion && (
          <div className="mb-6 p-4 border-2 border-blue-500 rounded-lg bg-blue-50">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-medium text-blue-900">Edit Question {editingQuestionIndex + 1}</h4>
              <button
                type="button"
                onClick={cancelEditQuestion}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Question Text</label>
                <textarea
                  value={editingQuestion.questionText}
                  onChange={(e) => setEditingQuestion(prev => prev ? ({ ...prev, questionText: e.target.value }) : null)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your question here..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Question Image (Optional)</label>
                <div className="flex items-center gap-3">
                  <label className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 cursor-pointer text-sm flex items-center gap-2">
                    <Upload size={16} />
                    {uploadingImage ? 'Uploading...' : 'Upload Image'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'question')}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                  </label>
                  {editingQuestion.questionImageUrl && (
                    <div className="flex items-center gap-2">
                      <img src={editingQuestion.questionImageUrl} alt="Question" className="h-16 w-16 object-cover rounded border" />
                      <button
                        type="button"
                        onClick={() => setEditingQuestion(prev => prev ? ({ ...prev, questionImageUrl: '' }) : null)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['A', 'B', 'C', 'D'].map((option) => (
                  <div key={option}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Option {option}</label>
                    <input
                      type="text"
                      value={editingQuestion.options[option as keyof typeof editingQuestion.options]}
                      onChange={(e) => setEditingQuestion(prev => prev ? ({
                        ...prev,
                        options: { ...prev.options, [option]: e.target.value }
                      }) : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder={`Enter option ${option}`}
                    />
                    <label className="mt-1 px-3 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200 cursor-pointer inline-flex items-center gap-1">
                      <Upload size={12} />
                      Image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'option', option)}
                        className="hidden"
                        disabled={uploadingImage}
                      />
                    </label>
                    {editingQuestion.optionImages?.[option as keyof typeof editingQuestion.optionImages] && (
                      <div className="mt-1 flex items-center gap-2">
                        <img src={editingQuestion.optionImages[option as keyof typeof editingQuestion.optionImages]} alt={`Option ${option}`} className="h-12 w-12 object-cover rounded border" />
                        <button
                          type="button"
                          onClick={() => setEditingQuestion(prev => prev ? ({
                            ...prev,
                            optionImages: { ...prev.optionImages, [option]: '' }
                          }) : null)}
                          className="text-red-600 hover:text-red-800 text-xs"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correct Answer</label>
                <select
                  value={editingQuestion.correctAnswer}
                  onChange={(e) => setEditingQuestion(prev => prev ? ({ ...prev, correctAnswer: e.target.value as any }) : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={cancelEditQuestion}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveEditedQuestion}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Manual Question Form */}
        {showQuestionForm && (
          <div className="mb-6 p-4 border rounded-lg bg-gray-50">
            <h4 className="font-medium mb-3">Add Question</h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Question Text</label>
                <textarea
                  value={currentQuestion.questionText}
                  onChange={(e) => setCurrentQuestion(prev => ({ ...prev, questionText: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your question here..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Question Image (Optional)</label>
                <div className="flex items-center gap-3">
                  <label className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 cursor-pointer text-sm flex items-center gap-2">
                    <Upload size={16} />
                    {uploadingImage ? 'Uploading...' : 'Upload Image'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'question')}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                  </label>
                  {currentQuestion.questionImageUrl && (
                    <div className="flex items-center gap-2">
                      <img src={currentQuestion.questionImageUrl} alt="Question" className="h-16 w-16 object-cover rounded border" />
                      <button
                        type="button"
                        onClick={() => setCurrentQuestion(prev => ({ ...prev, questionImageUrl: '' }))}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['A', 'B', 'C', 'D'].map((option) => (
                  <div key={option}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Option {option}</label>
                    <input
                      type="text"
                      value={currentQuestion.options[option as keyof typeof currentQuestion.options]}
                      onChange={(e) => setCurrentQuestion(prev => ({
                        ...prev,
                        options: { ...prev.options, [option]: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder={`Enter option ${option}`}
                    />
                    <label className="mt-1 px-3 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200 cursor-pointer inline-flex items-center gap-1">
                      <Upload size={12} />
                      Image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'option', option)}
                        className="hidden"
                        disabled={uploadingImage}
                      />
                    </label>
                    {currentQuestion.optionImages?.[option as keyof typeof currentQuestion.optionImages] && (
                      <div className="mt-1 flex items-center gap-2">
                        <img src={currentQuestion.optionImages[option as keyof typeof currentQuestion.optionImages]} alt={`Option ${option}`} className="h-12 w-12 object-cover rounded border" />
                        <button
                          type="button"
                          onClick={() => setCurrentQuestion(prev => ({
                            ...prev,
                            optionImages: { ...prev.optionImages, [option]: '' }
                          }))}
                          className="text-red-600 hover:text-red-800 text-xs"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correct Answer</label>
                <select
                  value={currentQuestion.correctAnswer}
                  onChange={(e) => setCurrentQuestion(prev => ({ ...prev, correctAnswer: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowQuestionForm(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={addQuestion}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Question
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Questions List */}
        <div className="space-y-3">
          {formData.questions.map((question, index) => (
            <div key={index} className={`p-4 border rounded-lg ${
              editingQuestionIndex === index ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
            }`}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-medium mb-2">{index + 1}. {question.questionText}</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(question.options).map(([key, value]) => (
                      <div
                        key={key}
                        className={`p-1 rounded ${
                          question.correctAnswer === key ? 'bg-green-100' : 'bg-gray-100'
                        }`}
                      >
                        <span className="font-medium">{key})</span> {value}
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-green-600 mt-1">
                    Correct: {question.correctAnswer} | Marks: {question.marks}
                  </p>
                </div>
                <div className="ml-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => startEditQuestion(index)}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                    title="Edit Question"
                  >
                    <CreditCard as Edit2 size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeQuestion(index)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                    title="Delete Question"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={() => setShowPreview(true)}
          disabled={formData.questions.length === 0}
          className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 flex items-center gap-2"
        >
          <Eye size={16} />
          Preview Test
        </button>
        <button
          type="submit"
          disabled={loading || !isFormValid()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? <LoadingSpinner size="sm" /> : null}
          Create Test
        </button>
      </div>
    </form>
  );
};

export default TestForm;