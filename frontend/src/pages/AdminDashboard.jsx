import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  studentAPI, 
  teacherAPI, 
  classAPI, 
  subjectAPI, 
  academicAPI, 
  dashboardAPI 
} from '../services/api';
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
  X, 
  ClipboardList, 
  FileCheck,
  Building2,
  Filter,
  ArrowRightLeft,
  Calendar,
  Layers,
  Sparkles,
  Settings2,
  RefreshCw,
  Award
} from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();

  // Metrics & Core State
  const [metrics, setMetrics] = useState({
    totalStudents: 0,
    totalEnrolledFaces: 0,
    totalTeachers: 0,
    totalClasses: 0,
    totalSubjects: 0,
    overallAttendancePercentage: 0.0
  });

  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [yearLevels, setYearLevels] = useState([]);
  const [semesters, setSemesters] = useState([]);

  // Academic Configuration Cascading Context
  const [academicYear, setAcademicYear] = useState('ALL');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedProg, setSelectedProg] = useState('ALL');
  const [selectedYear, setSelectedYear] = useState('ALL');
  const [selectedSemester, setSelectedSemester] = useState('ALL');
  const [selectedClassId, setSelectedClassId] = useState('ALL');

  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('students'); // 'students' | 'teachers' | 'classes' | 'subjects' | 'documents' | 'academic'
  const [academicSubTab, setAcademicSubTab] = useState('years'); // 'years' | 'depts' | 'progs' | 'yearlevels' | 'semesters'
  const [message, setMessage] = useState({ text: '', type: '' });

  // Creation & Edit Modals State
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [newStudent, setNewStudent] = useState({
    rollNumber: '',
    name: '',
    email: '',
    classId: '',
    academicYear: '',
    department: '',
    program: '',
    year: '',
    semester: '',
    division: ''
  });

  const [showEditStudentModal, setShowEditStudentModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);

  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferringStudent, setTransferringStudent] = useState(null);
  const [targetClassId, setTargetClassId] = useState('');

  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false);
  const [newTeacher, setNewTeacher] = useState({
    name: '', email: '', department: '', employeeId: '', designation: 'Assistant Professor', cabin: 'Room 304', assignedClasses: []
  });

  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [newClass, setNewClass] = useState({
    name: '', department: '', program: '', academicYear: '', year: '', semester: '', division: ''
  });

  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [newSubject, setNewSubject] = useState({
    code: '', name: '', classId: '', credits: 4, department: '', program: '', year: '', semester: '', division: '', teacherId: ''
  });

  // Dedicated Academic Entity Modals
  const [showAddYearModal, setShowAddYearModal] = useState(false);
  const [newYearData, setNewYearData] = useState({ year: '', startDate: '', endDate: '', isCurrent: true });

  const [showAddDeptModal, setShowAddDeptModal] = useState(false);
  const [newDeptData, setNewDeptData] = useState({ code: '', name: '', shortName: '' });

  const [showAddProgModal, setShowAddProgModal] = useState(false);
  const [newProgData, setNewProgData] = useState({ code: '', name: '', shortName: '', degree: 'B.Tech', department: '', durationYears: 4 });

  const [showAddYearLevelModal, setShowAddYearLevelModal] = useState(false);
  const [newYearLevelData, setNewYearLevelData] = useState({ yearName: '', yearNumber: 1, programId: 'ALL' });

  const [showAddSemesterModal, setShowAddSemesterModal] = useState(false);
  const [newSemesterData, setNewSemesterData] = useState({ semesterName: '', semesterNumber: 1, yearId: '', programId: 'ALL' });

  // Document Preview Modal State
  const [previewDoc, setPreviewDoc] = useState(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [mRes, stRes, tcRes, clRes, sbRes, ayRes, dpRes, prRes, ylRes, smRes] = await Promise.all([
        dashboardAPI.getAdminMetrics(),
        studentAPI.list(),
        teacherAPI.list(),
        classAPI.list(),
        subjectAPI.list(),
        academicAPI.listYears(),
        academicAPI.listDepartments(),
        academicAPI.listPrograms(),
        academicAPI.listYearLevels(),
        academicAPI.listSemesters()
      ]);
      setMetrics(mRes.data);
      setStudents(stRes.data);
      setTeachers(tcRes.data);
      setClasses(clRes.data);
      setSubjects(sbRes.data);
      setAcademicYears(ayRes.data);
      setDepartments(dpRes.data);
      setPrograms(prRes.data);
      setYearLevels(ylRes.data);
      setSemesters(smRes.data);

      if (ayRes.data.length > 0 && academicYear === 'ALL') {
        const currentAy = ayRes.data.find(y => y.isCurrent) || ayRes.data[0];
        setAcademicYear(currentAy.year);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
      setMessage({ text: 'Unable to load real-time admin data from cloud backend.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // CASCADING DERIVED LISTS
  // ==========================================
  const availablePrograms = useMemo(() => {
    if (selectedDept === 'ALL') return programs;
    return programs.filter(p => p.department === selectedDept);
  }, [programs, selectedDept]);

  const availableYearLevels = useMemo(() => {
    if (selectedProg === 'ALL') return yearLevels;
    return yearLevels.filter(y => y.programId === 'ALL' || y.programId === selectedProg || !y.programId);
  }, [yearLevels, selectedProg]);

  const availableSemesters = useMemo(() => {
    if (selectedYear === 'ALL') return semesters;
    return semesters.filter(s => s.yearId === 'ALL' || s.yearId === selectedYear || !s.yearId);
  }, [semesters, selectedYear]);

  const availableClasses = useMemo(() => {
    return classes.filter(c => {
      if (academicYear !== 'ALL' && c.academicYear && c.academicYear !== academicYear) return false;
      if (selectedDept !== 'ALL' && c.department && c.department !== selectedDept) return false;
      if (selectedProg !== 'ALL' && c.program && c.program !== selectedProg) return false;
      if (selectedYear !== 'ALL' && c.year && c.year !== selectedYear) return false;
      if (selectedSemester !== 'ALL' && c.semester && c.semester !== selectedSemester) return false;
      return true;
    });
  }, [classes, academicYear, selectedDept, selectedProg, selectedYear, selectedSemester]);

  // Filtered Students based on cascading context
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      if (academicYear !== 'ALL' && s.academicYear && s.academicYear !== academicYear) return false;
      if (selectedDept !== 'ALL' && s.department && s.department !== selectedDept) return false;
      if (selectedProg !== 'ALL' && s.program && s.program !== selectedProg) return false;
      if (selectedYear !== 'ALL' && s.year && s.year !== selectedYear) return false;
      if (selectedSemester !== 'ALL' && s.semester && s.semester !== selectedSemester) return false;
      if (selectedClassId !== 'ALL' && s.classId !== selectedClassId) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          (s.name && s.name.toLowerCase().includes(q)) ||
          (s.rollNumber && s.rollNumber.toLowerCase().includes(q)) ||
          (s.email && s.email.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [students, academicYear, selectedDept, selectedProg, selectedYear, selectedSemester, selectedClassId, searchQuery]);

  // ==========================================
  // ACADEMIC ENTITY CRUD HANDLERS
  // ==========================================
  const handleCreateYear = async (e) => {
    e.preventDefault();
    try {
      const res = await academicAPI.createYear(newYearData);
      setAcademicYears(prev => [res.data, ...prev]);
      setAcademicYear(res.data.year);
      setMessage({ text: `✓ Academic Year '${res.data.year}' created successfully!`, type: 'success' });
      setShowAddYearModal(false);
      setNewYearData({ year: '', startDate: '', endDate: '', isCurrent: true });
    } catch (err) {
      setMessage({ text: err.response?.data?.detail || 'Failed to create Academic Year.', type: 'error' });
    }
  };

  const handleDeleteYear = async (id, yearName) => {
    if (!window.confirm(`Delete Academic Year '${yearName}'?`)) return;
    try {
      await academicAPI.deleteYear(id);
      setAcademicYears(prev => prev.filter(y => y.id !== id));
      setMessage({ text: `✓ Academic Year '${yearName}' deleted.`, type: 'success' });
    } catch (err) {
      setMessage({ text: 'Failed to delete Academic Year.', type: 'error' });
    }
  };

  const handleCreateDept = async (e) => {
    e.preventDefault();
    try {
      const res = await academicAPI.createDepartment(newDeptData);
      setDepartments(prev => [...prev, res.data]);
      setSelectedDept(res.data.name);
      setMessage({ text: `✓ Department '${res.data.name}' created successfully!`, type: 'success' });
      setShowAddDeptModal(false);
      setNewDeptData({ code: '', name: '', shortName: '' });
    } catch (err) {
      setMessage({ text: err.response?.data?.detail || 'Failed to create Department.', type: 'error' });
    }
  };

  const handleDeleteDept = async (id, name) => {
    if (!window.confirm(`Delete Department '${name}'?`)) return;
    try {
      await academicAPI.deleteDepartment(id);
      setDepartments(prev => prev.filter(d => d.id !== id));
      setMessage({ text: `✓ Department '${name}' deleted.`, type: 'success' });
    } catch (err) {
      setMessage({ text: 'Failed to delete Department.', type: 'error' });
    }
  };

  const handleCreateProg = async (e) => {
    e.preventDefault();
    try {
      const res = await academicAPI.createProgram(newProgData);
      setPrograms(prev => [...prev, res.data]);
      setSelectedProg(res.data.name);
      setMessage({ text: `✓ Program '${res.data.name}' created!`, type: 'success' });
      setShowAddProgModal(false);
      setNewProgData({ code: '', name: '', shortName: '', degree: 'B.Tech', department: departments[0]?.name || '', durationYears: 4 });
    } catch (err) {
      setMessage({ text: err.response?.data?.detail || 'Failed to create Program.', type: 'error' });
    }
  };

  const handleDeleteProg = async (id, name) => {
    if (!window.confirm(`Delete Program '${name}'?`)) return;
    try {
      await academicAPI.deleteProgram(id);
      setPrograms(prev => prev.filter(p => p.id !== id));
      setMessage({ text: `✓ Program '${name}' deleted.`, type: 'success' });
    } catch (err) {
      setMessage({ text: 'Failed to delete Program.', type: 'error' });
    }
  };

  const handleCreateYearLevel = async (e) => {
    e.preventDefault();
    try {
      const res = await academicAPI.createYearLevel(newYearLevelData);
      setYearLevels(prev => [...prev, res.data]);
      setSelectedYear(res.data.yearName);
      setMessage({ text: `✓ Academic Year Level '${res.data.yearName}' created!`, type: 'success' });
      setShowAddYearLevelModal(false);
      setNewYearLevelData({ yearName: '', yearNumber: 1, programId: 'ALL' });
    } catch (err) {
      setMessage({ text: 'Failed to create Year Level.', type: 'error' });
    }
  };

  const handleDeleteYearLevel = async (id, name) => {
    if (!window.confirm(`Delete Year Level '${name}'?`)) return;
    try {
      await academicAPI.deleteYearLevel(id);
      setYearLevels(prev => prev.filter(y => y.id !== id));
      setMessage({ text: `✓ Year Level '${name}' deleted.`, type: 'success' });
    } catch (err) {
      setMessage({ text: 'Failed to delete Year Level.', type: 'error' });
    }
  };

  const handleCreateSemester = async (e) => {
    e.preventDefault();
    try {
      const res = await academicAPI.createSemester(newSemesterData);
      setSemesters(prev => [...prev, res.data]);
      setSelectedSemester(res.data.semesterName);
      setMessage({ text: `✓ Semester '${res.data.semesterName}' created!`, type: 'success' });
      setShowAddSemesterModal(false);
      setNewSemesterData({ semesterName: '', semesterNumber: 1, yearId: yearLevels[0]?.yearName || '1st Year', programId: 'ALL' });
    } catch (err) {
      setMessage({ text: 'Failed to create Semester.', type: 'error' });
    }
  };

  const handleDeleteSemester = async (id, name) => {
    if (!window.confirm(`Delete Semester '${name}'?`)) return;
    try {
      await academicAPI.deleteSemester(id);
      setSemesters(prev => prev.filter(s => s.id !== id));
      setMessage({ text: `✓ Semester '${name}' deleted.`, type: 'success' });
    } catch (err) {
      setMessage({ text: 'Failed to delete Semester.', type: 'error' });
    }
  };

  // Student CRUD
  const handleCreateStudent = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await studentAPI.create(newStudent);
      setStudents((prev) => [res.data, ...prev]);
      setMetrics(prev => ({ ...prev, totalStudents: prev.totalStudents + 1 }));
      setMessage({ text: `✓ Student '${res.data.name}' registered into ${res.data.classId}!`, type: 'success' });
      setShowAddStudentModal(false);
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

  const handleTransferStudent = async (e) => {
    e.preventDefault();
    if (!transferringStudent || !targetClassId) return;
    try {
      const targetCls = classes.find(c => c.id === targetClassId);
      const res = await studentAPI.transfer(transferringStudent.id, {
        newClassId: targetClassId,
        newDivision: targetCls?.division || 'AI-2',
        newSemester: targetCls?.semester || 'Semester III',
        newYear: targetCls?.year || '2nd Year'
      });
      setStudents(prev => prev.map(s => s.id === res.data.id ? res.data : s));
      setMessage({ text: `✓ Transferred '${res.data.name}' to ${targetClassId}!`, type: 'success' });
      setShowTransferModal(false);
      setTransferringStudent(null);
    } catch (err) {
      setMessage({ text: 'Failed to transfer student.', type: 'error' });
    }
  };

  const handleDeleteStudent = async (studentId, studentName) => {
    if (!window.confirm(`Delete student '${studentName}' permanently from the cloud database?`)) return;
    try {
      await studentAPI.delete(studentId);
      setStudents((prev) => prev.filter(s => s.id !== studentId));
      setMetrics(prev => ({ ...prev, totalStudents: Math.max(0, prev.totalStudents - 1) }));
      setMessage({ text: `✓ Student '${studentName}' permanently deleted.`, type: 'success' });
    } catch (err) {
      console.error('Delete error:', err);
      setMessage({ text: err.response?.data?.detail || 'Failed to delete student.', type: 'error' });
    }
  };

  // Teacher CRUD
  const handleCreateTeacher = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await teacherAPI.create(newTeacher);
      setTeachers((prev) => [res.data, ...prev]);
      setMetrics(prev => ({ ...prev, totalTeachers: prev.totalTeachers + 1 }));
      setMessage({ text: `✓ Faculty Teacher '${res.data.name}' registered!`, type: 'success' });
      setShowAddTeacherModal(false);
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
      setMetrics(prev => ({ ...prev, totalTeachers: Math.max(0, prev.totalTeachers - 1) }));
      setMessage({ text: `✓ Faculty '${teacherName}' removed.`, type: 'success' });
    } catch (err) {
      setMessage({ text: 'Failed to delete teacher.', type: 'error' });
    }
  };

  // Class CRUD
  const handleCreateClass = async (e) => {
    e.preventDefault();
    try {
      const res = await classAPI.create(newClass);
      setClasses(prev => [...prev, res.data]);
      setMetrics(prev => ({ ...prev, totalClasses: prev.totalClasses + 1 }));
      setMessage({ text: `✓ Class '${res.data.name}' created!`, type: 'success' });
      setShowAddClassModal(false);
    } catch (err) {
      setMessage({ text: 'Failed to create class.', type: 'error' });
    }
  };

  const handleDeleteClass = async (classId, className) => {
    if (!window.confirm(`Delete class '${className}'?`)) return;
    try {
      await classAPI.delete(classId);
      setClasses(prev => prev.filter(c => c.id !== classId));
      setMetrics(prev => ({ ...prev, totalClasses: Math.max(0, prev.totalClasses - 1) }));
      setMessage({ text: `✓ Class '${className}' deleted.`, type: 'success' });
    } catch (err) {
      setMessage({ text: 'Failed to delete class.', type: 'error' });
    }
  };

  // Subject CRUD
  const handleCreateSubject = async (e) => {
    e.preventDefault();
    try {
      const res = await subjectAPI.create(newSubject);
      setSubjects(prev => [...prev, res.data]);
      setMetrics(prev => ({ ...prev, totalSubjects: prev.totalSubjects + 1 }));
      setMessage({ text: `✓ Subject '${res.data.name}' added!`, type: 'success' });
      setShowAddSubjectModal(false);
    } catch (err) {
      setMessage({ text: 'Failed to create subject.', type: 'error' });
    }
  };

  const handleDeleteSubject = async (subjectId, subjectName) => {
    if (!window.confirm(`Delete subject '${subjectName}'?`)) return;
    try {
      await subjectAPI.delete(subjectId);
      setSubjects(prev => prev.filter(s => s.id !== subjectId));
      setMetrics(prev => ({ ...prev, totalSubjects: Math.max(0, prev.totalSubjects - 1) }));
      setMessage({ text: `✓ Subject '${subjectName}' deleted.`, type: 'success' });
    } catch (err) {
      setMessage({ text: 'Failed to delete subject.', type: 'error' });
    }
  };

  // Document Verification
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
            Institutional Administration & Academic Hierarchy Control
          </h2>
          <p className="text-sm text-slate-400">Single Source of Truth • Fully customizable academic structure & real-time database</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setNewStudent({
                rollNumber: '', name: '', email: '',
                classId: availableClasses[0]?.id || classes[0]?.id || '',
                academicYear: academicYear !== 'ALL' ? academicYear : (academicYears[0]?.year || '2026-27'),
                department: selectedDept !== 'ALL' ? selectedDept : (departments[0]?.name || ''),
                program: selectedProg !== 'ALL' ? selectedProg : (programs[0]?.name || ''),
                year: selectedYear !== 'ALL' ? selectedYear : (yearLevels[0]?.yearName || '1st Year'),
                semester: selectedSemester !== 'ALL' ? selectedSemester : (semesters[0]?.semesterName || 'Semester I'),
                division: availableClasses[0]?.division || 'A'
              });
              setShowAddStudentModal(true);
            }}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-xl shadow-md shadow-blue-600/20 flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" /> Enroll Student
          </button>
          <button
            onClick={() => {
              setNewTeacher({ name: '', email: '', department: departments[0]?.name || '', employeeId: '', designation: 'Assistant Professor', cabin: 'Room 304', assignedClasses: [] });
              setShowAddTeacherModal(true);
            }}
            className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs rounded-xl shadow-md shadow-purple-600/20 flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Faculty
          </button>
          <button
            onClick={() => fetchAllData()}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
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

      {/* Real Database KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Enrolled Students" value={metrics.totalStudents} icon={GraduationCap} color="blue" subtitle={`${metrics.totalEnrolledFaces} with AI biometric template`} />
        <StatCard title="Faculty Instructors" value={metrics.totalTeachers} icon={Users} color="purple" subtitle="Active teaching faculty" />
        <StatCard title="Active Classes" value={metrics.totalClasses} icon={School} color="emerald" subtitle="Configured academic divisions" />
        <StatCard title="Curriculum Subjects" value={metrics.totalSubjects} icon={BookOpen} color="amber" subtitle="Registered course subjects" />
      </div>

      {/* Academic Configuration Cascading Context Bar with Inline Add Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
            <Filter className="w-4 h-4 text-blue-400" />
            <span>Academic Hierarchy Cascading Context</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Current Filter: <strong className="text-white">{academicYear}</strong> • <strong className="text-blue-400">{selectedDept}</strong> • <strong className="text-purple-400">{selectedProg}</strong> • <strong className="text-emerald-400">{selectedClassId}</strong>
          </div>
        </div>

        {/* 6 Dropdowns with Inline "+ Add" Control Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {/* 1. Academic Year */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-slate-400">Academic Year</label>
              <button onClick={() => setShowAddYearModal(true)} className="text-[10px] text-blue-400 hover:text-blue-300 font-bold flex items-center gap-0.5">
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>
            <select
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:border-blue-500"
            >
              <option value="ALL">All Academic Years</option>
              {academicYears.map(ay => <option key={ay.id} value={ay.year}>{ay.year}</option>)}
            </select>
          </div>

          {/* 2. Department */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-slate-400">Department</label>
              <button onClick={() => setShowAddDeptModal(true)} className="text-[10px] text-purple-400 hover:text-purple-300 font-bold flex items-center gap-0.5">
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>
            <select
              value={selectedDept}
              onChange={(e) => {
                setSelectedDept(e.target.value);
                setSelectedProg('ALL');
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:border-purple-500"
            >
              <option value="ALL">All Departments</option>
              {departments.map(d => <option key={d.id} value={d.name}>{d.name} ({d.code})</option>)}
            </select>
          </div>

          {/* 3. Program / Branch */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-slate-400">Branch / Program</label>
              <button
                onClick={() => {
                  setNewProgData({ code: '', name: '', shortName: '', degree: 'B.Tech', department: selectedDept !== 'ALL' ? selectedDept : (departments[0]?.name || ''), durationYears: 4 });
                  setShowAddProgModal(true);
                }}
                className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-0.5"
              >
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>
            <select
              value={selectedProg}
              onChange={(e) => {
                setSelectedProg(e.target.value);
                setSelectedYear('ALL');
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:border-emerald-500"
            >
              <option value="ALL">All Programs</option>
              {availablePrograms.map(p => <option key={p.id} value={p.name}>{p.name} ({p.code})</option>)}
            </select>
          </div>

          {/* 4. Year Level */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-slate-400">Year Level</label>
              <button
                onClick={() => {
                  setNewYearLevelData({ yearName: '', yearNumber: 1, programId: selectedProg !== 'ALL' ? selectedProg : 'ALL' });
                  setShowAddYearLevelModal(true);
                }}
                className="text-[10px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-0.5"
              >
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setSelectedSemester('ALL');
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:border-amber-500"
            >
              <option value="ALL">All Year Levels</option>
              {availableYearLevels.map(y => <option key={y.id} value={y.yearName}>{y.yearName}</option>)}
            </select>
          </div>

          {/* 5. Semester */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-slate-400">Semester</label>
              <button
                onClick={() => {
                  setNewSemesterData({ semesterName: '', semesterNumber: 1, yearId: selectedYear !== 'ALL' ? selectedYear : '1st Year', programId: 'ALL' });
                  setShowAddSemesterModal(true);
                }}
                className="text-[10px] text-rose-400 hover:text-rose-300 font-bold flex items-center gap-0.5"
              >
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:border-rose-500"
            >
              <option value="ALL">All Semesters</option>
              {availableSemesters.map(s => <option key={s.id} value={s.semesterName}>{s.semesterName}</option>)}
            </select>
          </div>

          {/* 6. Division / Class */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-slate-400">Division / Class</label>
              <button
                onClick={() => {
                  setNewClass({
                    name: '',
                    department: selectedDept !== 'ALL' ? selectedDept : (departments[0]?.name || ''),
                    program: selectedProg !== 'ALL' ? selectedProg : (programs[0]?.name || ''),
                    academicYear: academicYear !== 'ALL' ? academicYear : (academicYears[0]?.year || '2026-27'),
                    year: selectedYear !== 'ALL' ? selectedYear : (yearLevels[0]?.yearName || '1st Year'),
                    semester: selectedSemester !== 'ALL' ? selectedSemester : (semesters[0]?.semesterName || 'Semester I'),
                    division: ''
                  });
                  setShowAddClassModal(true);
                }}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-0.5"
              >
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:border-indigo-500"
            >
              <option value="ALL">All Divisions</option>
              {availableClasses.map(c => <option key={c.id} value={c.id}>{c.name} ({c.division})</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="border-b border-slate-800 flex flex-wrap gap-4 sm:gap-6">
        <button
          onClick={() => { setActiveTab('students'); setSearchQuery(''); }}
          className={`pb-3 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'students' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Students Directory ({filteredStudents.length})
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
          onClick={() => { setActiveTab('academic'); setSearchQuery(''); }}
          className={`pb-3 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'academic' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Settings2 className="w-3.5 h-3.5" />
          Academic Structure Control
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
            <button
              onClick={() => {
                setNewStudent({
                  rollNumber: '', name: '', email: '',
                  classId: availableClasses[0]?.id || classes[0]?.id || '',
                  academicYear: academicYear !== 'ALL' ? academicYear : (academicYears[0]?.year || '2026-27'),
                  department: selectedDept !== 'ALL' ? selectedDept : (departments[0]?.name || ''),
                  program: selectedProg !== 'ALL' ? selectedProg : (programs[0]?.name || ''),
                  year: selectedYear !== 'ALL' ? selectedYear : (yearLevels[0]?.yearName || '1st Year'),
                  semester: selectedSemester !== 'ALL' ? selectedSemester : (semesters[0]?.semesterName || 'Semester I'),
                  division: availableClasses[0]?.division || 'A'
                });
                setShowAddStudentModal(true);
              }}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-xl flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Enroll Student
            </button>
          </div>

          {filteredStudents.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs space-y-2">
              <GraduationCap className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="font-semibold text-slate-400">0 Enrolled Students</p>
              <p className="text-slate-500">No students match the current academic hierarchy filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 text-slate-400 uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Roll No</th>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Program & Year</th>
                    <th className="py-3 px-4">Semester & Division</th>
                    <th className="py-3 px-4">AI Biometrics</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {filteredStudents.map((s) => (
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
                      <td className="py-3 px-4">{s.program || s.branch} • {s.year}</td>
                      <td className="py-3 px-4 font-mono font-semibold text-purple-400">{s.semester} (Div {s.division || s.classId})</td>
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
                              setTransferringStudent(s);
                              setTargetClassId(classes[0]?.id || '');
                              setShowTransferModal(true);
                            }}
                            className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 p-1.5 rounded-lg transition-all"
                            title="Transfer Student"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
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
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
              onClick={() => {
                setNewTeacher({ name: '', email: '', department: departments[0]?.name || '', employeeId: '', designation: 'Assistant Professor', cabin: 'Room 304', assignedClasses: [] });
                setShowAddTeacherModal(true);
              }}
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
                {teachers.map((t) => (
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
                      <span className="bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-[11px] text-slate-300 font-mono">
                        {t.assignedClasses?.length > 0 ? t.assignedClasses.join(', ') : 'None'}
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
              <p className="text-xs text-slate-400">Configure batches, divisions, and program allocations</p>
            </div>
            <button
              onClick={() => {
                setNewClass({
                  name: '',
                  department: selectedDept !== 'ALL' ? selectedDept : (departments[0]?.name || ''),
                  program: selectedProg !== 'ALL' ? selectedProg : (programs[0]?.name || ''),
                  academicYear: academicYear !== 'ALL' ? academicYear : (academicYears[0]?.year || '2026-27'),
                  year: selectedYear !== 'ALL' ? selectedYear : (yearLevels[0]?.yearName || '1st Year'),
                  semester: selectedSemester !== 'ALL' ? selectedSemester : (semesters[0]?.semesterName || 'Semester I'),
                  division: ''
                });
                setShowAddClassModal(true);
              }}
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
                    <p className="text-xs text-slate-400">{cls.program || cls.department} • {cls.year} • {cls.semester}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <span>Division: <strong className="text-purple-400 font-mono font-bold">{cls.division}</strong></span>
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
              <p className="text-xs text-slate-400">Manage course codes, credits, and faculty instructor assignments</p>
            </div>
            <button
              onClick={() => {
                setNewSubject({
                  code: '', name: '', classId: classes[0]?.id || '', credits: 4,
                  department: selectedDept !== 'ALL' ? selectedDept : (departments[0]?.name || ''),
                  program: selectedProg !== 'ALL' ? selectedProg : (programs[0]?.name || ''),
                  year: selectedYear !== 'ALL' ? selectedYear : (yearLevels[0]?.yearName || '1st Year'),
                  semester: selectedSemester !== 'ALL' ? selectedSemester : (semesters[0]?.semesterName || 'Semester I'),
                  division: '', teacherId: teachers[0]?.id || 'USR-TEACHER-01'
                });
                setShowAddSubjectModal(true);
              }}
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
                  <p className="text-xs text-slate-400">Class: {subj.classId} • {subj.semester || 'Semester III'} • {subj.credits || 4} Credits</p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span>Faculty: <strong className="text-slate-200">{subj.teacherId || 'Faculty'}</strong></span>
                  <span className="text-emerald-400">Active</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: Academic Structure Control Sub-Tabs */}
      {activeTab === 'academic' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-indigo-400" />
                Academic Structure Master Tables
              </h3>
              <p className="text-xs text-slate-400">Add, edit, or remove institutional levels, degrees, terms, and semesters</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setAcademicSubTab('years')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                  academicSubTab === 'years' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                Academic Years ({academicYears.length})
              </button>
              <button
                onClick={() => setAcademicSubTab('depts')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                  academicSubTab === 'depts' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                Departments ({departments.length})
              </button>
              <button
                onClick={() => setAcademicSubTab('progs')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                  academicSubTab === 'progs' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                Programs ({programs.length})
              </button>
              <button
                onClick={() => setAcademicSubTab('yearlevels')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                  academicSubTab === 'yearlevels' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                Year Levels ({yearLevels.length})
              </button>
              <button
                onClick={() => setAcademicSubTab('semesters')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                  academicSubTab === 'semesters' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                Semesters ({semesters.length})
              </button>
            </div>
          </div>

          {/* Sub-Tab 1: Academic Years */}
          {academicSubTab === 'years' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-bold text-white">Configured Academic Years</h4>
                <button
                  onClick={() => setShowAddYearModal(true)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Academic Year
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/60 text-slate-400 uppercase font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Academic Year</th>
                      <th className="py-3 px-4">Start Date</th>
                      <th className="py-3 px-4">End Date</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {academicYears.map(ay => (
                      <tr key={ay.id} className="hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-mono font-bold text-white">{ay.year}</td>
                        <td className="py-3 px-4 text-slate-400">{ay.startDate || '2026-07-01'}</td>
                        <td className="py-3 px-4 text-slate-400">{ay.endDate || '2027-05-31'}</td>
                        <td className="py-3 px-4">
                          {ay.isCurrent ? (
                            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-semibold">Active Current</span>
                          ) : (
                            <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded text-[10px]">Archived</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleDeleteYear(ay.id, ay.year)}
                            className="text-rose-400 hover:text-rose-300 p-1 rounded"
                            title="Delete Year"
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

          {/* Sub-Tab 2: Departments */}
          {academicSubTab === 'depts' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-bold text-white">Academic Departments</h4>
                <button
                  onClick={() => setShowAddDeptModal(true)}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Department
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/60 text-slate-400 uppercase font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Dept Code</th>
                      <th className="py-3 px-4">Department Name</th>
                      <th className="py-3 px-4">Short Name</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {departments.map(d => (
                      <tr key={d.id} className="hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-mono font-bold text-purple-400">{d.code}</td>
                        <td className="py-3 px-4 text-white font-medium">{d.name}</td>
                        <td className="py-3 px-4 text-slate-400">{d.shortName || d.code}</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleDeleteDept(d.id, d.name)}
                            className="text-rose-400 hover:text-rose-300 p-1 rounded"
                            title="Delete Department"
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

          {/* Sub-Tab 3: Programs / Branches */}
          {academicSubTab === 'progs' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-bold text-white">Degree Programs & Branches</h4>
                <button
                  onClick={() => setShowAddProgModal(true)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Program
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/60 text-slate-400 uppercase font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Program Code</th>
                      <th className="py-3 px-4">Program Title</th>
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4">Duration</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {programs.map(p => (
                      <tr key={p.id} className="hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-mono font-bold text-emerald-400">{p.code}</td>
                        <td className="py-3 px-4 text-white font-medium">{p.name}</td>
                        <td className="py-3 px-4 text-slate-400">{p.department}</td>
                        <td className="py-3 px-4 text-slate-300">{p.durationYears || 4} Years</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleDeleteProg(p.id, p.name)}
                            className="text-rose-400 hover:text-rose-300 p-1 rounded"
                            title="Delete Program"
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

          {/* Sub-Tab 4: Year Levels */}
          {academicSubTab === 'yearlevels' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-bold text-white">Academic Year Levels</h4>
                <button
                  onClick={() => setShowAddYearLevelModal(true)}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Year Level
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/60 text-slate-400 uppercase font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Level Index</th>
                      <th className="py-3 px-4">Year Level Name</th>
                      <th className="py-3 px-4">Target Program</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {yearLevels.map(y => (
                      <tr key={y.id} className="hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-mono font-bold text-amber-400">Year {y.yearNumber}</td>
                        <td className="py-3 px-4 text-white font-medium">{y.yearName}</td>
                        <td className="py-3 px-4 text-slate-400">{y.programId || 'All Programs'}</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleDeleteYearLevel(y.id, y.yearName)}
                            className="text-rose-400 hover:text-rose-300 p-1 rounded"
                            title="Delete Year Level"
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

          {/* Sub-Tab 5: Semesters */}
          {academicSubTab === 'semesters' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-bold text-white">Academic Semesters</h4>
                <button
                  onClick={() => setShowAddSemesterModal(true)}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Semester
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/60 text-slate-400 uppercase font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Sem No</th>
                      <th className="py-3 px-4">Semester Name</th>
                      <th className="py-3 px-4">Year Level</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {semesters.map(s => (
                      <tr key={s.id} className="hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-mono font-bold text-rose-400">Sem {s.semesterNumber}</td>
                        <td className="py-3 px-4 text-white font-medium">{s.semesterName}</td>
                        <td className="py-3 px-4 text-slate-400">{s.yearId || '2nd Year'}</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleDeleteSemester(s.id, s.semesterName)}
                            className="text-rose-400 hover:text-rose-300 p-1 rounded"
                            title="Delete Semester"
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
        </div>
      )}

      {/* TAB 6: Document Vault */}
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

      {/* ==========================================
          MODALS SECTION
          ========================================== */}

      {/* 1. Add Academic Year Modal */}
      {showAddYearModal && (
        <div className="fixed inset-0 bg-slate-950/90 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Create Academic Year</h3>
            <form onSubmit={handleCreateYear} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Academic Year Name *</label>
                <input
                  type="text" required value={newYearData.year} onChange={(e) => setNewYearData({...newYearData, year: e.target.value})}
                  placeholder="e.g. 2026-27 or 2027-28" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500 font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Start Date</label>
                  <input
                    type="date" value={newYearData.startDate} onChange={(e) => setNewYearData({...newYearData, startDate: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">End Date</label>
                  <input
                    type="date" value={newYearData.endDate} onChange={(e) => setNewYearData({...newYearData, endDate: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAddYearModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl">Save Year</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Add Department Modal */}
      {showAddDeptModal && (
        <div className="fixed inset-0 bg-slate-950/90 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Create Academic Department</h3>
            <form onSubmit={handleCreateDept} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Department Name *</label>
                <input
                  type="text" required value={newDeptData.name} onChange={(e) => setNewDeptData({...newDeptData, name: e.target.value})}
                  placeholder="e.g. Artificial Intelligence & Data Science" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-purple-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Dept Code *</label>
                  <input
                    type="text" required value={newDeptData.code} onChange={(e) => setNewDeptData({...newDeptData, code: e.target.value})}
                    placeholder="e.g. AIDS" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-purple-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Short Name</label>
                  <input
                    type="text" value={newDeptData.shortName} onChange={(e) => setNewDeptData({...newDeptData, shortName: e.target.value})}
                    placeholder="e.g. AI & DS" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-purple-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAddDeptModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl">Save Department</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Add Program Modal */}
      {showAddProgModal && (
        <div className="fixed inset-0 bg-slate-950/90 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Create Degree Program</h3>
            <form onSubmit={handleCreateProg} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Program Name *</label>
                <input
                  type="text" required value={newProgData.name} onChange={(e) => setNewProgData({...newProgData, name: e.target.value})}
                  placeholder="e.g. B.Tech in Artificial Intelligence & Data Science" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Program Code *</label>
                  <input
                    type="text" required value={newProgData.code} onChange={(e) => setNewProgData({...newProgData, code: e.target.value})}
                    placeholder="e.g. BTECH-AIDS" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Degree Type</label>
                  <input
                    type="text" value={newProgData.degree} onChange={(e) => setNewProgData({...newProgData, degree: e.target.value})}
                    placeholder="e.g. B.Tech or M.Tech" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Department *</label>
                <select
                  value={newProgData.department} onChange={(e) => setNewProgData({...newProgData, department: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500"
                >
                  {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAddProgModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl">Save Program</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Add Year Level Modal */}
      {showAddYearLevelModal && (
        <div className="fixed inset-0 bg-slate-950/90 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Create Academic Year Level</h3>
            <form onSubmit={handleCreateYearLevel} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Year Level Name *</label>
                <input
                  type="text" required value={newYearLevelData.yearName} onChange={(e) => setNewYearLevelData({...newYearLevelData, yearName: e.target.value})}
                  placeholder="e.g. 1st Year, 2nd Year, 3rd Year, 4th Year" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Year Number (1 - 5) *</label>
                <input
                  type="number" required min="1" max="10" value={newYearLevelData.yearNumber} onChange={(e) => setNewYearLevelData({...newYearLevelData, yearNumber: parseInt(e.target.value) || 1})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAddYearLevelModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-xl">Save Year Level</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Add Semester Modal */}
      {showAddSemesterModal && (
        <div className="fixed inset-0 bg-slate-950/90 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Create Academic Semester</h3>
            <form onSubmit={handleCreateSemester} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Semester Name *</label>
                <input
                  type="text" required value={newSemesterData.semesterName} onChange={(e) => setNewSemesterData({...newSemesterData, semesterName: e.target.value})}
                  placeholder="e.g. Semester I, Semester II, Semester III..." className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-rose-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Semester Number *</label>
                  <input
                    type="number" required min="1" max="12" value={newSemesterData.semesterNumber} onChange={(e) => setNewSemesterData({...newSemesterData, semesterNumber: parseInt(e.target.value) || 1})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Year Level</label>
                  <select
                    value={newSemesterData.yearId} onChange={(e) => setNewSemesterData({...newSemesterData, yearId: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-rose-500"
                  >
                    {yearLevels.map(y => <option key={y.id} value={y.yearName}>{y.yearName}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAddSemesterModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl">Save Semester</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Add Student Modal with Full Cascading Dropdowns */}
      {showAddStudentModal && (
        <div className="fixed inset-0 bg-slate-950/90 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 w-full max-w-xl shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white mb-2">Enroll Student with Academic Hierarchy</h3>
            <form onSubmit={handleCreateStudent} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Roll Number *</label>
                  <input
                    type="text" required value={newStudent.rollNumber} onChange={(e) => setNewStudent({...newStudent, rollNumber: e.target.value})}
                    placeholder="e.g. 101" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Full Name *</label>
                  <input
                    type="text" required value={newStudent.name} onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
                    placeholder="e.g. Rahul Sharma" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Official Email Address *</label>
                <input
                  type="email" required value={newStudent.email} onChange={(e) => setNewStudent({...newStudent, email: e.target.value})}
                  placeholder="student@college.edu" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Academic Year</label>
                  <select
                    value={newStudent.academicYear} onChange={(e) => setNewStudent({...newStudent, academicYear: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500"
                  >
                    {academicYears.map(ay => <option key={ay.id} value={ay.year}>{ay.year}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Department</label>
                  <select
                    value={newStudent.department} onChange={(e) => setNewStudent({...newStudent, department: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500"
                  >
                    {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Year Level</label>
                  <select
                    value={newStudent.year} onChange={(e) => setNewStudent({...newStudent, year: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500"
                  >
                    {yearLevels.map(y => <option key={y.id} value={y.yearName}>{y.yearName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Semester</label>
                  <select
                    value={newStudent.semester} onChange={(e) => setNewStudent({...newStudent, semester: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500"
                  >
                    {semesters.map(s => <option key={s.id} value={s.semesterName}>{s.semesterName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Division / Class *</label>
                  <select
                    value={newStudent.classId}
                    onChange={(e) => {
                      const sel = classes.find(c => c.id === e.target.value);
                      setNewStudent({
                        ...newStudent,
                        classId: e.target.value,
                        division: sel?.division || 'AI-2'
                      });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500"
                  >
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name} ({c.division})</option>)}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button" onClick={() => setShowAddStudentModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={isSubmitting}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-600/20"
                >
                  Save Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Edit Student Modal */}
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
                <button type="button" onClick={() => setShowEditStudentModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-xl">Update Student</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. Transfer Student Modal */}
      {showTransferModal && transferringStudent && (
        <div className="fixed inset-0 bg-slate-950/90 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-purple-400" />
              Transfer Student to Division
            </h3>
            <p className="text-xs text-slate-400">
              Transfer <strong className="text-white">{transferringStudent.name}</strong> from {transferringStudent.classId} to a new division.
            </p>
            <form onSubmit={handleTransferStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Destination Class / Division *</label>
                <select
                  value={targetClassId}
                  onChange={(e) => setTargetClassId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-purple-500"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.division})</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowTransferModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl">Confirm Transfer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. Add Faculty Modal */}
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
                <select
                  value={newTeacher.department} onChange={(e) => setNewTeacher({...newTeacher, department: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-purple-500"
                >
                  {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Assigned Classes</label>
                <select
                  multiple
                  value={newTeacher.assignedClasses}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => option.value);
                    setNewTeacher({ ...newTeacher, assignedClasses: selected });
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white focus:border-purple-500 h-24"
                >
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name} ({c.division})</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAddTeacherModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl">Save Teacher</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 10. Add Class Modal */}
      {showAddClassModal && (
        <div className="fixed inset-0 bg-slate-950/90 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Add Class / Division</h3>
            <form onSubmit={handleCreateClass} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Class Title *</label>
                <input
                  type="text" required value={newClass.name} onChange={(e) => setNewClass({...newClass, name: e.target.value})}
                  placeholder="e.g. B.Tech AI & DS - 2nd Year (Div AI-2)" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Academic Year</label>
                  <select
                    value={newClass.academicYear} onChange={(e) => setNewClass({...newClass, academicYear: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500"
                  >
                    {academicYears.map(ay => <option key={ay.id} value={ay.year}>{ay.year}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Division (Code) *</label>
                  <input
                    type="text" required value={newClass.division} onChange={(e) => setNewClass({...newClass, division: e.target.value})}
                    placeholder="AI-2" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Year Level</label>
                  <select
                    value={newClass.year} onChange={(e) => setNewClass({...newClass, year: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500"
                  >
                    {yearLevels.map(y => <option key={y.id} value={y.yearName}>{y.yearName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Semester</label>
                  <select
                    value={newClass.semester} onChange={(e) => setNewClass({...newClass, semester: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500"
                  >
                    {semesters.map(s => <option key={s.id} value={s.semesterName}>{s.semesterName}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAddClassModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl">Save Class</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 11. Add Subject Modal */}
      {showAddSubjectModal && (
        <div className="fixed inset-0 bg-slate-950/90 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white mb-2">Add Curriculum Subject</h3>
            <form onSubmit={handleCreateSubject} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Subject Code *</label>
                  <input
                    type="text" required value={newSubject.code} onChange={(e) => setNewSubject({...newSubject, code: e.target.value})}
                    placeholder="e.g. CS301" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Credits</label>
                  <input
                    type="number" min="1" max="10" value={newSubject.credits} onChange={(e) => setNewSubject({...newSubject, credits: parseInt(e.target.value) || 4})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Subject Name *</label>
                <input
                  type="text" required value={newSubject.name} onChange={(e) => setNewSubject({...newSubject, name: e.target.value})}
                  placeholder="e.g. Data Structures & Algorithms" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Target Class *</label>
                  <select
                    value={newSubject.classId} onChange={(e) => setNewSubject({...newSubject, classId: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500"
                  >
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name} ({c.division})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Assigned Faculty</label>
                  <select
                    value={newSubject.teacherId} onChange={(e) => setNewSubject({...newSubject, teacherId: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500"
                  >
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAddSubjectModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-xl">Save Subject</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 12. Full-Screen Document Preview Modal */}
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
