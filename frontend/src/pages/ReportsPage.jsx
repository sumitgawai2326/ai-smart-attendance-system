import React, { useState, useEffect } from 'react';
import { classAPI, subjectAPI, reportAPI } from '../services/api';
import { Download, Filter, FileText, CheckCircle } from 'lucide-react';

const ReportsPage = () => {
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

  useEffect(() => {
    loadOptions();
  }, []);

  const loadOptions = async () => {
    try {
      const [cRes, sRes] = await Promise.all([classAPI.list(), subjectAPI.list()]);
      setClasses(cRes.data);
      setSubjects(sRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportCSV = () => {
    const downloadUrl = reportAPI.getExportCSVUrl(selectedClass, selectedSubject);
    window.open(downloadUrl, '_blank');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Attendance Reports & CSV Export</h2>
        <p className="text-sm text-slate-400">Generate analytics and download Firestore attendance data</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          <Filter className="w-4 h-4 text-blue-400" /> Apply Data Filters
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Filter by Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white"
            >
              <option value="">All Classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Filter by Subject</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white"
            >
              <option value="">All Subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={handleExportCSV}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-600/20 flex items-center gap-2 transition-all"
          >
            <Download className="w-4 h-4" /> EXPORT CSV REPORT
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
