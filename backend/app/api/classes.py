from fastapi import APIRouter, HTTPException, status
from typing import List
import uuid
from datetime import datetime, timezone
from app.models.schemas import ClassCreate, ClassResponse
from app.firebase.client import get_db

router = APIRouter(prefix="/classes", tags=["Classes"])

@router.post("", response_model=ClassResponse, status_code=status.HTTP_201_CREATED)
def create_class(c_in: ClassCreate):
    db = get_db()
    class_id = f"CLS-{uuid.uuid4().hex[:6].upper()}"
    c_data = {
        "id": class_id,
        "name": c_in.name.strip(),
        "department": c_in.department.strip(),
        "year": c_in.year.strip(),
        "division": c_in.division.strip().upper(),
        "createdAt": datetime.now(timezone.utc).isoformat()
    }
    db.collection("classes").document(class_id).set(c_data)
    return c_data

@router.get("", response_model=List[ClassResponse])
def list_classes():
    db = get_db()
    docs = db.collection("classes").get()
    classes = [d.to_dict() for d in docs]
    if len(classes) == 0:
        default_cls = {
            "id": "CLS-AIDS-3A",
            "name": "B.Tech AI & DS - 3rd Year (Div A)",
            "department": "Artificial Intelligence & Data Science",
            "year": "3rd Year",
            "division": "A",
            "createdAt": datetime.now(timezone.utc).isoformat()
        }
        db.collection("classes").document("CLS-AIDS-3A").set(default_cls)
        classes.append(default_cls)
    return classes

@router.put("/{class_id}", response_model=ClassResponse)
def update_class(class_id: str, c_in: ClassCreate):
    db = get_db()
    doc_ref = db.collection("classes").document(class_id)
    if not doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="Class not found")
    
    update_data = {
        "name": c_in.name.strip(),
        "department": c_in.department.strip(),
        "year": c_in.year.strip(),
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
