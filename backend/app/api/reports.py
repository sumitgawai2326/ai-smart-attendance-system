from fastapi import APIRouter, Query, Response, HTTPException
from typing import Optional, List, Dict, Any
import csv
import io
from app.firebase.client import get_db

router = APIRouter(prefix="/reports", tags=["Reports & Analytics"])

@router.get("/student/{student_id}/summary")
def get_student_attendance_summary(student_id: str):
    """
    Authoritative student attendance summary.
    Calculates exact live metrics directly from attendance_records and attendance_sessions in the database.
    """
    db = get_db()
    
    # 1. Fetch student info
    student_doc = db.collection("students").document(student_id).get()
    if not student_doc.exists:
        by_email = db.collection("students").where("email", "==", student_id).get()
        if len(by_email) > 0:
            student_doc = by_email[0]
        else:
            raise HTTPException(status_code=404, detail="Student not found")

    student_data = student_doc.to_dict()
    real_student_id = student_doc.id
    class_id = student_data.get("classId")

    # 2. Fetch subjects for this student's class
    subjects_docs = db.collection("subjects").where("classId", "==", class_id).get() if class_id else []
    subjects = [s.to_dict() for s in subjects_docs]
    if len(subjects) == 0:
        subjects = [s.to_dict() for s in db.collection("subjects").get()]

    # 3. Fetch actual attendance records for this student
    records_docs = db.collection("attendance_records").where("studentId", "==", real_student_id).get()
    student_records = [r.to_dict() for r in records_docs]

    subject_stats = []
    total_conducted_all = 0
    total_attended_all = 0

    for subj in subjects:
        subj_id = subj.get("id")
        sessions_docs = db.collection("attendance_sessions").where("subjectId", "==", subj_id).get()
        total_sessions = len(sessions_docs)

        attended_count = len([r for r in student_records if r.get("subjectId") == subj_id and r.get("status") == "PRESENT"])
        percentage = round((attended_count / total_sessions) * 100, 1) if total_sessions > 0 else 0.0

        subject_stats.append({
            "subjectId": subj_id,
            "subjectCode": subj.get("code", "SUBJ"),
            "subjectName": subj.get("name"),
            "attended": attended_count,
            "total": total_sessions,
            "percentage": percentage
        })

        total_conducted_all += total_sessions
        total_attended_all += attended_count

    overall_percentage = round((total_attended_all / total_conducted_all) * 100, 1) if total_conducted_all > 0 else 0.0

    return {
        "student": {
            "id": real_student_id,
            "name": student_data.get("name"),
            "rollNumber": student_data.get("rollNumber"),
            "classId": class_id,
            "department": student_data.get("department", "AI & Data Science"),
            "division": student_data.get("division", "AI-2")
        },
        "overallPercentage": overall_percentage,
        "totalAttended": total_attended_all,
        "totalConducted": total_conducted_all,
        "isLowAttendance": overall_percentage < 75.0 and total_conducted_all > 0,
        "subjectStats": subject_stats,
        "recentRecords": student_records[:15]
    }

@router.get("/defaulters")
def get_defaulters_list(class_id: Optional[str] = None, threshold: float = 75.0):
    """
    Returns list of students with attendance below threshold (default 75%).
    """
    db = get_db()
    st_ref = db.collection("students")
    st_docs = st_ref.where("classId", "==", class_id).get() if class_id else st_ref.get()

    defaulters = []
    for s_doc in st_docs:
        s_data = s_doc.to_dict()
        sid = s_doc.id
        summary = get_student_attendance_summary(sid)
        if summary.get("totalConducted", 0) > 0 and summary.get("overallPercentage", 0.0) < threshold:
            defaulters.append({
                "studentId": sid,
                "name": s_data.get("name"),
                "rollNumber": s_data.get("rollNumber"),
                "email": s_data.get("email"),
                "classId": s_data.get("classId"),
                "attendancePercentage": summary.get("overallPercentage"),
                "attended": summary.get("totalAttended"),
                "conducted": summary.get("totalConducted")
            })

    return defaulters

@router.get("/export/csv")
def export_attendance_csv(class_id: Optional[str] = None, subject_id: Optional[str] = None):
    db = get_db()
    ref = db.collection("attendance_records")
    
    if class_id and subject_id:
        docs = ref.where("classId", "==", class_id).where("subjectId", "==", subject_id).get()
    elif class_id:
        docs = ref.where("classId", "==", class_id).get()
    else:
        docs = ref.get()

    records = [d.to_dict() for d in docs]

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Record ID", "Session ID", "Student ID", "Student Name", "Roll Number",
        "Class ID", "Subject ID", "Status", "Confidence %", "Method", "Marked By", "Timestamp"
    ])

    for r in records:
        conf_pct = f"{int(r.get('confidence', 1.0) * 100)}%"
        writer.writerow([
            r.get("id", ""),
            r.get("sessionId", ""),
            r.get("studentId", ""),
            r.get("studentName", ""),
            r.get("rollNumber", ""),
            r.get("classId", ""),
            r.get("subjectId", ""),
            r.get("status", ""),
            conf_pct,
            r.get("method", ""),
            r.get("markedBy", ""),
            r.get("timestamp", "")
        ])

    csv_content = output.getvalue()
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=attendance_report.csv"}
    )
