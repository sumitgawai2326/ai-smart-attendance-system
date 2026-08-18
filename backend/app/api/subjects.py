from fastapi import APIRouter, HTTPException, status
from typing import List
import uuid
from app.models.schemas import SubjectCreate, SubjectResponse
from app.firebase.client import get_db

router = APIRouter(prefix="/subjects", tags=["Subjects"])

@router.post("", response_model=SubjectResponse, status_code=status.HTTP_201_CREATED)
def create_subject(s_in: SubjectCreate):
    db = get_db()
    subj_id = f"SBJ-{uuid.uuid4().hex[:6].upper()}"
    s_data = {
        "id": subj_id,
        "code": s_in.code,
        "name": s_in.name,
        "classId": s_in.classId,
        "teacherId": s_in.teacherId
    }
    db.collection("subjects").document(subj_id).set(s_data)
    return s_data

@router.get("", response_model=List[SubjectResponse])
def list_subjects(class_id: str = None):
    db = get_db()
    ref = db.collection("subjects")
    docs = ref.where("classId", "==", class_id).get() if class_id else ref.get()
    subjects = [d.to_dict() for d in docs]
    
    if len(subjects) == 0 and not class_id:
        # Seed default subjects for instant setup
        default_subjs = [
            {"id": "SBJ-DSA", "code": "CS301", "name": "Data Structures & Algorithms", "classId": "CLS-AIDS-3A", "teacherId": "USR-TEACHER-01"},
            {"id": "SBJ-DBMS", "code": "CS302", "name": "Database Management Systems", "classId": "CLS-AIDS-3A", "teacherId": "USR-TEACHER-01"},
            {"id": "SBJ-AI", "code": "AI303", "name": "Artificial Intelligence & ML", "classId": "CLS-AIDS-3A", "teacherId": "USR-TEACHER-01"}
        ]
        for s in default_subjs:
            db.collection("subjects").document(s["id"]).set(s)
            subjects.append(s)
            
    return subjects
