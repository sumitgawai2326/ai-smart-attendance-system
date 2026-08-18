# Testing & Verification Guide

## Automated Backend Pytest Suite
Run the automated test suite covering API endpoints, health checks, authentication, and database logic:

```bash
cd backend
python -m pytest tests/
```

## Manual Verification Checklist
1. **Admin Portal**: Login with `admin@college.edu`, register students, check table list.
2. **Student Face Enrollment**: Go to Face Enrollment, capture webcam samples, verify master embedding generated.
3. **Teacher Live Camera Attendance**: Select class & subject, start session, verify face detection overlay, liveness check, and duplicate attendance prevention.
4. **Student Dashboard**: Login as student (`student@college.edu`), check subject breakdown table and low-attendance warning.
5. **CSV Export**: Generate and download CSV report.
