# main.py

import os
import uuid
from typing import Optional

from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel

from app import db
from app.config import (
    UPLOAD_DIR,
    ALLOWED_VIDEO_EXTENSIONS,
    FREQ_PRESETS,
    DEFAULT_ALPHA,
    MAX_ALPHA,
)

app = FastAPI(title="Motion Amplification Video Analysis System")


@app.on_event("startup")
def on_startup():
    # Initialize the database and create the uploads folder
    db.init_db()
    os.makedirs(UPLOAD_DIR, exist_ok=True)


@app.get("/")
def read_root():
    # Basic check to make sure the backend is running
    return {"status": "backend is running"}


@app.post("/api/upload")
async def upload_video(file: UploadFile = File(...)):
    # Check if the uploaded file has an allowed video extension
    ext = os.path.splitext(file.filename)[1].lower()

    if ext not in ALLOWED_VIDEO_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {ext}"
        )

    # Generate a unique ID for this job
    job_id = str(uuid.uuid4())

    # Save the uploaded video in the uploads folder
    saved_path = os.path.join(UPLOAD_DIR, f"{job_id}{ext}")

    with open(saved_path, "wb") as out_file:
        content = await file.read()
        out_file.write(content)

    # Create a job in the database
    # ROI and frequency settings will be added later
    db.create_job(
        job_id=job_id,
        filename=file.filename,
        alpha=None,
        low_hz=None,
        high_hz=None,
        preset="custom",
        roi=None,
    )

    return {"job_id": job_id, "filename": file.filename}


class RoiRequest(BaseModel):
    x: int
    y: int
    w: int
    h: int
    preset: str
    low_hz: Optional[float] = None
    high_hz: Optional[float] = None
    alpha: Optional[float] = None


@app.post("/api/jobs/{job_id}/roi")
def submit_roi(job_id: str, roi: RoiRequest):
    # Check that the job exists
    existing = db.get_job_by_id(job_id)

    if existing is None:
        raise HTTPException(status_code=404, detail="Job not found")

    # Get the frequency range from the selected preset
    if roi.preset == "custom":
        if roi.low_hz is None or roi.high_hz is None:
            raise HTTPException(
                status_code=400,
                detail="low_hz and high_hz are required when preset is 'custom'"
            )

        low_hz = roi.low_hz
        high_hz = roi.high_hz

    elif roi.preset in FREQ_PRESETS:
        preset_range = FREQ_PRESETS[roi.preset]
        low_hz = preset_range["low_hz"]
        high_hz = preset_range["high_hz"]

    else:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown preset: {roi.preset}"
        )

    # Use the default alpha if one was not provided
    alpha = roi.alpha if roi.alpha is not None else DEFAULT_ALPHA

    # Do not allow alpha to go above the maximum value
    alpha = min(alpha, MAX_ALPHA)

    # Save the ROI and analysis settings in the database
    db.update_job_roi(
        job_id=job_id,
        roi={
            "x": roi.x,
            "y": roi.y,
            "w": roi.w,
            "h": roi.h
        },
        preset=roi.preset,
        low_hz=low_hz,
        high_hz=high_hz,
        alpha=alpha,
    )

    return {
        "status": "roi_saved",
        "job_id": job_id,
        "low_hz": low_hz,
        "high_hz": high_hz,
        "alpha": alpha,
    }