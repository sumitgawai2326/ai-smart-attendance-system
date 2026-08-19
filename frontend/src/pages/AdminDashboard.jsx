import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentAPI, teacherAPI, classAPI, subjectAPI } from '../services/api';
import StatCard from '../components/StatCard';
import { Users, GraduationCap, School, BookOpen, Plus, Search, CheckCircle, AlertCircle, Trash2, Edit, Camera, Loader2, User } from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('students');

  // Add Student Modal State
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [newStudent, setNewStudent] = useState({
    rollNumber: '', name: '', email: '', classId: 'CLS-AIDS-3A', division: 'A', branch: 'AI & DS', year: '3rd Year'
  });

  // Edit Student Modal State
  const [showEditStudentModal, setShowEditStudentModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);

  // Add Teacher Modal State
  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false);
  const [newTeacher, setNewTeacher] = useState({
    name: '', email: '', department: 'AI & Data Science', assignedClasses: ['CLS-AIDS-3A']
  });

  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [stRes, tcRes, clRes, sbRes] = await Promise.all([
        studentAPI.list(),
        teacherAPI.list(),
        classAPI.list(),
        subjectAPI.list()
      ]);
      setStudents(stRes.data);
      setTeachers(tcRes.data);
      setClasses(clRes.data);
      setSubjects(sbRes.data);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await studentAPI.create(newStudent);
      const createdStudent = res.data;
      setStudents((prev) => [createdStudent, ...prev]);
      setMessage({ text: `Student '${createdStudent.name}' registered successfully!`, type: 'success' });
      setShowAddStudentModal(false);
      setNewStudent({ rollNumber: '', name: '', email: '', classId: 'CLS-AIDS-3A', division: 'A', branch: 'AI & DS', year: '3rd Year' });
    } catch (err) {
      setMessage({ text: err.response?.data?.detail || 'Failed to add student. Check details.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditStudent = (student) => {
    setEditingStudent({ ...student });
    setShowEditStudentModal(true);
  };

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    if (!editingStudent) return;
    setIsSubmitting(true);
    try {
      const res = await studentAPI.update(editingStudent.id, editingStudent);
      const updated = res.data;
      setStudents((prev) => prev.map(s => s.id === updated.id ? updated : s));
      setMessage({ text: `Student '${updated.name}' updated successfully!`, type: 'success' });
      setShowEditStudentModal(false);
      setEditingStudent(null);
    } catch (err) {
      setMessage({ text: err.response?.data?.detail || 'Failed to update student.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStudent = async (studentId, studentName) => {
    if (!window.confirm(`Are you sure you want to permanently delete student '${studentName}'? This will remove all their enrollment and attendance records.`)) return;
    try {
      await studentAPI.delete(studentId);
      setStudents((prev) => prev.filter(s => s.id !== studentId));
      setMessage({ text: `Student '${studentName}' deleted permanently.`, type: 'success' });
    } catch (err) {
      setMessage({ text: err.response?.data?.detail || 'Failed to delete student.', type: 'error' });
    }
  };

  const handleCreateTeacher = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await teacherAPI.create(newTeacher);
      const createdTeacher = res.data;
      setTeachers((prev) => [createdTeacher, ...prev]);
      setMessage({ text: `Faculty Teacher '${createdTeacher.name}' registered successfully!`, type: 'success' });
      setShowAddTeacherModal(false);
      setNewTeacher({ name: '', email: '', department: 'AI & Data Science', assignedClasses: ['CLS-AIDS-3A'] });
    } catch (err) {
      setMessage({ text: err.response?.data?.detail || 'Failed to add teacher.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteFaceData = async (studentId) => {
    if (!window.confirm('Are you sure you want to delete this student\'s biometric face data?')) return;
    try {
      await studentAPI.deleteFace(studentId);
      setStudents((prev) => prev.map(s => s.id === studentId ? { ...s, hasFaceEnrolled: false, photoUrl: null } : s));
      setMessage({ text: 'Biometric face data permanently deleted.', type: 'success' });
    } catch (err) {
      setMessage({ text: 'Failed to delete face data.', type: 'error' });
    }
  };

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const q = searchQuery.toLowerCase();
    return students.filter(s =>
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.rollNumber && s.rollNumber.toLowerCase().includes(q)) ||
      (s.email && s.email.toLowerCase().includes(q))
    );
  }, [students, searchQuery]);

  const filteredTeachers = useMemo(() => {
    if (!searchQuery.trim()) return teachers;
    const q = searchQuery.toLowerCase();
    return teachers.filter(t =>
      (t.name && t.name.toLowerCase().includes(q)) ||
      (t.email && t.email.toLowerCase().includes(q)) ||
      (t.department && t.department.toLowerCase().includes(q))
    );
  }, [teachers, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Admin System Control</h2>
          <p className="text-sm text-slate-400">Manage students, faculty teachers, classes and biometric records</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddStudentModal(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-xl shadow-md shadow-blue-600/20 flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Student
          </button>
          <button
            onClick={() => setShowAddTeacherModal(true)}
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs rounded-xl shadow-md shadow-purple-600/20 flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Faculty
          </button>
        </div>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl text-xs font-medium flex items-center justify-between ${
          message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
        }`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage({ text: '', type: '' })}>✕</button>
        </div>
      )}

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Enrolled Students" value={students.length} icon={GraduationCap} color="blue" subtitle={`${students.filter(s => s.hasFaceEnrolled).length} with AI Face Enrolled`} />
        <StatCard title="Faculty Teachers" value={teachers.length} icon={Users} color="purple" subtitle="Active instructors" />
        <StatCard title="Active Classes" value={classes.length} icon={School} color="emerald" subtitle="Divisions & Branches" />
        <StatCard title="Registered Subjects" value={subjects.length} icon={BookOpen} color="amber" subtitle="Course curriculum" />
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-800 flex gap-6">
        <button
          onClick={() => { setActiveTab('students'); setSearchQuery(''); }}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'students' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Students Directory ({students.length})
        </button>
        <button
          onClick={() => { setActiveTab('teachers'); setSearchQuery(''); }}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'teachers' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Faculty Teachers ({teachers.length})
        </button>
      </div>

      {/* Students Tab View */}
      {activeTab === 'students' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search students by name, roll number, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-blue-500 placeholder:text-slate-600"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-500 text-xs">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500 mb-2" />
                <span>Loading student records...</span>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 text-slate-400 uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Roll No</th>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Branch & Year</th>
                    <th className="py-3 px-4">AI Face Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-500 text-xs">
                        No students found matching "{searchQuery}".
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-mono font-semibold text-white">{s.rollNumber}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-500/30 overflow-hidden flex items-center justify-center shrink-0">
                              {s.photoUrl ? (
                                <img src={s.photoUrl} alt={s.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="font-bold text-xs text-blue-400">{s.name?.charAt(0) || 'S'}</span>
                              )}
                            </div>
                            <span className="font-medium text-white">{s.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-400">{s.email}</td>
                        <td className="py-3 px-4">{s.branch} - {s.year}</td>
                        <td className="py-3 px-4">
                          {s.hasFaceEnrolled ? (
                            <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[11px] font-medium">
                              <CheckCircle className="w-3 h-3" /> Enrolled
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded text-[11px] font-medium">
                              <AlertCircle className="w-3 h-3" /> Pending
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Enroll / Re-enroll Face Button */}
                            <button
                              onClick={() => navigate('/admin/enrollment')}
                              className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 p-1.5 rounded-lg transition-all"
                              title="Enroll / Update Face"
                            >
                              <Camera className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit Student Info Button */}
                            <button
                              onClick={() => handleOpenEditStudent(s)}
                              className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 p-1.5 rounded-lg transition-all"
                              title="Edit Student Information"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Student Button */}
                            <button
                              onClick={() => handleDeleteStudent(s.id, s.name)}
                              className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 p-1.5 rounded-lg transition-all"
                              title="Delete Student"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Teachers Tab View */}
      {activeTab === 'teachers' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search teachers by name, email, department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-blue-500 placeholder:text-slate-600"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-500 text-xs">
                <Loader2 className="w-6 h-6 animate-spin text-purple-500 mb-2" />
                <span>Loading faculty records...</span>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 text-slate-400 uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Faculty Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Assigned Classes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {filteredTeachers.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-8 text-center text-slate-500 text-xs">
                        No teachers found matching "{searchQuery}".
                      </td>
                    </tr>
                  ) : (
                    filteredTeachers.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-medium text-white flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs">
                            {t.name.charAt(0)}
                          </div>
                          {t.name}
                        </td>
                        <td className="py-3 px-4 text-slate-400">{t.email}</td>
                        <td className="py-3 px-4 text-slate-300">{t.department}</td>
                        <td className="py-3 px-4">
                          <span className="bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-[11px] text-slate-300">
                            {t.assignedClasses?.join(', ') || 'CLS-AIDS-3A'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddStudentModal && (
        <div className="fixed inset-0 bg-slate-950/90 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Register New Student</h3>
            <form onSubmit={handleCreateStudent} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Roll Number *</label>
                  <input
                    type="text" required value={newStudent.rollNumber} onChange={(e) => setNewStudent({...newStudent, rollNumber: e.target.value})}
                    placeholder="e.g. 141" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Full Name *</label>
                  <input
                    type="text" required value={newStudent.name} onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
                    placeholder="e.g. Yashraj More" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Email Address *</label>
                <input
                  type="email" required value={newStudent.email} onChange={(e) => setNewStudent({...newStudent, email: e.target.value})}
                  placeholder="student@college.edu" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Branch</label>
                  <input
                    type="text" value={newStudent.branch} onChange={(e) => setNewStudent({...newStudent, branch: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Year</label>
                  <input
                    type="text" value={newStudent.year} onChange={(e) => setNewStudent({...newStudent, year: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setShowAddStudentModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                    </>
                  ) : (
                    'Save Student'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {showEditStudentModal && editingStudent && (
        <div className="fixed inset-0 bg-slate-950/90 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Edit Student Information</h3>
            <form onSubmit={handleUpdateStudent} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Roll Number *</label>
                  <input
                    type="text" required value={editingStudent.rollNumber} onChange={(e) => setEditingStudent({...editingStudent, rollNumber: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Full Name *</label>
                  <input
                    type="text" required value={editingStudent.name} onChange={(e) => setEditingStudent({...editingStudent, name: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Email Address *</label>
                <input
                  type="email" required value={editingStudent.email} onChange={(e) => setEditingStudent({...editingStudent, email: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Branch</label>
                  <input
                    type="text" value={editingStudent.branch || ''} onChange={(e) => setEditingStudent({...editingStudent, branch: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Year</label>
                  <input
                    type="text" value={editingStudent.year || ''} onChange={(e) => setEditingStudent({...editingStudent, year: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => { setShowEditStudentModal(false); setEditingStudent(null); }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Updating...
                    </>
                  ) : (
                    'Update Student'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Faculty Teacher Modal */}
      {showAddTeacherModal && (
        <div className="fixed inset-0 bg-slate-950/90 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Register Faculty Teacher</h3>
            <form onSubmit={handleCreateTeacher} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Full Name & Title *</label>
                <input
                  type="text" required value={newTeacher.name} onChange={(e) => setNewTeacher({...newTeacher, name: e.target.value})}
                  placeholder="e.g. Prof. Alan Turing" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Email Address *</label>
                <input
                  type="email" required value={newTeacher.email} onChange={(e) => setNewTeacher({...newTeacher, email: e.target.value})}
                  placeholder="teacher@college.edu" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Department</label>
                <input
                  type="text" required value={newTeacher.department} onChange={(e) => setNewTeacher({...newTeacher, department: e.target.value})}
                  placeholder="AI & Data Science" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-purple-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setShowAddTeacherModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                    </>
                  ) : (
                    'Save Teacher'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
