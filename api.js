// Dayflow API & Storage Client
const API_BASE = '/api';

const TokenService = {
  getToken() {
    return localStorage.getItem('dayflow_token');
  },
  setToken(token) {
    localStorage.setItem('dayflow_token', token);
  },
  removeToken() {
    localStorage.removeItem('dayflow_token');
    localStorage.removeItem('dayflow_user');
  },
  getUser() {
    try {
      return JSON.parse(localStorage.getItem('dayflow_user') || 'null');
    } catch {
      return null;
    }
  },
  setUser(user) {
    localStorage.setItem('dayflow_user', JSON.stringify(user));
  },
  isAuthenticated() {
    return !!this.getToken();
  },
};

// Toast Notification Manager
const Toast = {
  show(message, type = 'info', duration = 3500) {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Icon based on type
    let iconSvg = '';
    if (type === 'success') {
      iconSvg = '<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>';
    } else if (type === 'error') {
      iconSvg = '<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
    } else if (type === 'warning') {
      iconSvg = '<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
    } else {
      iconSvg = '<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
    }

    toast.innerHTML = `
      <div style="flex-shrink:0;">${iconSvg}</div>
      <div style="flex:1;">${message}</div>
    `;

    container.appendChild(toast);

    // Trigger enter animation
    setTimeout(() => toast.classList.add('show'), 10);

    // Auto remove
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },
  success(msg) { this.show(msg, 'success'); },
  error(msg) { this.show(msg, 'error'); },
  info(msg) { this.show(msg, 'info'); },
  warning(msg) { this.show(msg, 'warning'); },
};

// Generic HTTP API Request helper
async function request(endpoint, options = {}) {
  const token = TokenService.getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (response.status === 401) {
        // Session expired
        if (window.location.pathname.includes('app.html') || window.location.pathname === '/app') {
          TokenService.removeToken();
          window.location.href = '/login.html?expired=true';
        }
      }
      const errorMsg = data.message || `Request failed with status ${response.status}`;
      throw new Error(errorMsg);
    }

    return data;
  } catch (err) {
    console.error(`API Error [${endpoint}]:`, err.message);
    throw err;
  }
}

const api = {
  // Auth
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (userData) => request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  getMe: () => request('/auth/me'),

  // Employees
  getEmployees: (params = '') => request(`/employees${params ? `?${params}` : ''}`),
  getEmployeeById: (id) => request(`/employees/${id}`),
  updateEmployee: (id, data) => request(`/employees/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  createEmployee: (data) => request('/employees', { method: 'POST', body: JSON.stringify(data) }),
  toggleEmployeeStatus: (id, status) => request(`/employees/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  // Attendance
  checkIn: (data = {}) => request('/attendance/check-in', { method: 'POST', body: JSON.stringify(data) }),
  checkOut: (data = {}) => request('/attendance/check-out', { method: 'POST', body: JSON.stringify(data) }),
  toggleBreak: (data = {}) => request('/attendance/break-toggle', { method: 'POST', body: JSON.stringify(data) }),
  getTodayAttendance: () => request('/attendance/today'),
  getMyAttendanceHistory: (params = '') => request(`/attendance/my-history${params ? `?${params}` : ''}`),
  getMyAttendanceStats: (params = '') => request(`/attendance/stats${params ? `?${params}` : ''}`),
  getAllAttendance: (params = '') => request(`/attendance/all${params ? `?${params}` : ''}`),

  // Leaves
  applyLeave: (data) => request('/leaves', { method: 'POST', body: JSON.stringify(data) }),
  getMyLeaves: () => request('/leaves/my-leaves'),
  getAllLeaves: (params = '') => request(`/leaves/all${params ? `?${params}` : ''}`),
  reviewLeave: (id, data) => request(`/leaves/${id}/review`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Payroll
  getMyPayroll: () => request('/payroll/my-payroll'),
  getAllPayroll: (params = '') => request(`/payroll/all${params ? `?${params}` : ''}`),
  getPayslipById: (id) => request(`/payroll/slip/${id}`),
  updateSalaryStructure: (userId, data) => request(`/payroll/structure/${userId}`, { method: 'PUT', body: JSON.stringify(data) }),
  generatePayrollBatch: (data = {}) => request('/payroll/generate-batch', { method: 'POST', body: JSON.stringify(data) }),

  // Insights
  getInsights: () => request('/insights'),

  // Notifications
  getNotifications: () => request('/notifications'),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () => request('/notifications/mark-all-read', { method: 'PATCH' }),
  broadcastAnnouncement: (data) => request('/notifications/broadcast', { method: 'POST', body: JSON.stringify(data) }),

  // Reports
  getAttendanceReport: (params = '') => request(`/reports/attendance${params ? `?${params}` : ''}`),
  getLeaveReport: (params = '') => request(`/reports/leaves${params ? `?${params}` : ''}`),
  getPayrollReport: (params = '') => request(`/reports/payroll${params ? `?${params}` : ''}`),
  getEmployeeMasterReport: (params = '') => request(`/reports/employees${params ? `?${params}` : ''}`),
};
