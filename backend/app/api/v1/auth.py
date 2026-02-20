from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from pydantic import BaseModel, EmailStr, Field
import secrets
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

from beanie import PydanticObjectId

from app.models import User
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.api.deps import get_current_user
from app.config import settings
from app.utils.email import send_verification_email

router = APIRouter()


class RegisterBody(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, description="At least 8 characters")
    name: str | None = None


class LoginBody(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class VerificationResponse(BaseModel):
    message: str
    email: str


class RefreshBody(BaseModel):
    refresh_token: str


@router.post("/register", response_model=VerificationResponse)
async def register(body: RegisterBody, background_tasks: BackgroundTasks):
    existing = await User.find_one(User.email == body.email)
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    
    # Generate verification token
    verification_token = secrets.token_urlsafe(32)
    
    user = User(
        email=body.email,
        password_hash=hash_password(body.password),
        name=body.name,
        email_verified=False,
        verification_token=verification_token,
    )
    await user.insert()
    
    # Send verification email in background (non-blocking)
    background_tasks.add_task(send_verification_email, body.email, verification_token)
    
    return VerificationResponse(
        message="Registration successful! Please check your email to verify your account.",
        email=body.email,
    )


class VerifyEmailBody(BaseModel):
    token: str


@router.post("/verify-email", response_model=TokenResponse)
async def verify_email(body: VerifyEmailBody):
    """Verify email with token from email link"""
    user = await User.find_one(User.verification_token == body.token)
    
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired verification token")
    
    # Mark email as verified and clear token
    user.email_verified = True
    user.verification_token = None
    await user.save()
    
    # Return tokens to auto-login
    return TokenResponse(
        access_token=create_access_token(str(user.id), user.email),
        refresh_token=create_refresh_token(str(user.id), user.email),
    )


@router.post("/resend-verification", response_model=VerificationResponse)
async def resend_verification(body: LoginBody, background_tasks: BackgroundTasks):
    """Resend verification email"""
    user = await User.find_one(User.email == body.email)
    
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    if user.email_verified:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already verified")
    
    # Verify password
    if not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid password")
    
    # Generate new verification token
    verification_token = secrets.token_urlsafe(32)
    user.verification_token = verification_token
    await user.save()
    
    # Send verification email in background (non-blocking)
    background_tasks.add_task(send_verification_email, user.email, verification_token)
    
    return VerificationResponse(
        message="Verification email sent! Please check your email.",
        email=user.email,
    )


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginBody):
    user = await User.find_one(User.email == body.email)
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    
    # Check if email is verified
    if not user.email_verified:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Email not verified. Please check your email to verify your account.")
    
    return TokenResponse(
        access_token=create_access_token(str(user.id), user.email),
        refresh_token=create_refresh_token(str(user.id), user.email),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh(body: RefreshBody):
    payload = decode_token(body.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
    user_id = payload.get("sub")
    email = payload.get("email")
    if not user_id or not email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
    try:
        oid = PydanticObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
    user = await User.get(oid)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return TokenResponse(
        access_token=create_access_token(str(user.id), user.email),
        refresh_token=create_refresh_token(str(user.id), user.email),
    )


class MeResponse(BaseModel):
    id: str
    email: str
    name: str | None


@router.get("/me", response_model=MeResponse)
async def me(current_user: User = Depends(get_current_user)):
    return MeResponse(id=str(current_user.id), email=current_user.email, name=current_user.name)


class GoogleAuthBody(BaseModel):
    token: str


@router.post("/google", response_model=TokenResponse)
async def google_auth(body: GoogleAuthBody):
    """
    Google OAuth authentication endpoint.
    Accepts a Google ID token from the frontend and creates/updates user.
    """
    google_client_id = settings.GOOGLE_CLIENT_ID
    
    if not google_client_id:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Google OAuth not configured")
    
    try:
        # Verify the Google token (ID token from GoogleLogin component)
        # The credential from GoogleLogin is a JWT ID token
        idinfo = id_token.verify_oauth2_token(body.token, google_requests.Request(), google_client_id)
        
        # Token is valid, extract user info
        email = idinfo.get("email")
        name = idinfo.get("name")
        
        if not email:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email not provided by Google")
        
        # Find or create user
        user = await User.find_one(User.email == email)
        
        if not user:
            # Create new user with Google OAuth
            # Google already verifies emails, so mark as verified
            user = User(
                email=email,
                name=name,
                password_hash="",  # No password for OAuth users
                email_verified=True,  # Google verifies emails
            )
            await user.insert()
        else:
            # Update user name if provided by Google
            if name and not user.name:
                user.name = name
                await user.save()
        
        return TokenResponse(
            access_token=create_access_token(str(user.id), user.email),
            refresh_token=create_refresh_token(str(user.id), user.email),
        )
    
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Invalid Google token: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Google authentication failed")

