from fastapi import APIRouter, HTTPException, status
from typing import List
import uuid
from app.models.schemas import ClassCreate, ClassResponse
from app.firebase.client import get_db

router = APIRouter(prefix="/classes", tags=["Classes"])

@router.post("", response_model=ClassResponse, status_code=status.HTTP_201_CREATED)
def create_class(c_in: ClassCreate):
    db = get_db()
    class_id = f"CLS-{uuid.uuid4().hex[:6].upper()}"
    c_data = {
        "id": class_id,
        "name": c_in.name,
        "department": c_in.department,
        "year": c_in.year,
        "division": c_in.division
    }
    db.collection("classes").document(class_id).set(c_data)
    return c_data

@router.get("", response_model=List[ClassResponse])
def list_classes():
    db = get_db()
    docs = db.collection("classes").get()
    classes = [d.to_dict() for d in docs]
    if len(classes) == 0:
        # Seed default class for instant setup
        default_cls = {
            "id": "CLS-AIDS-3A",
            "name": "B.Tech AI & DS - 3rd Year (Div A)",
            "department": "Artificial Intelligence & Data Science",
            "year": "3rd Year",
            "division": "A"
        }
        db.collection("classes").document("CLS-AIDS-3A").set(default_cls)
        classes.append(default_cls)
    return classes
