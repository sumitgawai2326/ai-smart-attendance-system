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
        "photoUrl": None,
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
        embs = d.get("faceEmbeddings") or []
        emb = d.get("faceEmbedding")
        # Valid if has 1536-dim multi-template or single template
        has_valid_embs = bool(embs and len(embs) > 0 and len(embs[0]) >= 500)
        has_valid_emb = bool(emb and len(emb) >= 500)
        has_enrolled = has_valid_embs or has_valid_emb or bool(d.get("hasFaceEnrolled") and (has_valid_embs or has_valid_emb))
            
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
            "enrolledSamplesCount": len(embs) if embs else (1 if has_valid_emb else 0),
            "photoUrl": d.get("photoUrl"),
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
    embs = d.get("faceEmbeddings") or []
    emb = d.get("faceEmbedding")
    has_valid_embs = bool(embs and len(embs) > 0 and len(embs[0]) >= 500)
    has_valid_emb = bool(emb and len(emb) >= 500)
    has_enrolled = has_valid_embs or has_valid_emb

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
        "enrolledSamplesCount": len(embs) if embs else (1 if has_valid_emb else 0),
        "photoUrl": d.get("photoUrl"),
        "createdAt": d.get("createdAt")
    }

@router.put("/{student_id}", response_model=StudentResponse)
def update_student(student_id: str, student_in: StudentCreate):
    """Update student personal and academic details"""
    db = get_db()
    doc_ref = db.collection("students").document(student_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Student not found")
    
    clean_roll = student_in.rollNumber.strip()
    clean_name = student_in.name.strip()
    clean_email = student_in.email.strip().lower()

    if not clean_roll or not clean_name:
        raise HTTPException(status_code=400, detail="Roll Number and Full Name are required.")

    # Check roll number uniqueness among other students
    existing_roll = db.collection("students").where("rollNumber", "==", clean_roll).get()
    for r in existing_roll:
        if r.id != student_id:
            raise HTTPException(status_code=400, detail=f"Roll Number '{clean_roll}' is already assigned to another student.")

    # Check email uniqueness among other students
    existing_email = db.collection("students").where("email", "==", clean_email).get()
    for e in existing_email:
        if e.id != student_id:
            raise HTTPException(status_code=400, detail=f"Email '{clean_email}' is already assigned to another student.")

    update_payload = {
        "rollNumber": clean_roll,
        "name": clean_name,
        "email": clean_email,
        "classId": student_in.classId,
        "division": student_in.division or "A",
        "branch": student_in.branch or "AI & DS",
        "year": student_in.year or "3rd Year",
        "updatedAt": datetime.now(timezone.utc).isoformat()
    }
    doc_ref.update(update_payload)

    # Update corresponding user profile
    user_ref = db.collection("users").document(student_id)
    if user_ref.get().exists:
        user_ref.update({"name": clean_name, "email": clean_email})

    updated_doc = doc_ref.get().to_dict()
    embs = updated_doc.get("faceEmbeddings") or []
    emb = updated_doc.get("faceEmbedding")
    has_valid_embs = bool(embs and len(embs) > 0 and len(embs[0]) >= 500)
    has_valid_emb = bool(emb and len(emb) >= 500)

    return {
        "id": updated_doc.get("id"),
        "rollNumber": updated_doc.get("rollNumber"),
        "name": updated_doc.get("name"),
        "email": updated_doc.get("email"),
        "classId": updated_doc.get("classId"),
        "division": updated_doc.get("division", "A"),
        "branch": updated_doc.get("branch", "AI & DS"),
        "year": updated_doc.get("year", "3rd Year"),
        "hasFaceEnrolled": has_valid_embs or has_valid_emb,
        "enrolledSamplesCount": len(embs) if embs else (1 if has_valid_emb else 0),
        "photoUrl": updated_doc.get("photoUrl"),
        "createdAt": updated_doc.get("createdAt")
    }

@router.delete("/{student_id}")
def delete_student(student_id: str):
    """Permanently delete student record and associated credentials"""
    db = get_db()
    doc_ref = db.collection("students").document(student_id)
    if not doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="Student not found")

    doc_ref.delete()
    db.collection("users").document(student_id).delete()
    return {"status": "SUCCESS", "message": f"Student '{student_id}' deleted successfully."}

@router.post("/{student_id}/enroll-face")
def enroll_student_face(student_id: str, req: FaceEnrollmentRequest):
    """
    High-Precision Multi-Sample Face Enrollment:
    1. Validates each sample for face presence and image quality.
    2. Aligns face using eye landmarks.
    3. Extracts 1536-dimensional normalized biometric feature vector per sample.
    4. Stores multi-sample template array, master average vector, and thumbnail photo.
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
    first_valid_photo = None

    for idx, sample_b64 in enumerate(req.imageSamples):
        img = face_detector.base64_to_image(sample_b64)
        if img is None:
            rejected_reasons.append(f"Sample #{idx+1}: Corrupted image format")
            continue

        faces = face_detector.detect_faces(img)
        if len(faces) == 0:
            rejected_reasons.append(f"Sample #{idx+1}: No face detected in frame")
            continue
        if len(faces) > 1:
            rejected_reasons.append(f"Sample #{idx+1}: Multiple faces detected (ensure only enrolling student is visible)")
            continue

        primary_face = faces[0]
        cropped = face_detector.crop_face(img, primary_face)

        # Quality check with relaxed tolerance for live webcams
        is_good, quality_msg, _ = face_detector.check_face_quality(cropped)
        if not is_good:
            rejected_reasons.append(f"Sample #{idx+1}: {quality_msg}")
            continue

        eyes = face_detector.detect_eyes(cropped)
        emb = face_recognizer.extract_embedding(cropped, eyes)
        if emb:
            sample_embeddings.append(emb)
            if first_valid_photo is None:
                first_valid_photo = sample_b64

    if len(sample_embeddings) == 0:
        reasons_summary = "; ".join(rejected_reasons[:3])
        raise HTTPException(
            status_code=400,
            detail=f"Face enrollment failed. Issues encountered: {reasons_summary or 'Please look directly at camera in good lighting.'}"
        )

    master_embedding = face_recognizer.average_embeddings(sample_embeddings)

    # Save multi-template array, master average template, and enrolled photo
    doc_ref.update({
        "faceEmbedding": master_embedding,
        "faceEmbeddings": sample_embeddings,
        "hasFaceEnrolled": True,
        "enrolledSamplesCount": len(sample_embeddings),
        "photoUrl": first_valid_photo or req.imageSamples[0],
        "updatedAt": datetime.now(timezone.utc).isoformat()
    })

    return {
        "status": "SUCCESS",
        "message": f"Successfully enrolled {len(sample_embeddings)} biometric templates for student ID {student_id}",
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
        "enrolledSamplesCount": 0,
        "photoUrl": None
    })
    return {"status": "SUCCESS", "message": "Biometric face enrollment data deleted permanently."}
