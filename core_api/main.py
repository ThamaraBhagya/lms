from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import db

from routers import auth, courses, users, assignments

app = FastAPI(title="EduFlow Core API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    await db.connect()

@app.on_event("shutdown")
async def shutdown():
    await db.disconnect()

# Connect the routers to the main application
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(courses.router)
app.include_router(assignments.router)