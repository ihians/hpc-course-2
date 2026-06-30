# PAF Duty Roster

A duty shift management tool for the students of IT Branch.
Used as a training application for Docker and Git workshops.

---

## Project Structure

```
paf-duty-roster/
├── frontend/
│   ├── index.html      # Main HTML page
│   ├── style.css       # Styling
│   ├── app.js          # Frontend logic — calls backend API directly
│   ├── nginx.conf      # Nginx configuration
│   └── Dockerfile      # How to containerise the frontend
└── backend/
    ├── main.py         # FastAPI application — all API routes
    ├── requirements.txt
    └── Dockerfile      # How to containerise the backend
```

> There is no docker-compose.yml — each container is built and run independently.

---

## Running with Docker (step by step)

### Step 1 — Build the backend image
```bash
cd backend
docker build -t paf-roster-backend .
```

### Step 2 — Run the backend container
```bash
docker run -d \
  --name roster-backend \
  -p 8000:8000 \
  -v roster-data:/app/data \
  paf-roster-backend
```

### Step 3 — Build the frontend image
```bash
cd ../frontend
docker build -t paf-roster-frontend .
```

### Step 4 — Run the frontend container
```bash
docker run -d \
  --name roster-frontend \
  -p 80:80 \
  paf-roster-frontend
```

### Step 5 — Open the application
```
Frontend:        http://localhost
Backend API:     http://localhost:8000
API Docs:        http://localhost:8000/docs
```

---

## Useful Docker commands for the workshop

```bash
# List running containers
docker ps

# View backend logs
docker logs roster-backend

# View frontend logs
docker logs roster-frontend

# Stop a container
docker stop roster-backend
docker stop roster-frontend

# Remove a container
docker rm roster-backend
docker rm roster-frontend

# Remove an image
docker rmi paf-roster-backend
docker rmi paf-roster-frontend

# List all images
docker images

# List all volumes
docker volume ls

# Inspect the data volume
docker volume inspect roster-data
```

---

## Running locally without Docker

**Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
python -m http.server 3000
# Open http://localhost:3000
```

---

## API Endpoints

| Method | Endpoint           | Description               |
|--------|--------------------|---------------------------|
| GET    | /duties            | Get all duty assignments  |
| POST   | /duties            | Add a new duty assignment |
| PATCH  | /duties/{id}       | Update duty status        |
| DELETE | /duties/{id}       | Delete a duty assignment  |

---

## Features

- Assign duty to an officer with rank, post, shift, and date
- View all assignments in a filterable table (by shift, status, date, name)
- Cycle status: Pending → On Duty → Completed
- Summary counts in the header
- Duplicate detection — same officer cannot have the same shift on the same date
- Data persisted via Docker named volume
