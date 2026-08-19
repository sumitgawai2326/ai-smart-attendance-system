from fastapi import APIRouter, HTTPException, status
from typing import List, Dict, Any
import uuid
from datetime import datetime, timezone
from app.models.schemas import TeacherCreate, TeacherResponse, TeacherProfileUpdate, ClassResponse, SubjectResponse
from app.firebase.client import get_db

router = APIRouter(prefix="/teachers", tags=["Teachers"])

def format_teacher_response(d: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": d.get("id"),
        "name": d.get("name"),
        "email": d.get("email"),
        "department": d.get("department", "AI & Data Science"),
        "phone": d.get("phone", ""),
        "employeeId": d.get("employeeId", ""),
        "designation": d.get("designation", "Assistant Professor"),
        "qualification": d.get("qualification", "Ph.D. / M.Tech in Computer Science"),
        "specialization": d.get("specialization", "Machine Learning & Algorithms"),
        "cabin": d.get("cabin", "Lab 402, Department Block"),
        "officeHours": d.get("officeHours", "Mon - Fri: 2:00 PM - 4:00 PM"),
        "experienceYears": d.get("experienceYears", "8+ Years"),
        "assignedClasses": d.get("assignedClasses", ["CLS-AIDS-AI2"]),
        "createdAt": d.get("createdAt")
    }

@router.post("", response_model=TeacherResponse, status_code=status.HTTP_201_CREATED)
def create_teacher(t_in: TeacherCreate):
    db = get_db()
    clean_email = t_in.email.strip().lower()
    clean_name = t_in.name.strip()

    existing = db.collection("teachers").where("email", "==", clean_email).get()
    if len(existing) > 0:
        raise HTTPException(status_code=400, detail=f"Teacher with email '{clean_email}' already exists.")

    teacher_id = f"TCH-{uuid.uuid4().hex[:6].upper()}"
    now_iso = datetime.now(timezone.utc).isoformat()
    t_data = {
        "id": teacher_id,
        "name": clean_name,
        "email": clean_email,
        "department": t_in.department,
        "phone": t_in.phone or "",
        "employeeId": t_in.employeeId or f"EMP-{uuid.uuid4().hex[:4].upper()}",
        "designation": t_in.designation or "Assistant Professor",
        "qualification": t_in.qualification or "Ph.D. / M.Tech in Computer Science",
        "specialization": t_in.specialization or "Artificial Intelligence",
        "cabin": t_in.cabin or "Block B, Room 304",
        "officeHours": t_in.officeHours or "Mon-Fri: 2PM-4PM",
        "experienceYears": t_in.experienceYears or "5 Years",
        "assignedClasses": t_in.assignedClasses or ["CLS-AIDS-AI2"],
        "createdAt": now_iso
    }
    db.collection("teachers").document(teacher_id).set(t_data)
    
    # Create corresponding user account
    db.collection("users").document(teacher_id).set({
        "id": teacher_id,
        "email": clean_email,
        "name": clean_name,
        "role": "TEACHER",
        "createdAt": now_iso
    })
    
    return format_teacher_response(t_data)

@router.get("", response_model=List[TeacherResponse])
def list_teachers():
    db = get_db()
    docs = db.collection("teachers").get()
    teachers = [format_teacher_response(d.to_dict()) for d in docs]
    
    if len(teachers) == 0:
        default_tch = {
            "id": "USR-TEACHER-01",
            "name": "Prof. Alan Turing",
            "email": "teacher@college.edu",
            "department": "AI & Data Science",
            "phone": "+91 98765 11223",
            "employeeId": "EMP-AIDS-01",
            "designation": "Associate Professor & HOD",
            "qualification": "Ph.D. in Artificial Intelligence",
            "specialization": "Deep Learning & Neural Networks",
            "cabin": "Faculty Block C, Cabin 402",
            "officeHours": "Mon-Fri: 11:00 AM - 1:00 PM",
            "experienceYears": "12+ Years",
            "assignedClasses": ["CLS-AIDS-AI2"],
            "createdAt": datetime.now(timezone.utc).isoformat()
        }
        db.collection("teachers").document(default_tch["id"]).set(default_tch)
        teachers.append(format_teacher_response(default_tch))

    return teachers

@router.get("/{teacher_id}", response_model=TeacherResponse)
def get_teacher(teacher_id: str):
    db = get_db()
    doc = db.collection("teachers").document(teacher_id).get()
    if not doc.exists:
        by_email = db.collection("teachers").where("email", "==", teacher_id).get()
        if len(by_email) > 0:
            return format_teacher_response(by_email[0].to_dict())
        raise HTTPException(status_code=404, detail="Teacher profile not found")
    return format_teacher_response(doc.to_dict())

@router.get("/{teacher_id}/classes")
def get_teacher_classes(teacher_id: str):
    """Returns only classes assigned to this teacher"""
    db = get_db()
    tdoc = db.collection("teachers").document(teacher_id).get()
    if not tdoc.exists:
        by_email = db.collection("teachers").where("email", "==", teacher_id).get()
        if len(by_email) > 0:
            tdoc = by_email[0]
        else:
            raise HTTPException(status_code=404, detail="Teacher not found")

    t_data = tdoc.to_dict()
    assigned_ids = t_data.get("assignedClasses", [])
    classes = []
    for cid in assigned_ids:
        cdoc = db.collection("classes").document(cid).get()
        if cdoc.exists:
            classes.append(cdoc.to_dict())
        else:
            classes.append({"id": cid, "name": cid, "department": t_data.get("department", "AI & DS"), "year": "2nd Year", "division": "AI-2"})
    return classes

@router.get("/{teacher_id}/subjects")
def get_teacher_subjects(teacher_id: str):
    """Returns only subjects assigned to this teacher"""
    db = get_db()
    docs = db.collection("subjects").where("teacherId", "==", teacher_id).get()
    subjs = [d.to_dict() for d in docs]
    if len(subjs) == 0:
        # Check by default teacher ID
        fallback = db.collection("subjects").where("teacherId", "==", "USR-TEACHER-01").get()
        subjs = [d.to_dict() for d in fallback]
    return subjs

@router.put("/{teacher_id}", response_model=TeacherResponse)
@router.put("/{teacher_id}/profile", response_model=TeacherResponse)
def update_teacher_profile(teacher_id: str, profile_in: TeacherProfileUpdate):
    db = get_db()
    doc_ref = db.collection("teachers").document(teacher_id)
    doc = doc_ref.get()

    if not doc.exists:
        by_email = db.collection("teachers").where("email", "==", teacher_id).get()
        if len(by_email) > 0:
            doc_ref = db.collection("teachers").document(by_email[0].id)
            doc = by_email[0]
        else:
            raise HTTPException(status_code=404, detail="Teacher not found")

    update_dict = {k: v for k, v in profile_in.model_dump().items() if v is not None}
    update_dict["updatedAt"] = datetime.now(timezone.utc).isoformat()

    doc_ref.update(update_dict)

    if "name" in update_dict or "email" in update_dict:
        user_ref = db.collection("users").document(doc_ref.id)
        if user_ref.get().exists:
            u_upd = {}
            if "name" in update_dict:
                u_upd["name"] = update_dict["name"]
            if "email" in update_dict:
                u_upd["email"] = update_dict["email"]
            user_ref.update(u_upd)

    return format_teacher_response(doc_ref.get().to_dict())

@router.delete("/{teacher_id}")
def delete_teacher(teacher_id: str):
    db = get_db()
    doc_ref = db.collection("teachers").document(teacher_id)
    if not doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="Teacher not found")
    doc_ref.delete()
    db.collection("users").document(teacher_id).delete()
    return {"status": "SUCCESS", "message": f"Teacher '{teacher_id}' deleted successfully."}
