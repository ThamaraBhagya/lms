from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm
from database import db
from schemas import RegisterInput
from security import get_password_hash, verify_password, create_access_token

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register")
async def register(user: RegisterInput):
    existing_user = await db.user.find_unique(where={"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = get_password_hash(user.password)
    new_user = await db.user.create(
        data={
            "email": user.email,
            "passwordHash": hashed_password,
            "firstName": user.firstName,
            "lastName": user.lastName,
            "role": user.role
        }
    )
    return {"message": "User created successfully", "user_id": new_user.id}

@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await db.user.find_unique(where={"email": form_data.username})
    if not user or not verify_password(form_data.password, user.passwordHash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    access_token = create_access_token(data={"sub": user.id, "role": user.role})
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": {"id": user.id, "email": user.email, "firstName": user.firstName, "lastName": user.lastName, "role": user.role}
    }