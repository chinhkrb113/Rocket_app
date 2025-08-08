import React, { useState } from 'react';
import { authApiService } from '../api/authApi';
import { studentService } from '../api/studentService';
import { enterpriseService } from '../api/enterpriseService';
import { aiService } from '../api/aiService';

interface TestResult {
  endpoint: string;
  status: 'success' | 'error' | 'loading';
  data?: any;
  error?: string;
}

const ApiTestDemo: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addTestResult = (result: TestResult) => {
    setTestResults(prev => [...prev, result]);
  };

  const updateTestResult = (endpoint: string, updates: Partial<TestResult>) => {
    setTestResults(prev => 
      prev.map(result => 
        result.endpoint === endpoint ? { ...result, ...updates } : result
      )
    );
  };

  const testEndpoint = async (endpoint: string, testFn: () => Promise<any>) => {
    addTestResult({ endpoint, status: 'loading' });
    
    try {
      const data = await testFn();
      updateTestResult(endpoint, { status: 'success', data });
    } catch (error: any) {
      updateTestResult(endpoint, { 
        status: 'error', 
        error: error.response?.data?.message || error.message 
      });
    }
  };

  const runAllTests = async () => {
    setIsLoading(true);
    setTestResults([]);

    // Test Backend Health
    await testEndpoint('Backend Health', async () => {
      const response = await fetch('http://localhost:3001/health');
      return await response.json();
    });

    // Test Auth Login (Mock)
    await testEndpoint('Auth Login', async () => {
      return await authApiService.login({
        email: 'test@example.com',
        password: 'password123'
      });
    });

    // Test Students API
    await testEndpoint('Get Students', async () => {
      return await studentService.getAllStudents();
    });

    // Test Enterprise Projects
    await testEndpoint('Get Projects', async () => {
      return await enterpriseService.getProjects();
    });

    // Test AI Service via Backend
    await testEndpoint('AI Analyze Submission', async () => {
      return await aiService.analyzeSubmission({
        studentId: '1',
        submissionContent: 'console.log("Hello World");',
        assignmentType: 'javascript-basics'
      });
    });

    // Test AI Candidate Recommendation
    await testEndpoint('AI Recommend Candidates', async () => {
      return await aiService.recommendCandidates({
        projectId: '1',
        requiredSkills: ['JavaScript', 'React'],
        experienceLevel: 'intermediate'
      });
    });

    setIsLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'loading': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'loading': return '⏳';
      default: return '⚪';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          API Connection Test Dashboard
        </h2>
        <p className="text-gray-600">
          Test kết nối giữa Frontend, Backend và AI Service
        </p>
      </div>

      <div className="mb-6">
        <button
          onClick={runAllTests}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          {isLoading ? 'Đang test...' : 'Chạy tất cả test'}
        </button>
      </div>

      <div className="space-y-4">
        {testResults.map((result, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-800">
                {getStatusIcon(result.status)} {result.endpoint}
              </h3>
              <span className={`font-medium ${getStatusColor(result.status)}`}>
                {result.status.toUpperCase()}
              </span>
            </div>
            
            {result.status === 'loading' && (
              <div className="text-yellow-600">Đang thực hiện...</div>
            )}
            
            {result.status === 'success' && result.data && (
              <div className="bg-green-50 border border-green-200 rounded p-3">
                <pre className="text-sm text-green-800 overflow-x-auto">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </div>
            )}
            
            {result.status === 'error' && result.error && (
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <p className="text-red-800 text-sm">{result.error}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {testResults.length === 0 && !isLoading && (
        <div className="text-center text-gray-500 py-8">
          Nhấn "Chạy tất cả test" để bắt đầu kiểm tra kết nối API
        </div>
      )}

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-800 mb-2">Thông tin Services:</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Frontend: http://localhost:3000</li>
          <li>• Backend (Main Service): http://localhost:3001</li>
          <li>• AI Service: http://localhost:8000</li>
        </ul>
      </div>
    </div>
  );
};

export default ApiTestDemo;