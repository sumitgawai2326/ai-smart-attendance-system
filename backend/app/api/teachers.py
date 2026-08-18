from fastapi import APIRouter, HTTPException, status
from typing import List
import uuid
from app.models.schemas import TeacherCreate, TeacherResponse
from app.firebase.client import get_db

router = APIRouter(prefix="/teachers", tags=["Teachers"])

@router.post("", response_model=TeacherResponse, status_code=status.HTTP_201_CREATED)
def create_teacher(t_in: TeacherCreate):
    db = get_db()
    existing = db.collection("teachers").where("email", "==", t_in.email).get()
    if len(existing) > 0:
        raise HTTPException(status_code=400, detail=f"Teacher with email '{t_in.email}' already exists.")

    teacher_id = f"TCH-{uuid.uuid4().hex[:6].upper()}"
    t_data = {
        "id": teacher_id,
        "name": t_in.name,
        "email": t_in.email,
        "department": t_in.department,
        "assignedClasses": t_in.assignedClasses
    }
    db.collection("teachers").document(teacher_id).set(t_data)
    
    # Create corresponding user account
    db.collection("users").document(teacher_id).set({
        "id": teacher_id,
        "email": t_in.email,
        "name": t_in.name,
        "role": "TEACHER"
    })
    
    return t_data

@router.get("", response_model=List[TeacherResponse])
def list_teachers():
    db = get_db()
    docs = db.collection("teachers").get()
    teachers = []
    for d in docs:
        teachers.append(d.to_dict())
    return teachers
