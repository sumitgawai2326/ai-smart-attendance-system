from fastapi import APIRouter, HTTPException, status
from typing import List
import uuid
from datetime import datetime, timezone
from app.models.schemas import StudentCreate, StudentResponse, FaceEnrollmentRequest
from app.firebase.client import get_db
from app.ai.detector import face_detector
from app.ai.recognizer import face_recognizer

router = APIRouter(prefix="/students", tags=["Students"])

@router.post("", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
def create_student(student_in: StudentCreate):
    db = get_db()
    clean_roll = student_in.rollNumber.strip()
    clean_email = student_in.email.strip().lower()
    clean_name = student_in.name.strip()

    if not clean_roll or not clean_name:
        raise HTTPException(status_code=400, detail="Roll Number and Full Name are required.")

    # Check duplicate Roll Number
    existing_roll = db.collection("students").where("rollNumber", "==", clean_roll).get()
    if len(existing_roll) > 0:
        raise HTTPException(status_code=400, detail=f"Student with Roll Number '{clean_roll}' already exists.")

    # Check duplicate Email
    existing_email = db.collection("students").where("email", "==", clean_email).get()
    if len(existing_email) > 0:
        raise HTTPException(status_code=400, detail=f"Student with Email '{clean_email}' already exists.")

    student_id = f"STU-{uuid.uuid4().hex[:6].upper()}"
    now_iso = datetime.now(timezone.utc).isoformat()
    student_data = {
        "id": student_id,
        "rollNumber": clean_roll,
        "name": clean_name,
        "email": clean_email,
        "classId": student_in.classId,
        "division": student_in.division or "A",
        "branch": student_in.branch or "AI & DS",
        "year": student_in.year or "3rd Year",
        "hasFaceEnrolled": False,
        "faceEmbedding": None,
        "faceEmbeddings": [],
        "enrolledSamplesCount": 0,
        "createdAt": now_iso
    }
    
    db.collection("students").document(student_id).set(student_data)
    
    # Create corresponding student user account if absent
    db.collection("users").document(student_id).set({
        "id": student_id,
        "email": clean_email,
        "name": clean_name,
        "role": "STUDENT",
        "createdAt": now_iso
    })
    
    return student_data

@router.get("", response_model=List[StudentResponse])
def list_students(class_id: str = None):
    db = get_db()
    ref = db.collection("students")
    docs = ref.where("classId", "==", class_id).get() if class_id else ref.get()
    
    students = []
    for doc in docs:
        d = doc.to_dict()
        has_enrolled = bool(d.get("hasFaceEnrolled")) or bool(d.get("faceEmbeddings")) or bool(d.get("faceEmbedding"))
        # Check if embedding matches current 1536-dim standard (or is legacy 160-dim)
        emb = d.get("faceEmbedding")
        if emb and len(emb) < 500:
            # Legacy format - flag as needing re-enrollment
            has_enrolled = False
            
        students.append({
            "id": d.get("id"),
            "rollNumber": d.get("rollNumber"),
            "name": d.get("name"),
            "email": d.get("email"),
            "classId": d.get("classId"),
            "division": d.get("division", "A"),
            "branch": d.get("branch", "AI & DS"),
            "year": d.get("year", "3rd Year"),
            "hasFaceEnrolled": has_enrolled,
            "enrolledSamplesCount": d.get("enrolledSamplesCount", 0),
            "createdAt": d.get("createdAt")
        })
    return students

@router.get("/{student_id}", response_model=StudentResponse)
def get_student(student_id: str):
    db = get_db()
    doc = db.collection("students").document(student_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Student not found")
    d = doc.to_dict()
    has_enrolled = bool(d.get("hasFaceEnrolled")) or bool(d.get("faceEmbeddings")) or bool(d.get("faceEmbedding"))
    emb = d.get("faceEmbedding")
    if emb and len(emb) < 500:
        has_enrolled = False

    return {
        "id": d.get("id"),
        "rollNumber": d.get("rollNumber"),
        "name": d.get("name"),
        "email": d.get("email"),
        "classId": d.get("classId"),
        "division": d.get("division", "A"),
        "branch": d.get("branch", "AI & DS"),
        "year": d.get("year", "3rd Year"),
        "hasFaceEnrolled": has_enrolled,
        "enrolledSamplesCount": d.get("enrolledSamplesCount", 0),
        "createdAt": d.get("createdAt")
    }

@router.post("/{student_id}/enroll-face")
def enroll_student_face(student_id: str, req: FaceEnrollmentRequest):
    """
    High-Precision Multi-Sample Face Enrollment:
    1. Validates each sample for resolution, sharpness, and illumination.
    2. Aligns face using eye landmarks.
    3. Extracts 1536-dimensional normalized biometric feature vector per sample.
    4. Stores both multi-sample template array (`faceEmbeddings`) and master average (`faceEmbedding`).
    """
    db = get_db()
    doc_ref = db.collection("students").document(student_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Student not found")

    if not req.imageSamples or len(req.imageSamples) == 0:
        raise HTTPException(status_code=400, detail="No face image samples provided")

    sample_embeddings = []
    rejected_reasons = []

    for idx, sample_b64 in enumerate(req.imageSamples):
        img = face_detector.base64_to_image(sample_b64)
        if img is None:
            rejected_reasons.append(f"Sample #{idx+1}: Corrupted image format")
            continue

        faces = face_detector.detect_faces(img)
        if len(faces) == 0:
            rejected_reasons.append(f"Sample #{idx+1}: No face detected")
            continue
        if len(faces) > 1:
            rejected_reasons.append(f"Sample #{idx+1}: Multiple faces detected (only 1 face allowed)")
            continue

        primary_face = faces[0]
        cropped = face_detector.crop_face(img, primary_face)

        # Quality validation
        is_good, quality_msg, _ = face_detector.check_face_quality(cropped)
        if not is_good:
            rejected_reasons.append(f"Sample #{idx+1}: {quality_msg}")
            continue

        eyes = face_detector.detect_eyes(cropped)
        emb = face_recognizer.extract_embedding(cropped, eyes)
        if emb:
            sample_embeddings.append(emb)

    if len(sample_embeddings) < 2:
        reasons_summary = "; ".join(rejected_reasons[:3])
        raise HTTPException(
            status_code=400,
            detail=f"Face enrollment failed. Need at least 2 clear, well-lit samples. Issues encountered: {reasons_summary or 'Please look directly at camera in good lighting.'}"
        )

    master_embedding = face_recognizer.average_embeddings(sample_embeddings)

    # Save multi-template array and master average template
    doc_ref.update({
        "faceEmbedding": master_embedding,
        "faceEmbeddings": sample_embeddings,
        "hasFaceEnrolled": True,
        "enrolledSamplesCount": len(sample_embeddings),
        "updatedAt": datetime.now(timezone.utc).isoformat()
    })

    return {
        "status": "SUCCESS",
        "message": f"Successfully enrolled {len(sample_embeddings)} high-precision biometric templates for student ID {student_id}",
        "validSamplesCount": len(sample_embeddings)
    }

@router.delete("/{student_id}/face")
def delete_student_face_enrollment(student_id: str):
    """Privacy feature: Permanently delete biometric face enrollment data for student"""
    db = get_db()
    doc_ref = db.collection("students").document(student_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Student not found")

    doc_ref.update({
        "faceEmbedding": None,
        "faceEmbeddings": [],
        "hasFaceEnrolled": False,
        "enrolledSamplesCount": 0
    })
    return {"status": "SUCCESS", "message": "Biometric face enrollment data deleted permanently."}
