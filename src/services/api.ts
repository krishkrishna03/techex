const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://college-sync-hub-tan.vercel.app/api';
class ApiService {
  private getHeaders(includeAuth = true): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const token = localStorage.getItem('token');
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getHeaders(true),
          ...options.headers,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Clear invalid token on 401 responses
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }

        const data = await response.json();
        
        if (response.status === 403) {
          throw new Error('Access denied. You do not have permission to access this resource.');
        }

        // Better error handling for validation errors
        if (data.errors && Array.isArray(data.errors)) {
          const errorMessages = data.errors.map((err: any) => err.msg || err.message).join(', ');
          throw new Error(errorMessages || 'Validation failed');
        }

        throw new Error(data.error || data.message || 'Request failed');
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error occurred');
    }
  }

  // Add convenience methods for HTTP verbs
  async get<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data?: any, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      headers: this.getHeaders(false),
      body: JSON.stringify({ email, password }),
    });
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  async updateProfile(data: any) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.request('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  async forgotPassword(email: string) {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      headers: this.getHeaders(false),
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, password: string) {
    return this.request(`/auth/reset-password/${token}`, {
      method: 'POST',
      headers: this.getHeaders(false),
      body: JSON.stringify({ password }),
    });
  }

  // Admin endpoints (Master Admin)
  async createCollege(collegeData: any) {
    return this.request('/admin/colleges', {
      method: 'POST',
      body: JSON.stringify(collegeData),
    });
  }

  async getColleges() {
    return this.request('/admin/colleges');
  }

  async getAdminStats() {
    return this.request('/admin/stats');
  }

  async toggleCollegeStatus(collegeId: string) {
    return this.request(`/admin/colleges/${collegeId}/toggle-status`, {
      method: 'PUT',
    });
  }

  // College endpoints
  async createUser(userData: any) {
    return this.request('/college/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getCollegeUsers(role: 'faculty' | 'student') {
    return this.request(`/college/users/${role}`);
  }

  async getCollegeDashboard() {
    return this.request('/college/dashboard');
  }

  async updateUser(userId: string, userData: any) {
    return this.request(`/college/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async toggleUserStatus(userId: string) {
    return this.request(`/college/users/${userId}/toggle-status`, {
      method: 'PUT',
    });
  }

  async deleteUser(userId: string) {
    return this.request(`/college/users/${userId}`, {
      method: 'DELETE',
    });
  }

  // Test endpoints
  async createTest(testData: any) {
    return this.request('/tests', {
      method: 'POST',
      body: JSON.stringify(testData),
    });
  }

  async updateTest(testId: string, testData: any) {
    return this.request(`/tests/${testId}`, {
      method: 'PUT',
      body: JSON.stringify(testData),
    });
  }

  async deleteTest(testId: string) {
    return this.request(`/tests/${testId}`, {
      method: 'DELETE',
    });
  }

  async getTests(testType?: string, subject?: string) {
    const params = new URLSearchParams();
    if (testType) params.append('testType', testType);
    if (subject) params.append('subject', subject);
    
    const queryString = params.toString();
    return this.request(`/tests${queryString ? `?${queryString}` : ''}`);
  }

  async getTest(testId: string) {
    return this.request(`/tests/${testId}`);
  }

  async assignTestToColleges(testId: string, collegeIds: string[]) {
    return this.request(`/tests/${testId}/assign-college`, {
      method: 'POST',
      body: JSON.stringify({ collegeIds }),
    });
  }

  async getTestAssignedColleges(testId: string) {
    return this.request(`/tests/${testId}/assigned-colleges`);
  }

  async getAssignedTests(testType?: string, subject?: string) {
    const params = new URLSearchParams();
    if (testType) params.append('testType', testType);
    if (subject) params.append('subject', subject);

    const queryString = params.toString();
    return this.request(`/tests/college/assigned${queryString ? `?${queryString}` : ''}`);
  }

  async getAllTestsForCollege(testType?: string, subject?: string) {
    const params = new URLSearchParams();
    if (testType) params.append('testType', testType);
    if (subject) params.append('subject', subject);

    const queryString = params.toString();
    return this.request(`/tests/college/all-tests${queryString ? `?${queryString}` : ''}`);
  }

  async updateTestAssignmentStatus(assignmentId: string, status: 'accepted' | 'rejected') {
    return this.request(`/tests/assignment/${assignmentId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async assignTestToStudents(assignmentId: string, filters: any) {
    return this.request(`/tests/assignment/${assignmentId}/assign-students`, {
      method: 'POST',
      body: JSON.stringify(filters),
    });
  }

  async getStudentAssignedTests(testType?: string, subject?: string) {
    const params = new URLSearchParams();
    if (testType) params.append('testType', testType);
    if (subject) params.append('subject', subject);

    const queryString = params.toString();
    return this.request(`/tests/student/assigned${queryString ? `?${queryString}` : ''}`);
  }

  async getCollegeAssignedTests(testType?: string, subject?: string) {
    const params = new URLSearchParams();
    if (testType) params.append('testType', testType);
    if (subject) params.append('subject', subject);

    const queryString = params.toString();
    return this.request(`/tests/college/assigned${queryString ? `?${queryString}` : ''}`);
  }

  async startTest(testId: string) {
    return this.request(`/tests/${testId}/start`, {
      method: 'POST',
    });
  }

  async submitTest(testId: string, answers: any[], startTime: Date, timeSpent: number, violations?: number) {
    return this.request(`/tests/${testId}/submit`, {
      method: 'POST',
      body: JSON.stringify({
        answers,
        startTime: startTime.toISOString(),
        timeSpent,
        violations: violations || 0
      }),
    });
  }

  async getTestResults(testId: string) {
    return this.request(`/tests/${testId}/results`);
  }

  // Reports endpoints
  async getMasterAdminReports() {
    return this.request('/reports/master/overview');
  }

  async getTestReport(testId: string) {
    return this.request(`/reports/master/test/${testId}`);
  }

  async getCollegeReports() {
    return this.request('/reports/college/overview');
  }

  async getFacultyReports() {
    return this.request('/reports/faculty/overview');
  }

  async getStudentPerformance() {
    return this.request('/reports/student/performance');
  }

  async getCollegeHierarchy() {
    return this.request('/college/hierarchy');
  }

  async getFilteredStudents(batch?: string, branch?: string, section?: string) {
    const params = new URLSearchParams();
    if (batch) params.append('batch', batch);
    if (branch) params.append('branch', branch);
    if (section) params.append('section', section);
    
    const queryString = params.toString();
    return this.request(`/college/students/filtered${queryString ? `?${queryString}` : ''}`);
  }

  async getHierarchicalReports(batch?: string, branch?: string, section?: string) {
    const params = new URLSearchParams();
    if (batch) params.append('batch', batch);
    if (branch) params.append('branch', branch);
    if (section) params.append('section', section);
    
    const queryString = params.toString();
    return this.request(`/reports/college/hierarchical${queryString ? `?${queryString}` : ''}`);
  }

  async getFacultyHierarchicalReports(batch?: string, section?: string) {
    const params = new URLSearchParams();
    if (batch) params.append('batch', batch);
    if (section) params.append('section', section);
    
    const queryString = params.toString();
    return this.request(`/reports/faculty/hierarchical${queryString ? `?${queryString}` : ''}`);
  }

  // Notification endpoints
  async createNotification(notificationData: any) {
    return this.request('/notifications', {
      method: 'POST',
      body: JSON.stringify(notificationData),
    });
  }

  async createNotificationWithFile(formData: FormData) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/notifications`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }
    return data;
  }

  async getMyNotifications(page = 1, limit = 20) {
    return this.request(`/notifications/my-notifications?page=${page}&limit=${limit}`);
  }

  async markNotificationRead(notificationId: string) {
    return this.request(`/notifications/${notificationId}/read`, {
      method: 'PUT',
    });
  }

  async markAllNotificationsRead() {
    return this.request('/notifications/mark-all-read', {
      method: 'PUT',
    });
  }

  async getNotificationStats() {
    return this.request('/notifications/stats');
  }

  async getSentNotifications(page = 1, limit = 20) {
    return this.request(`/notifications/sent-notifications?page=${page}&limit=${limit}`);
  }

  async getNotificationRecipients(notificationId: string, page = 1, limit = 50, filter?: string) {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (filter) params.append('filter', filter);
    return this.request(`/notifications/${notificationId}/recipients?${params.toString()}`);
  }

  async extractQuestionsFromFile(file: File) {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/tests/extract-file`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }
    return data;
  }

  // Dashboard stats endpoint (fallback to existing data)
  async getDashboardStats() {
    try {
      return await this.request('/analytics/dashboard');
    } catch (error) {
      // Fallback to admin stats if analytics endpoint fails
      return await this.getAdminStats();
    }
  }

  async getCollegeDashboardAnalytics() {
    return this.request('/analytics/college-dashboard');
  }

  async getNotificationAnalyticsReport(startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const queryString = params.toString();
    return this.request(`/notifications/analytics/report${queryString ? `?${queryString}` : ''}`);
  }

  async getStudentTestReports(testType?: string, subject?: string) {
    const params = new URLSearchParams();
    if (testType) params.append('testType', testType);
    if (subject) params.append('subject', subject);

    const queryString = params.toString();
    return this.request(`/tests/student/reports${queryString ? `?${queryString}` : ''}`);
  }

  async getFacultyStudentReports(testType?: string, subject?: string, studentName?: string, batch?: string, branch?: string, section?: string) {
    const params = new URLSearchParams();
    if (testType) params.append('testType', testType);
    if (subject) params.append('subject', subject);
    if (studentName) params.append('studentName', studentName);
    if (batch) params.append('batch', batch);
    if (branch) params.append('branch', branch);
    if (section) params.append('section', section);

    const queryString = params.toString();
    return this.request(`/tests/faculty/student-reports${queryString ? `?${queryString}` : ''}`);
  }

  async getBranches() {
    return this.request('/college/branches');
  }

  async getBatches() {
    return this.request('/college/batches');
  }

  async getSections() {
    return this.request('/college/sections');
  }

  async getStudents(branch?: string, batch?: string, section?: string, search?: string) {
    const params = new URLSearchParams();
    if (branch) params.append('branch', branch);
    if (batch) params.append('batch', batch);
    if (section) params.append('section', section);
    if (search) params.append('search', search);

    const queryString = params.toString();
    return this.request(`/college/students${queryString ? `?${queryString}` : ''}`);
  }

  async getCollegeTestReport(testId: string) {
    return this.request(`/college/tests/${testId}/report`);
  }

  async getMasterProfile() {
    return this.request('/admin/profile');
  }

  async updateMasterProfile(data: any) {
    return this.request('/admin/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getMasterTestReport(testId: string) {
    return this.request(`/admin/tests/${testId}/report`);
  }

  async updateCollege(collegeId: string, collegeData: any) {
    return this.request(`/admin/colleges/${collegeId}`, {
      method: 'PUT',
      body: JSON.stringify(collegeData),
    });
  }

  async getFacultyAssignedTests(testType?: string, subject?: string) {
    const params = new URLSearchParams();
    if (testType) params.append('testType', testType);
    if (subject) params.append('subject', subject);

    const queryString = params.toString();
    return this.request(`/faculty/tests/assigned${queryString ? `?${queryString}` : ''}`);
  }

  async getFacultyTestReport(testId: string) {
    return this.request(`/faculty/tests/${testId}/report`);
  }

  async getFacultyTestStudents(testId: string) {
    return this.request(`/faculty/tests/${testId}/students`);
  }

  async exportFacultyTestResults(testId: string, format: 'json' | 'csv' = 'json') {
    const response = await fetch(
      `${API_BASE_URL}/faculty/tests/${testId}/export?format=${format}`,
      {
        headers: this.getHeaders(true)
      }
    );

    if (!response.ok) {
      throw new Error('Failed to export results');
    }

    if (format === 'csv') {
      const blob = await response.blob();
      return blob;
    }

    return response.json();
  }

  async getFacultyAnalyticsOverview(timeRange = '30') {
    return this.request(`/faculty/analytics/overview?timeRange=${timeRange}`);
  }

  async bulkUploadUsers(file: File, role: string) {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('excel', file);
    formData.append('role', role);

    const response = await fetch(`${API_BASE_URL}/college/users/bulk-upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Bulk upload failed');
    }
    return data;
  }

  async getStudentReports() {
    return this.request('/tests/student/reports');
  }

  async uploadQuestionImage(file: File): Promise<{ imageUrl: string }> {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`${API_BASE_URL}/tests/upload-image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Image upload failed');
    }
    return data;
  }
}

export default new ApiService();
