from fastapi import APIRouter, HTTPException, status
from typing import List, Dict, Any, Optional
import uuid
from datetime import datetime, timezone
from app.models.schemas import (
    StudentCreate, StudentResponse, FaceEnrollmentRequest,
    StudentProfileUpdate, DocumentUploadRequest, StudentTransferRequest
)
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
        "classId": d.get("classId", "CLS-AIDS-AI2"),
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

@router.post("", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
def create_student(student_in: StudentCreate):
    db = get_db()
    clean_roll = student_in.rollNumber.strip()
    clean_email = student_in.email.strip().lower()
    clean_name = student_in.name.strip()

    if not clean_roll or not clean_name:
        raise HTTPException(status_code=400, detail="Roll Number and Full Name are required.")

    # Check duplicate Roll Number in the same class
    existing_roll = db.collection("students").where("rollNumber", "==", clean_roll).get()
    for r in existing_roll:
        if r.to_dict().get("classId") == student_in.classId:
            raise HTTPException(status_code=400, detail=f"Roll Number '{clean_roll}' already exists in class '{student_in.classId}'.")

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
        "academicYear": student_in.academicYear or "2026-27",
        "department": student_in.department or "AI & Data Science",
        "program": student_in.program or "B.Tech AI & Data Science",
        "year": student_in.year or "2nd Year",
        "semester": student_in.semester or "Semester III",
        "division": student_in.division or "AI-2",
        "branch": student_in.branch or "AI & Data Science",
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
def list_students(
    class_id: Optional[str] = None,
    academic_year: Optional[str] = None,
    department: Optional[str] = None,
    year: Optional[str] = None,
    semester: Optional[str] = None,
    division: Optional[str] = None
):
    db = get_db()
    docs = db.collection("students").get()
    students = [format_student_response(doc.to_dict()) for doc in docs]

    if class_id:
        students = [s for s in students if s.get("classId") == class_id]
    if academic_year:
        students = [s for s in students if s.get("academicYear") == academic_year]
    if department:
        students = [s for s in students if s.get("department") == department]
    if year:
        students = [s for s in students if s.get("year") == year]
    if semester:
        students = [s for s in students if s.get("semester") == semester]
    if division:
        students = [s for s in students if s.get("division") == division]

    return students

@router.get("/{student_id}", response_model=StudentResponse)
def get_student(student_id: str):
    db = get_db()
    doc = db.collection("students").document(student_id).get()
    if not doc.exists:
        by_email = db.collection("students").where("email", "==", student_id).get()
        if len(by_email) > 0:
            return format_student_response(by_email[0].to_dict())
        raise HTTPException(status_code=404, detail="Student not found")
    return format_student_response(doc.to_dict())

@router.put("/{student_id}", response_model=StudentResponse)
def update_student(student_id: str, student_in: StudentCreate):
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

    update_payload = {
        "rollNumber": clean_roll,
        "name": clean_name,
        "email": clean_email,
        "classId": student_in.classId,
        "academicYear": student_in.academicYear or "2026-27",
        "department": student_in.department or "AI & Data Science",
        "program": student_in.program or "B.Tech AI & Data Science",
        "year": student_in.year or "2nd Year",
        "semester": student_in.semester or "Semester III",
        "division": student_in.division or "AI-2",
        "branch": student_in.branch or "AI & Data Science",
        "phone": student_in.phone or "",
        "prnNumber": student_in.prnNumber or "",
        "updatedAt": datetime.now(timezone.utc).isoformat()
    }
    doc_ref.update(update_payload)

    user_ref = db.collection("users").document(student_id)
    if user_ref.get().exists:
        user_ref.update({"name": clean_name, "email": clean_email})

    return format_student_response(doc_ref.get().to_dict())

@router.put("/{student_id}/transfer", response_model=StudentResponse)
def transfer_student(student_id: str, req: StudentTransferRequest):
    """Transfer student between classes/divisions/semesters"""
    db = get_db()
    doc_ref = db.collection("students").document(student_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Student not found")

    update_dict = {
        "classId": req.newClassId,
        "updatedAt": datetime.now(timezone.utc).isoformat()
    }
    if req.newDivision: update_dict["division"] = req.newDivision
    if req.newSemester: update_dict["semester"] = req.newSemester
    if req.newYear: update_dict["year"] = req.newYear

    doc_ref.update(update_dict)
    return format_student_response(doc_ref.get().to_dict())

@router.put("/{student_id}/profile", response_model=StudentResponse)
def update_student_profile(student_id: str, profile_in: StudentProfileUpdate):
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

    update_dict = {k: v for k, v in profile_in.model_dump().items() if v is not None}
    update_dict["updatedAt"] = datetime.now(timezone.utc).isoformat()

    doc_ref.update(update_dict)
    
    if "name" in update_dict or "email" in update_dict:
        user_ref = db.collection("users").document(doc_ref.id)
        if user_ref.get().exists:
            u_upd = {}
            if "name" in update_dict: u_upd["name"] = update_dict["name"]
            if "email" in update_dict: u_upd["email"] = update_dict["email"]
            user_ref.update(u_upd)

    return format_student_response(doc_ref.get().to_dict())

@router.post("/{student_id}/upload-document")
def upload_student_document(student_id: str, req: DocumentUploadRequest):
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
        "status": "Verified",
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
    """Permanently delete student record, credentials, and associated records"""
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
    High-Precision Multi-Sample Face Enrollment (DO NOT CHANGE SFACE ALGORITHM)
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
            rejected_reasons.append(f"Sample #{idx+1}: No face detected")
            continue

        primary_face = max(faces, key=lambda f: f["confidence"])
        aligned = face_recognizer.align_face(img, primary_face["landmarks"])
        emb = face_recognizer.extract_embedding(aligned)

        if emb is not None and len(emb) == 1536:
            sample_embeddings.append(emb.tolist())
            if first_valid_photo is None:
                first_valid_photo = sample_b64

    if len(sample_embeddings) == 0:
        err_detail = "All face samples failed quality check. " + "; ".join(rejected_reasons)
        raise HTTPException(status_code=400, detail=err_detail)

    master_embedding = sample_embeddings[0]
    now_iso = datetime.now(timezone.utc).isoformat()

    doc_ref.update({
        "hasFaceEnrolled": True,
        "faceEmbedding": master_embedding,
        "faceEmbeddings": sample_embeddings,
        "enrolledSamplesCount": len(sample_embeddings),
        "photoUrl": first_valid_photo,
        "updatedAt": now_iso
    })

    return {
        "status": "SUCCESS",
        "studentId": student_id,
        "validSamplesEnrolled": len(sample_embeddings),
        "hasFaceEnrolled": True,
        "photoUrl": first_valid_photo,
        "message": f"Successfully enrolled {len(sample_embeddings)} face template(s)."
    }

@router.delete("/{student_id}/face")
def delete_student_face(student_id: str):
    db = get_db()
    doc_ref = db.collection("students").document(student_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Student not found")

    doc_ref.update({
        "hasFaceEnrolled": False,
        "faceEmbedding": None,
        "faceEmbeddings": [],
        "enrolledSamplesCount": 0,
        "photoUrl": None,
        "updatedAt": datetime.now(timezone.utc).isoformat()
    })
    return {"status": "SUCCESS", "message": f"Biometric face data for student '{student_id}' deleted successfully."}
