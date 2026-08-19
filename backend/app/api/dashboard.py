from fastapi import APIRouter, HTTPException, status
from typing import Dict, Any, List
from app.models.schemas import AdminDashboardMetrics, TeacherDashboardMetrics, StudentResponse
from app.firebase.client import get_db

router = APIRouter(prefix="/dashboard", tags=["Dashboard Real-Time Metrics"])

def format_student_summary(d: Dict[str, Any]) -> Dict[str, Any]:
    embs = d.get("faceEmbeddings") or []
    emb = d.get("faceEmbedding")
    has_valid_embs = bool(embs and len(embs) > 0 and len(embs[0]) >= 500)
    has_valid_emb = bool(emb and len(emb) >= 500)
    has_enrolled = has_valid_embs or has_valid_emb or bool(d.get("hasFaceEnrolled") and (has_valid_embs or has_valid_emb))

    return {
        "id": d.get("id"),
        "rollNumber": d.get("rollNumber"),
        "name": d.get("name"),
        "email": d.get("email"),
        "classId": d.get("classId", "CLS-AIDS-3A"),
        "academicYear": d.get("academicYear", "2026-27"),
        "department": d.get("department", "AI & Data Science"),
        "program": d.get("program", "B.Tech AI & Data Science"),
        "year": d.get("year", "2nd Year"),
        "semester": d.get("semester", "Semester III"),
        "division": d.get("division", "AI-2"),
        "branch": d.get("branch", "AI & Data Science"),
        "prnNumber": d.get("prnNumber", ""),
        "phone": d.get("phone", ""),
        "whatsapp": d.get("whatsapp", ""),
        "dob": d.get("dob", ""),
        "gender": d.get("gender", ""),
        "bloodGroup": d.get("bloodGroup", ""),
        "guardianName": d.get("guardianName", ""),
        "guardianPhone": d.get("guardianPhone", ""),
        "address": d.get("address", ""),
        "emergencyContact": d.get("emergencyContact", ""),
        "hasFaceEnrolled": has_enrolled,
        "enrolledSamplesCount": len(embs) if embs else (1 if has_valid_emb else 0),
        "photoUrl": d.get("photoUrl"),
        "documents": d.get("documents", {}),
        "createdAt": d.get("createdAt")
    }

@router.get("/admin", response_model=AdminDashboardMetrics)
def get_admin_dashboard_metrics():
    """
    Single authoritative source of truth for Admin Dashboard.
    Calculates exact live metrics directly from the persistent database.
    """
    db = get_db()
    
    # 1. Total active students
    student_docs = db.collection("students").get()
    students = [d.to_dict() for d in student_docs]
    total_students = len(students)
    total_enrolled_faces = sum(1 for s in students if format_student_summary(s)["hasFaceEnrolled"])

    # 2. Total active faculty teachers
    teacher_docs = db.collection("teachers").get()
    total_teachers = len(teacher_docs)

    # 3. Total active classes
    class_docs = db.collection("classes").get()
    total_classes = len(class_docs)

    # 4. Total subjects
    subject_docs = db.collection("subjects").get()
    total_subjects = len(subject_docs)

    # 5. Total attendance sessions & overall attendance calculation
    session_docs = db.collection("attendance_sessions").get()
    total_sessions = len(session_docs)

    record_docs = db.collection("attendance_records").get()
    total_records = len(record_docs)
    total_present = sum(1 for r in record_docs if r.to_dict().get("status") == "PRESENT")
    overall_percentage = round((total_present / total_records) * 100, 1) if total_records > 0 else 0.0

    return {
        "totalStudents": total_students,
        "totalEnrolledFaces": total_enrolled_faces,
        "totalTeachers": total_teachers,
        "totalClasses": total_classes,
        "totalSubjects": total_subjects,
        "totalAttendanceSessions": total_sessions,
        "overallAttendancePercentage": overall_percentage
    }

@router.get("/teacher/{teacher_id}", response_model=TeacherDashboardMetrics)
def get_teacher_dashboard_metrics(teacher_id: str):
    """
    Single authoritative source of truth for Teacher Dashboard.
    Filters classes, subjects, enrolled students, and attendance percentage specifically for this teacher.
    """
    db = get_db()

    # Find teacher by id or email
    teacher_doc = db.collection("teachers").document(teacher_id).get()
    if not teacher_doc.exists:
        by_email = db.collection("teachers").where("email", "==", teacher_id).get()
        if len(by_email) > 0:
            teacher_doc = by_email[0]
            teacher_id = teacher_doc.id
        else:
            raise HTTPException(status_code=404, detail="Teacher profile not found")

    t_data = teacher_doc.to_dict()
    assigned_class_ids = t_data.get("assignedClasses", [])

    # 1. Fetch assigned classes
    assigned_classes = []
    for cid in assigned_class_ids:
        cdoc = db.collection("classes").document(cid).get()
        if cdoc.exists:
            assigned_classes.append(cdoc.to_dict())
        else:
            assigned_classes.append({"id": cid, "name": cid, "department": t_data.get("department", "Engineering"), "year": "2nd Year", "division": "AI-2"})

    # 2. Fetch assigned subjects taught by this teacher
    subject_docs = db.collection("subjects").where("teacherId", "==", teacher_id).get()
    assigned_subjects = [s.to_dict() for s in subject_docs]
    if len(assigned_subjects) == 0:
        # Also check by teacher email / USR-TEACHER-01
        fallback_subjs = db.collection("subjects").where("teacherId", "==", "USR-TEACHER-01").get()
        assigned_subjects = [s.to_dict() for s in fallback_subjs]

    # 3. Fetch students belonging to the teacher's assigned classes
    teacher_students = []
    if len(assigned_class_ids) > 0:
        for cid in assigned_class_ids:
            sdocs = db.collection("students").where("classId", "==", cid).get()
            for s in sdocs:
                teacher_students.append(format_student_summary(s.to_dict()))
    else:
        # All classes
        sdocs = db.collection("students").get()
        for s in sdocs:
            teacher_students.append(format_student_summary(s.to_dict()))

    # Remove duplicates by student ID
    unique_students_map = {s["id"]: s for s in teacher_students}
    unique_students = list(unique_students_map.values())

    # 4. Calculate actual attendance rate for this teacher's sessions
    session_docs = db.collection("attendance_sessions").where("teacherId", "==", teacher_id).get()
    total_sessions_conducted = len(session_docs)

    teacher_session_ids = [s.id for s in session_docs]
    all_teacher_records = []
    for sid in teacher_session_ids:
        r_docs = db.collection("attendance_records").where("sessionId", "==", sid).get()
        all_teacher_records.extend([r.to_dict() for r in r_docs])

    total_recs = len(all_teacher_records)
    total_pres = sum(1 for r in all_teacher_records if r.get("status") == "PRESENT")
    avg_percentage = round((total_pres / total_recs) * 100, 1) if total_recs > 0 else 0.0

    return {
        "teacherId": teacher_id,
        "assignedClasses": assigned_classes,
        "assignedSubjects": assigned_subjects,
        "enrolledStudentsCount": len(unique_students),
        "averageAttendancePercentage": avg_percentage,
        "totalSessionsConducted": total_sessions_conducted,
        "students": unique_students
    }
