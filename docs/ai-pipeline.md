# AI Face Recognition & Anti-Spoofing Pipeline

## Pipeline Execution Order
1. **Camera Frame Acquisition**: Live web camera base64 frame received via `/attendance/recognize`.
2. **Face Detection**: OpenCV Haar Cascade detects bounding boxes (scaleFactor=1.1, minNeighbors=5).
3. **Liveness & Anti-Spoofing Check**:
   - Laplacian texture variance analysis blocks flat photo prints or screen displays.
   - Eye Aspect Ratio (EAR) estimation verifies eye presence and natural motion.
4. **Facial Feature Embedding**: 128-dimensional L2-normalized feature vector computed from spatial intensity histograms and gradient magnitudes.
5. **Vector Similarity Matching**: Cosine similarity score computed against enrolled student master templates.
6. **Threshold Decision**: Confidence >= 75% identifies student identity; triggers Attendance Engine with duplicate check.
