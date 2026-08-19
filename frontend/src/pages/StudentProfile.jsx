import React, { useState, useEffect } from 'react';
import { studentAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  GraduationCap, 
  FileText, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Eye, 
  Download, 
  Loader2, 
  ShieldCheck, 
  Calendar, 
  HeartPulse, 
  Users, 
  FolderLock,
  X,
  FileCheck
} from 'lucide-react';

const StudentProfile = () => {
  const { user } = useAuth();
  const studentId = user?.id || 'STU-001';

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'documents'
  const [message, setMessage] = useState({ text: '', type: '' });

  // Profile Form State
  const [profile, setProfile] = useState({
    id: '',
    name: '',
    rollNumber: '',
    prnNumber: '',
    email: '',
    phone: '',
    whatsapp: '',
    dob: '',
    gender: 'Male',
    bloodGroup: 'O+',
    branch: 'AI & Data Science',
    year: '3rd Year',
    division: 'A',
    guardianName: '',
    guardianPhone: '',
    address: '',
    emergencyContact: '',
    photoUrl: null,
    hasFaceEnrolled: false,
    documents: {}
  });

  // Document Upload State
  const [uploadingDocType, setUploadingDocType] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null); // { title, fileBase64, fileType }

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      // First try fetching by student ID or user email
      const res = await studentAPI.get(user?.email || studentId);
      if (res.data) {
        setProfile(prev => ({
          ...prev,
          ...res.data,
          documents: res.data.documents || {}
        }));
      }
    } catch (err) {
      console.warn('Could not fetch student by email, attempting default list lookup...', err);
      try {
        const listRes = await studentAPI.list();
        if (listRes.data && listRes.data.length > 0) {
          const match = listRes.data.find(s => s.email === user?.email) || listRes.data[0];
          setProfile(prev => ({ ...prev, ...match, documents: match.documents || {} }));
        }
      } catch (e) {
        console.error('Error fetching student profile:', e);
      }
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
      const res = await studentAPI.updateProfile(profile.id || studentId, profile);
      setProfile(prev => ({ ...prev, ...res.data, documents: res.data.documents || prev.documents }));
      setMessage({ text: '✓ Student profile details updated successfully!', type: 'success' });
    } catch (err) {
      setMessage({ text: err.response?.data?.detail || 'Failed to update profile. Please check all fields.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = (docType, docTitle, e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ text: 'File size exceeds 5MB limit. Please upload a smaller document.', type: 'error' });
      return;
    }

    const reader = new FileReader();
    setUploadingDocType(docType);

    reader.onload = async () => {
      const base64Data = reader.result;
      const fileSizeFormatted = (file.size / (1024 * 1024)).toFixed(2) + ' MB';

      try {
        const payload = {
          documentType: docType,
          title: docTitle,
          fileName: file.name,
          fileBase64: base64Data,
          fileType: file.type || 'application/pdf',
          fileSize: fileSizeFormatted
        };

        const res = await studentAPI.uploadDocument(profile.id || studentId, payload);
        setProfile(prev => ({
          ...prev,
          documents: res.data.documents || {
            ...prev.documents,
            [docType]: {
              title: docTitle,
              fileName: file.name,
              fileBase64: base64Data,
              fileType: file.type,
              fileSize: fileSizeFormatted,
              status: 'Submitted',
              uploadedAt: new Date().toISOString()
            }
          }
        }));
        setMessage({ text: `✓ ${docTitle} uploaded successfully!`, type: 'success' });
      } catch (err) {
        setMessage({ text: err.response?.data?.detail || `Failed to upload ${docTitle}.`, type: 'error' });
      } finally {
        setUploadingDocType(null);
      }
    };

    reader.onerror = () => {
      setMessage({ text: 'Error reading file. Please try again.', type: 'error' });
      setUploadingDocType(null);
    };

    reader.readAsDataURL(file);
  };

  const handleDeleteDocument = async (docType, docTitle) => {
    if (!window.confirm(`Are you sure you want to delete your uploaded ${docTitle}?`)) return;
    try {
      await studentAPI.deleteDocument(profile.id || studentId, docType);
      setProfile(prev => {
        const newDocs = { ...prev.documents };
        delete newDocs[docType];
        return { ...prev, documents: newDocs };
      });
      setMessage({ text: `✓ ${docTitle} removed from vault.`, type: 'success' });
    } catch (err) {
      setMessage({ text: 'Failed to delete document.', type: 'error' });
    }
  };

  // Calculate profile completeness score
  const calculateCompleteness = () => {
    let score = 0;
    const totalFields = 10;
    if (profile.name) score++;
    if (profile.rollNumber) score++;
    if (profile.email) score++;
    if (profile.phone) score++;
    if (profile.prnNumber) score++;
    if (profile.dob) score++;
    if (profile.guardianName) score++;
    if (profile.address) score++;
    if (profile.hasFaceEnrolled) score++;
    if (profile.documents && Object.keys(profile.documents).length > 0) score++;
    return Math.round((score / totalFields) * 100);
  };

  const completeness = calculateCompleteness();

  const standardDocuments = [
    { type: 'collegeId', title: 'College Student ID Card', desc: 'Official student photo identity issued by institution' },
    { type: 'aadhaarCard', title: 'Aadhaar / National ID Card', desc: 'Government verified national identity proof' },
    { type: 'marksheet', title: 'Previous Semester Marksheet', desc: 'Semester grade sheet / academic score card' },
    { type: 'feeReceipt', title: 'College Fee / Admission Receipt', desc: 'Current academic year tuition fee payment acknowledgment' },
    { type: 'bonafide', title: 'Bonafide / Other Certificate', desc: 'College bonafide, caste, or domicile certificate (optional)' },
  ];

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-slate-400 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-sm font-medium">Loading Student Profile & Documents...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner Card with Profile Summary */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/40 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 border-2 border-blue-400/40 overflow-hidden flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
              {profile.photoUrl ? (
                <img src={profile.photoUrl} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-8 h-8 text-white" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-2xl font-bold text-white tracking-tight">{profile.name || 'Student Name'}</h2>
                {profile.hasFaceEnrolled ? (
                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-lg text-xs font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> AI Biometrics Enrolled
                  </span>
                ) : (
                  <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2.5 py-0.5 rounded-lg text-xs font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Biometrics Pending
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Roll No: <span className="font-mono text-blue-400 font-semibold">{profile.rollNumber || 'N/A'}</span> • {profile.branch || 'AI & DS'} • {profile.year || '3rd Year'} (Div {profile.division || 'A'})
              </p>
            </div>
          </div>

          {/* Completeness Gauge */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 min-w-[200px] space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Profile Completeness</span>
              <span className={`font-bold ${completeness >= 80 ? 'text-emerald-400' : 'text-blue-400'}`}>{completeness}%</span>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  completeness >= 80 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                }`}
                style={{ width: `${completeness}%` }}
              ></div>
            </div>
            <p className="text-[10px] text-slate-500">
              {completeness === 100 ? 'All details & documents verified' : 'Upload remaining documents to reach 100%'}
            </p>
          </div>
        </div>
      </div>

      {/* Alert Notifications */}
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
          onClick={() => setActiveTab('details')}
          className={`pb-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'details' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <User className="w-4 h-4" /> Personal & Academic Information
        </button>
        <button
          onClick={() => setActiveTab('documents')}
          className={`pb-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'documents' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FolderLock className="w-4 h-4" /> Document Vault ({Object.keys(profile.documents || {}).length} Uploaded)
        </button>
      </div>

      {/* TAB 1: Personal & Academic Details Form */}
      {activeTab === 'details' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white">Student Information & Contact Profile</h3>
              <p className="text-xs text-slate-400">Fill and update your official academic and contact records</p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-6">
            {/* Academic Information */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4" /> Academic Credentials
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    name="name"
                    value={profile.name || ''}
                    onChange={handleProfileChange}
                    placeholder="e.g. Sumit Gawai"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Roll Number *</label>
                  <input
                    type="text"
                    required
                    name="rollNumber"
                    value={profile.rollNumber || ''}
                    onChange={handleProfileChange}
                    placeholder="e.g. 25107076"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">PRN / Registration Number</label>
                  <input
                    type="text"
                    name="prnNumber"
                    value={profile.prnNumber || ''}
                    onChange={handleProfileChange}
                    placeholder="e.g. PRN-2024-8849"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Department / Branch</label>
                  <input
                    type="text"
                    name="branch"
                    value={profile.branch || ''}
                    onChange={handleProfileChange}
                    placeholder="AI & Data Science"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Academic Year</label>
                  <select
                    name="year"
                    value={profile.year || '3rd Year'}
                    onChange={handleProfileChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-blue-500"
                  >
                    <option value="1st Year">1st Year (FE)</option>
                    <option value="2nd Year">2nd Year (SE)</option>
                    <option value="3rd Year">3rd Year (TE)</option>
                    <option value="Final Year">Final Year (BE)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Division</label>
                  <input
                    type="text"
                    name="division"
                    value={profile.division || 'A'}
                    onChange={handleProfileChange}
                    placeholder="A"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Personal Details */}
            <div className="space-y-3 pt-4 border-t border-slate-800/80">
              <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                <User className="w-4 h-4" /> Personal & Medical Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    name="email"
                    value={profile.email || ''}
                    onChange={handleProfileChange}
                    placeholder="student@college.edu"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    name="dob"
                    value={profile.dob || ''}
                    onChange={handleProfileChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Gender</label>
                  <select
                    name="gender"
                    value={profile.gender || 'Male'}
                    onChange={handleProfileChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-blue-500"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Blood Group</label>
                  <select
                    name="bloodGroup"
                    value={profile.bloodGroup || 'O+'}
                    onChange={handleProfileChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-blue-500 font-mono"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Contact & Guardian */}
            <div className="space-y-3 pt-4 border-t border-slate-800/80">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Phone className="w-4 h-4" /> Contact & Guardian Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Mobile Contact Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={profile.phone || ''}
                    onChange={handleProfileChange}
                    placeholder="+91 98765 43210"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Parent / Guardian Name</label>
                  <input
                    type="text"
                    name="guardianName"
                    value={profile.guardianName || ''}
                    onChange={handleProfileChange}
                    placeholder="e.g. Ramesh Gawai"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Parent Contact Phone</label>
                  <input
                    type="tel"
                    name="guardianPhone"
                    value={profile.guardianPhone || ''}
                    onChange={handleProfileChange}
                    placeholder="+91 98765 00000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Residential Address</label>
                <textarea
                  name="address"
                  rows={2}
                  value={profile.address || ''}
                  onChange={handleProfileChange}
                  placeholder="Enter full permanent / current residential address..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-blue-500"
                ></textarea>
              </div>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-600/25 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>{isSaving ? 'Saving Profile Details...' : 'Save Profile Changes'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: Document Vault */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white">Student Document Verification Vault</h3>
                <p className="text-xs text-slate-400">Upload official documents (PDF, JPG, PNG up to 5MB) for college administration records</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {standardDocuments.map((docDef) => {
                const uploaded = profile.documents && profile.documents[docDef.type];
                const isThisUploading = uploadingDocType === docDef.type;

                return (
                  <div
                    key={docDef.type}
                    className={`border rounded-2xl p-5 flex flex-col justify-between transition-all ${
                      uploaded
                        ? 'bg-slate-950/80 border-emerald-500/30'
                        : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            uploaded ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          }`}>
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white">{docDef.title}</h4>
                            <p className="text-[11px] text-slate-400 mt-0.5">{docDef.desc}</p>
                          </div>
                        </div>

                        {uploaded && (
                          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold px-2 py-0.5 rounded-md shrink-0 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> {uploaded.status || 'Submitted'}
                          </span>
                        )}
                      </div>

                      {uploaded && (
                        <div className="p-3 bg-slate-900 border border-slate-800/80 rounded-xl text-xs space-y-1">
                          <p className="text-slate-200 font-mono font-medium truncate">📄 {uploaded.fileName}</p>
                          <p className="text-slate-500 text-[10px]">
                            Size: {uploaded.fileSize} • Uploaded on {new Date(uploaded.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-slate-800/60 mt-4 flex items-center justify-between gap-2">
                      {uploaded ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setPreviewDoc(uploaded)}
                            className="px-3 py-2 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 text-blue-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
                          >
                            <Eye className="w-3.5 h-3.5" /> Preview
                          </button>

                          <div className="flex items-center gap-2">
                            {/* Replace Button */}
                            <label className="cursor-pointer px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all">
                              <Upload className="w-3.5 h-3.5" /> Replace
                              <input
                                type="file"
                                accept=".pdf,.png,.jpg,.jpeg"
                                className="hidden"
                                onChange={(e) => handleFileUpload(docDef.type, docDef.title, e)}
                              />
                            </label>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => handleDeleteDocument(docDef.type, docDef.title)}
                              className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
                              title="Delete Document"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </>
                      ) : (
                        <label className={`w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          isThisUploading
                            ? 'bg-slate-800 text-slate-400 pointer-events-none'
                            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20'
                        }`}>
                          {isThisUploading ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Uploading Document...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-3.5 h-3.5" />
                              <span>Upload Document</span>
                            </>
                          )}
                          <input
                            type="file"
                            accept=".pdf,.png,.jpg,.jpeg"
                            className="hidden"
                            onChange={(e) => handleFileUpload(docDef.type, docDef.title, e)}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Full-Screen Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 bg-slate-950/90 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-2xl shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <FileCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">{previewDoc.title || previewDoc.fileName}</h3>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-all"
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
                <a
                  href={previewDoc.fileBase64}
                  download={previewDoc.fileName || 'student-document'}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-blue-600/20"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
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

export default StudentProfile;
