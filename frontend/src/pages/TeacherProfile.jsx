import React, { useState, useEffect } from 'react';
import { teacherAPI, subjectAPI, classAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  User, 
  Mail, 
  Phone, 
  GraduationCap, 
  BookOpen, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Building2, 
  Clock, 
  Award, 
  Briefcase, 
  X, 
  BookMarked
} from 'lucide-react';

const TeacherProfile = () => {
  const { user } = useAuth();
  const teacherId = user?.id || 'USR-TEACHER-01';

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'subjects'
  const [message, setMessage] = useState({ text: '', type: '' });

  // Teacher Profile State
  const [profile, setProfile] = useState({
    id: '',
    name: '',
    email: '',
    department: 'AI & Data Science',
    phone: '',
    employeeId: '',
    designation: 'Associate Professor',
    qualification: 'Ph.D. in Computer Science',
    specialization: 'Artificial Intelligence & Machine Learning',
    cabin: 'Faculty Block C, Cabin 402',
    officeHours: 'Mon-Fri: 11:00 AM - 1:00 PM',
    experienceYears: '10+ Years',
    assignedClasses: ['CLS-AIDS-3A']
  });

  // Subjects State
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [newSubject, setNewSubject] = useState({
    code: '',
    name: '',
    classId: 'CLS-AIDS-3A'
  });

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tRes, sRes, cRes] = await Promise.all([
        teacherAPI.get(user?.email || teacherId),
        subjectAPI.list(),
        classAPI.list()
      ]);
      if (tRes.data) setProfile(tRes.data);
      if (sRes.data) setSubjects(sRes.data);
      if (cRes.data) setClasses(cRes.data);
    } catch (err) {
      console.warn('Error fetching teacher data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ text: '', type: '' });

    try {
      const res = await teacherAPI.updateProfile(profile.id || teacherId, profile);
      setProfile(res.data);
      setMessage({ text: '✓ Faculty profile updated successfully!', type: 'success' });
    } catch (err) {
      setMessage({ text: err.response?.data?.detail || 'Failed to update profile.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSubject = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...newSubject,
        teacherId: profile.id || teacherId
      };
      const res = await subjectAPI.create(payload);
      setSubjects(prev => [...prev, res.data]);
      setMessage({ text: `✓ Subject '${res.data.name}' added successfully!`, type: 'success' });
      setShowAddSubjectModal(false);
      setNewSubject({ code: '', name: '', classId: 'CLS-AIDS-3A' });
    } catch (err) {
      setMessage({ text: 'Failed to create subject.', type: 'error' });
    }
  };

  const handleDeleteSubject = async (subjectId, subjectName) => {
    if (!window.confirm(`Are you sure you want to delete subject '${subjectName}'?`)) return;
    try {
      await subjectAPI.delete(subjectId);
      setSubjects(prev => prev.filter(s => s.id !== subjectId));
      setMessage({ text: `✓ Subject '${subjectName}' removed.`, type: 'success' });
    } catch (err) {
      setMessage({ text: 'Failed to delete subject.', type: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-slate-400 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-sm font-medium">Loading Faculty Profile & Subjects...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 border-2 border-indigo-400/40 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-indigo-500/20">
              {profile.name?.charAt(0) || 'P'}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-2xl font-bold text-white tracking-tight">{profile.name || 'Prof. Faculty Member'}</h2>
                <span className="bg-purple-500/10 text-purple-400 border border-purple-500/30 px-2.5 py-0.5 rounded-lg text-xs font-semibold">
                  {profile.designation || 'Faculty'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Employee ID: <span className="font-mono text-purple-400 font-semibold">{profile.employeeId || 'EMP-01'}</span> • {profile.department} • {profile.qualification}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowAddSubjectModal(true)}
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl shadow-md shadow-purple-600/20 flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" /> Add New Subject
            </button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {message.text && (
        <div className={`p-4 rounded-xl text-xs font-medium flex items-center justify-between shadow-lg ${
          message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
        }`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage({ text: '', type: '' })}>✕</button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-slate-800 flex gap-6">
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'profile' ? 'border-purple-500 text-purple-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <User className="w-4 h-4" /> Faculty Profile & Credentials
        </button>
        <button
          onClick={() => setActiveTab('subjects')}
          className={`pb-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'subjects' ? 'border-purple-500 text-purple-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" /> Assigned Subjects & Curriculum ({subjects.length})
        </button>
      </div>

      {/* TAB 1: Faculty Profile Form */}
      {activeTab === 'profile' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-base font-bold text-white">Faculty Academic & Personal Credentials</h3>
            <p className="text-xs text-slate-400">Maintain your official academic appointment, qualifications, and consultation hours</p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-6">
            {/* Academic Info */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4" /> Official Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Full Name & Title *</label>
                  <input
                    type="text"
                    required
                    name="name"
                    value={profile.name || ''}
                    onChange={handleProfileChange}
                    placeholder="e.g. Prof. Alan Turing"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Employee ID *</label>
                  <input
                    type="text"
                    required
                    name="employeeId"
                    value={profile.employeeId || ''}
                    onChange={handleProfileChange}
                    placeholder="EMP-AIDS-01"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-purple-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Academic Department</label>
                  <input
                    type="text"
                    name="department"
                    value={profile.department || ''}
                    onChange={handleProfileChange}
                    placeholder="AI & Data Science"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Designation</label>
                  <input
                    type="text"
                    name="designation"
                    value={profile.designation || ''}
                    onChange={handleProfileChange}
                    placeholder="Associate Professor & HOD"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Highest Qualification</label>
                  <input
                    type="text"
                    name="qualification"
                    value={profile.qualification || ''}
                    onChange={handleProfileChange}
                    placeholder="Ph.D. in Computer Science"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Research Specialization</label>
                  <input
                    type="text"
                    name="specialization"
                    value={profile.specialization || ''}
                    onChange={handleProfileChange}
                    placeholder="Deep Learning, NLP"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-purple-500"
                  />
                </div>
              </div>
            </div>

            {/* Contact & Cabin Location */}
            <div className="space-y-3 pt-4 border-t border-slate-800/80">
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                <Building2 className="w-4 h-4" /> Office & Contact Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Official Email Address *</label>
                  <input
                    type="email"
                    required
                    name="email"
                    value={profile.email || ''}
                    onChange={handleProfileChange}
                    placeholder="teacher@college.edu"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={profile.phone || ''}
                    onChange={handleProfileChange}
                    placeholder="+91 98765 11223"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Teaching Experience</label>
                  <input
                    type="text"
                    name="experienceYears"
                    value={profile.experienceYears || ''}
                    onChange={handleProfileChange}
                    placeholder="12+ Years"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Office / Cabin Location</label>
                  <input
                    type="text"
                    name="cabin"
                    value={profile.cabin || ''}
                    onChange={handleProfileChange}
                    placeholder="Faculty Block C, Cabin 402"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Student Consultation Hours</label>
                  <input
                    type="text"
                    name="officeHours"
                    value={profile.officeHours || ''}
                    onChange={handleProfileChange}
                    placeholder="Mon-Fri: 11:00 AM - 1:00 PM"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-purple-500"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-purple-600/25 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>{isSaving ? 'Saving Profile...' : 'Save Profile Changes'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: Subjects & Curriculum Management */}
      {activeTab === 'subjects' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white">Course Curriculum & Subjects Taught</h3>
                <p className="text-xs text-slate-400">Add, configure, and manage subjects assigned to your classes</p>
              </div>
              <button
                onClick={() => setShowAddSubjectModal(true)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl shadow-md shadow-purple-600/20 flex items-center gap-1.5 transition-all self-start"
              >
                <Plus className="w-4 h-4" /> Add Subject
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {subjects.map((subj) => (
                <div key={subj.id} className="bg-slate-950/70 border border-slate-800 hover:border-purple-500/40 rounded-2xl p-5 flex flex-col justify-between space-y-4 transition-all">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="bg-purple-500/10 text-purple-400 border border-purple-500/30 px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold">
                        {subj.code}
                      </span>
                      <button
                        onClick={() => handleDeleteSubject(subj.id, subj.name)}
                        className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors"
                        title="Delete Subject"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <h4 className="text-sm font-bold text-white">{subj.name}</h4>
                    <p className="text-xs text-slate-400">Assigned Class: <span className="text-slate-200 font-medium">{subj.classId}</span></p>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between">
                    <span>Department: AI & DS</span>
                    <span className="text-emerald-400">Active</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Subject Modal */}
      {showAddSubjectModal && (
        <div className="fixed inset-0 bg-slate-950/90 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <BookMarked className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-white">Add New Subject</h3>
              </div>
              <button
                onClick={() => setShowAddSubjectModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Subject Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CS305 / AI401"
                  value={newSubject.code}
                  onChange={(e) => setNewSubject({...newSubject, code: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-purple-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Subject Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Natural Language Processing"
                  value={newSubject.name}
                  onChange={(e) => setNewSubject({...newSubject, name: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Target Class *</label>
                <select
                  value={newSubject.classId}
                  onChange={(e) => setNewSubject({...newSubject, classId: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-purple-500"
                >
                  <option value="CLS-AIDS-3A">B.Tech AI & DS (Div A)</option>
                  <option value="CLS-AIDS-3B">B.Tech AI & DS (Div B)</option>
                  <option value="CLS-CS-4A">B.Tech Computer Science (Div A)</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddSubjectModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-purple-600/20 transition-all"
                >
                  Save Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherProfile;
