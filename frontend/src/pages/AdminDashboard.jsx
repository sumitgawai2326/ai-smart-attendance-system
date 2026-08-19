import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentAPI, teacherAPI, classAPI, subjectAPI } from '../services/api';
import StatCard from '../components/StatCard';
import { 
  Users, 
  GraduationCap, 
  School, 
  BookOpen, 
  Plus, 
  Search, 
  CheckCircle, 
  AlertCircle, 
  Trash2, 
  Edit, 
  Camera, 
  Loader2, 
  FolderLock, 
  Eye, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Download, 
  X, 
  ClipboardList, 
  FileCheck,
  Building2,
  FileText
} from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('students'); // 'students' | 'teachers' | 'classes' | 'subjects' | 'documents' | 'defaulters'

  // Modal States
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [newStudent, setNewStudent] = useState({
    rollNumber: '', name: '', email: '', classId: 'CLS-AIDS-3A', division: 'A', branch: 'AI & DS', year: '3rd Year'
  });

  const [showEditStudentModal, setShowEditStudentModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);

  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false);
  const [newTeacher, setNewTeacher] = useState({
    name: '', email: '', department: 'AI & Data Science', employeeId: '', designation: 'Assistant Professor', cabin: 'Room 304', assignedClasses: ['CLS-AIDS-3A']
  });

  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [newClass, setNewClass] = useState({
    name: '', department: 'Artificial Intelligence & Data Science', year: '3rd Year', division: 'A'
  });

  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [newSubject, setNewSubject] = useState({
    code: '', name: '', classId: 'CLS-AIDS-3A', teacherId: 'USR-TEACHER-01'
  });

  // Document Preview Modal State
  const [previewDoc, setPreviewDoc] = useState(null);

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

  // Student CRUD Handlers
  const handleCreateStudent = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await studentAPI.create(newStudent);
      setStudents((prev) => [res.data, ...prev]);
      setMessage({ text: `✓ Student '${res.data.name}' registered successfully!`, type: 'success' });
      setShowAddStudentModal(false);
      setNewStudent({ rollNumber: '', name: '', email: '', classId: 'CLS-AIDS-3A', division: 'A', branch: 'AI & DS', year: '3rd Year' });
    } catch (err) {
      setMessage({ text: err.response?.data?.detail || 'Failed to add student.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    if (!editingStudent) return;
    setIsSubmitting(true);
    try {
      const res = await studentAPI.update(editingStudent.id, editingStudent);
      setStudents((prev) => prev.map(s => s.id === res.data.id ? res.data : s));
      setMessage({ text: `✓ Student '${res.data.name}' updated!`, type: 'success' });
      setShowEditStudentModal(false);
      setEditingStudent(null);
    } catch (err) {
      setMessage({ text: err.response?.data?.detail || 'Failed to update student.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStudent = async (studentId, studentName) => {
    if (!window.confirm(`Delete student '${studentName}' permanently?`)) return;
    try {
      await studentAPI.delete(studentId);
      setStudents((prev) => prev.filter(s => s.id !== studentId));
      setMessage({ text: `✓ Student '${studentName}' deleted.`, type: 'success' });
    } catch (err) {
      setMessage({ text: 'Failed to delete student.', type: 'error' });
    }
  };

  // Teacher CRUD Handlers
  const handleCreateTeacher = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await teacherAPI.create(newTeacher);
      setTeachers((prev) => [res.data, ...prev]);
      setMessage({ text: `✓ Faculty Teacher '${res.data.name}' registered!`, type: 'success' });
      setShowAddTeacherModal(false);
      setNewTeacher({ name: '', email: '', department: 'AI & Data Science', employeeId: '', designation: 'Assistant Professor', cabin: 'Room 304', assignedClasses: ['CLS-AIDS-3A'] });
    } catch (err) {
      setMessage({ text: err.response?.data?.detail || 'Failed to add teacher.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTeacher = async (teacherId, teacherName) => {
    if (!window.confirm(`Delete faculty '${teacherName}'?`)) return;
    try {
      await teacherAPI.delete(teacherId);
      setTeachers((prev) => prev.filter(t => t.id !== teacherId));
      setMessage({ text: `✓ Faculty '${teacherName}' removed.`, type: 'success' });
    } catch (err) {
      setMessage({ text: 'Failed to delete teacher.', type: 'error' });
    }
  };

  // Class CRUD Handlers
  const handleCreateClass = async (e) => {
    e.preventDefault();
    try {
      const res = await classAPI.create(newClass);
      setClasses(prev => [...prev, res.data]);
      setMessage({ text: `✓ Class '${res.data.name}' created!`, type: 'success' });
      setShowAddClassModal(false);
      setNewClass({ name: '', department: 'Artificial Intelligence & Data Science', year: '3rd Year', division: 'A' });
    } catch (err) {
      setMessage({ text: 'Failed to create class.', type: 'error' });
    }
  };

  const handleDeleteClass = async (classId, className) => {
    if (!window.confirm(`Delete class '${className}'?`)) return;
    try {
      await classAPI.delete(classId);
      setClasses(prev => prev.filter(c => c.id !== classId));
      setMessage({ text: `✓ Class '${className}' deleted.`, type: 'success' });
    } catch (err) {
      setMessage({ text: 'Failed to delete class.', type: 'error' });
    }
  };

  // Subject CRUD Handlers
  const handleCreateSubject = async (e) => {
    e.preventDefault();
    try {
      const res = await subjectAPI.create(newSubject);
      setSubjects(prev => [...prev, res.data]);
      setMessage({ text: `✓ Subject '${res.data.name}' added!`, type: 'success' });
      setShowAddSubjectModal(false);
      setNewSubject({ code: '', name: '', classId: 'CLS-AIDS-3A', teacherId: 'USR-TEACHER-01' });
    } catch (err) {
      setMessage({ text: 'Failed to create subject.', type: 'error' });
    }
  };

  const handleDeleteSubject = async (subjectId, subjectName) => {
    if (!window.confirm(`Delete subject '${subjectName}'?`)) return;
    try {
      await subjectAPI.delete(subjectId);
      setSubjects(prev => prev.filter(s => s.id !== subjectId));
      setMessage({ text: `✓ Subject '${subjectName}' deleted.`, type: 'success' });
    } catch (err) {
      setMessage({ text: 'Failed to delete subject.', type: 'error' });
    }
  };

  // Document Verification Handlers
  const handleVerifyDocument = async (studentId, docType, newStatus) => {
    try {
      await studentAPI.verifyDocument(studentId, docType, newStatus);
      setStudents(prev => prev.map(s => {
        if (s.id === studentId && s.documents && s.documents[docType]) {
          return {
            ...s,
            documents: {
              ...s.documents,
              [docType]: { ...s.documents[docType], status: newStatus }
            }
          };
        }
        return s;
      }));
      setMessage({ text: `✓ Document '${docType}' marked as ${newStatus}!`, type: 'success' });
    } catch (err) {
      setMessage({ text: 'Failed to update document status.', type: 'error' });
    }
  };

  // Memoized Search Filters
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

  // Aggregate all uploaded student documents across the institution
  const allUploadedDocuments = useMemo(() => {
    const list = [];
    students.forEach(s => {
      if (s.documents && Object.keys(s.documents).length > 0) {
        Object.entries(s.documents).forEach(([docType, docData]) => {
          list.push({
            studentId: s.id,
            studentName: s.name,
            studentRoll: s.rollNumber,
            studentClass: s.classId,
            docType,
            ...docData
          });
        });
      }
    });
    return list;
  }, [students]);

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Building2 className="w-7 h-7 text-blue-400" />
            Admin System Control & Academic Oversight
          </h2>
          <p className="text-sm text-slate-400">Institutional control • Manage students, faculty, classes, curriculum & document vault</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowAddStudentModal(true)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-xl shadow-md shadow-blue-600/20 flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Student
          </button>
          <button
            onClick={() => setShowAddTeacherModal(true)}
            className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs rounded-xl shadow-md shadow-purple-600/20 flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Faculty
          </button>
          <button
            onClick={() => navigate('/teacher/manual')}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all"
          >
            <ClipboardList className="w-4 h-4" /> Manual Register
          </button>
        </div>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl text-xs font-medium flex items-center justify-between shadow-lg ${
          message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
        }`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage({ text: '', type: '' })}>✕</button>
        </div>
      )}

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Enrolled Students" value={students.length} icon={GraduationCap} color="blue" subtitle={`${students.filter(s => s.hasFaceEnrolled).length} with AI Face Enrolled`} />
        <StatCard title="Faculty Instructors" value={teachers.length} icon={Users} color="purple" subtitle="Active teaching faculty" />
        <StatCard title="Active Classes" value={classes.length} icon={School} color="emerald" subtitle="Divisions & Batches" />
        <StatCard title="Registered Subjects" value={subjects.length} icon={BookOpen} color="amber" subtitle="Curriculum courses" />
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-800 flex flex-wrap gap-4 sm:gap-6">
        <button
          onClick={() => { setActiveTab('students'); setSearchQuery(''); }}
          className={`pb-3 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'students' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Students Directory ({students.length})
        </button>
        <button
          onClick={() => { setActiveTab('teachers'); setSearchQuery(''); }}
          className={`pb-3 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'teachers' ? 'border-purple-500 text-purple-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Faculty Teachers ({teachers.length})
        </button>
        <button
          onClick={() => { setActiveTab('classes'); setSearchQuery(''); }}
          className={`pb-3 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'classes' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Classes & Divisions ({classes.length})
        </button>
        <button
          onClick={() => { setActiveTab('subjects'); setSearchQuery(''); }}
          className={`pb-3 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'subjects' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Curriculum Subjects ({subjects.length})
        </button>
        <button
          onClick={() => { setActiveTab('documents'); setSearchQuery(''); }}
          className={`pb-3 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'documents' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FolderLock className="w-3.5 h-3.5" />
          Document Vault ({allUploadedDocuments.length})
        </button>
      </div>

      {/* TAB 1: Students Directory */}
      {activeTab === 'students' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search students by name, roll number, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
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
                              <span className="font-bold text-xs text-blue-400">{s.name?.charAt(0)}</span>
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
                          <button
                            onClick={() => navigate('/admin/enrollment')}
                            className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 p-1.5 rounded-lg transition-all"
                            title="Enroll Face"
                          >
                            <Camera className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingStudent({ ...s });
                              setShowEditStudentModal(true);
                            }}
                            className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 p-1.5 rounded-lg transition-all"
                            title="Edit Student"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
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
          </div>
        </div>
      )}

      {/* TAB 2: Faculty Teachers */}
      {activeTab === 'teachers' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search teachers by name, email, department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <button
              onClick={() => setShowAddTeacherModal(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs rounded-xl shadow-md shadow-purple-600/20 flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" /> Add Faculty
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Faculty Name</th>
                  <th className="py-3 px-4">Email Address</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Designation & Cabin</th>
                  <th className="py-3 px-4">Assigned Classes</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {filteredTeachers.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-medium text-white flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs">
                        {t.name.charAt(0)}
                      </div>
                      {t.name}
                    </td>
                    <td className="py-3 px-4 text-slate-400">{t.email}</td>
                    <td className="py-3 px-4 text-slate-300">{t.department}</td>
                    <td className="py-3 px-4 text-slate-400">{t.designation || 'Faculty'} • {t.cabin || 'Cabin 304'}</td>
                    <td className="py-3 px-4">
                      <span className="bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-[11px] text-slate-300">
                        {t.assignedClasses?.join(', ') || 'CLS-AIDS-3A'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeleteTeacher(t.id, t.name)}
                        className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 p-1.5 rounded-lg transition-all"
                        title="Delete Faculty"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Classes & Divisions */}
      {activeTab === 'classes' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white">Classrooms & Academic Divisions</h3>
              <p className="text-xs text-slate-400">Configure batches, divisions, and department assignments</p>
            </div>
            <button
              onClick={() => setShowAddClassModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" /> Add Class
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {classes.map((cls) => {
              const count = students.filter(s => s.classId === cls.id).length;
              return (
                <div key={cls.id} className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold">
                        {cls.id}
                      </span>
                      <button
                        onClick={() => handleDeleteClass(cls.id, cls.name)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                        title="Delete Class"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <h4 className="text-sm font-bold text-white">{cls.name}</h4>
                    <p className="text-xs text-slate-400">{cls.department}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <span>Division: {cls.division || 'A'}</span>
                    <span className="font-semibold text-white">{count} Students</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: Curriculum Subjects */}
      {activeTab === 'subjects' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white">Course Curriculum & Subjects</h3>
              <p className="text-xs text-slate-400">Manage course codes, titles, and classroom allocations</p>
            </div>
            <button
              onClick={() => setShowAddSubjectModal(true)}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs rounded-xl shadow-md shadow-amber-600/20 flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" /> Add Subject
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {subjects.map((subj) => (
              <div key={subj.id} className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold">
                      {subj.code}
                    </span>
                    <button
                      onClick={() => handleDeleteSubject(subj.id, subj.name)}
                      className="text-slate-500 hover:text-rose-400 p-1"
                      title="Delete Subject"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <h4 className="text-sm font-bold text-white">{subj.name}</h4>
                  <p className="text-xs text-slate-400">Class: {subj.classId}</p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span>Teacher ID: {subj.teacherId || 'Faculty'}</span>
                  <span className="text-emerald-400">Active</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: Document Vault & Verification Center */}
      {activeTab === 'documents' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FolderLock className="w-5 h-5 text-blue-400" />
              Student Document Verification Vault
            </h3>
            <p className="text-xs text-slate-400">Review, preview, and approve official student certificates and identity proofs</p>
          </div>

          {allUploadedDocuments.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No documents uploaded by students yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 text-slate-400 uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Document Title</th>
                    <th className="py-3 px-4">File Name & Size</th>
                    <th className="py-3 px-4">Upload Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Verification Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {allUploadedDocuments.map((doc, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-medium text-white">
                        <div>{doc.studentName}</div>
                        <span className="text-[10px] text-slate-500 font-mono">Roll: {doc.studentRoll}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-200 font-semibold">{doc.title}</td>
                      <td className="py-3 px-4 font-mono text-slate-400">
                        {doc.fileName} <span className="text-[10px] text-slate-500">({doc.fileSize})</span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">{new Date(doc.uploadedAt).toLocaleDateString()}</td>
                      <td className="py-3 px-4">
                        {doc.status === 'Verified' ? (
                          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3 h-3" /> Verified
                          </span>
                        ) : (
                          <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 w-fit">
                            <AlertCircle className="w-3 h-3" /> Pending Review
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setPreviewDoc(doc)}
                            className="px-2.5 py-1 bg-blue-600/10 hover:bg-blue-600/20 text-blue-300 border border-blue-500/30 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
                          >
                            <Eye className="w-3 h-3" /> View
                          </button>
                          <button
                            onClick={() => handleVerifyDocument(doc.studentId, doc.docType, 'Verified')}
                            className="px-2.5 py-1 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
                          >
                            <CheckCircle2 className="w-3 h-3" /> Approve
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl"
                >
                  Save Student
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
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditStudentModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-xl"
                >
                  Update Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Faculty Modal */}
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
                  onClick={() => setShowAddTeacherModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl"
                >
                  Save Teacher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Class Modal */}
      {showAddClassModal && (
        <div className="fixed inset-0 bg-slate-950/90 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Add Class / Division</h3>
            <form onSubmit={handleCreateClass} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Class Title *</label>
                <input
                  type="text" required value={newClass.name} onChange={(e) => setNewClass({...newClass, name: e.target.value})}
                  placeholder="e.g. B.Tech AI & DS (Div B)" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Department</label>
                <input
                  type="text" value={newClass.department} onChange={(e) => setNewClass({...newClass, department: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Year</label>
                  <input
                    type="text" value={newClass.year} onChange={(e) => setNewClass({...newClass, year: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Division</label>
                  <input
                    type="text" value={newClass.division} onChange={(e) => setNewClass({...newClass, division: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddClassModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl"
                >
                  Save Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Subject Modal */}
      {showAddSubjectModal && (
        <div className="fixed inset-0 bg-slate-950/90 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Add Curriculum Subject</h3>
            <form onSubmit={handleCreateSubject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Subject Code *</label>
                <input
                  type="text" required value={newSubject.code} onChange={(e) => setNewSubject({...newSubject, code: e.target.value})}
                  placeholder="e.g. CS305" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Subject Name *</label>
                <input
                  type="text" required value={newSubject.name} onChange={(e) => setNewSubject({...newSubject, name: e.target.value})}
                  placeholder="e.g. Natural Language Processing" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Target Class</label>
                <select
                  value={newSubject.classId} onChange={(e) => setNewSubject({...newSubject, classId: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500"
                >
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddSubjectModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-xl"
                >
                  Save Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full-Screen Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 bg-slate-950/90 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-2xl shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <FileCheck className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="text-base font-bold text-white">{previewDoc.title}</h3>
                  <p className="text-[11px] text-slate-400">Student: {previewDoc.studentName} (Roll: {previewDoc.studentRoll})</p>
                </div>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto bg-slate-950 rounded-2xl border border-slate-800 p-4 flex items-center justify-center min-h-[300px]">
              {previewDoc.fileType?.includes('image') || previewDoc.fileBase64?.startsWith('data:image') ? (
                <img src={previewDoc.fileBase64} alt={previewDoc.title} className="max-w-full max-h-[60vh] object-contain rounded-lg" />
              ) : (
                <iframe
                  src={previewDoc.fileBase64}
                  title="Document Preview"
                  className="w-full h-[60vh] rounded-lg border-0"
                />
              )}
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-xs text-slate-400 font-mono truncate max-w-xs">{previewDoc.fileName}</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleVerifyDocument(previewDoc.studentId, previewDoc.docType, 'Verified');
                    setPreviewDoc(null);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Approve & Verify
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
