from datetime import datetime, timezone
import threading
from typing import Dict, Any, List, Optional
from app.firebase.client import get_db
from app.models.schemas import AttendanceMethod, AttendanceStatus

class AttendanceEngine:
    def __init__(self):
        self._lock = threading.Lock()

    def create_session(self, class_id: str, subject_id: str, teacher_id: str) -> Dict[str, Any]:
        """Start a new attendance session with a deterministic, unique ID"""
        with self._lock:
            db = get_db()
            date_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
            time_str = datetime.now(timezone.utc).strftime("%H%M%S")
            session_id = f"SES_{class_id}_{subject_id}_{date_str}_{time_str}"
            now_str = datetime.now(timezone.utc).isoformat()
            
            session_data = {
                "id": session_id,
                "classId": class_id,
                "subjectId": subject_id,
                "teacherId": teacher_id,
                "date": date_str,
                "startTime": now_str,
                "endTime": None,
                "status": "ACTIVE",
                "createdAt": now_str,
                "updatedAt": now_str
            }
            
            db.collection("attendance_sessions").document(session_id).set(session_data)
            print(f"[ATTENDANCE-ENGINE] Created Session: {session_id} for Class={class_id}, Subject={subject_id}")
            return session_data

    def mark_ai_attendance(self, session_id: str, student_id: str, student_name: str, roll_number: str, confidence: float) -> Dict[str, Any]:
        """
        Mark attendance via AI Face Recognition with deterministic composite keys and thread-safe duplicate immunity.
        Enforces Rule: Strictly ONE attendance record per student per session.
        Deterministic doc_id: ATT_{session_id}_{student_id}
        """
        with self._lock:
            db = get_db()
            doc_id = f"ATT_{session_id}_{student_id}"
            
            # 1. Verify session exists and is ACTIVE
            session_doc = db.collection("attendance_sessions").document(session_id).get()
            if not session_doc.exists:
                print(f"[ATTENDANCE-ENGINE] Session not found: {session_id}")
                return {"status": "INVALID_SESSION", "message": "Attendance session not found"}
            
            session_data = session_doc.to_dict()
            if session_data.get("status") != "ACTIVE":
                print(f"[ATTENDANCE-ENGINE] Session is closed: {session_id}")
                return {"status": "SESSION_CLOSED", "message": "Attendance session is no longer active"}

            # 2. Check deterministic primary key record
            rec_doc = db.collection("attendance_records").document(doc_id).get()
            if rec_doc.exists:
                existing_record = rec_doc.to_dict()
                print(f"[ATTENDANCE-ENGINE] [DUPLICATE-PREVENTED] Student {student_name} (ID: {student_id}) already marked in session {session_id}")
                return {
                    "status": "ALREADY_MARKED",
                    "already_marked": True,
                    "message": f"Attendance already marked for {student_name} (Roll No: {roll_number})",
                    "record": existing_record
                }

            # 3. Create new attendance record with deterministic document ID
            now_str = datetime.now(timezone.utc).isoformat()
            
            record_data = {
                "id": doc_id,
                "sessionId": session_id,
                "studentId": student_id,
                "studentName": student_name,
                "rollNumber": roll_number,
                "classId": session_data.get("classId", ""),
                "subjectId": session_data.get("subjectId", ""),
                "date": session_data.get("date", datetime.now(timezone.utc).strftime("%Y-%m-%d")),
                "status": AttendanceStatus.PRESENT,
                "confidence": round(confidence, 4),
                "method": AttendanceMethod.AI_FACE,
                "markedBy": session_data.get("teacherId", "AI_SYSTEM"),
                "timestamp": now_str,
                "createdAt": now_str
            }
            
            db.collection("attendance_records").document(doc_id).set(record_data)
            print(f"[ATTENDANCE-ENGINE] [RECORD-CREATED] Marked PRESENT for {student_name} (Roll: {roll_number}, DocID: {doc_id}, Confidence: {int(confidence*100)}%)")
            
            return {
                "status": "SUCCESS",
                "already_marked": False,
                "message": f"Attendance marked for {student_name} (Roll No: {roll_number})",
                "record": record_data
            }

    def manual_override(self, session_id: str, student_id: str, new_status: AttendanceStatus, teacher_id: str, reason: str = "") -> Dict[str, Any]:
        """Manual attendance status correction by teacher with audit log"""
        with self._lock:
            db = get_db()
            doc_id = f"ATT_{session_id}_{student_id}"
            
            # Fetch student details
            student_doc = db.collection("students").document(student_id).get()
            student_data = student_doc.to_dict() if student_doc.exists else {}
            student_name = student_data.get("name", "Unknown Student")
            roll_number = student_data.get("rollNumber", "N/A")

            now_str = datetime.now(timezone.utc).isoformat()
            rec_doc = db.collection("attendance_records").document(doc_id).get()

            if rec_doc.exists:
                old_status = rec_doc.to_dict().get("status", "NONE")
                db.collection("attendance_records").document(doc_id).update({
                    "status": new_status,
                    "method": AttendanceMethod.MANUAL,
                    "markedBy": teacher_id,
                    "timestamp": now_str
                })
            else:
                old_status = "NONE"
                session_doc = db.collection("attendance_sessions").document(session_id).get()
                session_data = session_doc.to_dict() if session_doc.exists else {}
                
                rec_data = {
                    "id": doc_id,
                    "sessionId": session_id,
                    "studentId": student_id,
                    "studentName": student_name,
                    "rollNumber": roll_number,
                    "classId": session_data.get("classId", ""),
                    "subjectId": session_data.get("subjectId", ""),
                    "date": session_data.get("date", datetime.now(timezone.utc).strftime("%Y-%m-%d")),
                    "status": new_status,
                    "confidence": 1.0,
                    "method": AttendanceMethod.MANUAL,
                    "markedBy": teacher_id,
                    "timestamp": now_str,
                    "createdAt": now_str
                }
                db.collection("attendance_records").document(doc_id).set(rec_data)

            # Audit Log Entry
            import uuid
            audit_id = f"AUD_{session_id}_{uuid.uuid4().hex[:6]}"
            audit_data = {
                "id": audit_id,
                "sessionId": session_id,
                "studentId": student_id,
                "teacherId": teacher_id,
                "oldStatus": old_status,
                "newStatus": new_status,
                "reason": reason or "Teacher manual correction",
                "timestamp": now_str
            }
            db.collection("audit_logs").document(audit_id).set(audit_data)
            print(f"[ATTENDANCE-ENGINE] [MANUAL-OVERRIDE] {student_name} -> {new_status} by {teacher_id}")

            return {
                "status": "SUCCESS",
                "message": f"Attendance for {student_name} manually set to {new_status}",
                "recordId": doc_id
            }

    def close_session(self, session_id: str) -> Dict[str, Any]:
        """Close an active attendance session"""
        with self._lock:
            db = get_db()
            now_str = datetime.now(timezone.utc).isoformat()
            db.collection("attendance_sessions").document(session_id).update({
                "status": "COMPLETED",
                "endTime": now_str
            })
            print(f"[ATTENDANCE-ENGINE] Closed Session: {session_id}")
            return {"status": "SUCCESS", "message": "Session completed successfully"}

attendance_engine = AttendanceEngine()
