from fastapi import APIRouter, HTTPException, status
from typing import List, Optional
import uuid
from datetime import datetime, timezone
from app.models.schemas import SubjectCreate, SubjectResponse
from app.firebase.client import get_db

router = APIRouter(prefix="/subjects", tags=["Subjects & Courses"])

@router.post("", response_model=SubjectResponse, status_code=status.HTTP_201_CREATED)
def create_subject(s_in: SubjectCreate):
    db = get_db()
    subj_code = s_in.code.strip().replace(' ', '').upper()
    subj_id = f"SBJ-{subj_code}"
    if db.collection("subjects").document(subj_id).get().exists:
        subj_id = f"SBJ-{subj_code}-{uuid.uuid4().hex[:4].upper()}"

    s_data = {
        "id": subj_id,
        "code": subj_code,
        "name": s_in.name.strip(),
        "classId": s_in.classId,
        "credits": s_in.credits or 4,
        "department": s_in.department or "",
        "program": s_in.program or "",
        "year": s_in.year or "",
        "semester": s_in.semester or "Semester III",
        "division": s_in.division or "",
        "teacherId": s_in.teacherId or "USR-TEACHER-01",
        "createdAt": datetime.now(timezone.utc).isoformat()
    }
    db.collection("subjects").document(subj_id).set(s_data)
    return s_data

@router.get("", response_model=List[SubjectResponse])
def list_subjects(
    class_id: Optional[str] = None,
    teacher_id: Optional[str] = None,
    semester: Optional[str] = None,
    department: Optional[str] = None,
    program: Optional[str] = None,
    year: Optional[str] = None
):
    db = get_db()
    ref = db.collection("subjects")
    docs = ref.get()
    subjects = [d.to_dict() for d in docs]
    
    if len(subjects) == 0:
        default_subjs = [
            {"id": "SBJ-DSA", "code": "CS301", "name": "Data Structures & Algorithms", "classId": "CLS-AIDA-AI-2", "credits": 4, "department": "Artificial Intelligence & Data Science", "program": "B.Tech in Artificial Intelligence & Data Science", "year": "2nd Year", "semester": "Semester III", "division": "AI-2", "teacherId": "USR-TEACHER-01", "createdAt": datetime.now(timezone.utc).isoformat()},
            {"id": "SBJ-DBMS", "code": "CS302", "name": "Database Management Systems", "classId": "CLS-AIDA-AI-2", "credits": 4, "department": "Artificial Intelligence & Data Science", "program": "B.Tech in Artificial Intelligence & Data Science", "year": "2nd Year", "semester": "Semester III", "division": "AI-2", "teacherId": "USR-TEACHER-01", "createdAt": datetime.now(timezone.utc).isoformat()},
            {"id": "SBJ-AI", "code": "AI303", "name": "Artificial Intelligence & ML", "classId": "CLS-AIDA-AI-2", "credits": 4, "department": "Artificial Intelligence & Data Science", "program": "B.Tech in Artificial Intelligence & Data Science", "year": "2nd Year", "semester": "Semester III", "division": "AI-2", "teacherId": "USR-TEACHER-01", "createdAt": datetime.now(timezone.utc).isoformat()}
        ]
        for s in default_subjs:
            db.collection("subjects").document(s["id"]).set(s)
            subjects.append(s)

    if class_id and class_id != "ALL":
        subjects = [s for s in subjects if s.get("classId") == class_id]
    if teacher_id and teacher_id != "ALL":
        subjects = [s for s in subjects if s.get("teacherId") == teacher_id or s.get("teacherId") == "USR-TEACHER-01"]
    if semester and semester != "ALL":
        subjects = [s for s in subjects if s.get("semester") == semester]
    if department and department != "ALL":
        subjects = [s for s in subjects if s.get("department") in (department, "", None)]
    if program and program != "ALL":
        subjects = [s for s in subjects if s.get("program") in (program, "", None)]
    if year and year != "ALL":
        subjects = [s for s in subjects if s.get("year") in (year, "", None)]

    return subjects

@router.put("/{subject_id}", response_model=SubjectResponse)
def update_subject(subject_id: str, s_in: SubjectCreate):
    db = get_db()
    doc_ref = db.collection("subjects").document(subject_id)
    if not doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    update_data = {
        "code": s_in.code.strip().upper(),
        "name": s_in.name.strip(),
        "classId": s_in.classId,
        "credits": s_in.credits or 4,
        "department": s_in.department or "",
        "program": s_in.program or "",
        "year": s_in.year or "",
        "semester": s_in.semester or "Semester III",
        "division": s_in.division or "",
        "teacherId": s_in.teacherId or "USR-TEACHER-01",
        "updatedAt": datetime.now(timezone.utc).isoformat()
    }
    doc_ref.update(update_data)
    return doc_ref.get().to_dict()

@router.delete("/{subject_id}")
def delete_subject(subject_id: str):
    db = get_db()
    doc_ref = db.collection("subjects").document(subject_id)
    if not doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="Subject not found")
    doc_ref.delete()
    return {"status": "SUCCESS", "message": f"Subject '{subject_id}' deleted successfully."}
