import cv2
import numpy as np
import os
from typing import List, Optional, Union, Dict, Any

class FaceRecognizer:
    def __init__(self, target_size=(128, 128)):
        self.target_size = target_size
        self._sface = None
        self._load_sface_if_available()

    def _load_sface_if_available(self):
        sface_p = os.path.join(os.path.dirname(__file__), "models", "face_recognition_sface_2021dec.onnx")
        if os.path.exists(sface_p) and os.path.getsize(sface_p) > 1000000:
            try:
                self._sface = cv2.FaceRecognizerSF.create(sface_p, "")
                print("[AI-RECOGNIZER] SFace Deep Learning FaceRecognizer model loaded successfully.")
            except Exception as e:
                print(f"[AI-RECOGNIZER] SFace model load failed ({e}), operating with Spatial LBP+HOG descriptor.")

    def _compute_lbp(self, gray: np.ndarray) -> np.ndarray:
        """Compute 8-neighbor circular Local Binary Pattern map"""
        h, w = gray.shape
        lbp = np.zeros((h - 2, w - 2), dtype=np.uint8)
        # 8 neighbors with (dy, dx) offsets
        offsets = [(-1, -1), (-1, 0), (-1, 1), (0, 1), (1, 1), (1, 0), (1, -1), (0, -1)]
        center = gray[1:h - 1, 1:w - 1]
        for p, (dy, dx) in enumerate(offsets):
            neighbor = gray[1 + dy:h - 1 + dy, 1 + dx:w - 1 + dx]
            lbp |= ((neighbor >= center) << p).astype(np.uint8)
        return lbp

    def extract_embedding(self, face_img: np.ndarray, eyes: Optional[List[Any]] = None) -> Optional[List[float]]:
        """
        Extract a normalized 1536-dimensional biometric embedding vector from an aligned face image.
        Uses Difference of Gaussians (DoG) for illumination invariance + Spatial 8x8 LBP + Spatial 8x8 Directional HOG.
        """
        if face_img is None or face_img.size == 0:
            return None

        try:
            # 1. Face Alignment (Horizontal eye-level leveling)
            aligned_face = self.align_face(face_img, eyes)
            
            # 2. Resize & Convert to Grayscale
            face_resized = cv2.resize(aligned_face, self.target_size)
            if len(face_resized.shape) == 3:
                gray = cv2.cvtColor(face_resized, cv2.COLOR_BGR2GRAY)
            else:
                gray = face_resized

            # 3. Illumination Invariance via Difference of Gaussians (DoG) Bandpass Filter + CLAHE
            g1 = cv2.GaussianBlur(gray, (0, 0), 1.0)
            g2 = cv2.GaussianBlur(gray, (0, 0), 2.0)
            dog = cv2.subtract(g1, g2)
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
            norm_img = clahe.apply(dog)

            # 4. Spatial Local Binary Patterns across 8x8 Grid (64 spatial sub-regions)
            lbp = self._compute_lbp(norm_img)
            grid_h, grid_w = lbp.shape[0] // 8, lbp.shape[1] // 8
            lbp_feats = []
            for r in range(8):
                for c in range(8):
                    cell = lbp[r * grid_h:(r + 1) * grid_h, c * grid_w:(c + 1) * grid_w]
                    hist, _ = np.histogram(cell.ravel(), bins=16, range=(0, 256))
                    lbp_feats.extend(hist)

            # 5. Spatial Histogram of Oriented Gradients (HOG) across 8x8 Grid (8 angle bins: 0-180 deg)
            gx = cv2.Sobel(norm_img, cv2.CV_32F, 1, 0, ksize=3)
            gy = cv2.Sobel(norm_img, cv2.CV_32F, 0, 1, ksize=3)
            mag, ang = cv2.cartToPolar(gx, gy, angleInDegrees=True)
            ang = ang % 180.0
            hog_feats = []
            for r in range(8):
                for c in range(8):
                    cell_mag = mag[r * grid_h:(r + 1) * grid_h, c * grid_w:(c + 1) * grid_w]
                    cell_ang = ang[r * grid_h:(r + 1) * grid_h, c * grid_w:(c + 1) * grid_w]
                    hist, _ = np.histogram(cell_ang, bins=8, range=(0, 180), weights=cell_mag)
                    hog_feats.extend(hist)

            # 6. Combined Feature Concatenation & L2 Unit Sphere Normalization
            combined = np.array(lbp_feats + hog_feats, dtype=np.float32)
            norm = np.linalg.norm(combined)
            if norm > 0:
                combined = combined / norm

            return combined.tolist()

        except Exception as e:
            print(f"[AI-RECOGNIZER] Error extracting embedding: {e}")
            return None

    def align_face(self, face_img: np.ndarray, eyes: Optional[List[Any]] = None) -> np.ndarray:
        """
        Geometrically align face horizontally using detected eye centers.
        """
        if face_img is None or face_img.size == 0 or eyes is None or len(eyes) < 2:
            return face_img
        try:
            eyes_sorted = sorted(eyes, key=lambda e: e[0])
            e1, e2 = eyes_sorted[0], eyes_sorted[1]
            c1 = (e1[0] + e1[2] // 2, e1[1] + e1[3] // 2)
            c2 = (e2[0] + e2[2] // 2, e2[1] + e2[3] // 2)
            dy = c2[1] - c1[1]
            dx = c2[0] - c1[0]
            angle = float(np.degrees(np.arctan2(dy, dx)))
            eye_center = ((c1[0] + c2[0]) / 2.0, (c1[1] + c2[1]) / 2.0)
            M = cv2.getRotationMatrix2D(eye_center, angle, 1.0)
            h, w = face_img.shape[:2]
            aligned = cv2.warpAffine(face_img, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
            return aligned
        except Exception:
            return face_img

    def compute_similarity(self, embedding1: List[float], embedding2: List[float]) -> float:
        """
        Compute Cosine Similarity score between two normalized embedding vectors.
        Returns a score in range [0.0, 1.0].
        """
        if not embedding1 or not embedding2 or len(embedding1) != len(embedding2):
            return 0.0

        v1 = np.array(embedding1, dtype=np.float32)
        v2 = np.array(embedding2, dtype=np.float32)

        dot_product = float(np.dot(v1, v2))
        return max(0.0, min(1.0, round(dot_product, 4)))

    def match_student_templates(self, query_embedding: List[float], student: Dict[str, Any]) -> float:
        """
        Compare query embedding against a student's stored multi-sample templates.
        Supports both:
        1. Multi-template array: student['faceEmbeddings'] = [[emb1], [emb2], [emb3]] -> max similarity across templates.
        2. Single template: student['faceEmbedding'] = [emb].
        """
        if not query_embedding or not student:
            return 0.0

        templates = []
        if "faceEmbeddings" in student and isinstance(student["faceEmbeddings"], list):
            templates.extend([t for t in student["faceEmbeddings"] if t and len(t) == len(query_embedding)])
        
        if "faceEmbedding" in student and student["faceEmbedding"] and len(student["faceEmbedding"]) == len(query_embedding):
            templates.append(student["faceEmbedding"])

        if not templates:
            return 0.0

        # Maximum similarity score across all enrolled templates for this student
        scores = [self.compute_similarity(query_embedding, t) for t in templates]
        return max(scores)

    def average_embeddings(self, embeddings_list: List[List[float]]) -> Optional[List[float]]:
        """Average multiple sample embeddings into a master template vector"""
        valid_embeddings = [e for e in embeddings_list if e and len(e) > 0]
        if not valid_embeddings:
            return None

        arr = np.array(valid_embeddings, dtype=np.float32)
        avg = np.mean(arr, axis=0)
        norm = np.linalg.norm(avg)
        if norm > 0:
            avg = avg / norm
        return avg.tolist()

face_recognizer = FaceRecognizer()
