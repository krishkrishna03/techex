import React, { useState, useEffect } from 'react';
import { Code, CheckCircle, XCircle, Clock, Loader, Terminal, ChevronDown, ChevronUp } from 'lucide-react';
import CodeEditor from './CodeEditor';
import api from '../../services/api';

interface CodingQuestion {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  constraints: string;
  input_format: string;
  output_format: string;
  sample_input: string;
  sample_output: string;
  explanation: string;
  time_limit: number;
  memory_limit: number;
  supported_languages: string[];
  tags: string[];
}

interface TestResult {
  test_case_number: number;
  passed: boolean;
  input: string;
  expected_output: string;
  actual_output?: string;
  execution_time?: number;
  error?: string;
}

interface CodingInterfaceProps {
  questionId: string;
  testAttemptId?: string;
  isPractice?: boolean;
  onSubmit?: (submissionId: string, score: number) => void;
}

const CodingInterface: React.FC<CodingInterfaceProps> = ({
  questionId,
  testAttemptId,
  isPractice = false,
  onSubmit
}) => {
  const [question, setQuestion] = useState<CodingQuestion | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState('python');
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<string | null>(null);
  const [showDescription, setShowDescription] = useState(true);
  const [showTestResults, setShowTestResults] = useState(true);

  useEffect(() => {
    fetchQuestion();
  }, [questionId]);

  const fetchQuestion = async () => {
    try {
      const response = await api.get<{ data: CodingQuestion }>(`/coding/questions/${questionId}`);
      const questionData = response.data;
      setQuestion(questionData);

      // Set default code for Python
      setCode(`def solution(nums, target):
    # Write your code here
    hashmap = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in hashmap:
            return [hashmap[complement], i]
        hashmap[num] = i
    return []

# DO NOT MODIFY BELOW THIS LINE
if __name__ == "__main__":
    n = int(input())
    nums = list(map(int, input().split()))
    target = int(input())
    result = solution(nums, target)
    print(*result)`);

    } catch (error) {
      console.error('Error fetching question:', error);
      setOutput('Error fetching question. Please try again.');
    }
  };

  const handleRunCode = async () => {
    if (!code.trim()) {
      alert('Please write some code first');
      return;
    }

    setIsRunning(true);
    setOutput('Running code...');
    setTestResults([]);

    try {
      interface RunResponse {
        data: {
          output?: string;
          testResults?: TestResult[];
          error?: string;
        }
      }
      const response = await api.post<RunResponse>('/coding/run', {
        questionId,
        code,
        language: selectedLanguage.toLowerCase()
      });

      if (response.data.error) {
        setOutput('Error: ' + response.data.error);
      } else {
        setOutput(response.data.output || '');
        if (response.data.testResults) {
          setTestResults(response.data.testResults);
        }
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Error running code';
      setOutput('Error: ' + errorMessage);
      console.error('Run code error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!code.trim()) {
      alert('Please write some code first');
      return;
    }

    if (!confirm('Are you sure you want to submit your solution? This will run all test cases.')) {
      return;
    }

    setIsSubmitting(true);
    setSubmissionStatus(null);

    try {
      interface SubmitResponse {
        data: {
          status: string;
          testResults: TestResult[];
          submissionId: string;
          score: number;
          testCasesPassed: number;
          totalTestCases: number;
        }
      }
      const response = await api.post<SubmitResponse>('/coding/submit', {
        questionId,
        testAttemptId,
        code,
        // normalize language casing to match backend expectations (e.g. 'javascript', 'python')
        language: selectedLanguage.toLowerCase(),
        isPractice
      });

      setSubmissionStatus(response.data.status);
      setTestResults(response.data.testResults || []);

      if (onSubmit) {
        onSubmit(response.data.submissionId, response.data.score);
      }

      if (response.data.status === 'accepted') {
        alert(`Success! You passed ${response.data.testCasesPassed}/${response.data.totalTestCases} test cases. Score: ${response.data.score}`);
      } else {
        alert(`Submission completed. Status: ${response.data.status}. Passed ${response.data.testCasesPassed}/${response.data.totalTestCases} test cases.`);
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error submitting code');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (!question) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Code className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-800">{question.title}</h1>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(question.difficulty)}`}>
              {question.difficulty.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {question.supported_languages.map(lang => (
                <option key={lang} value={lang}>
                  {lang.charAt(0).toUpperCase() + lang.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          {question.tags.map(tag => (
            <span key={tag} className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-1/2 border-r overflow-y-auto">
          <div className="p-6 space-y-6">
            <div>
              <button
                onClick={() => setShowDescription(!showDescription)}
                className="flex items-center justify-between w-full text-left mb-3"
              >
                <h2 className="text-lg font-semibold text-gray-800">Problem Description</h2>
                {showDescription ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
              {showDescription && (
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">{question.description}</p>
                </div>
              )}
            </div>

            {question.constraints && (
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Constraints</h3>
                <p className="text-gray-700 text-sm whitespace-pre-wrap">{question.constraints}</p>
              </div>
            )}

            {question.input_format && (
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Input Format</h3>
                <p className="text-gray-700 text-sm whitespace-pre-wrap">{question.input_format}</p>
              </div>
            )}

            {question.output_format && (
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Output Format</h3>
                <p className="text-gray-700 text-sm whitespace-pre-wrap">{question.output_format}</p>
              </div>
            )}

            {question.sample_input && (
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Sample Input</h3>
                <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">{question.sample_input}</pre>
              </div>
            )}

            {question.sample_output && (
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Sample Output</h3>
                <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">{question.sample_output}</pre>
              </div>
            )}

            {question.explanation && (
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Explanation</h3>
                <p className="text-gray-700 text-sm whitespace-pre-wrap">{question.explanation}</p>
              </div>
            )}

            <div className="flex items-center gap-6 text-sm text-gray-600 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Time Limit: {question.time_limit}ms</span>
              </div>
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4" />
                <span>Memory Limit: {question.memory_limit}MB</span>
              </div>
            </div>
          </div>
        </div>

        <div className="w-1/2 flex flex-col">
          <div className="flex-1 p-4 overflow-hidden">
            <CodeEditor
              language={selectedLanguage}
              initialCode={code}
              onCodeChange={setCode}
              height="calc(100vh - 300px)"
            />
          </div>

          <div className="border-t bg-white">
            <div className="px-4 py-3 flex items-center justify-between border-b">
              <button
                onClick={() => setShowTestResults(!showTestResults)}
                className="flex items-center gap-2 font-semibold text-gray-800"
              >
                <Terminal className="w-5 h-5" />
                Output
                {showTestResults ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
              <div className="flex gap-2">
                <button
                  onClick={handleRunCode}
                  disabled={isRunning}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {isRunning ? <Loader className="w-4 h-4 animate-spin" /> : null}
                  Run Code
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? <Loader className="w-4 h-4 animate-spin" /> : null}
                  Submit
                </button>
              </div>
            </div>
            {submissionStatus && (
              <div className="px-4 py-2 text-center text-sm">
                <span
                  className={`font-medium ${submissionStatus.toLowerCase() === 'accepted'
                      ? 'text-green-600'
                      : 'text-red-600'
                    }`}
                >
                  {submissionStatus.toLowerCase() === 'accepted'
                    ? '✅ Accepted! Great job.'
                    : `❌ Submission status: ${submissionStatus}`}
                </span>
              </div>
            )}

            {showTestResults && (
              <div className="p-4 overflow-y-auto" style={{ maxHeight: '200px' }}>
                {output && (
                  <div className="mb-4">
                    <pre className="bg-gray-900 text-green-400 p-3 rounded text-sm overflow-x-auto font-mono">
                      {output}
                    </pre>
                  </div>
                )}

                {testResults.length > 0 && (
                  <div className="space-y-2">
                    {testResults.map((result, index) => (
                      <div
                        key={index}
                        className={`border rounded-lg p-3 ${result.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">Test Case {result.test_case_number}</span>
                          {result.passed ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600" />
                          )}
                        </div>
                        {!result.passed && (
                          <div className="text-sm space-y-1">
                            <div>
                              <span className="text-gray-600">Input:</span>
                              <pre className="bg-white p-2 rounded mt-1 text-xs">{result.input}</pre>
                            </div>
                            <div>
                              <span className="text-gray-600">Expected:</span>
                              <pre className="bg-white p-2 rounded mt-1 text-xs">{result.expected_output}</pre>
                            </div>
                            {result.actual_output && (
                              <div>
                                <span className="text-gray-600">Your Output:</span>
                                <pre className="bg-white p-2 rounded mt-1 text-xs">{result.actual_output}</pre>
                              </div>
                            )}
                            {result.error && (
                              <div>
                                <span className="text-red-600">Error:</span>
                                <pre className="bg-white p-2 rounded mt-1 text-xs text-red-600">{result.error}</pre>
                              </div>
                            )}
                          </div>
                        )}
                        {result.execution_time && (
                          <div className="text-xs text-gray-600 mt-2">
                            Execution time: {result.execution_time}ms
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {!output && testResults.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    Run your code to see the output
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodingInterface;
