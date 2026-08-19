from fastapi import APIRouter, HTTPException, status
from typing import List, Dict, Any
import uuid
from datetime import datetime, timezone
from app.models.schemas import StudentCreate, StudentResponse, FaceEnrollmentRequest, StudentProfileUpdate, DocumentUploadRequest
from app.firebase.client import get_db
from app.ai.detector import face_detector
from app.ai.recognizer import face_recognizer

router = APIRouter(prefix="/students", tags=["Students"])

def format_student_response(d: Dict[str, Any]) -> Dict[str, Any]:
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
        "classId": d.get("classId", "CLS-AIDS-3A"),
        "division": d.get("division", "A"),
        "branch": d.get("branch", "AI & DS"),
        "year": d.get("year", "3rd Year"),
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
        "prnNumber": student_in.prnNumber or "",
        "phone": student_in.phone or "",
        "whatsapp": "",
        "dob": "",
        "gender": "",
        "bloodGroup": "",
        "guardianName": "",
        "guardianPhone": "",
        "address": "",
        "emergencyContact": "",
        "hasFaceEnrolled": False,
        "faceEmbedding": None,
        "faceEmbeddings": [],
        "enrolledSamplesCount": 0,
        "photoUrl": None,
        "documents": {},
        "createdAt": now_iso
    }
    
    db.collection("students").document(student_id).set(student_data)
    
    # Create corresponding student user account
    db.collection("users").document(student_id).set({
        "id": student_id,
        "email": clean_email,
        "name": clean_name,
        "role": "STUDENT",
        "createdAt": now_iso
    })
    
    return format_student_response(student_data)

@router.get("", response_model=List[StudentResponse])
def list_students(class_id: str = None):
    db = get_db()
    ref = db.collection("students")
    docs = ref.where("classId", "==", class_id).get() if class_id else ref.get()
    return [format_student_response(doc.to_dict()) for doc in docs]

@router.get("/{student_id}", response_model=StudentResponse)
def get_student(student_id: str):
    db = get_db()
    doc = db.collection("students").document(student_id).get()
    if not doc.exists:
        # Check by email or user ID
        users = db.collection("students").where("email", "==", student_id).get()
        if len(users) > 0:
            return format_student_response(users[0].to_dict())
        raise HTTPException(status_code=404, detail="Student not found")
    return format_student_response(doc.to_dict())

@router.put("/{student_id}", response_model=StudentResponse)
def update_student(student_id: str, student_in: StudentCreate):
    """Update student personal and academic details (Admin / Faculty)"""
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

    existing_roll = db.collection("students").where("rollNumber", "==", clean_roll).get()
    for r in existing_roll:
        if r.id != student_id:
            raise HTTPException(status_code=400, detail=f"Roll Number '{clean_roll}' is already assigned to another student.")

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
        "phone": student_in.phone or "",
        "prnNumber": student_in.prnNumber or "",
        "updatedAt": datetime.now(timezone.utc).isoformat()
    }
    doc_ref.update(update_payload)

    user_ref = db.collection("users").document(student_id)
    if user_ref.get().exists:
        user_ref.update({"name": clean_name, "email": clean_email})

    return format_student_response(doc_ref.get().to_dict())

@router.put("/{student_id}/profile", response_model=StudentResponse)
def update_student_profile(student_id: str, profile_in: StudentProfileUpdate):
    """
    Student Self-Service Profile Update:
    Enables students to maintain their personal, contact, guardian, and address information.
    """
    db = get_db()
    doc_ref = db.collection("students").document(student_id)
    doc = doc_ref.get()
    
    if not doc.exists:
        # Check by email lookup if student_id is user email
        by_email = db.collection("students").where("email", "==", student_id).get()
        if len(by_email) > 0:
            doc_ref = db.collection("students").document(by_email[0].id)
            doc = by_email[0]
        else:
            raise HTTPException(status_code=404, detail="Student not found")

    update_dict = {k: v for k, v in profile_in.model_dump().items() if v is not None}
    update_dict["updatedAt"] = datetime.now(timezone.utc).isoformat()

    doc_ref.update(update_dict)
    
    # Update associated user record if name or email changed
    if "name" in update_dict or "email" in update_dict:
        user_ref = db.collection("users").document(doc_ref.id)
        if user_ref.get().exists:
            user_update = {}
            if "name" in update_dict:
                user_update["name"] = update_dict["name"]
            if "email" in update_dict:
                user_update["email"] = update_dict["email"]
            user_ref.update(user_update)

    return format_student_response(doc_ref.get().to_dict())

@router.post("/{student_id}/upload-document")
def upload_student_document(student_id: str, req: DocumentUploadRequest):
    """
    Document Vault: Upload important student documents (College ID, Aadhaar, Marksheet, Fee Receipt)
    """
    db = get_db()
    doc_ref = db.collection("students").document(student_id)
    doc = doc_ref.get()
    
    if not doc.exists:
        by_email = db.collection("students").where("email", "==", student_id).get()
        if len(by_email) > 0:
            doc_ref = db.collection("students").document(by_email[0].id)
            doc = by_email[0]
        else:
            raise HTTPException(status_code=404, detail="Student not found")

    student_data = doc.to_dict()
    docs_vault = student_data.get("documents", {})

    now_iso = datetime.now(timezone.utc).isoformat()
    docs_vault[req.documentType] = {
        "title": req.title,
        "fileName": req.fileName,
        "fileBase64": req.fileBase64,
        "fileType": req.fileType,
        "fileSize": req.fileSize or "1.2 MB",
        "status": "Submitted",
        "uploadedAt": now_iso
    }

    doc_ref.update({
        "documents": docs_vault,
        "updatedAt": now_iso
    })

    return {
        "status": "SUCCESS",
        "message": f"Document '{req.title}' uploaded successfully.",
        "documents": docs_vault
    }

@router.delete("/{student_id}/documents/{doc_type}")
def delete_student_document(student_id: str, doc_type: str):
    """Delete an uploaded document from the student's vault"""
    db = get_db()
    doc_ref = db.collection("students").document(student_id)
    doc = doc_ref.get()
    
    if not doc.exists:
        by_email = db.collection("students").where("email", "==", student_id).get()
        if len(by_email) > 0:
            doc_ref = db.collection("students").document(by_email[0].id)
            doc = by_email[0]
        else:
            raise HTTPException(status_code=404, detail="Student not found")

    student_data = doc.to_dict()
    docs_vault = student_data.get("documents", {})

    if doc_type in docs_vault:
        docs_vault.pop(doc_type)
        doc_ref.update({"documents": docs_vault, "updatedAt": datetime.now(timezone.utc).isoformat()})

    return {"status": "SUCCESS", "message": f"Document '{doc_type}' removed successfully."}

@router.put("/{student_id}/documents/{doc_type}/status")
def verify_student_document(student_id: str, doc_type: str, payload: Dict[str, Any]):
    """Admin Verification: Approve or Reject uploaded student document"""
    db = get_db()
    doc_ref = db.collection("students").document(student_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Student not found")

    student_data = doc.to_dict()
    docs_vault = student_data.get("documents", {})

    if doc_type not in docs_vault:
        raise HTTPException(status_code=404, detail="Document not found in student vault")

    status_val = payload.get("status", "Verified")
    remarks_val = payload.get("remarks", "")
    now_iso = datetime.now(timezone.utc).isoformat()

    docs_vault[doc_type]["status"] = status_val
    docs_vault[doc_type]["verificationRemarks"] = remarks_val
    docs_vault[doc_type]["verifiedAt"] = now_iso

    doc_ref.update({
        "documents": docs_vault,
        "updatedAt": now_iso
    })

    return {
        "status": "SUCCESS",
        "message": f"Document '{doc_type}' updated to {status_val}",
        "document": docs_vault[doc_type]
    }

@router.delete("/{student_id}")
def delete_student(student_id: str):
    """Permanently delete student record and associated credentials"""
    db = get_db()
    doc_ref = db.collection("students").document(student_id)
    doc = doc_ref.get()
    
    if not doc.exists:
        # Fallback search by email in students collection
        by_email = db.collection("students").where("email", "==", student_id).get()
        if len(by_email) > 0:
            doc_ref = db.collection("students").document(by_email[0].id)
            doc = by_email[0]
        else:
            raise HTTPException(status_code=404, detail="Student not found")

    real_student_id = doc_ref.id
    student_data = doc.to_dict()
    student_email = student_data.get("email")

    # 1. Delete student record from students collection
    doc_ref.delete()

    # 2. Delete user credentials from users collection
    db.collection("users").document(real_student_id).delete()
    if student_email:
        users_by_email = db.collection("users").where("email", "==", student_email).get()
        for u in users_by_email:
            db.collection("users").document(u.id).delete()

    # 3. Clean up attendance records for this student
    att_docs = db.collection("attendance_records").where("studentId", "==", real_student_id).get()
    for att in att_docs:
        db.collection("attendance_records").document(att.id).delete()

    return {"status": "SUCCESS", "message": f"Student '{real_student_id}' deleted successfully."}

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
