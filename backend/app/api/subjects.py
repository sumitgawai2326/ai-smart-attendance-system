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
    subj_id = f"SBJ-{s_in.code.strip().replace(' ', '').upper()}"
    if db.collection("subjects").document(subj_id).get().exists:
        subj_id = f"SBJ-{uuid.uuid4().hex[:6].upper()}"

    s_data = {
        "id": subj_id,
        "code": s_in.code.strip().upper(),
        "name": s_in.name.strip(),
        "classId": s_in.classId,
        "semester": s_in.semester or "Semester III",
        "teacherId": s_in.teacherId or "USR-TEACHER-01",
        "createdAt": datetime.now(timezone.utc).isoformat()
    }
    db.collection("subjects").document(subj_id).set(s_data)
    return s_data

@router.get("", response_model=List[SubjectResponse])
def list_subjects(class_id: Optional[str] = None, teacher_id: Optional[str] = None, semester: Optional[str] = None):
    db = get_db()
    ref = db.collection("subjects")
    docs = ref.get()
    subjects = [d.to_dict() for d in docs]
    
    if len(subjects) == 0:
        default_subjs = [
            {"id": "SBJ-DSA", "code": "CS301", "name": "Data Structures & Algorithms", "classId": "CLS-AIDS-AI2", "semester": "Semester III", "teacherId": "USR-TEACHER-01", "createdAt": datetime.now(timezone.utc).isoformat()},
            {"id": "SBJ-DBMS", "code": "CS302", "name": "Database Management Systems", "classId": "CLS-AIDS-AI2", "semester": "Semester III", "teacherId": "USR-TEACHER-01", "createdAt": datetime.now(timezone.utc).isoformat()},
            {"id": "SBJ-AI", "code": "AI303", "name": "Artificial Intelligence & ML", "classId": "CLS-AIDS-AI2", "semester": "Semester III", "teacherId": "USR-TEACHER-01", "createdAt": datetime.now(timezone.utc).isoformat()}
        ]
        for s in default_subjs:
            db.collection("subjects").document(s["id"]).set(s)
            subjects.append(s)

    if class_id:
        subjects = [s for s in subjects if s.get("classId") == class_id]
    if teacher_id:
        subjects = [s for s in subjects if s.get("teacherId") == teacher_id or s.get("teacherId") == "USR-TEACHER-01"]
    if semester:
        subjects = [s for s in subjects if s.get("semester") == semester]

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
        "semester": s_in.semester or "Semester III",
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
