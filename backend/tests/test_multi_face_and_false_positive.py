import sys
import os
import pytest
import numpy as np
import cv2

# Add backend dir to path for test runner
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.ai.recognizer import face_recognizer
from app.ai.matcher import ai_matcher
from app.attendance.engine import attendance_engine
from app.firebase.client import get_db

def create_synthetic_face(skin_tone=160, eye_spacing=30, mouth_w=24):
    img = np.ones((128, 128, 3), dtype=np.uint8) * skin_tone
    cv2.ellipse(img, (64, 64), (48, 56), 0, 0, 360, (skin_tone - 30, skin_tone - 30, skin_tone - 30), -1)
    # Eyes
    cv2.circle(img, (64 - eye_spacing // 2, 45), 7, (20, 20, 20), -1)
    cv2.circle(img, (64 + eye_spacing // 2, 45), 7, (20, 20, 20), -1)
    # Nose
    cv2.line(img, (64, 52), (64, 70), (skin_tone - 50, skin_tone - 50, skin_tone - 50), 2)
    # Mouth
    cv2.ellipse(img, (64, 90), (mouth_w // 2, 5), 0, 0, 180, (30, 30, 30), 2)
    return img

def image_to_base64(img):
    _, buffer = cv2.imencode(".jpg", img)
    import base64
    return "data:image/jpeg;base64," + base64.b64encode(buffer).decode("utf-8")

def test_false_positive_reproduction_and_prevention():
    """
    CRITICAL BUG TEST:
    Student A (Rahul) is in front of the camera.
    Student B (Amit) is absent.
    The system MUST identify Student A. It must NEVER mark Student B!
    """
    faceA = create_synthetic_face(skin_tone=140, eye_spacing=26, mouth_w=20)
    faceB = create_synthetic_face(skin_tone=190, eye_spacing=38, mouth_w=32)

    embA1 = face_recognizer.extract_embedding(faceA)
    embA2 = face_recognizer.extract_embedding(faceA) # slight variation
    embB = face_recognizer.extract_embedding(faceB)

    studentA = {
        "id": "STU-RAHUL",
        "name": "Rahul Patil",
        "rollNumber": "24",
        "classId": "CLS-TEST",
        "faceEmbeddings": [embA1, embA2],
        "faceEmbedding": embA1
    }

    studentB = {
        "id": "STU-AMIT",
        "name": "Amit Sharma",
        "rollNumber": "25",
        "classId": "CLS-TEST",
        "faceEmbeddings": [embB],
        "faceEmbedding": embB
    }

    enrolled = [studentA, studentB]

    # Frame contains Student A only
    b64_frame = image_to_base64(faceA)
    res = ai_matcher.process_frame_multi(b64_frame, enrolled)

    assert res["totalFaces"] >= 1
    face_res = res["results"][0]

    # Must match Student A (Rahul) with high confidence and margin
    assert face_res["recognized"] is True
    assert face_res["studentId"] == "STU-RAHUL"
    assert face_res["name"] == "Rahul Patil"
    assert face_res["confidence"] >= 0.65
    assert face_res["margin"] >= 0.12

    # Verify Student B was NOT selected
    assert face_res["studentId"] != "STU-AMIT"

def test_unregistered_unknown_person():
    """
    Unregistered person C enters camera view.
    System MUST return UNKNOWN and NEVER guess an enrolled student.
    """
    faceA = create_synthetic_face(skin_tone=140, eye_spacing=26, mouth_w=20)
    faceC_unknown = np.zeros((128, 128, 3), dtype=np.uint8) + 80 # completely unmodeled face
    cv2.circle(faceC_unknown, (64, 64), 30, (255, 255, 255), -1)

    embA = face_recognizer.extract_embedding(faceA)
    studentA = {
        "id": "STU-RAHUL",
        "name": "Rahul Patil",
        "rollNumber": "24",
        "classId": "CLS-TEST",
        "faceEmbeddings": [embA],
        "faceEmbedding": embA
    }

    b64_unknown = image_to_base64(faceC_unknown)
    res = ai_matcher.process_frame_multi(b64_unknown, [studentA])

    if res["totalFaces"] > 0:
        face_res = res["results"][0]
        assert face_res["recognized"] is False
        assert face_res["status"] in ["UNKNOWN", "LOW_QUALITY", "LIVENESS_FAILED"]
        assert face_res["studentId"] is None

def test_ambiguous_second_best_margin_safety():
    """
    If two candidates have nearly identical similarity (< 0.12 margin),
    system MUST return AMBIGUOUS and NOT mark attendance.
    """
    face1 = create_synthetic_face(skin_tone=150, eye_spacing=30, mouth_w=24)
    emb1 = face_recognizer.extract_embedding(face1)

    # Student A and Student B with nearly identical embeddings (twins / extreme ambiguity)
    studentA = {"id": "STU-A", "name": "Student A", "rollNumber": "01", "faceEmbeddings": [emb1]}
    studentB = {"id": "STU-B", "name": "Student B", "rollNumber": "02", "faceEmbeddings": [emb1]}

    b64_frame = image_to_base64(face1)
    res = ai_matcher.process_frame_multi(b64_frame, [studentA, studentB])

    assert res["totalFaces"] >= 1
    face_res = res["results"][0]
    # Because margin is ~0.0 (both have identical score), must be AMBIGUOUS
    assert face_res["status"] == "AMBIGUOUS"
    assert face_res["recognized"] is False

def test_multi_student_attendance_marking_in_same_session():
    """
    Three registered students sit in front of the camera simultaneously.
    System must mark all three present in the same session without cross-assignment or duplicates.
    """
    session = attendance_engine.create_session("CLS-MULTI", "SBJ-MULTI", "TEACHER-01")
    session_id = session["id"]

    # Student 1
    res1 = attendance_engine.mark_ai_attendance(session_id, "STU-1", "Rahul", "01", 0.92)
    assert res1["status"] == "SUCCESS"
    assert res1["record"]["id"] == f"ATT_{session_id}_STU-1"

    # Student 2
    res2 = attendance_engine.mark_ai_attendance(session_id, "STU-2", "Amit", "02", 0.89)
    assert res2["status"] == "SUCCESS"
    assert res2["record"]["id"] == f"ATT_{session_id}_STU-2"

    # Student 3
    res3 = attendance_engine.mark_ai_attendance(session_id, "STU-3", "Sneha", "03", 0.94)
    assert res3["status"] == "SUCCESS"
    assert res3["record"]["id"] == f"ATT_{session_id}_STU-3"

    # Repeated detection of Student 1 in same session -> ALREADY_MARKED (No duplicate record)
    res1_dup = attendance_engine.mark_ai_attendance(session_id, "STU-1", "Rahul", "01", 0.95)
    assert res1_dup["status"] == "ALREADY_MARKED"

    # Verify database has strictly 3 records for this session
    db = get_db()
    records = db.collection("attendance_records").where("sessionId", "==", session_id).get()
    assert len(records) == 3
    marked_ids = {r.to_dict()["studentId"] for r in records}
    assert marked_ids == {"STU-1", "STU-2", "STU-3"}
