import axios from 'axios';

// Default to live Render backend in production, or localhost:8000 in dev
export const API_BASE = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? 'https://ai-attendance-backend-3v8s.onrender.com' : 'http://localhost:8000');

const API = axios.create({
  baseURL: `${API_BASE}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60s timeout to gracefully accommodate cloud cold starts
});

// Automatic pre-warming ping for cloud instances
export const wakeUpBackend = async () => {
  try {
    const res = await axios.get(`${API_BASE}/health`, { timeout: 45000 });
    return res.data;
  } catch (e) {
    console.warn('[PRE-WARM] Backend wake-up ping in progress...', e.message);
    return null;
  }
};

export const authAPI = {
  login: (email, password) => API.post('/auth/login', { email, password }),
  forgotPassword: (email) => API.post('/auth/forgot-password', { email }),
  resetPassword: (email, otp, newPassword) => API.post('/auth/reset-password', { email, otp, newPassword }),
  getProfile: (userId) => API.get(`/auth/me?user_id=${userId}`),
  wakeUp: wakeUpBackend,
};

export const dashboardAPI = {
  getAdminMetrics: () => API.get('/dashboard/admin'),
  getTeacherMetrics: (teacherId) => API.get(`/dashboard/teacher/${teacherId}`),
};

export const academicAPI = {
  // Academic Years
  listYears: () => API.get('/academic/years'),
  createYear: (data) => API.post('/academic/years', data),
  updateYear: (id, data) => API.put(`/academic/years/${id}`, data),
  deleteYear: (id) => API.delete(`/academic/years/${id}`),

  // Departments
  listDepartments: () => API.get('/academic/departments'),
  createDepartment: (data) => API.post('/academic/departments', data),
  updateDepartment: (id, data) => API.put(`/academic/departments/${id}`, data),
  deleteDepartment: (id) => API.delete(`/academic/departments/${id}`),

  // Programs / Branches
  listPrograms: (params) => API.get('/academic/programs', { params }),
  createProgram: (data) => API.post('/academic/programs', data),
  updateProgram: (id, data) => API.put(`/academic/programs/${id}`, data),
  deleteProgram: (id) => API.delete(`/academic/programs/${id}`),

  // Year Levels
  listYearLevels: (params) => API.get('/academic/year-levels', { params }),
  createYearLevel: (data) => API.post('/academic/year-levels', data),
  updateYearLevel: (id, data) => API.put(`/academic/year-levels/${id}`, data),
  deleteYearLevel: (id) => API.delete(`/academic/year-levels/${id}`),

  // Semesters
  listSemesters: (params) => API.get('/academic/semesters', { params }),
  createSemester: (data) => API.post('/academic/semesters', data),
  updateSemester: (id, data) => API.put(`/academic/semesters/${id}`, data),
  deleteSemester: (id) => API.delete(`/academic/semesters/${id}`),
};

export const studentAPI = {
  create: (data) => API.post('/students', data),
  list: (params) => API.get('/students', { params: typeof params === 'string' ? { class_id: params } : params }),
  get: (id) => API.get(`/students/${id}`),
  update: (id, data) => API.put(`/students/${id}`, data),
  transfer: (id, data) => API.put(`/students/${id}/transfer`, data),
  updateProfile: (id, data) => API.put(`/students/${id}/profile`, data),
  uploadDocument: (id, data) => API.post(`/students/${id}/upload-document`, data),
  deleteDocument: (id, docType) => API.delete(`/students/${id}/documents/${docType}`),
  delete: (id) => API.delete(`/students/${id}`),
  enrollFace: (id, imageSamples) => API.post(`/students/${id}/enroll-face`, { studentId: id, imageSamples }),
  verifyDocument: (id, docType, status, remarks = '') => API.put(`/students/${id}/documents/${docType}/status`, { status, remarks }),
  deleteFace: (id) => API.delete(`/students/${id}/face`),
};

export const teacherAPI = {
  create: (data) => API.post('/teachers', data),
  list: () => API.get('/teachers'),
  get: (id) => API.get(`/teachers/${id}`),
  getClasses: (teacherId) => API.get(`/teachers/${teacherId}/classes`),
  getSubjects: (teacherId) => API.get(`/teachers/${teacherId}/subjects`),
  updateProfile: (id, data) => API.put(`/teachers/${id}/profile`, data),
  delete: (id) => API.delete(`/teachers/${id}`),
};

export const classAPI = {
  create: (data) => API.post('/classes', data),
  list: (params) => API.get('/classes', { params }),
  getStudents: (classId) => API.get(`/classes/${classId}/students`),
  update: (id, data) => API.put(`/classes/${id}`, data),
  delete: (id) => API.delete(`/classes/${id}`),
};

export const subjectAPI = {
  create: (data) => API.post('/subjects', data),
  list: (params) => API.get('/subjects', { params: typeof params === 'string' ? { class_id: params } : params }),
  update: (id, data) => API.put(`/subjects/${id}`, data),
  delete: (id) => API.delete(`/subjects/${id}`),
};

export const attendanceAPI = {
  startSession: (classId, subjectId, teacherId, academicContext = {}) => 
    API.post('/attendance/session', { classId, subjectId, teacherId, ...academicContext }),
  closeSession: (sessionId) => API.post(`/attendance/session/${sessionId}/close`),
  recognizeFrame: (sessionId, frameBase64, blinkCount = 0) => API.post('/attendance/recognize', { sessionId, frame: frameBase64, consecutiveBlinkCount: blinkCount }),
  recognizeMultiFrame: (sessionId, frameBase64, blinkCount = 0) => API.post('/attendance/recognize-multi', { sessionId, frame: frameBase64, consecutiveBlinkCount: blinkCount }),
  markConfirmedStudent: (sessionId, studentId, studentName, rollNumber, confidence) => 
    API.post(`/attendance/mark-confirmed?sessionId=${encodeURIComponent(sessionId)}&studentId=${encodeURIComponent(studentId)}&studentName=${encodeURIComponent(studentName)}&rollNumber=${encodeURIComponent(rollNumber)}&confidence=${confidence}`),
  manualOverride: (sessionId, studentId, status, reason) => API.post('/attendance/manual-override', { sessionId, studentId, status, reason }),
  submitManualSession: (data) => API.post('/attendance/manual-session-submit', data),
  updateRecord: (recordId, data) => API.put(`/attendance/records/${recordId}`, data),
  getSessionRecords: (sessionId) => API.get(`/attendance/session/${sessionId}/records`),
};

export const reportAPI = {
  getStudentSummary: (studentId) => API.get(`/reports/student/${studentId}/summary`),
  getDefaulters: (classId, threshold = 75.0) => API.get('/reports/defaulters', { params: { class_id: classId, threshold } }),
  getExportCSVUrl: (classId, subjectId) => {
    let url = `${API_BASE}/api/v1/reports/export/csv`;
    const params = [];
    if (classId) params.push(`class_id=${encodeURIComponent(classId)}`);
    if (subjectId) params.push(`subject_id=${encodeURIComponent(subjectId)}`);
    if (params.length) url += `?${params.join('&')}`;
    return url;
  }
};

export default API;
