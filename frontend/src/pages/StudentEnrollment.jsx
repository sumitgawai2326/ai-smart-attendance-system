import React, { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import { studentAPI } from '../services/api';
import { Camera, CheckCircle2, AlertCircle, RefreshCw, UserCheck, ShieldAlert } from 'lucide-react';

const StudentEnrollment = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [samples, setSamples] = useState([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [enrollmentStatus, setEnrollmentStatus] = useState({ text: '', type: '' });
  const [guidanceStep, setGuidanceStep] = useState(0);

  const webcamRef = useRef(null);
  const guidanceMessages = [
    "LOOK STRAIGHT into the camera with neutral expression",
    "Turn your head SLIGHTLY LEFT",
    "Turn your head SLIGHTLY RIGHT",
    "BLINK YOUR EYES naturally"
  ];

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const res = await studentAPI.list();
      setStudents(res.data);
      if (res.data.length > 0) {
        setSelectedStudentId(res.data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const captureSample = () => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      setSamples((prev) => [...prev, imageSrc]);
      if (guidanceStep < guidanceMessages.length - 1) {
        setGuidanceStep((prev) => prev + 1);
      }
    }
  };

  const resetCapture = () => {
    setSamples([]);
    setGuidanceStep(0);
    setEnrollmentStatus({ text: '', type: '' });
  };

  const handleSubmitEnrollment = async () => {
    if (!selectedStudentId) {
      setEnrollmentStatus({ text: 'Please select a student first.', type: 'error' });
      return;
    }
    if (samples.length === 0) {
      setEnrollmentStatus({ text: 'Please capture at least 2 face samples.', type: 'error' });
      return;
    }

    setIsCapturing(true);
    setEnrollmentStatus({ text: 'Processing AI Face Embeddings...', type: 'info' });

    try {
      const res = await studentAPI.enrollFace(selectedStudentId, samples);
      setEnrollmentStatus({
        text: `Face Enrollment Successful! Generated biometric vector from ${res.data.validSamplesCount} samples.`,
        type: 'success'
      });
      loadStudents();
    } catch (err) {
      setEnrollmentStatus({
        text: err.response?.data?.detail || 'Face enrollment failed. Please try again.',
        type: 'error'
      });
    } finally {
      setIsCapturing(false);
    }
  };

  const currentStudent = students.find((s) => s.id === selectedStudentId);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">AI Student Face Enrollment</h2>
        <p className="text-sm text-slate-400">Capture multi-angle face samples to build biometrical embedding templates</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Webcam Capture View (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col items-center">
          <div className="w-full mb-4 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Live Camera Feed</span>
            <span className="text-xs text-blue-400 font-mono">WebCam HD</span>
          </div>

          <div className="relative w-full aspect-video bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              screenshotQuality={0.8}
              className="w-full h-full object-cover"
              videoConstraints={{ width: 640, height: 480, facingMode: "user" }}
            />

            {/* Bounding box guide overlay */}
            <div className="absolute inset-0 border-2 border-dashed border-blue-500/40 rounded-full w-48 h-64 m-auto pointer-events-none flex items-center justify-center">
              <span className="text-[10px] text-blue-400/70 font-mono uppercase bg-slate-950/80 px-2 py-0.5 rounded">
                Position Face Here
              </span>
            </div>
          </div>

          {/* Guidance Banner */}
          <div className="w-full mt-4 p-3.5 bg-blue-950/40 border border-blue-800/40 rounded-xl text-center">
            <p className="text-xs font-semibold text-blue-300">
              Guidance Step {guidanceStep + 1} of {guidanceMessages.length}:
            </p>
            <p className="text-sm font-medium text-white mt-0.5">{guidanceMessages[guidanceStep]}</p>
          </div>

          {/* Controls */}
          <div className="w-full mt-4 flex items-center justify-between gap-3">
            <button
              onClick={resetCapture}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all"
            >
              <RefreshCw className="w-4 h-4" /> Reset Samples
            </button>
            <button
              onClick={captureSample}
              className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transition-all"
            >
              <Camera className="w-4 h-4" /> Capture Sample ({samples.length})
            </button>
          </div>
        </div>

        {/* Right: Enrollment Details & Samples (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Target Student Selection</h3>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Select Enrolling Student</label>
              <select
                value={selectedStudentId}
                onChange={(e) => {
                  setSelectedStudentId(e.target.value);
                  resetCapture();
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    Roll {s.rollNumber} - {s.name} ({s.hasFaceEnrolled ? 'Enrolled' : 'Pending'})
                  </option>
                ))}
              </select>
            </div>

            {currentStudent && (
              <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1 text-xs">
                <p className="text-white font-medium">{currentStudent.name}</p>
                <p className="text-slate-400">Roll No: {currentStudent.rollNumber} | Class: {currentStudent.classId}</p>
                <p className="text-slate-400">{currentStudent.email}</p>
              </div>
            )}

            <div>
              <p className="text-xs font-semibold text-slate-400 mb-2">Captured Samples ({samples.length})</p>
              <div className="grid grid-cols-4 gap-2">
                {samples.map((src, idx) => (
                  <div key={idx} className="relative aspect-square bg-slate-950 rounded-lg overflow-hidden border border-blue-500/50">
                    <img src={src} alt={`sample-${idx}`} className="w-full h-full object-cover" />
                    <span className="absolute bottom-0 right-0 bg-blue-600 text-[9px] text-white font-bold px-1 rounded-tl">#{idx + 1}</span>
                  </div>
                ))}
              </div>
            </div>

            {enrollmentStatus.text && (
              <div className={`p-3.5 rounded-xl text-xs font-medium flex items-center gap-2 ${
                enrollmentStatus.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                enrollmentStatus.type === 'error' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                'bg-blue-500/10 text-blue-400 border border-blue-500/20'
              }`}>
                {enrollmentStatus.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{enrollmentStatus.text}</span>
              </div>
            )}

            <button
              onClick={handleSubmitEnrollment}
              disabled={isCapturing || samples.length === 0}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all"
            >
              <UserCheck className="w-4 h-4" /> Save Face Embedding & Finish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentEnrollment;
