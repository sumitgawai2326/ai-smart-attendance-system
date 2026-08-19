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

# --- Academic Hierarchy Schemas ---
class AcademicYearCreate(BaseModel):
    year: str # e.g. "2026-27"
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    isCurrent: bool = True

class AcademicYearResponse(BaseModel):
    id: str
    year: str
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    isCurrent: bool = True
    createdAt: Optional[str] = None

class DepartmentCreate(BaseModel):
    code: str # e.g. "AIDS"
    name: str # e.g. "Artificial Intelligence & Data Science"
    shortName: Optional[str] = None # e.g. "AI & DS"

class DepartmentResponse(BaseModel):
    id: str
    code: str
    name: str
    shortName: Optional[str] = None
    createdAt: Optional[str] = None

class ProgramCreate(BaseModel):
    code: str # e.g. "BTECH-AIDS"
    name: str # e.g. "B.Tech in Artificial Intelligence & Data Science"
    shortName: Optional[str] = None # e.g. "B.Tech AI & DS"
    degree: Optional[str] = "B.Tech"
    department: str # e.g. "Artificial Intelligence & Data Science"
    durationYears: int = 4

class ProgramResponse(BaseModel):
    id: str
    code: str
    name: str
    shortName: Optional[str] = None
    degree: Optional[str] = "B.Tech"
    department: str
    durationYears: int = 4
    createdAt: Optional[str] = None

class YearLevelCreate(BaseModel):
    yearName: str # e.g. "2nd Year", "SE"
    yearNumber: int # e.g. 2
    programId: Optional[str] = None

class YearLevelResponse(BaseModel):
    id: str
    yearName: str
    yearNumber: int
    programId: Optional[str] = None
    createdAt: Optional[str] = None

class SemesterCreate(BaseModel):
    semesterName: str # e.g. "Semester III"
    semesterNumber: int # e.g. 3
    yearId: Optional[str] = None # e.g. "2nd Year"
    programId: Optional[str] = None

class SemesterResponse(BaseModel):
    id: str
    semesterName: str
    semesterNumber: int
    yearId: Optional[str] = None
    programId: Optional[str] = None
    createdAt: Optional[str] = None

class DivisionCreate(BaseModel):
    divisionName: str # e.g. "A", "B", "C", "AI-1", "AI-2"
    department: Optional[str] = None
    program: Optional[str] = None

class DivisionResponse(BaseModel):
    id: str
    divisionName: str
    department: Optional[str] = None
    program: Optional[str] = None
    createdAt: Optional[str] = None

# --- Student Schemas ---
class StudentCreate(BaseModel):
    rollNumber: str
    name: str
    email: EmailStr
    classId: str
    academicYear: Optional[str] = "2026-27"
    department: Optional[str] = "Artificial Intelligence & Data Science"
    program: Optional[str] = "B.Tech in Artificial Intelligence & Data Science"
    year: Optional[str] = "2nd Year"
    semester: Optional[str] = "Semester III"
    division: Optional[str] = "AI-2"
    branch: Optional[str] = "AI & Data Science"
    phone: Optional[str] = None
    prnNumber: Optional[str] = None

class StudentProfileUpdate(BaseModel):
    name: Optional[str] = None
    rollNumber: Optional[str] = None
    prnNumber: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    whatsapp: Optional[str] = None
    dob: Optional[str] = None
    gender: Optional[str] = None
    bloodGroup: Optional[str] = None
    academicYear: Optional[str] = None
    department: Optional[str] = None
    program: Optional[str] = None
    year: Optional[str] = None
    semester: Optional[str] = None
    division: Optional[str] = None
    branch: Optional[str] = None
    guardianName: Optional[str] = None
    guardianPhone: Optional[str] = None
    address: Optional[str] = None
    emergencyContact: Optional[str] = None

class StudentTransferRequest(BaseModel):
    newClassId: str
    newDivision: Optional[str] = None
    newSemester: Optional[str] = None
    newYear: Optional[str] = None

class DocumentUploadRequest(BaseModel):
    documentType: str  # e.g., 'collegeId', 'aadhaarCard', 'marksheet', 'feeReceipt', 'other'
    title: str
    fileName: str
    fileBase64: str
    fileType: str  # e.g., 'image/jpeg', 'image/png', 'application/pdf'
    fileSize: Optional[str] = None

class StudentResponse(BaseModel):
    id: str
    rollNumber: str
    name: str
    email: str
    classId: str
    academicYear: Optional[str] = "2026-27"
    department: Optional[str] = "Artificial Intelligence & Data Science"
    program: Optional[str] = "B.Tech in Artificial Intelligence & Data Science"
    year: Optional[str] = "2nd Year"
    semester: Optional[str] = "Semester III"
    division: Optional[str] = "AI-2"
    branch: Optional[str] = "AI & Data Science"
    prnNumber: Optional[str] = None
    phone: Optional[str] = None
    whatsapp: Optional[str] = None
    dob: Optional[str] = None
    gender: Optional[str] = None
    bloodGroup: Optional[str] = None
    guardianName: Optional[str] = None
    guardianPhone: Optional[str] = None
    address: Optional[str] = None
    emergencyContact: Optional[str] = None
    hasFaceEnrolled: bool = False
    enrolledSamplesCount: Optional[int] = 0
    photoUrl: Optional[str] = None
    documents: Optional[Dict[str, Any]] = {}
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
    phone: Optional[str] = None
    employeeId: Optional[str] = None
    designation: Optional[str] = "Assistant Professor"
    qualification: Optional[str] = None
    specialization: Optional[str] = None
    cabin: Optional[str] = None
    officeHours: Optional[str] = None
    experienceYears: Optional[str] = None

class TeacherProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    department: Optional[str] = None
    phone: Optional[str] = None
    employeeId: Optional[str] = None
    designation: Optional[str] = None
    qualification: Optional[str] = None
    specialization: Optional[str] = None
    cabin: Optional[str] = None
    officeHours: Optional[str] = None
    experienceYears: Optional[str] = None
    assignedClasses: Optional[List[str]] = None

class TeacherResponse(BaseModel):
    id: str
    name: str
    email: str
    department: str
    phone: Optional[str] = None
    employeeId: Optional[str] = None
    designation: Optional[str] = "Assistant Professor"
    qualification: Optional[str] = None
    specialization: Optional[str] = None
    cabin: Optional[str] = None
    officeHours: Optional[str] = None
    experienceYears: Optional[str] = None
    assignedClasses: List[str] = []
    createdAt: Optional[str] = None

# --- Class & Subject Schemas ---
class ClassCreate(BaseModel):
    name: str # e.g. "B.Tech AI & DS - 2nd Year (Div AI-2)"
    department: str # e.g. "Artificial Intelligence & Data Science"
    program: Optional[str] = "B.Tech in Artificial Intelligence & Data Science"
    academicYear: Optional[str] = "2026-27"
    year: str # e.g. "2nd Year"
    semester: Optional[str] = "Semester III"
    division: str # e.g. "AI-2"

class ClassResponse(ClassCreate):
    id: str
    createdAt: Optional[str] = None

class SubjectCreate(BaseModel):
    code: str
    name: str
    classId: str
    credits: Optional[int] = 4
    department: Optional[str] = None
    program: Optional[str] = None
    year: Optional[str] = None
    semester: Optional[str] = "Semester III"
    division: Optional[str] = None
    teacherId: Optional[str] = None

class SubjectResponse(SubjectCreate):
    id: str
    createdAt: Optional[str] = None

# --- Manual & Session Schemas ---
class ManualAttendanceSubmitRequest(BaseModel):
    classId: str
    subjectId: str
    teacherId: str
    date: str
    academicYear: Optional[str] = "2026-27"
    semester: Optional[str] = "Semester III"
    division: Optional[str] = "AI-2"
    timeSlot: Optional[str] = "10:00 AM - 11:00 AM"
    topicCovered: Optional[str] = ""
    records: List[Dict[str, Any]]

class SessionCreate(BaseModel):
    classId: str
    subjectId: str
    teacherId: str
    academicYear: Optional[str] = "2026-27"
    semester: Optional[str] = "Semester III"
    division: Optional[str] = "AI-2"

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

# --- Dashboard Unified Metrics Schemas ---
class AdminDashboardMetrics(BaseModel):
    totalStudents: int
    totalEnrolledFaces: int
    totalTeachers: int
    totalClasses: int
    totalSubjects: int
    totalAttendanceSessions: int
    overallAttendancePercentage: float

class TeacherDashboardMetrics(BaseModel):
    teacherId: str
    assignedClasses: List[Dict[str, Any]]
    assignedSubjects: List[Dict[str, Any]]
    enrolledStudentsCount: int
    averageAttendancePercentage: float
    totalSessionsConducted: int
    students: List[StudentResponse]
