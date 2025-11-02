import React, { useState } from 'react';
import { Plus, Trash2, Edit2, XCircle, Save, Clock, Hash, Upload, Eye } from 'lucide-react';
import LoadingSpinner from '../UI/LoadingSpinner';
import QuestionPreviewModal from './QuestionPreviewModal';

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

interface Section {
  sectionName: string;
  sectionDuration: number;
  numberOfQuestions: number;
  marksPerQuestion: number;
  questions: Question[];
}

interface SectionConfigurationProps {
  sections: Section[];
  onSectionsChange: (sections: Section[]) => void;
  onAddQuestions: (sectionIndex: number) => void;
  onUploadFile: (sectionIndex: number, file: File) => void;
  uploadingSectionIndex: number | null;
  fileUploadLoading: boolean;
}

const SectionConfiguration: React.FC<SectionConfigurationProps> = ({
  sections,
  onSectionsChange,
  onAddQuestions,
  onUploadFile,
  uploadingSectionIndex,
  fileUploadLoading
}) => {
  const [editingSectionIndex, setEditingSectionIndex] = useState<number | null>(null);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [previewSectionIndex, setPreviewSectionIndex] = useState<number | null>(null);

  const addSection = () => {
    const newSection: Section = {
      sectionName: `Section ${sections.length + 1}`,
      sectionDuration: 30,
      numberOfQuestions: 10,
      marksPerQuestion: 1,
      questions: []
    };
    onSectionsChange([...sections, newSection]);
  };

  const removeSection = (index: number) => {
    onSectionsChange(sections.filter((_, i) => i !== index));
  };

  const startEditSection = (index: number) => {
    setEditingSectionIndex(index);
    setEditingSection({ ...sections[index] });
  };

  const saveEditedSection = () => {
    if (editingSection === null || editingSectionIndex === null) return;

    const updatedSections = sections.map((section, index) =>
      index === editingSectionIndex ? editingSection : section
    );
    onSectionsChange(updatedSections);
    setEditingSectionIndex(null);
    setEditingSection(null);
  };

  const cancelEditSection = () => {
    setEditingSectionIndex(null);
    setEditingSection(null);
  };

  const getTotalDuration = () => {
    return sections.reduce((sum, section) => sum + section.sectionDuration, 0);
  };

  const getTotalQuestions = () => {
    return sections.reduce((sum, section) => sum + section.numberOfQuestions, 0);
  };

  const getTotalMarks = () => {
    return sections.reduce((sum, section) => sum + (section.numberOfQuestions * section.marksPerQuestion), 0);
  };

  const handleEditQuestion = (sectionIndex: number, questionIndex: number, updatedQuestion: Question) => {
    const updatedSections = [...sections];
    updatedSections[sectionIndex].questions[questionIndex] = updatedQuestion;
    onSectionsChange(updatedSections);
  };

  const handleDeleteQuestion = (sectionIndex: number, questionIndex: number) => {
    const updatedSections = [...sections];
    updatedSections[sectionIndex].questions.splice(questionIndex, 1);
    onSectionsChange(updatedSections);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Test Sections</h3>
        <button
          type="button"
          onClick={addSection}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={16} />
          Add Section
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="text-center">
          <p className="text-sm text-gray-600">Total Sections</p>
          <p className="text-2xl font-bold text-blue-600">{sections.length}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">Total Duration</p>
          <p className="text-2xl font-bold text-blue-600">{getTotalDuration()} min</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">Total Questions</p>
          <p className="text-2xl font-bold text-blue-600">{getTotalQuestions()}</p>
        </div>
      </div>

      {editingSectionIndex !== null && editingSection && (
        <div className="p-4 border-2 border-blue-500 rounded-lg bg-blue-50">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-medium text-blue-900">Edit Section</h4>
            <button
              type="button"
              onClick={cancelEditSection}
              className="text-gray-500 hover:text-gray-700"
            >
              <XCircle size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Section Name
              </label>
              <input
                type="text"
                value={editingSection.sectionName}
                onChange={(e) => setEditingSection({ ...editingSection, sectionName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Quantitative Aptitude"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="inline w-4 h-4 mr-1" />
                Section Duration (minutes)
              </label>
              <input
                type="number"
                min="5"
                max="180"
                value={editingSection.sectionDuration}
                onChange={(e) => setEditingSection({ ...editingSection, sectionDuration: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
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
                value={editingSection.numberOfQuestions}
                onChange={(e) => setEditingSection({ ...editingSection, numberOfQuestions: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Marks per Question
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={editingSection.marksPerQuestion}
                onChange={(e) => setEditingSection({ ...editingSection, marksPerQuestion: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={cancelEditSection}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveEditedSection}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Save size={16} />
              Save Changes
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {sections.map((section, index) => (
          <div
            key={index}
            className={`p-4 border rounded-lg ${
              editingSectionIndex === index ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-medium text-lg mb-2">{section.sectionName}</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-gray-500" />
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium">{section.sectionDuration} min</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Hash size={16} className="text-gray-500" />
                    <span className="text-gray-600">Questions:</span>
                    <span className="font-medium">{section.numberOfQuestions}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Marks/Q:</span>
                    <span className="font-medium ml-1">{section.marksPerQuestion}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Marks:</span>
                    <span className="font-medium ml-1">{section.numberOfQuestions * section.marksPerQuestion}</span>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">
                      Questions Added: {section.questions.length} / {section.numberOfQuestions}
                    </span>
                    {section.questions.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setPreviewSectionIndex(index)}
                        className="text-sm px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 font-medium flex items-center gap-1"
                      >
                        <Eye size={14} />
                        Preview Questions
                      </button>
                    )}
                    {section.questions.length < section.numberOfQuestions && (
                      <>
                        <button
                          type="button"
                          onClick={() => onAddQuestions(index)}
                          className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium flex items-center gap-1"
                        >
                          <Plus size={14} />
                          Add Questions
                        </button>
                        <label className="text-sm px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 font-medium cursor-pointer flex items-center gap-1">
                          <Upload size={14} />
                          Upload JSON
                          <input
                            type="file"
                            accept=".json,.csv"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                onUploadFile(index, file);
                                e.target.value = '';
                              }
                            }}
                            className="hidden"
                            disabled={fileUploadLoading}
                          />
                        </label>
                      </>
                    )}
                    {section.questions.length === section.numberOfQuestions && (
                      <span className="text-sm text-green-600 font-medium">✓ Complete</span>
                    )}
                  </div>
                  {fileUploadLoading && uploadingSectionIndex === index && (
                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded flex items-center gap-2">
                      <LoadingSpinner size="sm" />
                      <span className="text-sm text-blue-700">Uploading and processing file...</span>
                    </div>
                  )}
                  {section.questions.length !== section.numberOfQuestions && (
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${(section.questions.length / section.numberOfQuestions) * 100}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="ml-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => startEditSection(index)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                  title="Edit Section"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => removeSection(index)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                  title="Delete Section"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {sections.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Plus className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">No Sections Created Yet</h4>
              <p className="text-gray-600 mb-4">Click "Add Section" to create your first section</p>
              <p className="text-sm text-gray-500">Each section can have its own name, duration, number of questions, and marks</p>
            </div>
            <button
              type="button"
              onClick={addSection}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium"
            >
              <Plus size={20} />
              Create First Section
            </button>
          </div>
        </div>
      )}

      {previewSectionIndex !== null && (
        <QuestionPreviewModal
          isOpen={true}
          onClose={() => setPreviewSectionIndex(null)}
          questions={sections[previewSectionIndex].questions}
          sectionName={sections[previewSectionIndex].sectionName}
          onEditQuestion={(questionIndex, updatedQuestion) =>
            handleEditQuestion(previewSectionIndex, questionIndex, updatedQuestion)
          }
          onDeleteQuestion={(questionIndex) =>
            handleDeleteQuestion(previewSectionIndex, questionIndex)
          }
        />
      )}
    </div>
  );
};

export default SectionConfiguration;
