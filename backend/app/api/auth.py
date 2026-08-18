from fastapi import APIRouter, HTTPException, status
from app.models.schemas import LoginRequest, TokenResponse, UserRole
from app.firebase.client import get_db

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest):
    """
    Authenticate user against Firestore/Firebase user collection.
    Seed default accounts (admin@college.edu, teacher@college.edu, student@college.edu) if system is empty.
    """
    db = get_db()
    users_ref = db.collection("users")
    matching_users = users_ref.where("email", "==", req.email).get()

    user_data = None
    if len(matching_users) > 0:
        user_data = matching_users[0].to_dict()
    else:
        # Auto-seed initial demo role accounts for instant testing if not existing
        if req.email == "admin@college.edu":
            user_data = {"id": "USR-ADMIN-01", "email": "admin@college.edu", "name": "System Administrator", "role": UserRole.ADMIN}
            users_ref.document("USR-ADMIN-01").set(user_data)
        elif req.email == "teacher@college.edu":
            user_data = {"id": "USR-TEACHER-01", "email": "teacher@college.edu", "name": "Prof. Alan Turing", "role": UserRole.TEACHER}
            users_ref.document("USR-TEACHER-01").set(user_data)
        elif req.email == "student@college.edu":
            user_data = {"id": "STU-001", "email": "student@college.edu", "name": "Rahul Patil", "role": UserRole.STUDENT}
            users_ref.document("STU-001").set(user_data)
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials. Please verify your email address."
            )

    role = user_data.get("role", UserRole.STUDENT)
    token = f"fake-jwt-token-{user_data.get('id')}-{role}"

    return {
        "token": token,
        "role": role,
        "user": user_data
    }

@router.get("/me")
def get_current_user_profile(user_id: str):
    db = get_db()
    doc = db.collection("users").document(user_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="User profile not found")
    return doc.to_dict()
