from fastapi import APIRouter, HTTPException, status
from typing import List, Dict, Any
from datetime import datetime, timezone
import uuid
from app.models.schemas import (
    SessionCreate, SessionResponse, FrameRecognitionRequest, SingleFaceRecognitionResult,
    MultiFaceRecognitionResponse, ManualAttendanceCorrection, AttendanceRecordResponse,
    ManualAttendanceSubmitRequest
)
from app.firebase.client import get_db
from app.ai.matcher import ai_matcher
from app.attendance.engine import attendance_engine

router = APIRouter(prefix="/attendance", tags=["Attendance"])

@router.post("/session", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
def start_attendance_session(req: SessionCreate):
    session_data = attendance_engine.create_session(
        class_id=req.classId,
        subject_id=req.subjectId,
        teacher_id=req.teacherId
    )
    return session_data

@router.post("/session/{session_id}/close")
def close_attendance_session(session_id: str):
    res = attendance_engine.close_session(session_id)
    return res

@router.post("/recognize-multi", response_model=MultiFaceRecognitionResponse)
def recognize_multi_faces(req: FrameRecognitionRequest):
    """
    Multi-Student AI Frame Endpoint:
    1. Detects ALL faces in frame simultaneously.
    2. Gating: Quality check (resolution, blur, lighting) + anti-spoofing liveness check.
    3. Biometric extraction with eye-landmark horizontal leveling.
    4. Evaluates all enrolled student templates with second-best candidate safety margin.
    5. Returns array of face bounding boxes and confirmed identities without marking.
    """
    db = get_db()
    session_doc = db.collection("attendance_sessions").document(req.sessionId).get()
    if not session_doc.exists:
        raise HTTPException(status_code=404, detail="Attendance session not found")
        
    session_data = session_doc.to_dict()
    class_id = session_data.get("classId")

    # Fetch enrolled students for this class with valid face templates
    student_docs = db.collection("students").where("classId", "==", class_id).get()
    enrolled_students = []
    for s_doc in student_docs:
        s_data = s_doc.to_dict()
        # Support both new multi-template array and single template
        if s_data.get("faceEmbeddings") or s_data.get("faceEmbedding"):
            enrolled_students.append(s_data)

    # Process all faces in frame independently
    multi_results = ai_matcher.process_frame_multi(
        base64_frame=req.frame,
        enrolled_students=enrolled_students,
        consecutive_blinks=req.consecutiveBlinkCount or 0
    )

    return multi_results

@router.post("/mark-confirmed")
def mark_confirmed_student(sessionId: str, studentId: str, studentName: str, rollNumber: str, confidence: float):
    """
    Atomic Backend Attendance Marking:
    Called after temporal confirmation to mark attendance with deterministic composite primary key ATT_{session_id}_{student_id}.
    """
    res = attendance_engine.mark_ai_attendance(
        session_id=sessionId,
        student_id=studentId,
        student_name=studentName,
        roll_number=rollNumber,
        confidence=confidence
    )
    return res

@router.post("/recognize", response_model=SingleFaceRecognitionResult)
def recognize_and_mark_attendance(req: FrameRecognitionRequest):
    """
    Single / Legacy Frame Recognition Endpoint with strict unknown rejection and second-best margin safety.
    """
    db = get_db()
    session_doc = db.collection("attendance_sessions").document(req.sessionId).get()
    if not session_doc.exists:
        raise HTTPException(status_code=404, detail="Attendance session not found")
        
    session_data = session_doc.to_dict()
    class_id = session_data.get("classId")

    student_docs = db.collection("students").where("classId", "==", class_id).get()
    enrolled_students = []
    for s_doc in student_docs:
        s_data = s_doc.to_dict()
        if s_data.get("faceEmbeddings") or s_data.get("faceEmbedding"):
            enrolled_students.append(s_data)

    multi_results = ai_matcher.process_frame_multi(
        base64_frame=req.frame,
        enrolled_students=enrolled_students,
        consecutive_blinks=req.consecutiveBlinkCount or 0
    )

    if multi_results["totalFaces"] == 0 or len(multi_results["results"]) == 0:
        return {
            "faceIndex": 0,
            "boundingBox": [0, 0, 0, 0],
            "recognized": False,
            "studentId": None,
            "name": None,
            "rollNumber": None,
            "confidence": 0.0,
            "secondCandidateName": None,
            "secondConfidence": 0.0,
            "margin": 0.0,
            "quality": None,
            "livenessVerified": False,
            "status": "NO_FACE",
            "message": "No face detected in camera view"
        }

    # Pick the primary / most confident recognized face
    best_face_result = max(multi_results["results"], key=lambda r: (r["recognized"], r["confidence"]))

    if not best_face_result["recognized"]:
        return best_face_result

    # If identity is confirmed, check duplicate in session
    mark_result = attendance_engine.mark_ai_attendance(
        session_id=req.sessionId,
        student_id=best_face_result["studentId"],
        student_name=best_face_result["name"],
        roll_number=best_face_result["rollNumber"],
        confidence=best_face_result["confidence"]
    )

    best_face_result["status"] = mark_result.get("status", "PRESENT")
    best_face_result["message"] = mark_result.get("message", "")
    return best_face_result

@router.post("/manual-override")
def manual_attendance_override(req: ManualAttendanceCorrection, teacher_id: str = "TEACHER_ADMIN"):
    res = attendance_engine.manual_override(
        session_id=req.sessionId,
        student_id=req.studentId,
        new_status=req.status,
        teacher_id=teacher_id,
        reason=req.reason or "Manual correction"
    )
    return res

@router.get("/session/{session_id}/records", response_model=List[AttendanceRecordResponse])
def get_session_attendance_records(session_id: str):
    db = get_db()
    docs = db.collection("attendance_records").where("sessionId", "==", session_id).get()
    records = []
    for d in docs:
        rec = d.to_dict()
        records.append({
            "id": rec.get("id"),
            "sessionId": rec.get("sessionId"),
            "studentId": rec.get("studentId"),
            "studentName": rec.get("studentName", "Unknown"),
            "rollNumber": rec.get("rollNumber", "N/A"),
            "status": rec.get("status"),
            "confidence": rec.get("confidence", 1.0),
            "method": rec.get("method", "AI_FACE"),
            "markedBy": rec.get("markedBy", "SYSTEM"),
            "timestamp": rec.get("timestamp", "")
        })
    return records

@router.post("/manual-session-submit")
def submit_manual_attendance_session(req: ManualAttendanceSubmitRequest):
    """
    Manual Classroom Attendance Register (No Webcam Fallback):
    Records entire classroom attendance batch manually with custom lecture topic notes.
    """
    db = get_db()
    now_iso = datetime.now(timezone.utc).isoformat()
    session_id = f"SES_MANUAL_{req.classId}_{req.subjectId}_{datetime.now().strftime('%Y-%m-%d_%H%M%S')}"

    # 1. Create completed session document
    session_data = {
        "id": session_id,
        "classId": req.classId,
        "subjectId": req.subjectId,
        "teacherId": req.teacherId or "USR-TEACHER-01",
        "date": req.date,
        "timeSlot": req.timeSlot or "10:00 AM - 11:00 AM",
        "topicCovered": req.topicCovered or "Regular Lecture",
        "method": "MANUAL",
        "startTime": now_iso,
        "endTime": now_iso,
        "status": "COMPLETED",
        "totalPresent": sum(1 for r in req.records if r.get("status") == "PRESENT"),
        "totalAbsent": sum(1 for r in req.records if r.get("status") == "ABSENT"),
        "totalLate": sum(1 for r in req.records if r.get("status") == "LATE"),
        "createdAt": now_iso
    }
    db.collection("attendance_sessions").document(session_id).set(session_data)

    # 2. Save individual student attendance records
    saved_records = []
    for r in req.records:
        rec_id = f"ATT_{session_id}_{r['studentId']}"
        rec_data = {
            "id": rec_id,
            "sessionId": session_id,
            "studentId": r["studentId"],
            "studentName": r.get("studentName", "Student"),
            "rollNumber": r.get("rollNumber", "N/A"),
            "classId": req.classId,
            "subjectId": req.subjectId,
            "status": r.get("status", "PRESENT"),
            "confidence": 1.0,
            "method": "MANUAL",
            "markedBy": req.teacherId or "TEACHER_MANUAL",
            "remarks": r.get("remarks", ""),
            "timestamp": now_iso
        }
        db.collection("attendance_records").document(rec_id).set(rec_data)
        saved_records.append(rec_data)

    return {
        "status": "SUCCESS",
        "sessionId": session_id,
        "message": f"Manual attendance submitted successfully! Present: {session_data['totalPresent']}, Absent: {session_data['totalAbsent']}, Late: {session_data['totalLate']}",
        "session": session_data,
        "recordsCount": len(saved_records)
    }

@router.put("/records/{record_id}")
def update_attendance_record(record_id: str, payload: Dict[str, Any]):
    """Update single attendance record status and remarks"""
    db = get_db()
    doc_ref = db.collection("attendance_records").document(record_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Attendance record not found")

    new_status = payload.get("status")
    remarks = payload.get("remarks", "")
    now_iso = datetime.now(timezone.utc).isoformat()

    doc_ref.update({
        "status": new_status,
        "remarks": remarks,
        "updatedAt": now_iso
    })
    return {"status": "SUCCESS", "message": f"Record updated to {new_status}"}

