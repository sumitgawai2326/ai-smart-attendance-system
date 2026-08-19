from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from enum import Enum

class UserRole(str, Enum):
    ADMIN = "ADMIN"
    TEACHER = "TEACHER"
    STUDENT = "STUDENT"

class AttendanceMethod(str, Enum):
    AI_FACE = "AI_FACE"
    MANUAL = "MANUAL"

class AttendanceStatus(str, Enum):
    PRESENT = "PRESENT"
    ABSENT = "ABSENT"
    LATE = "LATE"

# --- User & Auth Schemas ---
class UserBase(BaseModel):
    email: EmailStr
    name: str
    role: UserRole

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: str
    createdAt: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    token: str
    role: UserRole
    user: Dict[str, Any]

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str
    newPassword: str

# --- Student Schemas ---
class StudentCreate(BaseModel):
    rollNumber: str
    name: str
    email: EmailStr
    classId: str
    division: Optional[str] = "A"
    branch: str = "AI & DS"
    year: str = "3rd Year"

class StudentResponse(BaseModel):
    id: str
    rollNumber: str
    name: str
    email: str
    classId: str
    division: Optional[str] = "A"
    branch: str = "AI & DS"
    year: str = "3rd Year"
    hasFaceEnrolled: bool = False
    enrolledSamplesCount: Optional[int] = 0
    photoUrl: Optional[str] = None
    createdAt: Optional[str] = None

class FaceEnrollmentRequest(BaseModel):
    studentId: str
    imageSamples: List[str]  # Multi-angle Base64 sample images

# --- Teacher Schemas ---
class TeacherCreate(BaseModel):
    name: str
    email: EmailStr
    department: str
    assignedClasses: List[str] = []

class TeacherResponse(BaseModel):
    id: str
    name: str
    email: str
    department: str
    assignedClasses: List[str] = []

# --- Class & Subject Schemas ---
class ClassCreate(BaseModel):
    name: str
    department: str
    year: str
    division: str

class ClassResponse(ClassCreate):
    id: str

class SubjectCreate(BaseModel):
    code: str
    name: str
    classId: str
    teacherId: str

class SubjectResponse(SubjectCreate):
    id: str

# --- Attendance Session & Record Schemas ---
class SessionCreate(BaseModel):
    classId: str
    subjectId: str
    teacherId: str

class SessionResponse(BaseModel):
    id: str
    classId: str
    subjectId: str
    teacherId: str
    date: str
    startTime: str
    endTime: Optional[str] = None
    status: str  # ACTIVE, COMPLETED, CANCELLED

class FrameRecognitionRequest(BaseModel):
    sessionId: str
    frame: str  # Base64 image
    consecutiveBlinkCount: Optional[int] = 0

class SingleFaceRecognitionResult(BaseModel):
    faceIndex: int
    boundingBox: List[int]  # [x, y, w, h]
    recognized: bool
    studentId: Optional[str] = None
    name: Optional[str] = None
    rollNumber: Optional[str] = None
    confidence: float
    secondCandidateName: Optional[str] = None
    secondConfidence: Optional[float] = 0.0
    margin: Optional[float] = 0.0
    quality: Optional[Dict[str, Any]] = None
    livenessVerified: bool
    status: str  # CONFIRMED, PRESENT, ALREADY_MARKED, UNKNOWN, AMBIGUOUS, LOW_QUALITY, LIVENESS_FAILED
    message: str

class MultiFaceRecognitionResponse(BaseModel):
    totalFaces: int
    results: List[SingleFaceRecognitionResult]
    status: str
    message: str

class ManualAttendanceCorrection(BaseModel):
    recordId: Optional[str] = None
    sessionId: str
    studentId: str
    status: AttendanceStatus
    reason: Optional[str] = "Teacher override"

class AttendanceRecordResponse(BaseModel):
    id: str
    sessionId: str
    studentId: str
    studentName: str
    rollNumber: str
    status: str
    confidence: float
    method: str
    markedBy: str
    timestamp: str
