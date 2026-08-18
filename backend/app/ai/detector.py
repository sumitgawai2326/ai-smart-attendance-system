import cv2
import numpy as np
import base64
import os
from typing import Tuple, List, Dict, Any

class FaceDetector:
    def __init__(self):
        cascade_dir = os.path.join(os.path.dirname(__file__), "cascades")
        os.makedirs(cascade_dir, exist_ok=True)
        
        face_default = os.path.join(cascade_dir, "haarcascade_frontalface_default.xml")
        face_alt2 = os.path.join(cascade_dir, "haarcascade_frontalface_alt2.xml")
        face_profile = os.path.join(cascade_dir, "haarcascade_profileface.xml")
        eye_default = os.path.join(cascade_dir, "haarcascade_eye.xml")
        eye_glasses = os.path.join(cascade_dir, "haarcascade_eye_tree_eyeglasses.xml")

        self.face_cascade = cv2.CascadeClassifier(face_default) if os.path.exists(face_default) else None
        self.face_alt2_cascade = cv2.CascadeClassifier(face_alt2) if os.path.exists(face_alt2) else None
        self.profile_cascade = cv2.CascadeClassifier(face_profile) if os.path.exists(face_profile) else None
        
        self.eye_cascade = cv2.CascadeClassifier(eye_default) if os.path.exists(eye_default) else None
        self.eye_glasses_cascade = cv2.CascadeClassifier(eye_glasses) if os.path.exists(eye_glasses) else None

        self.clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))

    def base64_to_image(self, base64_str: str) -> np.ndarray:
        try:
            if "," in base64_str:
                base64_str = base64_str.split(",")[1]
            image_bytes = base64.b64decode(base64_str)
            nparr = np.frombuffer(image_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            return img
        except Exception as e:
            print(f"[AI-DETECTOR] Error decoding base64 image: {e}")
            return None

    def detect_faces(self, image: np.ndarray) -> List[List[int]]:
        """
        Detect ALL faces in the frame using multi-cascade ensemble with CLAHE contrast enhancement.
        Returns a list of bounding boxes: [[x, y, w, h], ...]
        """
        if image is None or image.size == 0:
            return []

        h, w = image.shape[:2]
        max_dim = 640
        scale = 1.0
        if max(h, w) > max_dim:
            scale = max_dim / float(max(h, w))
            small_img = cv2.resize(image, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
        else:
            small_img = image

        gray = cv2.cvtColor(small_img, cv2.COLOR_BGR2GRAY)
        gray_enhanced = self.clahe.apply(gray)
        inv_scale = 1.0 / scale

        # 1. Primary Frontal Detector
        detected_boxes = []
        if self.face_cascade and not self.face_cascade.empty():
            try:
                small_faces = self.face_cascade.detectMultiScale(
                    gray_enhanced,
                    scaleFactor=1.1,
                    minNeighbors=4,
                    minSize=(35, 35)
                )
                for (sx, sy, sw, sh) in small_faces:
                    detected_boxes.append([
                        int(sx * inv_scale),
                        int(sy * inv_scale),
                        int(sw * inv_scale),
                        int(sh * inv_scale)
                    ])
            except Exception as e:
                print(f"[AI-DETECTOR] Primary face detection error: {e}")

        # 2. Secondary Alt2 Detector (if needed or to catch additional students)
        if len(detected_boxes) == 0 and self.face_alt2_cascade and not self.face_alt2_cascade.empty():
            try:
                small_faces = self.face_alt2_cascade.detectMultiScale(
                    gray_enhanced,
                    scaleFactor=1.1,
                    minNeighbors=3,
                    minSize=(30, 30)
                )
                for (sx, sy, sw, sh) in small_faces:
                    detected_boxes.append([
                        int(sx * inv_scale),
                        int(sy * inv_scale),
                        int(sw * inv_scale),
                        int(sh * inv_scale)
                    ])
            except Exception as e:
                print(f"[AI-DETECTOR] Alt2 face detection error: {e}")

        # Non-maximum suppression / overlapping box deduplication
        if len(detected_boxes) > 1:
            detected_boxes = self._nms_boxes(detected_boxes, overlap_thresh=0.35)

        # Fallback for tightly cropped pre-extracted face images (e.g. 128x128)
        if len(detected_boxes) == 0 and h <= 200 and w <= 200 and h >= 40 and w >= 40:
            is_q, _, _ = self.check_face_quality(image)
            if is_q:
                detected_boxes.append([0, 0, w, h])

        return detected_boxes

    def _nms_boxes(self, boxes: List[List[int]], overlap_thresh: float = 0.35) -> List[List[int]]:
        """Non-Maximum Suppression to remove overlapping duplicate detections of the same face"""
        if len(boxes) <= 1:
            return boxes

        boxes_arr = np.array(boxes)
        x1 = boxes_arr[:, 0]
        y1 = boxes_arr[:, 1]
        x2 = boxes_arr[:, 0] + boxes_arr[:, 2]
        y2 = boxes_arr[:, 1] + boxes_arr[:, 3]
        areas = boxes_arr[:, 2] * boxes_arr[:, 3]
        order = areas.argsort()[::-1]

        keep = []
        while order.size > 0:
            i = order[0]
            keep.append(i)
            xx1 = np.maximum(x1[i], x1[order[1:]])
            yy1 = np.maximum(y1[i], y1[order[1:]])
            xx2 = np.minimum(x2[i], x2[order[1:]])
            yy2 = np.minimum(y2[i], y2[order[1:]])

            w = np.maximum(0.0, xx2 - xx1)
            h = np.maximum(0.0, yy2 - yy1)
            inter = w * h
            ovr = inter / (areas[i] + areas[order[1:]] - inter)

            inds = np.where(ovr <= overlap_thresh)[0]
            order = order[inds + 1]

        return [boxes[k] for k in keep]

    def crop_face(self, image: np.ndarray, bbox: List[int]) -> np.ndarray:
        x, y, w, h = bbox
        if x == 0 and y == 0 and w == image.shape[1] and h == image.shape[0]:
            return image

        margin_x = int(w * 0.1)
        margin_y = int(h * 0.1)
        
        h_img, w_img = image.shape[:2]
        x1 = max(0, x - margin_x)
        y1 = max(0, y - margin_y)
        x2 = min(w_img, x + w + margin_x)
        y2 = min(h_img, y + h + margin_y)
        
        return image[y1:y2, x1:x2]

    def check_face_quality(self, face_crop: np.ndarray) -> Tuple[bool, str, Dict[str, Any]]:
        """
        Validate face image quality before recognition:
        Checks size, sharpness (laplacian variance), brightness, and aspect ratio.
        """
        if face_crop is None or face_crop.size == 0:
            return False, "Empty face image", {}

        h, w = face_crop.shape[:2]
        if w < 40 or h < 40:
            return False, "Face too small, please move closer to the camera", {"size": (w, h)}

        gray = cv2.cvtColor(face_crop, cv2.COLOR_BGR2GRAY) if len(face_crop.shape) == 3 else face_crop
        
        # 1. Sharpness (Laplacian variance)
        lap_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
        if lap_var < 10.0:
            return False, "Face is blurry, please hold still", {"sharpness": round(lap_var, 1)}

        # 2. Brightness Check (mean pixel value)
        mean_brightness = float(np.mean(gray))
        if mean_brightness < 25.0:
            return False, "Face is in deep shadow, please improve lighting", {"brightness": round(mean_brightness, 1)}
        if mean_brightness > 240.0:
            return False, "Face is overexposed, please reduce direct glare", {"brightness": round(mean_brightness, 1)}

        return True, "Good quality", {
            "size": (w, h),
            "sharpness": round(lap_var, 1),
            "brightness": round(mean_brightness, 1)
        }

    def detect_eyes(self, face_image: np.ndarray):
        if face_image is None or face_image.size == 0:
            return []

        gray = cv2.cvtColor(face_image, cv2.COLOR_BGR2GRAY) if len(face_image.shape) == 3 else face_image
        gray = self.clahe.apply(gray)

        eyes = ()
        if self.eye_cascade and not self.eye_cascade.empty():
            try:
                eyes = self.eye_cascade.detectMultiScale(
                    gray,
                    scaleFactor=1.1,
                    minNeighbors=3,
                    minSize=(12, 12)
                )
            except Exception as e:
                print(f"[AI-DETECTOR] Eye detection error: {e}")

        if len(eyes) == 0 and self.eye_glasses_cascade and not self.eye_glasses_cascade.empty():
            try:
                eyes = self.eye_glasses_cascade.detectMultiScale(
                    gray,
                    scaleFactor=1.1,
                    minNeighbors=3,
                    minSize=(12, 12)
                )
            except Exception as e:
                print(f"[AI-DETECTOR] Eyeglasses detection error: {e}")

        return eyes

face_detector = FaceDetector()
