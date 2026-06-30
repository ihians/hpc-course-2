from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import json
import os
import uuid
from datetime import datetime

app = FastAPI(title="Duty Roster API - FAST API Backend")

# Allow the frontend (running in a browser) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# JSON file used as our simple database
DATA_FILE = os.getenv("DATA_FILE", "data/roster.json")


def read_data():
    """Read all duty entries from the JSON file."""
    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
    if not os.path.exists(DATA_FILE):
        return []
    with open(DATA_FILE, "r") as f:
        return json.load(f)


def write_data(entries):
    """Write all duty entries to the JSON file."""
    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
    with open(DATA_FILE, "w") as f:
        json.dump(entries, f, indent=2)


# ── Data model ────────────────────────────────────────────────────────────────

class DutyCreate(BaseModel):
    officer_name: str
    rank: str
    post: str
    shift: str          # Morning / Afternoon / Night
    duty_date: str      # YYYY-MM-DD


class DutyUpdate(BaseModel):
    status: str         # Pending / On Duty / Completed


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"message": "Duty Roster API is running"}


@app.get("/duties")
def get_all_duties():
    """Return all duty entries, sorted by date."""
    entries = read_data()
    return sorted(entries, key=lambda x: x["duty_date"])


@app.post("/duties", status_code=201)
def add_duty(entry: DutyCreate):
    """Add a new duty assignment."""
    entries = read_data()

    # Prevent same officer being assigned two shifts on the same date
    for existing in entries:
        if (existing["officer_name"].lower() == entry.officer_name.lower()
                and existing["duty_date"] == entry.duty_date
                and existing["shift"] == entry.shift):
            raise HTTPException(
                status_code=400,
                detail=f"{entry.officer_name} is already assigned to the "
                       f"{entry.shift} shift on {entry.duty_date}."
            )

    new_entry = {
        "id":           str(uuid.uuid4()),
        "officer_name": entry.officer_name,
        "rank":         entry.rank,
        "post":         entry.post,
        "shift":        entry.shift,
        "duty_date":    entry.duty_date,
        "status":       "Pending",
        "created_at":   datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC"),
    }

    entries.append(new_entry)
    write_data(entries)
    return new_entry


@app.patch("/duties/{duty_id}")
def update_status(duty_id: str, update: DutyUpdate):
    """Update the status of a duty entry."""
    entries = read_data()

    for entry in entries:
        if entry["id"] == duty_id:
            entry["status"] = update.status
            write_data(entries)
            return entry

    raise HTTPException(status_code=404, detail="Duty entry not found.")


@app.delete("/duties/{duty_id}", status_code=204)
def delete_duty(duty_id: str):
    """Delete a duty entry."""
    entries = read_data()
    updated = [e for e in entries if e["id"] != duty_id]

    if len(updated) == len(entries):
        raise HTTPException(status_code=404, detail="Duty entry not found.")

    write_data(updated)
    return None
