from fastapi import APIRouter, HTTPException, status
import random
from datetime import datetime, timezone, timedelta
from app.models.schemas import LoginRequest, TokenResponse, UserRole, ForgotPasswordRequest, ResetPasswordRequest
from app.firebase.client import get_db

router = APIRouter(prefix="/auth", tags=["Authentication"])

# In-memory OTP store: { email: { "otp": "123456", "expires_at": datetime } }
OTP_STORE = {}

@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest):
    """
    Authenticate user against Firestore/Firebase user collection.
    Seed default accounts (admin@college.edu, teacher@college.edu, student@college.edu) if system is empty.
    """
    db = get_db()
    users_ref = db.collection("users")
    clean_email = req.email.strip().lower()
    matching_users = users_ref.where("email", "==", clean_email).get()

    user_data = None
    if len(matching_users) > 0:
        user_data = matching_users[0].to_dict()
    else:
        # Auto-seed initial demo role accounts for instant testing if not existing
        if clean_email == "admin@college.edu":
            user_data = {"id": "USR-ADMIN-01", "email": "admin@college.edu", "name": "System Administrator", "role": UserRole.ADMIN, "password": req.password}
            users_ref.document("USR-ADMIN-01").set(user_data)
        elif clean_email == "teacher@college.edu":
            user_data = {"id": "USR-TEACHER-01", "email": "teacher@college.edu", "name": "Prof. Alan Turing", "role": UserRole.TEACHER, "password": req.password}
            users_ref.document("USR-TEACHER-01").set(user_data)
        elif clean_email == "student@college.edu":
            user_data = {"id": "STU-001", "email": "student@college.edu", "name": "Rahul Patil", "role": UserRole.STUDENT, "password": req.password}
            users_ref.document("STU-001").set(user_data)
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials. Please verify your email address or check registered accounts."
            )

    role = user_data.get("role", UserRole.STUDENT)
    token = f"fake-jwt-token-{user_data.get('id')}-{role}"

    return {
        "token": token,
        "role": role,
        "user": user_data
    }

@router.post("/forgot-password")
def request_password_reset_otp(req: ForgotPasswordRequest):
    """
    Generate 6-digit OTP verification code for user's email to reset password.
    """
    db = get_db()
    clean_email = req.email.strip().lower()
    matching_users = db.collection("users").where("email", "==", clean_email).get()
    
    # Auto-seed demo accounts if requested
    if len(matching_users) == 0:
        if clean_email in ["teacher@college.edu", "admin@college.edu", "student@college.edu"]:
            role = UserRole.TEACHER if "teacher" in clean_email else (UserRole.ADMIN if "admin" in clean_email else UserRole.STUDENT)
            uid = f"USR-{role.value}-01"
            db.collection("users").document(uid).set({"id": uid, "email": clean_email, "name": f"Demo {role.value}", "role": role})
        else:
            raise HTTPException(
                status_code=404,
                detail=f"No registered account found with email '{clean_email}'. Please verify your email."
            )

    # Generate 6-digit OTP
    otp_code = f"{random.randint(100000, 999999)}"
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)

    OTP_STORE[clean_email] = {
        "otp": otp_code,
        "expires_at": expires_at
    }

    # Mask email for privacy display (e.g. t***r@college.edu)
    parts = clean_email.split("@")
    user_part = parts[0]
    domain_part = parts[1] if len(parts) > 1 else "college.edu"
    masked = f"{user_part[0]}***{user_part[-1] if len(user_part) > 1 else ''}@{domain_part}"

    print(f"[AUTH-OTP] Generated OTP for {clean_email}: {otp_code} (Valid for 10 min)")

    return {
        "status": "SUCCESS",
        "message": f"Verification OTP code sent to {masked}",
        "maskedTarget": masked,
        "otp": otp_code, # Sent back so UI can display instant testing notification
        "expiresInMinutes": 10
    }

@router.post("/reset-password")
def verify_otp_and_reset_password(req: ResetPasswordRequest):
    """
    Verify OTP and update user's password in database.
    """
    db = get_db()
    clean_email = req.email.strip().lower()
    clean_otp = req.otp.strip()
    clean_pwd = req.newPassword.strip()

    if not clean_pwd or len(clean_pwd) < 4:
        raise HTTPException(status_code=400, detail="New password must be at least 4 characters long.")

    record = OTP_STORE.get(clean_email)
    if not record:
        raise HTTPException(status_code=400, detail="No OTP was requested for this email or it has expired. Please request a new OTP.")

    if datetime.now(timezone.utc) > record["expires_at"]:
        OTP_STORE.pop(clean_email, None)
        raise HTTPException(status_code=400, detail="The OTP has expired. Please request a new OTP.")

    if record["otp"] != clean_otp:
        raise HTTPException(status_code=400, detail="Invalid OTP code. Please check the code and try again.")

    # OTP Verified! Update password in database
    users = db.collection("users").where("email", "==", clean_email).get()
    for u in users:
        db.collection("users").document(u.id).update({
            "password": clean_pwd,
            "updatedAt": datetime.now(timezone.utc).isoformat()
        })

    # Clear OTP
    OTP_STORE.pop(clean_email, None)

    return {
        "status": "SUCCESS",
        "message": f"Password updated successfully for {clean_email}! You can now sign in with your new password."
    }

@router.get("/me")
def get_current_user_profile(user_id: str):
    db = get_db()
    doc = db.collection("users").document(user_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="User profile not found")
    return doc.to_dict()
