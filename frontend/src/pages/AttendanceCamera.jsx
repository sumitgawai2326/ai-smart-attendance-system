import React, { useState, useRef, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import { attendanceAPI, classAPI, subjectAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Play, Pause, Square, CheckCircle2, AlertTriangle, ShieldCheck, UserX, Clock, Edit2, Info, Eye, Layers } from 'lucide-react';

// Helper: Calculate Bounding Box IoU (Intersection-over-Union)
function computeIoU(boxA, boxB) {
  if (!boxA || !boxB) return 0;
  const [xA, yA, wA, hA] = boxA;
  const [xB, yB, wB, hB] = boxB;
  const x1 = Math.max(xA, xB);
  const y1 = Math.max(yA, yB);
  const x2 = Math.min(xA + wA, xB + wB);
  const y2 = Math.min(yA + hA, yB + hB);
  const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const areaA = wA * hA;
  const areaB = wB * hB;
  const union = areaA + areaB - inter;
  return union > 0 ? inter / union : 0;
}

const AttendanceCamera = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [yearLevels, setYearLevels] = useState([]);
  const [semesters, setSemesters] = useState([]);

  const [selectedAY, setSelectedAY] = useState('ALL');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedYear, setSelectedYear] = useState('ALL');
  const [selectedSem, setSelectedSem] = useState('ALL');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

  // Session State
  const [sessionId, setSessionId] = useState(null);
  const [sessionActive, setSessionActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [records, setRecords] = useState([]);
  const [diagnosticMode, setDiagnosticMode] = useState(false);

  // Multi-Face Tracking State for Overlay Bounding Boxes
  const [activeTracks, setActiveTracks] = useState([]);
  const tracksRef = useRef({}); // { [trackId]: { trackId, bbox, candidateId, name, rollNumber, confidence, margin, status, consecutiveMatches, missedFrames, quality } }
  const nextTrackIdRef = useRef(1);

  const webcamRef = useRef(null);
  const intervalRef = useRef(null);
  const isProcessingRef = useRef(false);
  const markedStudentIdsRef = useRef(new Set());

  useEffect(() => {
    loadAcademicData();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const loadAcademicData = async () => {
    try {
      const [cRes, sRes, ayRes, dpRes, ylRes, smRes] = await Promise.all([
        classAPI.list(),
        subjectAPI.list(),
        import('../services/api').then(m => m.academicAPI.listYears()),
        import('../services/api').then(m => m.academicAPI.listDepartments()),
        import('../services/api').then(m => m.academicAPI.listYearLevels()),
        import('../services/api').then(m => m.academicAPI.listSemesters())
      ]);
      setClasses(cRes.data);
      setSubjects(sRes.data);
      setAcademicYears(ayRes.data);
      setDepartments(dpRes.data);
      setYearLevels(ylRes.data);
      setSemesters(smRes.data);

      if (cRes.data.length > 0 && !selectedClass) setSelectedClass(cRes.data[0].id);
      if (sRes.data.length > 0 && !selectedSubject) setSelectedSubject(sRes.data[0].id);
    } catch (err) {
      console.error('Error loading academic data:', err);
    }
  };

  const filteredClasses = classes.filter(c => {
    if (selectedAY !== 'ALL' && c.academicYear && c.academicYear !== selectedAY) return false;
    if (selectedDept !== 'ALL' && c.department && c.department !== selectedDept) return false;
    if (selectedYear !== 'ALL' && c.year && c.year !== selectedYear) return false;
    if (selectedSem !== 'ALL' && c.semester && c.semester !== selectedSem) return false;
    return true;
  });

  const filteredSubjects = subjects.filter(s => {
    if (selectedClass && s.classId && s.classId !== selectedClass && s.classId !== 'ALL') return false;
    return true;
  });

  const startSession = async () => {
    try {
      const teacherId = user?.id || 'USR-TEACHER-01';
      const res = await attendanceAPI.startSession(selectedClass, selectedSubject, teacherId);
      const newSessionId = res.data.id;
      setSessionId(newSessionId);
      setSessionActive(true);
      setIsPaused(false);
      setRecords([]);
      markedStudentIdsRef.current = new Set();
      tracksRef.current = {};
      setActiveTracks([]);

      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        processMultiFrame(newSessionId);
      }, 1200);
    } catch (err) {
      alert('Failed to start session: ' + (err.response?.data?.detail || err.message));
    }
  };

  const pauseSession = () => {
    setIsPaused(true);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const resumeSession = () => {
    setIsPaused(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      processMultiFrame(sessionId);
    }, 1200);
  };

  const stopSession = async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (sessionId) {
      try {
        await attendanceAPI.closeSession(sessionId);
      } catch (err) {
        console.error(err);
      }
    }
    setSessionActive(false);
    setIsPaused(false);
    isProcessingRef.current = false;
    tracksRef.current = {};
    setActiveTracks([]);
  };

  const processMultiFrame = async (activeSessionId) => {
    const currentSid = activeSessionId || sessionId;
    if (!currentSid || isProcessingRef.current || !webcamRef.current || isPaused) return;

    const frameBase64 = webcamRef.current.getScreenshot();
    if (!frameBase64) return;

    isProcessingRef.current = true;

    try {
      const res = await attendanceAPI.recognizeMultiFrame(currentSid, frameBase64, 1);
      const data = res.data;
      const detectedResults = data.results || [];

      // Multi-Face IoU Tracker Association
      const updatedTracks = { ...tracksRef.current };
      const matchedTrackIds = new Set();

      // Step 1: Associate each detected face with an existing track via IoU
      detectedResults.forEach((detection) => {
        let bestIoU = 0.25; // Minimum IoU threshold to consider same person
        let matchedTrackId = null;

        Object.keys(updatedTracks).forEach((tId) => {
          const iou = computeIoU(detection.boundingBox, updatedTracks[tId].bbox);
          if (iou > bestIoU) {
            bestIoU = iou;
            matchedTrackId = tId;
          }
        });

        if (!matchedTrackId) {
          // New face appeared -> allocate new unique track ID
          const newId = `T${nextTrackIdRef.current++}`;
          matchedTrackId = newId;
          updatedTracks[newId] = {
            trackId: newId,
            bbox: detection.boundingBox,
            candidateId: detection.studentId,
            name: detection.name,
            rollNumber: detection.rollNumber,
            confidence: detection.confidence,
            secondCandidateName: detection.secondCandidateName,
            secondConfidence: detection.secondConfidence,
            margin: detection.margin,
            quality: detection.quality,
            status: detection.status,
            message: detection.message,
            consecutiveMatches: detection.recognized ? 1 : 0,
            missedFrames: 0
          };
        } else {
          // Existing track updated
          const track = updatedTracks[matchedTrackId];
          track.bbox = detection.boundingBox;
          track.confidence = detection.confidence;
          track.secondCandidateName = detection.secondCandidateName;
          track.secondConfidence = detection.secondConfidence;
          track.margin = detection.margin;
          track.quality = detection.quality;
          track.status = detection.status;
          track.message = detection.message;
          track.missedFrames = 0;

          if (detection.recognized && detection.studentId === track.candidateId) {
            track.consecutiveMatches += 1;
          } else if (detection.recognized) {
            track.candidateId = detection.studentId;
            track.name = detection.name;
            track.rollNumber = detection.rollNumber;
            track.consecutiveMatches = 1;
          } else {
            track.candidateId = null;
            track.name = detection.name;
            track.rollNumber = detection.rollNumber;
            track.consecutiveMatches = 0;
          }
        }

        matchedTrackIds.add(matchedTrackId);

        // Step 2: Temporal Confirmation & Attendance Marking
        const track = updatedTracks[matchedTrackId];
        const isAlreadyMarked = track.candidateId && markedStudentIdsRef.current.has(track.candidateId);

        if (isAlreadyMarked) {
          track.status = 'ALREADY_MARKED';
        } else if (track.consecutiveMatches >= 2 && track.candidateId) {
          // CONFIRMED across 2 consecutive frames -> Commit attendance to backend
          commitAttendanceForTrack(currentSid, track);
        }
      });

      // Step 3: Age out disappearing tracks
      Object.keys(updatedTracks).forEach((tId) => {
        if (!matchedTrackIds.has(tId)) {
          updatedTracks[tId].missedFrames += 1;
          if (updatedTracks[tId].missedFrames >= 3) {
            delete updatedTracks[tId];
          }
        }
      });

      tracksRef.current = updatedTracks;
      setActiveTracks(Object.values(updatedTracks));

    } catch (err) {
      console.error('[CAMERA] Multi-frame processing error:', err);
    } finally {
      isProcessingRef.current = false;
    }
  };

  const commitAttendanceForTrack = async (currentSid, track) => {
    if (!track.candidateId || markedStudentIdsRef.current.has(track.candidateId)) return;
    
    // Mark student ID in local set immediately to prevent duplicate requests
    markedStudentIdsRef.current.add(track.candidateId);

    try {
      const res = await attendanceAPI.markConfirmedStudent(
        currentSid,
        track.candidateId,
        track.name,
        track.rollNumber,
        track.confidence
      );
      if (res.data.status === 'SUCCESS' || res.data.status === 'ALREADY_MARKED') {
        track.status = 'PRESENT';
        refreshRecords(currentSid);
      }
    } catch (err) {
      console.error('[ATTENDANCE-COMMIT] Failed:', err);
      markedStudentIdsRef.current.delete(track.candidateId); // Allow retry on failure
    }
  };

  const refreshRecords = async (sid) => {
    try {
      const res = await attendanceAPI.getSessionRecords(sid);
      setRecords(res.data);
      res.data.forEach(r => {
        if (r.studentId && r.status === 'PRESENT') {
          markedStudentIdsRef.current.add(r.studentId);
        }
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleManualOverride = async (studentId, currentStatus) => {
    const newStatus = currentStatus === 'PRESENT' ? 'ABSENT' : 'PRESENT';
    try {
      await attendanceAPI.manualOverride(sessionId, studentId, newStatus, user?.name || 'Teacher Override');
      if (newStatus === 'PRESENT') {
        markedStudentIdsRef.current.add(studentId);
      } else {
        markedStudentIdsRef.current.delete(studentId);
      }
      refreshRecords(sessionId);
    } catch (err) {
      console.error('Manual correction failed.', err);
    }
  };

  // Convert bounding box relative coordinates to percentage for responsive SVG overlay
  const renderBoundingBoxes = () => {
    if (!sessionActive || activeTracks.length === 0) return null;

    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 640 480" preserveAspectRatio="none">
        {activeTracks.map((track) => {
          if (!track.bbox || track.bbox.length < 4) return null;
          const [x, y, w, h] = track.bbox;

          let strokeColor = '#ef4444'; // Red for Unknown
          let badgeBg = 'bg-rose-600';
          let labelText = 'Unknown Student';

          if (track.status === 'PRESENT' || track.status === 'CONFIRMED') {
            strokeColor = '#10b981'; // Green
            badgeBg = 'bg-emerald-600';
            labelText = `${track.name} (${Math.round(track.confidence * 100)}%) ✓`;
          } else if (track.status === 'ALREADY_MARKED') {
            strokeColor = '#3b82f6'; // Blue
            badgeBg = 'bg-blue-600';
            labelText = `${track.name} (Already Marked)`;
          } else if (track.status === 'AMBIGUOUS') {
            strokeColor = '#f59e0b'; // Yellow
            badgeBg = 'bg-amber-600';
            labelText = 'Ambiguous - Look at Camera';
          } else if (track.status === 'LOW_QUALITY') {
            strokeColor = '#f97316'; // Orange
            badgeBg = 'bg-orange-600';
            labelText = 'Move Closer';
          } else if (track.status === 'LIVENESS_FAILED') {
            strokeColor = '#ec4899';
            badgeBg = 'bg-pink-600';
            labelText = 'Liveness Check';
          }

          return (
            <g key={track.trackId}>
              {/* Bounding Box */}
              <rect
                x={x}
                y={y}
                width={w}
                height={h}
                fill="none"
                stroke={strokeColor}
                strokeWidth="2.5"
                rx="8"
                className="transition-all duration-200"
              />

              {/* Tag Label Background & Text */}
              <foreignObject x={x} y={Math.max(0, y - 28)} width={Math.max(w, 180)} height="26">
                <div className="flex items-center">
                  <span className={`text-[10px] font-semibold font-mono text-white px-2 py-0.5 rounded-md shadow-md ${badgeBg} truncate`}>
                    [{track.trackId}] {labelText}
                  </span>
                </div>
              </foreignObject>
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Class Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">AI Multi-Student Smart Attendance Camera</h2>
          <p className="text-sm text-slate-400">Simultaneous multi-face detection, IoU tracking, anti-spoofing & second-best margin safety</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Academic Year */}
          <select
            disabled={sessionActive}
            value={selectedAY}
            onChange={(e) => setSelectedAY(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white disabled:opacity-50"
          >
            <option value="ALL">All Academic Years</option>
            {academicYears.map(ay => <option key={ay.id} value={ay.year}>{ay.year}</option>)}
          </select>

          {/* Department */}
          <select
            disabled={sessionActive}
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white disabled:opacity-50"
          >
            <option value="ALL">All Departments</option>
            {departments.map(d => <option key={d.id} value={d.name}>{d.name} ({d.code})</option>)}
          </select>

          {/* Class / Division */}
          <select
            disabled={sessionActive}
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white disabled:opacity-50 font-medium"
          >
            {filteredClasses.map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({c.division})</option>
            ))}
          </select>

          {/* Subject */}
          <select
            disabled={sessionActive}
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white disabled:opacity-50 font-medium"
          >
            {filteredSubjects.map((s) => (
              <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
            ))}
          </select>

          {/* Diagnostic Toggle Button */}
          <button
            onClick={() => setDiagnosticMode(!diagnosticMode)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all flex items-center gap-1.5 ${
              diagnosticMode ? 'bg-purple-600/20 text-purple-400 border-purple-500/30' : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Diagnostic {diagnosticMode ? 'ON' : 'OFF'}
          </button>

          {!sessionActive ? (
            <button
              onClick={startSession}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all"
            >
              <Play className="w-4 h-4 fill-white" /> START ATTENDANCE
            </button>
          ) : (
            <div className="flex items-center gap-2">
              {isPaused ? (
                <button
                  onClick={resumeSession}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5"
                >
                  <Play className="w-4 h-4" /> RESUME
                </button>
              ) : (
                <button
                  onClick={pauseSession}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5"
                >
                  <Pause className="w-4 h-4" /> PAUSE
                </button>
              )}
              <button
                onClick={stopSession}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-lg shadow-rose-600/20"
              >
                <Square className="w-4 h-4 fill-white" /> STOP SESSION
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Dual Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT PANEL: Live Camera Stream with Multi-Face Overlays (7 Cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${sessionActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`}></span>
              Multi-Face Stream ({activeTracks.length} Detected)
            </span>
            <span className="text-xs font-mono text-slate-400">
              Session ID: {sessionId || 'N/A'}
            </span>
          </div>

          <div className="relative aspect-video bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
            {sessionActive ? (
              <>
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  screenshotQuality={0.75}
                  className="w-full h-full object-cover"
                  videoConstraints={{ width: 640, height: 480, facingMode: "user" }}
                />
                {renderBoundingBoxes()}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-8">
                <ShieldCheck className="w-12 h-12 text-slate-700 mb-2" />
                <p className="text-sm text-slate-400">Camera offline. Click START ATTENDANCE to begin multi-student recognition.</p>
              </div>
            )}
          </div>

          {/* Diagnostic Inspection Box (Development Mode) */}
          {diagnosticMode && activeTracks.length > 0 && (
            <div className="bg-slate-950 border border-purple-500/30 rounded-2xl p-4 space-y-2">
              <h4 className="text-xs font-bold text-purple-400 flex items-center gap-1.5 uppercase tracking-wider">
                <Info className="w-3.5 h-3.5" /> Biometric Diagnostic Inspector
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-slate-300">
                {activeTracks.map((t) => (
                  <div key={t.trackId} className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 space-y-1">
                    <p className="font-mono font-bold text-white flex justify-between">
                      <span>Track: {t.trackId}</span>
                      <span className="text-purple-400">{t.status}</span>
                    </p>
                    <p>Candidate 1: <strong className="text-emerald-400">{t.name || 'None'}</strong> (Score: {Math.round(t.confidence * 100)}%)</p>
                    <p>Candidate 2: <strong className="text-slate-400">{t.secondCandidateName || 'None'}</strong> (Score: {Math.round((t.secondConfidence || 0) * 100)}%)</p>
                    <p>Safety Margin: <strong className="text-blue-400">{Math.round((t.margin || 0) * 100)}%</strong> (Min Req: 8%)</p>
                    <p>Consecutive Frames: <strong className="text-amber-400">{t.consecutiveMatches}</strong></p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Counters Footer */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-center">
              <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">Present Marked</p>
              <p className="text-xl font-bold text-emerald-400 mt-0.5">{records.filter(r => r.status === 'PRESENT').length}</p>
            </div>
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-center">
              <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">Faces in View</p>
              <p className="text-xl font-bold text-blue-400 mt-0.5">{activeTracks.length}</p>
            </div>
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-center">
              <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">Unknown Rejected</p>
              <p className="text-xl font-bold text-rose-400 mt-0.5">{activeTracks.filter(t => t.status === 'UNKNOWN').length}</p>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Live Attendance Log Table (5 Cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Live Attendance Log</h3>
            <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-0.5 rounded-full font-mono">
              {records.length} Recorded
            </span>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[460px] space-y-2 pr-1">
            {records.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                No attendance marked yet in this session.
              </div>
            ) : (
              records.map((r) => (
                <div key={r.id} className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between hover:border-slate-700 transition-all">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-white">{r.studentName}</span>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">Roll {r.rollNumber}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                      <span>Method: <strong className="text-blue-400">{r.method}</strong></span>
                      <span>• Confidence: <strong className="text-emerald-400">{Math.round(r.confidence * 100)}%</strong></span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                      r.status === 'PRESENT' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {r.status}
                    </span>
                    <button
                      onClick={() => handleManualOverride(r.studentId, r.status)}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-all"
                      title="Manual Override (Change Status)"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceCamera;
