import sys
import os
import pytest
import concurrent.futures

# Add backend dir to path for test runner
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.attendance.engine import attendance_engine
from app.firebase.client import get_db

def test_attendance_idempotency_and_deterministic_key():
    """Verify that marking attendance repeatedly produces strictly ONE record with a deterministic key"""
    session = attendance_engine.create_session(
        class_id="CLS-TEST-01",
        subject_id="SBJ-TEST-01",
        teacher_id="USR-TEACHER-01"
    )
    session_id = session["id"]
    student_id = "STU-TEST-99"

    # First attempt: SUCCESS
    res1 = attendance_engine.mark_ai_attendance(
        session_id=session_id,
        student_id=student_id,
        student_name="Test Student",
        roll_number="99",
        confidence=0.92
    )
    assert res1["status"] == "SUCCESS"
    assert res1["already_marked"] is False
    expected_doc_id = f"ATT_{session_id}_{student_id}"
    assert res1["record"]["id"] == expected_doc_id

    # Second attempt: ALREADY_MARKED (Idempotent)
    res2 = attendance_engine.mark_ai_attendance(
        session_id=session_id,
        student_id=student_id,
        student_name="Test Student",
        roll_number="99",
        confidence=0.95
    )
    assert res2["status"] == "ALREADY_MARKED"
    assert res2["already_marked"] is True

    # Verify database strictly has 1 record for this (session, student)
    db = get_db()
    records = db.collection("attendance_records").where("sessionId", "==", session_id).where("studentId", "==", student_id).get()
    assert len(records) == 1
    assert records[0].id == expected_doc_id

def test_concurrent_attendance_requests_race_condition():
    """Simulate 10 concurrent threads attempting to mark attendance at the exact same microsecond"""
    session = attendance_engine.create_session(
        class_id="CLS-RACE-01",
        subject_id="SBJ-RACE-01",
        teacher_id="USR-TEACHER-01"
    )
    session_id = session["id"]
    student_id = "STU-RACE-42"

    def mark_worker():
        return attendance_engine.mark_ai_attendance(
            session_id=session_id,
            student_id=student_id,
            student_name="Race Student",
            roll_number="42",
            confidence=0.88
        )

    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        futures = [executor.submit(mark_worker) for _ in range(10)]
        results = [f.result() for f in futures]

    success_count = len([r for r in results if r["status"] == "SUCCESS"])
    already_marked_count = len([r for r in results if r["status"] == "ALREADY_MARKED"])

    # Strictly 1 thread must succeed in creating the record, all other 9 must get ALREADY_MARKED
    assert success_count == 1
    assert already_marked_count == 9

    # DB must have exactly 1 record
    db = get_db()
    records = db.collection("attendance_records").where("sessionId", "==", session_id).where("studentId", "==", student_id).get()
    assert len(records) == 1
