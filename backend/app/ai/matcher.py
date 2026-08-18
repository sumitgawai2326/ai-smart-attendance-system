from typing import List, Dict, Any, Optional
from app.ai.detector import face_detector
from app.ai.recognizer import face_recognizer
from app.ai.liveness import liveness_detector
from app.config.settings import settings

class AIMatcherPipeline:
    def __init__(
        self,
        match_threshold: float = settings.FACE_MATCH_THRESHOLD,
        min_margin: float = settings.MIN_MATCH_MARGIN
    ):
        self.match_threshold = match_threshold
        self.min_margin = min_margin

    def process_frame_multi(
        self,
        base64_frame: str,
        enrolled_students: List[Dict[str, Any]],
        consecutive_blinks: int = 0
    ) -> Dict[str, Any]:
        """
        Execute AI Recognition across ALL detected faces in the camera frame independently.
        Never forces a match. Evaluates quality, liveness, best candidate threshold, and second-best safety margin.
        """
        img = face_detector.base64_to_image(base64_frame)
        if img is None:
            return {
                "totalFaces": 0,
                "results": [],
                "status": "ERROR",
                "message": "Invalid video frame format"
            }

        # 1. Detect ALL faces in frame
        faces = face_detector.detect_faces(img)
        if len(faces) == 0:
            return {
                "totalFaces": 0,
                "results": [],
                "status": "NO_FACE",
                "message": "No face detected in camera view"
            }

        results = []
        for idx, bbox in enumerate(faces):
            cropped_face = face_detector.crop_face(img, bbox)
            
            # 2. Quality Check
            is_good_quality, quality_msg, quality_meta = face_detector.check_face_quality(cropped_face)
            if not is_good_quality:
                results.append({
                    "faceIndex": idx,
                    "boundingBox": bbox,
                    "recognized": False,
                    "studentId": None,
                    "name": None,
                    "rollNumber": None,
                    "confidence": 0.0,
                    "secondConfidence": 0.0,
                    "margin": 0.0,
                    "quality": quality_meta,
                    "livenessVerified": False,
                    "status": "LOW_QUALITY",
                    "message": quality_msg
                })
                continue

            # 3. Eyes & Liveness Check
            eyes = face_detector.detect_eyes(cropped_face)
            is_live, liveness_msg, liveness_score = liveness_detector.verify_liveness(cropped_face, eyes, consecutive_blinks)
            if not is_live:
                results.append({
                    "faceIndex": idx,
                    "boundingBox": bbox,
                    "recognized": False,
                    "studentId": None,
                    "name": None,
                    "rollNumber": None,
                    "confidence": liveness_score,
                    "secondConfidence": 0.0,
                    "margin": 0.0,
                    "quality": quality_meta,
                    "livenessVerified": False,
                    "status": "LIVENESS_FAILED",
                    "message": f"Anti-spoofing check failed: {liveness_msg}"
                })
                continue

            # 4. Extract Biometric Embedding (with Eye Alignment)
            frame_embedding = face_recognizer.extract_embedding(cropped_face, eyes)
            if not frame_embedding:
                results.append({
                    "faceIndex": idx,
                    "boundingBox": bbox,
                    "recognized": False,
                    "studentId": None,
                    "name": None,
                    "rollNumber": None,
                    "confidence": 0.0,
                    "secondConfidence": 0.0,
                    "margin": 0.0,
                    "quality": quality_meta,
                    "livenessVerified": True,
                    "status": "LOW_QUALITY",
                    "message": "Could not extract clear biometric feature signature"
                })
                continue

            # 5. Compare against ALL enrolled students & rank candidates
            candidates = []
            for student in enrolled_students:
                sim = face_recognizer.match_student_templates(frame_embedding, student)
                if sim > 0.0:
                    candidates.append({
                        "student": student,
                        "similarity": sim
                    })

            # Sort candidates by similarity descending
            candidates.sort(key=lambda x: x["similarity"], reverse=True)

            best_match = candidates[0] if len(candidates) > 0 else None
            second_match = candidates[1] if len(candidates) > 1 else None

            s1 = best_match["similarity"] if best_match else 0.0
            s2 = second_match["similarity"] if second_match else 0.0
            margin = round(s1 - s2, 4) if len(candidates) > 1 else round(s1, 4)

            # Adaptive safety margin based on top match confidence tier
            required_margin = self.min_margin
            if s1 >= 0.95:
                required_margin = 0.04
            elif s1 >= 0.85:
                required_margin = 0.06

            # 6. Multi-Tier Decision Logic
            if not best_match or s1 < self.match_threshold:
                # Similarity below strict threshold -> UNKNOWN (Never force closest student)
                results.append({
                    "faceIndex": idx,
                    "boundingBox": bbox,
                    "recognized": False,
                    "studentId": None,
                    "name": "Unknown",
                    "rollNumber": "N/A",
                    "confidence": round(s1, 4),
                    "secondCandidateName": second_match["student"].get("name") if second_match else None,
                    "secondConfidence": round(s2, 4),
                    "margin": margin,
                    "quality": quality_meta,
                    "livenessVerified": True,
                    "status": "UNKNOWN",
                    "message": f"Unknown face (highest similarity {int(s1*100)}% below threshold {int(self.match_threshold*100)}%)"
                })
            elif len(candidates) > 1 and margin < required_margin:
                # Ambiguous match between top 2 candidates -> AMBIGUOUS (Never guess)
                results.append({
                    "faceIndex": idx,
                    "boundingBox": bbox,
                    "recognized": False,
                    "studentId": None,
                    "name": "Ambiguous",
                    "rollNumber": "N/A",
                    "confidence": round(s1, 4),
                    "secondCandidateName": second_match["student"].get("name") if second_match else None,
                    "secondConfidence": round(s2, 4),
                    "margin": margin,
                    "quality": quality_meta,
                    "livenessVerified": True,
                    "status": "AMBIGUOUS",
                    "message": f"Ambiguous match between {best_match['student'].get('name')} ({int(s1*100)}%) and {second_match['student'].get('name')} ({int(s2*100)}%). Look directly at camera."
                })
            else:
                # High confidence + safe margin -> CONFIRMED IDENTITY
                matched_student = best_match["student"]
                results.append({
                    "faceIndex": idx,
                    "boundingBox": bbox,
                    "recognized": True,
                    "studentId": matched_student.get("id"),
                    "name": matched_student.get("name"),
                    "rollNumber": matched_student.get("rollNumber"),
                    "confidence": round(s1, 4),
                    "secondCandidateName": second_match["student"].get("name") if second_match else None,
                    "secondConfidence": round(s2, 4),
                    "margin": margin,
                    "quality": quality_meta,
                    "livenessVerified": True,
                    "status": "CONFIRMED",
                    "message": f"Confirmed: {matched_student.get('name')} (Roll No: {matched_student.get('rollNumber')})"
                })

        return {
            "totalFaces": len(faces),
            "results": results,
            "status": "SUCCESS",
            "message": f"Processed {len(faces)} faces"
        }

ai_matcher = AIMatcherPipeline()
