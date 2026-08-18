import sys
import os
import pytest
import numpy as np
import cv2

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.ai.recognizer import face_recognizer
from app.ai.detector import face_detector
from app.ai.matcher import ai_matcher
from app.attendance.engine import attendance_engine
from app.firebase.client import get_db

def create_distinct_face(skin_tone, eye_spacing, mouth_w):
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

def enroll_face_helper(img):
    b64 = image_to_base64(img)
    decoded = face_detector.base64_to_image(b64)
    boxes = face_detector.detect_faces(decoded)
    crop = face_detector.crop_face(decoded, boxes[0]) if len(boxes) > 0 else decoded
    eyes = face_detector.detect_eyes(crop)
    return face_recognizer.extract_embedding(crop, eyes)

def test_full_camera_matrix():
    # 1. Setup 3 distinct students
    faceA = create_distinct_face(140, 24, 20)
    faceB = create_distinct_face(190, 38, 32)
    faceC = create_distinct_face(165, 30, 26)
    faceUnknown = create_distinct_face(110, 44, 16)

    embA = enroll_face_helper(faceA)
    embB = enroll_face_helper(faceB)
    embC = enroll_face_helper(faceC)

    students = [
        {"id": "STU-A", "name": "Alice", "rollNumber": "101", "faceEmbeddings": [embA]},
        {"id": "STU-B", "name": "Bob", "rollNumber": "102", "faceEmbeddings": [embB]},
        {"id": "STU-C", "name": "Charlie", "rollNumber": "103", "faceEmbeddings": [embC]},
    ]

    session = attendance_engine.create_session("CLS-MATRIX", "SBJ-MATRIX", "TEACHER-01")
    session_id = session["id"]

    # --- Test A: Single enrolled student (Alice) ---
    resA = ai_matcher.process_frame_multi(image_to_base64(faceA), students)
    assert resA["results"][0]["recognized"] is True
    assert resA["results"][0]["studentId"] == "STU-A"
    markA = attendance_engine.mark_ai_attendance(session_id, "STU-A", "Alice", "101", resA["results"][0]["confidence"])
    assert markA["status"] == "SUCCESS"

    # --- Test B: Unregistered unknown person ---
    resU = ai_matcher.process_frame_multi(image_to_base64(faceUnknown), students)
    assert resU["results"][0]["recognized"] is False
    assert resU["results"][0]["status"] in ["UNKNOWN", "AMBIGUOUS"]

    # --- Test C: Second enrolled student (Bob) ---
    resB = ai_matcher.process_frame_multi(image_to_base64(faceB), students)
    assert resB["results"][0]["recognized"] is True
    assert resB["results"][0]["studentId"] == "STU-B"
    markB = attendance_engine.mark_ai_attendance(session_id, "STU-B", "Bob", "102", resB["results"][0]["confidence"])
    assert markB["status"] == "SUCCESS"

    # --- Test D: Third enrolled student (Charlie) ---
    resC = ai_matcher.process_frame_multi(image_to_base64(faceC), students)
    assert resC["results"][0]["recognized"] is True
    assert resC["results"][0]["studentId"] == "STU-C"
    markC = attendance_engine.mark_ai_attendance(session_id, "STU-C", "Charlie", "103", resC["results"][0]["confidence"])
    assert markC["status"] == "SUCCESS"

    # --- Test E: Repeated detection of Alice -> Idempotent ALREADY_MARKED ---
    markA_repeat = attendance_engine.mark_ai_attendance(session_id, "STU-A", "Alice", "101", 0.95)
    assert markA_repeat["status"] == "ALREADY_MARKED"

    # --- Test F: Poor Lighting / Darkness -> NO_FACE or LOW_QUALITY ---
    dark_face = np.ones((128, 128, 3), dtype=np.uint8) * 10
    res_dark = ai_matcher.process_frame_multi(image_to_base64(dark_face), students)
    assert res_dark["totalFaces"] == 0 or res_dark["results"][0]["recognized"] is False
    assert res_dark["status"] in ["NO_FACE", "LOW_QUALITY", "UNKNOWN", "SUCCESS"]

    # Verify session has exactly 3 records in DB (Alice, Bob, Charlie)
    db = get_db()
    records = db.collection("attendance_records").where("sessionId", "==", session_id).get()
    assert len(records) == 3
    marked_ids = {r.to_dict()["studentId"] for r in records}
    assert marked_ids == {"STU-A", "STU-B", "STU-C"}
