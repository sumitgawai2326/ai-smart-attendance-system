from fastapi import APIRouter, HTTPException, status
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
from app.models.schemas import ClassCreate, ClassResponse, StudentResponse
from app.firebase.client import get_db

router = APIRouter(prefix="/classes", tags=["Classes & Divisions"])

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
        "classId": d.get("classId", "CLS-AIDS-2A"),
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

@router.post("", response_model=ClassResponse, status_code=status.HTTP_201_CREATED)
def create_class(c_in: ClassCreate):
    db = get_db()
    clean_div = c_in.division.strip().upper()
    class_id = f"CLS-{c_in.department.replace(' ', '').replace('&', '')[:4].upper()}-{clean_div}"
    
    # Check if duplicate
    if db.collection("classes").document(class_id).get().exists:
        class_id = f"CLS-{uuid.uuid4().hex[:6].upper()}"

    c_data = {
        "id": class_id,
        "name": c_in.name.strip(),
        "department": c_in.department.strip(),
        "program": c_in.program or "B.Tech AI & Data Science",
        "academicYear": c_in.academicYear or "2026-27",
        "year": c_in.year.strip(),
        "semester": c_in.semester or "Semester III",
        "division": clean_div,
        "createdAt": datetime.now(timezone.utc).isoformat()
    }
    db.collection("classes").document(class_id).set(c_data)
    return c_data

@router.get("", response_model=List[ClassResponse])
def list_classes(
    academic_year: Optional[str] = None,
    department: Optional[str] = None,
    year: Optional[str] = None,
    semester: Optional[str] = None
):
    db = get_db()
    ref = db.collection("classes")
    docs = ref.get()
    classes = [d.to_dict() for d in docs]

    if len(classes) == 0:
        default_cls = [
            {
                "id": "CLS-AIDS-AI2",
                "name": "B.Tech AI & DS - 2nd Year (Div AI-2)",
                "department": "AI & Data Science",
                "program": "B.Tech AI & Data Science",
                "academicYear": "2026-27",
                "year": "2nd Year",
                "semester": "Semester III",
                "division": "AI-2",
                "createdAt": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": "CLS-AIDS-AI3",
                "name": "B.Tech AI & DS - 2nd Year (Div AI-3)",
                "department": "AI & Data Science",
                "program": "B.Tech AI & Data Science",
                "academicYear": "2026-27",
                "year": "2nd Year",
                "semester": "Semester III",
                "division": "AI-3",
                "createdAt": datetime.now(timezone.utc).isoformat()
            }
        ]
        for c in default_cls:
            db.collection("classes").document(c["id"]).set(c)
            classes.append(c)

    # Optional query filters
    if academic_year:
        classes = [c for c in classes if c.get("academicYear") == academic_year]
    if department:
        classes = [c for c in classes if c.get("department") == department]
    if year:
        classes = [c for c in classes if c.get("year") == year]
    if semester:
        classes = [c for c in classes if c.get("semester") == semester]

    return classes

@router.get("/{class_id}/students", response_model=List[StudentResponse])
def get_class_students(class_id: str):
    """Authoritative API: Returns ONLY students enrolled in this specific class/division"""
    db = get_db()
    docs = db.collection("students").where("classId", "==", class_id).get()
    return [format_student_summary(d.to_dict()) for d in docs]

@router.put("/{class_id}", response_model=ClassResponse)
def update_class(class_id: str, c_in: ClassCreate):
    db = get_db()
    doc_ref = db.collection("classes").document(class_id)
    if not doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="Class not found")
    
    update_data = {
        "name": c_in.name.strip(),
        "department": c_in.department.strip(),
        "program": c_in.program or "B.Tech AI & Data Science",
        "academicYear": c_in.academicYear or "2026-27",
        "year": c_in.year.strip(),
        "semester": c_in.semester or "Semester III",
        "division": c_in.division.strip().upper(),
        "updatedAt": datetime.now(timezone.utc).isoformat()
    }
    doc_ref.update(update_data)
    return doc_ref.get().to_dict()

@router.delete("/{class_id}")
def delete_class(class_id: str):
    db = get_db()
    doc_ref = db.collection("classes").document(class_id)
    if not doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="Class not found")
    doc_ref.delete()
    return {"status": "SUCCESS", "message": f"Class '{class_id}' deleted successfully."}
