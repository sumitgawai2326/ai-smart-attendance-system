import React, { useState, useEffect } from 'react';
import { studentAPI, classAPI, subjectAPI, attendanceAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  ClipboardList, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Calendar, 
  BookOpen, 
  Users, 
  Edit, 
  Camera, 
  Save, 
  RotateCcw, 
  Check, 
  X, 
  AlertCircle, 
  Loader2, 
  Sparkles,
  Search
} from 'lucide-react';

const ManualAttendance = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState('CLS-AIDS-3A');
  const [selectedSubject, setSelectedSubject] = useState('SBJ-DSA');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeSlot, setTimeSlot] = useState('10:00 AM - 11:00 AM');
  const [topicCovered, setTopicCovered] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Attendance Roster Map: { studentId: { status: 'PRESENT' | 'ABSENT' | 'LATE', remarks: '' } }
  const [roster, setRoster] = useState({});
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Edit Student Modal State
  const [editingStudent, setEditingStudent] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadStudentsForClass(selectedClass);
    }
  }, [selectedClass]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [cRes, sRes] = await Promise.all([
        classAPI.list(),
        subjectAPI.list(selectedClass)
      ]);
      setClasses(cRes.data);
      setSubjects(sRes.data);
      if (cRes.data.length > 0 && !selectedClass) setSelectedClass(cRes.data[0].id);
      if (sRes.data.length > 0 && !selectedSubject) setSelectedSubject(sRes.data[0].id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadStudentsForClass = async (classId) => {
    try {
      const res = await studentAPI.list(classId);
      setStudents(res.data);

      // Initialize roster with default PRESENT status for all students
      const initialRoster = {};
      res.data.forEach(s => {
        initialRoster[s.id] = { status: 'PRESENT', remarks: '' };
      });
      setRoster(initialRoster);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusChange = (studentId, status) => {
    setRoster(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status
      }
    }));
  };

  const handleRemarksChange = (studentId, remarks) => {
    setRoster(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remarks
      }
    }));
  };

  const markAll = (status) => {
    const updated = {};
    students.forEach(s => {
      updated[s.id] = {
        status,
        remarks: roster[s.id]?.remarks || ''
      };
    });
    setRoster(updated);
  };

  const handleSubmitAttendance = async (e) => {
    e.preventDefault();
    if (students.length === 0) {
      setMessage({ text: 'No students found in the selected class.', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    setMessage({ text: '', type: '' });

    try {
      const recordsPayload = students.map(s => ({
        studentId: s.id,
        studentName: s.name,
        rollNumber: s.rollNumber,
        status: roster[s.id]?.status || 'PRESENT',
        remarks: roster[s.id]?.remarks || ''
      }));

      const payload = {
        classId: selectedClass,
        subjectId: selectedSubject,
        teacherId: user?.id || 'USR-TEACHER-01',
        date,
        timeSlot,
        topicCovered: topicCovered || 'Regular Lecture',
        records: recordsPayload
      };

      const res = await attendanceAPI.submitManualSession(payload);
      setMessage({
        text: `✓ Manual attendance successfully committed to cloud! (Session: ${res.data.sessionId})`,
        type: 'success'
      });
    } catch (err) {
      setMessage({
        text: err.response?.data?.detail || 'Failed to submit manual attendance register.',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    if (!editingStudent) return;
    try {
      const res = await studentAPI.update(editingStudent.id, editingStudent);
      setStudents(prev => prev.map(s => s.id === res.data.id ? res.data : s));
      setMessage({ text: `✓ Student '${res.data.name}' updated!`, type: 'success' });
      setShowEditModal(false);
      setEditingStudent(null);
    } catch (err) {
      setMessage({ text: 'Failed to update student.', type: 'error' });
    }
  };

  // Stats calculation
  const totalCount = students.length;
  const presentCount = Object.values(roster).filter(r => r.status === 'PRESENT').length;
  const absentCount = Object.values(roster).filter(r => r.status === 'ABSENT').length;
  const lateCount = Object.values(roster).filter(r => r.status === 'LATE').length;

  const filteredStudents = students.filter(s =>
    (s.name && s.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (s.rollNumber && s.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <ClipboardList className="w-7 h-7 text-blue-400" />
            Manual Attendance Register
          </h2>
          <p className="text-sm text-slate-400">Classroom roll-call without webcam • Mark, edit, and record attendance</p>
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

      {/* Control Panel / Session Settings */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Classroom & Division</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-blue-500"
            >
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.department})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Subject / Course</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-blue-500"
            >
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Lecture Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Time Slot</label>
            <select
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-blue-500"
            >
              <option value="09:00 AM - 10:00 AM">09:00 AM - 10:00 AM</option>
              <option value="10:00 AM - 11:00 AM">10:00 AM - 11:00 AM</option>
              <option value="11:15 AM - 12:15 PM">11:15 AM - 12:15 PM</option>
              <option value="01:00 PM - 02:00 PM">01:00 PM - 02:00 PM</option>
              <option value="02:00 PM - 03:00 PM">02:00 PM - 03:00 PM</option>
              <option value="03:15 PM - 04:15 PM">03:15 PM - 04:15 PM</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5">Lecture Topic Covered / Notes</label>
          <input
            type="text"
            placeholder="e.g. Unit 3: Graph Traversal Algorithms (BFS & DFS) + Complexity Analysis"
            value={topicCovered}
            onChange={(e) => setTopicCovered(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-blue-500"
          />
        </div>
      </div>

      {/* Live Counts & Batch Actions */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        <div className="md:col-span-8 flex flex-wrap gap-2.5 items-center">
          <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 flex items-center gap-2">
            <span className="text-xs text-slate-400">Total Enrolled:</span>
            <span className="font-bold text-white text-sm">{totalCount}</span>
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-2 flex items-center gap-2 text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-xs font-medium">Present:</span>
            <span className="font-bold text-sm">{presentCount}</span>
          </div>

          <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-2 flex items-center gap-2 text-rose-400">
            <XCircle className="w-4 h-4" />
            <span className="text-xs font-medium">Absent:</span>
            <span className="font-bold text-sm">{absentCount}</span>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-2 flex items-center gap-2 text-amber-400">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-medium">Late:</span>
            <span className="font-bold text-sm">{lateCount}</span>
          </div>
        </div>

        <div className="md:col-span-4 flex justify-start md:justify-end gap-2">
          <button
            type="button"
            onClick={() => markAll('PRESENT')}
            className="px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-semibold text-xs rounded-xl transition-all"
          >
            All Present
          </button>
          <button
            type="button"
            onClick={() => markAll('ABSENT')}
            className="px-3 py-2 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 font-semibold text-xs rounded-xl transition-all"
          >
            All Absent
          </button>
          <button
            type="button"
            onClick={() => markAll('PRESENT')}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl transition-all flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
        </div>
      </div>

      {/* Student Roster Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search students in class..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            onClick={handleSubmitAttendance}
            disabled={isSubmitting || students.length === 0}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-600/25 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{isSubmitting ? 'Saving Register...' : 'Save & Commit Attendance'}</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Roll No</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4 text-center">Status Selection</th>
                <th className="py-3 px-4">Remarks / Notes</th>
                <th className="py-3 px-4 text-right">Edit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-500 text-xs">
                    No students found matching "{searchQuery}".
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => {
                  const currentStatus = roster[s.id]?.status || 'PRESENT';

                  return (
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
                          <div>
                            <span className="font-medium text-white block">{s.name}</span>
                            <span className="text-[10px] text-slate-500">{s.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Status Toggle Buttons */}
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800 gap-1">
                          <button
                            type="button"
                            onClick={() => handleStatusChange(s.id, 'PRESENT')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              currentStatus === 'PRESENT'
                                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            P
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(s.id, 'ABSENT')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              currentStatus === 'ABSENT'
                                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            A
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(s.id, 'LATE')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              currentStatus === 'LATE'
                                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            L
                          </button>
                        </div>
                      </td>

                      {/* Remarks Input */}
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          placeholder="Optional reason..."
                          value={roster[s.id]?.remarks || ''}
                          onChange={(e) => handleRemarksChange(s.id, e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white focus:border-blue-500"
                        />
                      </td>

                      {/* Edit Details Shortcut */}
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingStudent({ ...s });
                            setShowEditModal(true);
                          }}
                          className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 p-1.5 rounded-lg transition-all"
                          title="Edit Student Information"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Student Modal */}
      {showEditModal && editingStudent && (
        <div className="fixed inset-0 bg-slate-950/90 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Edit Student Details</h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStudent} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Roll Number *</label>
                  <input
                    type="text"
                    required
                    value={editingStudent.rollNumber}
                    onChange={(e) => setEditingStudent({...editingStudent, rollNumber: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editingStudent.name}
                    onChange={(e) => setEditingStudent({...editingStudent, name: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={editingStudent.email}
                  onChange={(e) => setEditingStudent({...editingStudent, email: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-amber-600/20 transition-all"
                >
                  Update Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManualAttendance;
