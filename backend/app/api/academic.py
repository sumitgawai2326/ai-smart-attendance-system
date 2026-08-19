from fastapi import APIRouter, HTTPException, status
from typing import List
import uuid
from datetime import datetime, timezone
from app.models.schemas import (
    AcademicYearCreate, AcademicYearResponse,
    DepartmentCreate, DepartmentResponse,
    ProgramCreate, ProgramResponse
)
from app.firebase.client import get_db

router = APIRouter(prefix="/academic", tags=["Academic Hierarchy"])

# --- Academic Years ---
@router.get("/years", response_model=List[AcademicYearResponse])
def list_academic_years():
    db = get_db()
    docs = db.collection("academic_years").get()
    years = [d.to_dict() for d in docs]
    if len(years) == 0:
        # Default active academic year
        default_yr = {
            "id": "AY-2026-27",
            "year": "2026-27",
            "isCurrent": True,
            "createdAt": datetime.now(timezone.utc).isoformat()
        }
        db.collection("academic_years").document(default_yr["id"]).set(default_yr)
        years.append(default_yr)
    return sorted(years, key=lambda y: y.get("year", ""), reverse=True)

@router.post("/years", response_model=AcademicYearResponse, status_code=status.HTTP_201_CREATED)
def create_academic_year(req: AcademicYearCreate):
    db = get_db()
    clean_year = req.year.strip()
    existing = db.collection("academic_years").where("year", "==", clean_year).get()
    if len(existing) > 0:
        raise HTTPException(status_code=400, detail=f"Academic Year '{clean_year}' already exists.")

    year_id = f"AY-{clean_year.replace('/', '-').replace(' ', '')}"
    now_iso = datetime.now(timezone.utc).isoformat()
    y_data = {
        "id": year_id,
        "year": clean_year,
        "isCurrent": req.isCurrent,
        "createdAt": now_iso
    }
    db.collection("academic_years").document(year_id).set(y_data)
    return y_data

@router.delete("/years/{year_id}")
def delete_academic_year(year_id: str):
    db = get_db()
    doc_ref = db.collection("academic_years").document(year_id)
    if not doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="Academic year not found")
    doc_ref.delete()
    return {"status": "SUCCESS", "message": f"Academic year '{year_id}' deleted."}

# --- Departments ---
@router.get("/departments", response_model=List[DepartmentResponse])
def list_departments():
    db = get_db()
    docs = db.collection("departments").get()
    depts = [d.to_dict() for d in docs]
    if len(depts) == 0:
        default_depts = [
            {"id": "DEP-AIDS", "code": "AIDS", "name": "Artificial Intelligence & Data Science", "createdAt": datetime.now(timezone.utc).isoformat()},
            {"id": "DEP-CS", "code": "CS", "name": "Computer Science & Engineering", "createdAt": datetime.now(timezone.utc).isoformat()},
            {"id": "DEP-IT", "code": "IT", "name": "Information Technology", "createdAt": datetime.now(timezone.utc).isoformat()}
        ]
        for d in default_depts:
            db.collection("departments").document(d["id"]).set(d)
            depts.append(d)
    return depts

@router.post("/departments", response_model=DepartmentResponse, status_code=status.HTTP_201_CREATED)
def create_department(req: DepartmentCreate):
    db = get_db()
    dept_id = f"DEP-{req.code.strip().upper()}"
    d_data = {
        "id": dept_id,
        "code": req.code.strip().upper(),
        "name": req.name.strip(),
        "createdAt": datetime.now(timezone.utc).isoformat()
    }
    db.collection("departments").document(dept_id).set(d_data)
    return d_data

@router.delete("/departments/{dept_id}")
def delete_department(dept_id: str):
    db = get_db()
    doc_ref = db.collection("departments").document(dept_id)
    if not doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="Department not found")
    doc_ref.delete()
    return {"status": "SUCCESS", "message": f"Department '{dept_id}' deleted."}

# --- Programs ---
@router.get("/programs", response_model=List[ProgramResponse])
def list_programs():
    db = get_db()
    docs = db.collection("programs").get()
    progs = [d.to_dict() for d in docs]
    if len(progs) == 0:
        default_progs = [
            {"id": "PRG-BTECH-AIDS", "code": "BTECH-AIDS", "name": "B.Tech in Artificial Intelligence & Data Science", "department": "Artificial Intelligence & Data Science", "durationYears": 4, "createdAt": datetime.now(timezone.utc).isoformat()},
            {"id": "PRG-BTECH-CS", "code": "BTECH-CS", "name": "B.Tech in Computer Science & Engineering", "department": "Computer Science & Engineering", "durationYears": 4, "createdAt": datetime.now(timezone.utc).isoformat()}
        ]
        for p in default_progs:
            db.collection("programs").document(p["id"]).set(p)
            progs.append(p)
    return progs

@router.post("/programs", response_model=ProgramResponse, status_code=status.HTTP_201_CREATED)
def create_program(req: ProgramCreate):
    db = get_db()
    prog_id = f"PRG-{req.code.strip().upper()}"
    p_data = {
        "id": prog_id,
        "code": req.code.strip().upper(),
        "name": req.name.strip(),
        "department": req.department.strip(),
        "durationYears": req.durationYears,
        "createdAt": datetime.now(timezone.utc).isoformat()
    }
    db.collection("programs").document(prog_id).set(p_data)
    return p_data

@router.delete("/programs/{prog_id}")
def delete_program(prog_id: str):
    db = get_db()
    doc_ref = db.collection("programs").document(prog_id)
    if not doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="Program not found")
    doc_ref.delete()
    return {"status": "SUCCESS", "message": f"Program '{prog_id}' deleted."}
