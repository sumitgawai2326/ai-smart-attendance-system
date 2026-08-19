import axios from 'axios';

export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const API = axios.create({
  baseURL: `${API_BASE}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60s timeout to gracefully accommodate cloud cold starts (Render free tier spin-up)
});

// Lightweight client-side memory cache for static reference data
const cache = {
  classes: null,
  subjects: {},
  teachers: null,
};

export const clearCache = () => {
  cache.classes = null;
  cache.subjects = {};
  cache.teachers = null;
};

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
  getProfile: (userId) => API.get(`/auth/me?user_id=${userId}`),
  wakeUp: wakeUpBackend,
};

export const studentAPI = {
  create: (data) => API.post('/students', data),
  list: (classId) => API.get('/students', { params: { class_id: classId } }),
  get: (id) => API.get(`/students/${id}`),
  enrollFace: (id, imageSamples) => API.post(`/students/${id}/enroll-face`, { studentId: id, imageSamples }),
  deleteFace: (id) => API.delete(`/students/${id}/face`),
};

export const teacherAPI = {
  create: async (data) => {
    const res = await API.post('/teachers', data);
    cache.teachers = null; // Invalidate cache on creation
    return res;
  },
  list: async () => {
    if (cache.teachers) return { data: cache.teachers };
    const res = await API.get('/teachers');
    cache.teachers = res.data;
    return res;
  },
};

export const classAPI = {
  create: async (data) => {
    const res = await API.post('/classes', data);
    cache.classes = null;
    return res;
  },
  list: async () => {
    if (cache.classes) return { data: cache.classes };
    const res = await API.get('/classes');
    cache.classes = res.data;
    return res;
  },
};

export const subjectAPI = {
  create: async (data) => {
    const res = await API.post('/subjects', data);
    cache.subjects = {};
    return res;
  },
  list: async (classId) => {
    const key = classId || 'all';
    if (cache.subjects[key]) return { data: cache.subjects[key] };
    const res = await API.get('/subjects', { params: { class_id: classId } });
    cache.subjects[key] = res.data;
    return res;
  },
};

export const attendanceAPI = {
  startSession: (classId, subjectId, teacherId) => API.post('/attendance/session', { classId, subjectId, teacherId }),
  closeSession: (sessionId) => API.post(`/attendance/session/${sessionId}/close`),
  recognizeFrame: (sessionId, frameBase64, blinkCount = 0) => API.post('/attendance/recognize', { sessionId, frame: frameBase64, consecutiveBlinkCount: blinkCount }),
  recognizeMultiFrame: (sessionId, frameBase64, blinkCount = 0) => API.post('/attendance/recognize-multi', { sessionId, frame: frameBase64, consecutiveBlinkCount: blinkCount }),
  markConfirmedStudent: (sessionId, studentId, studentName, rollNumber, confidence) => 
    API.post(`/attendance/mark-confirmed?sessionId=${encodeURIComponent(sessionId)}&studentId=${encodeURIComponent(studentId)}&studentName=${encodeURIComponent(studentName)}&rollNumber=${encodeURIComponent(rollNumber)}&confidence=${confidence}`),
  manualOverride: (sessionId, studentId, status, reason) => API.post('/attendance/manual-override', { sessionId, studentId, status, reason }),
  getSessionRecords: (sessionId) => API.get(`/attendance/session/${sessionId}/records`),
};

export const reportAPI = {
  getStudentSummary: (studentId) => API.get(`/reports/student/${studentId}/summary`),
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
