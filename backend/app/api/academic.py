from fastapi import APIRouter, HTTPException, status
from typing import List, Optional
import uuid
from datetime import datetime, timezone
from app.models.schemas import (
    AcademicYearCreate, AcademicYearResponse,
    DepartmentCreate, DepartmentResponse,
    ProgramCreate, ProgramResponse,
    YearLevelCreate, YearLevelResponse,
    SemesterCreate, SemesterResponse
)
from app.firebase.client import get_db

router = APIRouter(prefix="/academic", tags=["Academic Hierarchy"])

# =========================================================================
# 1. ACADEMIC YEARS
# =========================================================================
@router.get("/years", response_model=List[AcademicYearResponse])
def list_academic_years():
    db = get_db()
    docs = db.collection("academic_years").get()
    years = [d.to_dict() for d in docs]
    if len(years) == 0:
        default_yr = {
            "id": "AY-2026-27",
            "year": "2026-27",
            "startDate": "2026-07-01",
            "endDate": "2027-05-31",
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
        "startDate": req.startDate or "",
        "endDate": req.endDate or "",
        "isCurrent": req.isCurrent,
        "createdAt": now_iso
    }
    db.collection("academic_years").document(year_id).set(y_data)
    return y_data

@router.put("/years/{year_id}", response_model=AcademicYearResponse)
def update_academic_year(year_id: str, req: AcademicYearCreate):
    db = get_db()
    doc_ref = db.collection("academic_years").document(year_id)
    if not doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="Academic year not found")
    
    update_data = {
        "year": req.year.strip(),
        "startDate": req.startDate or "",
        "endDate": req.endDate or "",
        "isCurrent": req.isCurrent,
        "updatedAt": datetime.now(timezone.utc).isoformat()
    }
    doc_ref.update(update_data)
    return doc_ref.get().to_dict()

@router.delete("/years/{year_id}")
def delete_academic_year(year_id: str):
    db = get_db()
    doc_ref = db.collection("academic_years").document(year_id)
    if not doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="Academic year not found")
    doc_ref.delete()
    return {"status": "SUCCESS", "message": f"Academic year '{year_id}' deleted."}

# =========================================================================
# 2. DEPARTMENTS
# =========================================================================
@router.get("/departments", response_model=List[DepartmentResponse])
def list_departments():
    db = get_db()
    docs = db.collection("departments").get()
    depts = [d.to_dict() for d in docs]
    if len(depts) == 0:
        default_depts = [
            {"id": "DEP-AIDS", "code": "AIDS", "name": "Artificial Intelligence & Data Science", "shortName": "AI & DS", "createdAt": datetime.now(timezone.utc).isoformat()},
            {"id": "DEP-CS", "code": "CS", "name": "Computer Science & Engineering", "shortName": "CSE", "createdAt": datetime.now(timezone.utc).isoformat()},
            {"id": "DEP-IT", "code": "IT", "name": "Information Technology", "shortName": "IT", "createdAt": datetime.now(timezone.utc).isoformat()}
        ]
        for d in default_depts:
            db.collection("departments").document(d["id"]).set(d)
            depts.append(d)
    return depts

@router.post("/departments", response_model=DepartmentResponse, status_code=status.HTTP_201_CREATED)
def create_department(req: DepartmentCreate):
    db = get_db()
    dept_code = req.code.strip().upper()
    dept_id = f"DEP-{dept_code}"
    if db.collection("departments").document(dept_id).get().exists:
        raise HTTPException(status_code=400, detail=f"Department with code '{dept_code}' already exists.")

    d_data = {
        "id": dept_id,
        "code": dept_code,
        "name": req.name.strip(),
        "shortName": req.shortName.strip() if req.shortName else dept_code,
        "createdAt": datetime.now(timezone.utc).isoformat()
    }
    db.collection("departments").document(dept_id).set(d_data)
    return d_data

@router.put("/departments/{dept_id}", response_model=DepartmentResponse)
def update_department(dept_id: str, req: DepartmentCreate):
    db = get_db()
    doc_ref = db.collection("departments").document(dept_id)
    if not doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="Department not found")
    
    update_data = {
        "code": req.code.strip().upper(),
        "name": req.name.strip(),
        "shortName": req.shortName.strip() if req.shortName else req.code.strip().upper(),
        "updatedAt": datetime.now(timezone.utc).isoformat()
    }
    doc_ref.update(update_data)
    return doc_ref.get().to_dict()

@router.delete("/departments/{dept_id}")
def delete_department(dept_id: str):
    db = get_db()
    doc_ref = db.collection("departments").document(dept_id)
    if not doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="Department not found")
    doc_ref.delete()
    return {"status": "SUCCESS", "message": f"Department '{dept_id}' deleted."}

# =========================================================================
# 3. PROGRAMS / BRANCHES
# =========================================================================
@router.get("/programs", response_model=List[ProgramResponse])
def list_programs(department: Optional[str] = None):
    db = get_db()
    docs = db.collection("programs").get()
    progs = [d.to_dict() for d in docs]
    if len(progs) == 0:
        default_progs = [
            {"id": "PRG-BTECH-AIDS", "code": "BTECH-AIDS", "name": "B.Tech in Artificial Intelligence & Data Science", "shortName": "B.Tech AI & DS", "degree": "B.Tech", "department": "Artificial Intelligence & Data Science", "durationYears": 4, "createdAt": datetime.now(timezone.utc).isoformat()},
            {"id": "PRG-BTECH-CS", "code": "BTECH-CS", "name": "B.Tech in Computer Science & Engineering", "shortName": "B.Tech CSE", "degree": "B.Tech", "department": "Computer Science & Engineering", "durationYears": 4, "createdAt": datetime.now(timezone.utc).isoformat()}
        ]
        for p in default_progs:
            db.collection("programs").document(p["id"]).set(p)
            progs.append(p)

    if department and department != "ALL":
        progs = [p for p in progs if p.get("department") == department]

    return progs

@router.post("/programs", response_model=ProgramResponse, status_code=status.HTTP_201_CREATED)
def create_program(req: ProgramCreate):
    db = get_db()
    prog_code = req.code.strip().upper()
    prog_id = f"PRG-{prog_code}"
    if db.collection("programs").document(prog_id).get().exists:
        prog_id = f"PRG-{prog_code}-{uuid.uuid4().hex[:4].upper()}"

    p_data = {
        "id": prog_id,
        "code": prog_code,
        "name": req.name.strip(),
        "shortName": req.shortName.strip() if req.shortName else req.name.strip(),
        "degree": req.degree or "B.Tech",
        "department": req.department.strip(),
        "durationYears": req.durationYears,
        "createdAt": datetime.now(timezone.utc).isoformat()
    }
    db.collection("programs").document(prog_id).set(p_data)
    return p_data

@router.put("/programs/{prog_id}", response_model=ProgramResponse)
def update_program(prog_id: str, req: ProgramCreate):
    db = get_db()
    doc_ref = db.collection("programs").document(prog_id)
    if not doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="Program not found")

    update_data = {
        "code": req.code.strip().upper(),
        "name": req.name.strip(),
        "shortName": req.shortName.strip() if req.shortName else req.name.strip(),
        "degree": req.degree or "B.Tech",
        "department": req.department.strip(),
        "durationYears": req.durationYears,
        "updatedAt": datetime.now(timezone.utc).isoformat()
    }
    doc_ref.update(update_data)
    return doc_ref.get().to_dict()

@router.delete("/programs/{prog_id}")
def delete_program(prog_id: str):
    db = get_db()
    doc_ref = db.collection("programs").document(prog_id)
    if not doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="Program not found")
    doc_ref.delete()
    return {"status": "SUCCESS", "message": f"Program '{prog_id}' deleted."}

# =========================================================================
# 4. ACADEMIC YEAR LEVELS (1st Year, 2nd Year, 3rd Year, 4th Year, etc.)
# =========================================================================
@router.get("/year-levels", response_model=List[YearLevelResponse])
def list_year_levels(program_id: Optional[str] = None):
    db = get_db()
    docs = db.collection("year_levels").get()
    y_levels = [d.to_dict() for d in docs]
    if len(y_levels) == 0:
        default_years = [
            {"id": "YRL-1", "yearName": "1st Year", "yearNumber": 1, "programId": "ALL", "createdAt": datetime.now(timezone.utc).isoformat()},
            {"id": "YRL-2", "yearName": "2nd Year", "yearNumber": 2, "programId": "ALL", "createdAt": datetime.now(timezone.utc).isoformat()},
            {"id": "YRL-3", "yearName": "3rd Year", "yearNumber": 3, "programId": "ALL", "createdAt": datetime.now(timezone.utc).isoformat()},
            {"id": "YRL-4", "yearName": "4th Year", "yearNumber": 4, "programId": "ALL", "createdAt": datetime.now(timezone.utc).isoformat()}
        ]
        for y in default_years:
            db.collection("year_levels").document(y["id"]).set(y)
            y_levels.append(y)

    if program_id and program_id != "ALL":
        y_levels = [y for y in y_levels if y.get("programId") in (program_id, "ALL", None)]

    return sorted(y_levels, key=lambda x: x.get("yearNumber", 0))

@router.post("/year-levels", response_model=YearLevelResponse, status_code=status.HTTP_201_CREATED)
def create_year_level(req: YearLevelCreate):
    db = get_db()
    y_name = req.yearName.strip()
    y_id = f"YRL-{req.yearNumber}-{uuid.uuid4().hex[:4].upper()}"

    y_data = {
        "id": y_id,
        "yearName": y_name,
        "yearNumber": req.yearNumber,
        "programId": req.programId or "ALL",
        "createdAt": datetime.now(timezone.utc).isoformat()
    }
    db.collection("year_levels").document(y_id).set(y_data)
    return y_data

@router.put("/year-levels/{year_level_id}", response_model=YearLevelResponse)
def update_year_level(year_level_id: str, req: YearLevelCreate):
    db = get_db()
    doc_ref = db.collection("year_levels").document(year_level_id)
    if not doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="Year level not found")

    update_data = {
        "yearName": req.yearName.strip(),
        "yearNumber": req.yearNumber,
        "programId": req.programId or "ALL",
        "updatedAt": datetime.now(timezone.utc).isoformat()
    }
    doc_ref.update(update_data)
    return doc_ref.get().to_dict()

@router.delete("/year-levels/{year_level_id}")
def delete_year_level(year_level_id: str):
    db = get_db()
    doc_ref = db.collection("year_levels").document(year_level_id)
    if not doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="Year level not found")
    doc_ref.delete()
    return {"status": "SUCCESS", "message": f"Year level '{year_level_id}' deleted."}

# =========================================================================
# 5. SEMESTERS (Semester I through Semester VIII, etc.)
# =========================================================================
@router.get("/semesters", response_model=List[SemesterResponse])
def list_semesters(year_id: Optional[str] = None):
    db = get_db()
    docs = db.collection("semesters").get()
    sems = [d.to_dict() for d in docs]
    if len(sems) == 0:
        default_sems = [
            {"id": "SEM-1", "semesterName": "Semester I", "semesterNumber": 1, "yearId": "1st Year", "createdAt": datetime.now(timezone.utc).isoformat()},
            {"id": "SEM-2", "semesterName": "Semester II", "semesterNumber": 2, "yearId": "1st Year", "createdAt": datetime.now(timezone.utc).isoformat()},
            {"id": "SEM-3", "semesterName": "Semester III", "semesterNumber": 3, "yearId": "2nd Year", "createdAt": datetime.now(timezone.utc).isoformat()},
            {"id": "SEM-4", "semesterName": "Semester IV", "semesterNumber": 4, "yearId": "2nd Year", "createdAt": datetime.now(timezone.utc).isoformat()},
            {"id": "SEM-5", "semesterName": "Semester V", "semesterNumber": 5, "yearId": "3rd Year", "createdAt": datetime.now(timezone.utc).isoformat()},
            {"id": "SEM-6", "semesterName": "Semester VI", "semesterNumber": 6, "yearId": "3rd Year", "createdAt": datetime.now(timezone.utc).isoformat()},
            {"id": "SEM-7", "semesterName": "Semester VII", "semesterNumber": 7, "yearId": "4th Year", "createdAt": datetime.now(timezone.utc).isoformat()},
            {"id": "SEM-8", "semesterName": "Semester VIII", "semesterNumber": 8, "yearId": "4th Year", "createdAt": datetime.now(timezone.utc).isoformat()}
        ]
        for s in default_sems:
            db.collection("semesters").document(s["id"]).set(s)
            sems.append(s)

    if year_id and year_id != "ALL":
        sems = [s for s in sems if s.get("yearId") in (year_id, "ALL", None)]

    return sorted(sems, key=lambda x: x.get("semesterNumber", 0))

@router.post("/semesters", response_model=SemesterResponse, status_code=status.HTTP_201_CREATED)
def create_semester(req: SemesterCreate):
    db = get_db()
    s_name = req.semesterName.strip()
    s_id = f"SEM-{req.semesterNumber}-{uuid.uuid4().hex[:4].upper()}"

    s_data = {
        "id": s_id,
        "semesterName": s_name,
        "semesterNumber": req.semesterNumber,
        "yearId": req.yearId or "2nd Year",
        "programId": req.programId or "ALL",
        "createdAt": datetime.now(timezone.utc).isoformat()
    }
    db.collection("semesters").document(s_id).set(s_data)
    return s_data

@router.put("/semesters/{semester_id}", response_model=SemesterResponse)
def update_semester(semester_id: str, req: SemesterCreate):
    db = get_db()
    doc_ref = db.collection("semesters").document(semester_id)
    if not doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="Semester not found")

    update_data = {
        "semesterName": req.semesterName.strip(),
        "semesterNumber": req.semesterNumber,
        "yearId": req.yearId or "2nd Year",
        "programId": req.programId or "ALL",
        "updatedAt": datetime.now(timezone.utc).isoformat()
    }
    doc_ref.update(update_data)
    return doc_ref.get().to_dict()

@router.delete("/semesters/{semester_id}")
def delete_semester(semester_id: str):
    db = get_db()
    doc_ref = db.collection("semesters").document(semester_id)
    if not doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="Semester not found")
    doc_ref.delete()
    return {"status": "SUCCESS", "message": f"Semester '{semester_id}' deleted."}
