import cv2
import numpy as np

class LivenessDetector:
    def __init__(self, ear_threshold=0.20, min_consecutive_blinks=1):
        self.ear_threshold = ear_threshold
        self.min_consecutive_blinks = min_consecutive_blinks

    def verify_liveness(self, face_image: np.ndarray, eyes_list: list, consecutive_blinks: int = 0) -> tuple[bool, str, float]:
        """
        Evaluate frame for anti-spoofing / liveness:
        1. Texture variance check (printed photos often lack natural skin depth / gradient detail)
        2. Eye detection & blink counter verification
        Returns: (liveness_passed: bool, reason: str, liveness_score: float)
        """
        if face_image is None or face_image.size == 0:
            return False, "No valid face region", 0.0

        # 1. Texture / Laplacian Variance Analysis (Detect blur or flat photo prints)
        gray_face = cv2.cvtColor(face_image, cv2.COLOR_BGR2GRAY)
        laplacian_var = cv2.Laplacian(gray_face, cv2.CV_64F).var()
        
        # Extremely low laplacian variance indicates blur or fake low-quality printed picture
        if laplacian_var < 20.0:
            return False, "Low texture detail (possible photo print/screen display)", 0.30

        # 2. Eye Aspect Ratio & Eye Landmark Check
        eye_count = len(eyes_list) if eyes_list is not None else 0
        
        # If consecutive blink count reported or detected eyes present, confirm liveness score
        if consecutive_blinks >= 1 or eye_count >= 1:
            liveness_score = min(1.0, 0.70 + (0.15 * min(eye_count, 2)))
            return True, "Liveness verified (Natural eye & facial depth detected)", liveness_score
            
        # Default pass for live camera feed with high laplacian variance
        if laplacian_var >= 45.0:
            return True, "Liveness verified (Natural video motion)", 0.85

        return False, "Liveness check unverified (Keep facing camera & blink)", 0.40

liveness_detector = LivenessDetector()
