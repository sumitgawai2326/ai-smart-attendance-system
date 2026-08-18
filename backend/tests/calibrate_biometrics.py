import cv2
import numpy as np
import os
import time

def generate_synthetic_person_dataset(num_persons=10, samples_per_person=6):
    """
    Generate synthetic realistic facial profile structures for calibration & benchmark.
    Each person has unique landmark proportions (eye distance, nose length, mouth width, face ratio).
    Each sample has noise, brightness variations, slight scaling, and rotation.
    """
    np.random.seed(42)
    dataset = {}
    
    for p in range(num_persons):
        p_id = f"PERSON_{p+1:02d}"
        dataset[p_id] = []
        
        # Unique biometric geometry for this person
        eye_y = int(np.random.uniform(40, 52))
        eye_spacing = int(np.random.uniform(24, 38))
        nose_y = int(np.random.uniform(62, 74))
        mouth_y = int(np.random.uniform(85, 96))
        mouth_w = int(np.random.uniform(18, 32))
        skin_tone = int(np.random.uniform(120, 200))
        
        for s in range(samples_per_person):
            img = np.ones((128, 128, 3), dtype=np.uint8) * skin_tone
            # Add facial boundary
            cv2.ellipse(img, (64, 64), (48, 56), 0, 0, 360, (skin_tone - 30, skin_tone - 30, skin_tone - 30), -1)
            
            # Add eyes with sample jitter
            j_ex = np.random.randint(-2, 3)
            j_ey = np.random.randint(-2, 3)
            left_eye = (64 - eye_spacing // 2 + j_ex, eye_y + j_ey)
            right_eye = (64 + eye_spacing // 2 + j_ex, eye_y + j_ey)
            
            cv2.circle(img, left_eye, 7, (30, 30, 30), -1)
            cv2.circle(img, right_eye, 7, (30, 30, 30), -1)
            
            # Eyebrows
            cv2.line(img, (left_eye[0] - 8, left_eye[1] - 8), (left_eye[0] + 8, left_eye[1] - 8), (20, 20, 20), 2)
            cv2.line(img, (right_eye[0] - 8, right_eye[1] - 8), (right_eye[0] + 8, right_eye[1] - 8), (20, 20, 20), 2)
            
            # Nose
            cv2.line(img, (64, eye_y + 8), (64, nose_y), (skin_tone - 50, skin_tone - 50, skin_tone - 50), 2)
            
            # Mouth
            cv2.ellipse(img, (64, mouth_y), (mouth_w // 2, 5), 0, 0, 180, (40, 40, 40), 2)
            
            # Lighting & noise variation
            noise = np.random.normal(0, 8, (128, 128, 3)).astype(np.int16)
            img_noisy = np.clip(img.astype(np.int16) + noise, 0, 255).astype(np.uint8)
            
            # Random slight rotation (-5 to +5 deg)
            angle = np.random.uniform(-5, 5)
            M = cv2.getRotationMatrix2D((64, 64), angle, 1.0)
            img_rot = cv2.warpAffine(img_noisy, M, (128, 128), borderMode=cv2.BORDER_REPLICATE)
            
            dataset[p_id].append(img_rot)
            
    return dataset

def run_biometric_calibration():
    from app.ai.recognizer import face_recognizer
    dataset = generate_synthetic_person_dataset(num_persons=10, samples_per_person=6)
    
    # Extract embeddings for all samples
    embeddings = {}
    for p_id, samples in dataset.items():
        embeddings[p_id] = [face_recognizer.extract_embedding(img) for img in samples]
        
    same_person_scores = []
    diff_person_scores = []
    
    # 1. Same-person pairwise comparisons
    for p_id, embs in embeddings.items():
        for i in range(len(embs)):
            for j in range(i + 1, len(embs)):
                sim = face_recognizer.compute_similarity(embs[i], embs[j])
                same_person_scores.append(sim)
                
    # 2. Different-person pairwise comparisons
    p_keys = list(embeddings.keys())
    for i in range(len(p_keys)):
        for j in range(i + 1, len(p_keys)):
            for emb1 in embeddings[p_keys[i]]:
                for emb2 in embeddings[p_keys[j]]:
                    sim = face_recognizer.compute_similarity(emb1, emb2)
                    diff_person_scores.append(sim)
                    
    same_min = np.min(same_person_scores)
    same_avg = np.mean(same_person_scores)
    same_max = np.max(same_person_scores)
    
    diff_min = np.min(diff_person_scores)
    diff_avg = np.mean(diff_person_scores)
    diff_max = np.max(diff_person_scores)
    
    print("=== BIOMETRIC ACCURACY & SIMILARITY DISTRIBUTION ===")
    print(f"Total Same-Person Pair Comparisons: {len(same_person_scores)}")
    print(f"Same-Person Similarity  -> Min: {same_min:.4f}, Avg: {same_avg:.4f}, Max: {same_max:.4f}")
    print(f"Total Different-Person Pair Comparisons: {len(diff_person_scores)}")
    print(f"Different-Person Similarity -> Min: {diff_min:.4f}, Avg: {diff_avg:.4f}, Max: {diff_max:.4f}")
    
    # Sweep thresholds to find optimal threshold with 0 False Acceptance
    best_thresh = 0.65
    min_far = 1.0
    for t in np.arange(0.40, 0.85, 0.02):
        far = np.mean([s >= t for s in diff_person_scores])  # False Acceptance Rate
        frr = np.mean([s < t for s in same_person_scores])   # False Rejection Rate
        if far == 0.0 and frr < 0.05:
            best_thresh = t
            print(f"Valid Safe Threshold: {t:.2f} -> FAR: {far*100:.2f}%, FRR: {frr*100:.2f}%")
            break

    print(f"\nCalibrated FACE_MATCH_THRESHOLD: {best_thresh:.2f}")
    return same_person_scores, diff_person_scores

if __name__ == "__main__":
    import sys
    sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
    run_biometric_calibration()
