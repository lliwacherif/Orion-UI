# Backend API Implementation Guide

The frontend has been updated to use backend APIs for folder management and user settings. You need to implement the following endpoints in your backend.

---

## Part 1: User Settings API (Email & Password Update)

### Database Requirements
No additional tables needed - uses existing `users` table.

### API Endpoints for User Settings

#### 1. PUT `/api/v1/auth/users/{user_id}/email` - Update Email

**Request Body:**
```json
{
    "new_email": "newemail@example.com",
    "current_password": "userpassword123"
}
```

**Response (Success):**
```json
{
    "status": "ok",
    "message": "Email updated successfully"
}
```

**Response (Error):**
```json
{
    "detail": "Incorrect password"
}
```

#### 2. PUT `/api/v1/auth/users/{user_id}/password` - Update Password

**Request Body:**
```json
{
    "current_password": "oldpassword123",
    "new_password": "newpassword456"
}
```

**Response (Success):**
```json
{
    "status": "ok",
    "message": "Password updated successfully"
}
```

**Response (Error):**
```json
{
    "detail": "Incorrect current password"
}
```

### FastAPI Implementation for User Settings

```python
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext

router = APIRouter(prefix="/auth", tags=["auth"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class UpdateEmailRequest(BaseModel):
    new_email: EmailStr
    current_password: str

class UpdatePasswordRequest(BaseModel):
    current_password: str
    new_password: str

@router.put("/users/{user_id}/email")
async def update_user_email(user_id: int, request: UpdateEmailRequest, db: Session = Depends(get_db)):
    """Update user's email address"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify current password
    if not pwd_context.verify(request.current_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect password")
    
    # Check if email is already taken
    existing = db.query(User).filter(User.email == request.new_email, User.id != user_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already in use")
    
    user.email = request.new_email
    db.commit()
    
    return {"status": "ok", "message": "Email updated successfully"}

@router.put("/users/{user_id}/password")
async def update_user_password(user_id: int, request: UpdatePasswordRequest, db: Session = Depends(get_db)):
    """Update user's password"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify current password
    if not pwd_context.verify(request.current_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect current password")
    
    # Hash and save new password
    user.hashed_password = pwd_context.hash(request.new_password)
    db.commit()
    
    return {"status": "ok", "message": "Password updated successfully"}
```

---

## Part 2: Folders API

## Database Schema

Create a `folders` table:

```sql
CREATE TABLE folders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    conversation_ids INTEGER[] DEFAULT '{}',  -- Array of conversation IDs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster user lookups
CREATE INDEX idx_folders_user_id ON folders(user_id);
```

## API Endpoints

### 1. GET `/api/v1/folders/{user_id}` - Get User's Folders

**Response:**
```json
[
    {
        "id": 1,
        "user_id": 123,
        "name": "Work Projects",
        "conversation_ids": [45, 67, 89],
        "created_at": "2024-01-15T10:30:00Z",
        "updated_at": "2024-01-15T10:30:00Z"
    },
    {
        "id": 2,
        "user_id": 123,
        "name": "Personal",
        "conversation_ids": [12, 34],
        "created_at": "2024-01-14T08:00:00Z",
        "updated_at": "2024-01-14T08:00:00Z"
    }
]
```

### 2. POST `/api/v1/folders` - Create Folder

**Request Body:**
```json
{
    "user_id": 123,
    "name": "New Folder"
}
```

**Response:**
```json
{
    "id": 3,
    "user_id": 123,
    "name": "New Folder",
    "conversation_ids": [],
    "created_at": "2024-01-16T12:00:00Z",
    "updated_at": "2024-01-16T12:00:00Z"
}
```

### 3. PUT `/api/v1/folders/{user_id}/{folder_id}` - Update Folder

**Request Body:**
```json
{
    "name": "Updated Folder Name",        // Optional
    "conversation_ids": [1, 2, 3, 4]      // Optional - replace entire array
}
```

**Response:** Updated folder object

### 4. DELETE `/api/v1/folders/{user_id}/{folder_id}` - Delete Folder

**Response:**
```json
{
    "status": "ok",
    "message": "Folder deleted successfully"
}
```

**Note:** Deleting a folder does NOT delete the conversations inside it. They just become "unfiled" and appear in the main chat list.

### 5. POST `/api/v1/folders/{user_id}/{folder_id}/conversations` - Add Conversation to Folder

**Request Body:**
```json
{
    "conversation_id": 456
}
```

**Response:** Updated folder object with new conversation_id added to array

### 6. DELETE `/api/v1/folders/{user_id}/{folder_id}/conversations/{conversation_id}` - Remove Conversation from Folder

**Response:** Updated folder object with conversation_id removed from array

---

## FastAPI Implementation Example

```python
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import Column, Integer, String, ARRAY, DateTime
from sqlalchemy.sql import func
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

router = APIRouter(prefix="/folders", tags=["folders"])

# SQLAlchemy Model
class Folder(Base):
    __tablename__ = "folders"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    conversation_ids = Column(ARRAY(Integer), default=[])
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

# Pydantic Schemas
class FolderBase(BaseModel):
    name: str

class FolderCreate(FolderBase):
    user_id: int

class FolderUpdate(BaseModel):
    name: Optional[str] = None
    conversation_ids: Optional[List[int]] = None

class FolderResponse(FolderBase):
    id: int
    user_id: int
    conversation_ids: List[int]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class AddConversationRequest(BaseModel):
    conversation_id: int

# Endpoints
@router.get("/{user_id}", response_model=List[FolderResponse])
async def get_user_folders(user_id: int, db: Session = Depends(get_db)):
    """Get all folders for a user"""
    folders = db.query(Folder).filter(Folder.user_id == user_id).order_by(Folder.created_at.desc()).all()
    return folders

@router.post("", response_model=FolderResponse)
async def create_folder(folder: FolderCreate, db: Session = Depends(get_db)):
    """Create a new folder"""
    db_folder = Folder(
        user_id=folder.user_id,
        name=folder.name,
        conversation_ids=[]
    )
    db.add(db_folder)
    db.commit()
    db.refresh(db_folder)
    return db_folder

@router.put("/{user_id}/{folder_id}", response_model=FolderResponse)
async def update_folder(user_id: int, folder_id: int, folder_update: FolderUpdate, db: Session = Depends(get_db)):
    """Update a folder"""
    db_folder = db.query(Folder).filter(Folder.id == folder_id, Folder.user_id == user_id).first()
    if not db_folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    
    if folder_update.name is not None:
        db_folder.name = folder_update.name
    if folder_update.conversation_ids is not None:
        db_folder.conversation_ids = folder_update.conversation_ids
    
    db.commit()
    db.refresh(db_folder)
    return db_folder

@router.delete("/{user_id}/{folder_id}")
async def delete_folder(user_id: int, folder_id: int, db: Session = Depends(get_db)):
    """Delete a folder (conversations are NOT deleted)"""
    db_folder = db.query(Folder).filter(Folder.id == folder_id, Folder.user_id == user_id).first()
    if not db_folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    
    db.delete(db_folder)
    db.commit()
    return {"status": "ok", "message": "Folder deleted successfully"}

@router.post("/{user_id}/{folder_id}/conversations", response_model=FolderResponse)
async def add_conversation_to_folder(user_id: int, folder_id: int, request: AddConversationRequest, db: Session = Depends(get_db)):
    """Add a conversation to a folder"""
    db_folder = db.query(Folder).filter(Folder.id == folder_id, Folder.user_id == user_id).first()
    if not db_folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    
    # Add conversation_id if not already in list
    if request.conversation_id not in db_folder.conversation_ids:
        db_folder.conversation_ids = db_folder.conversation_ids + [request.conversation_id]
        db.commit()
        db.refresh(db_folder)
    
    return db_folder

@router.delete("/{user_id}/{folder_id}/conversations/{conversation_id}", response_model=FolderResponse)
async def remove_conversation_from_folder(user_id: int, folder_id: int, conversation_id: int, db: Session = Depends(get_db)):
    """Remove a conversation from a folder"""
    db_folder = db.query(Folder).filter(Folder.id == folder_id, Folder.user_id == user_id).first()
    if not db_folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    
    # Remove conversation_id from list
    if conversation_id in db_folder.conversation_ids:
        db_folder.conversation_ids = [cid for cid in db_folder.conversation_ids if cid != conversation_id]
        db.commit()
        db.refresh(db_folder)
    
    return db_folder
```

## Don't forget to:

1. **Register the router** in your main FastAPI app:
   ```python
   from routers import folders
   app.include_router(folders.router, prefix="/api/v1")
   ```

2. **Run database migration** to create the `folders` table

3. **Handle cleanup** when a conversation is deleted - optionally remove its ID from all folders:
   ```python
   # In your delete_conversation endpoint, add:
   db.query(Folder).filter(Folder.conversation_ids.contains([conversation_id])).update(
       {Folder.conversation_ids: func.array_remove(Folder.conversation_ids, conversation_id)},
       synchronize_session=False
   )
   ```

---

## Testing the Implementation

After implementing the backend, you can test using curl:

```bash
# Create a folder
curl -X POST http://localhost:8000/api/v1/folders \
  -H "Content-Type: application/json" \
  -d '{"user_id": 1, "name": "Test Folder"}'

# Get user folders
curl http://localhost:8000/api/v1/folders/1

# Add conversation to folder
curl -X POST http://localhost:8000/api/v1/folders/1/1/conversations \
  -H "Content-Type: application/json" \
  -d '{"conversation_id": 5}'

# Delete folder
curl -X DELETE http://localhost:8000/api/v1/folders/1/1
```

---

## Part 3: Admin Dashboard API

### Database Setup

Run the migration script located at `migrations/001_create_admin_table.sql` to create the admin table.

**Default credentials:** `admin` / `admin`

### Admin API Endpoints

#### 1. POST `/api/v1/admin/login` - Admin Login

**Request Body:**
```json
{
    "username": "admin",
    "password": "admin"
}
```

**Response:**
```json
{
    "access_token": "eyJhbGciOiJIUzI1...",
    "token_type": "bearer",
    "admin": {
        "id": 1,
        "username": "admin",
        "created_at": "2024-01-01T00:00:00Z"
    }
}
```

#### 2. GET `/api/v1/admin/me` - Get Current Admin

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
    "id": 1,
    "username": "admin",
    "created_at": "2024-01-01T00:00:00Z"
}
```

#### 3. GET `/api/v1/admin/users` - Get All Users with Stats

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
    "users": [
        {
            "id": 1,
            "username": "john_doe",
            "email": "john@example.com",
            "full_name": "John Doe",
            "job_title": "Engineer",
            "is_active": true,
            "plan_type": "free",
            "created_at": "2024-01-15T10:30:00Z",
            "conversation_count": 15,
            "message_count": 234,
            "last_activity": "2024-01-20T15:45:00Z"
        }
    ],
    "stats": {
        "total_users": 100,
        "active_users": 85,
        "total_conversations": 1500,
        "total_messages": 25000
    }
}
```

#### 4. DELETE `/api/v1/admin/users/{user_id}` - Delete User

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
    "status": "ok",
    "message": "User deleted successfully"
}
```

#### 5. PUT `/api/v1/admin/credentials` - Update Admin Credentials

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
    "current_password": "admin",
    "new_username": "superadmin",
    "new_password": "newSecurePassword123"
}
```

**Response:**
```json
{
    "status": "ok",
    "message": "Credentials updated successfully"
}
```

### FastAPI Implementation for Admin API

```python
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta
from typing import Optional, List

router = APIRouter(prefix="/admin", tags=["admin"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

SECRET_KEY = "your-admin-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

# Pydantic Models
class AdminLogin(BaseModel):
    username: str
    password: str

class AdminCredentialsUpdate(BaseModel):
    current_password: str
    new_username: Optional[str] = None
    new_password: Optional[str] = None

class UserStats(BaseModel):
    id: int
    username: str
    email: str
    full_name: Optional[str]
    job_title: Optional[str]
    is_active: bool
    plan_type: str
    created_at: datetime
    conversation_count: int
    message_count: int
    last_activity: Optional[datetime]

class DashboardStats(BaseModel):
    total_users: int
    active_users: int
    total_conversations: int
    total_messages: int

# Helper functions
def create_admin_token(admin_id: int, username: str) -> str:
    expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    payload = {
        "sub": str(admin_id),
        "username": username,
        "exp": expire,
        "type": "admin"
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def verify_admin_token(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        admin_id = int(payload.get("sub"))
        if payload.get("type") != "admin":
            raise HTTPException(status_code=401, detail="Invalid admin token")
        admin = db.query(Admin).filter(Admin.id == admin_id).first()
        if not admin:
            raise HTTPException(status_code=401, detail="Admin not found")
        return admin
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Endpoints
@router.post("/login")
async def admin_login(request: AdminLogin, db: Session = Depends(get_db)):
    """Admin login endpoint"""
    admin = db.query(Admin).filter(Admin.username == request.username).first()
    if not admin or not pwd_context.verify(request.password, admin.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_admin_token(admin.id, admin.username)
    return {
        "access_token": token,
        "token_type": "bearer",
        "admin": {
            "id": admin.id,
            "username": admin.username,
            "created_at": admin.created_at.isoformat()
        }
    }

@router.get("/me")
async def get_current_admin(admin: Admin = Depends(verify_admin_token)):
    """Get current admin info"""
    return {
        "id": admin.id,
        "username": admin.username,
        "created_at": admin.created_at.isoformat()
    }

@router.get("/users")
async def get_all_users(admin: Admin = Depends(verify_admin_token), db: Session = Depends(get_db)):
    """Get all users with statistics"""
    # Query users with conversation and message counts
    users_query = db.execute("""
        SELECT * FROM admin_user_stats
    """).fetchall()
    
    users = []
    for row in users_query:
        users.append({
            "id": row.id,
            "username": row.username,
            "email": row.email,
            "full_name": row.full_name,
            "job_title": row.job_title,
            "is_active": row.is_active,
            "plan_type": row.plan_type,
            "created_at": row.created_at.isoformat() if row.created_at else None,
            "conversation_count": row.conversation_count or 0,
            "message_count": row.message_count or 0,
            "last_activity": row.last_activity.isoformat() if row.last_activity else None
        })
    
    # Get overall stats
    total_users = db.query(func.count(User.id)).filter(User.is_active == True).scalar()
    total_conversations = db.query(func.count(Conversation.id)).filter(Conversation.is_deleted == False).scalar()
    total_messages = db.query(func.count(Message.id)).scalar()
    
    return {
        "users": users,
        "stats": {
            "total_users": total_users,
            "active_users": len([u for u in users if u["last_activity"]]),
            "total_conversations": total_conversations,
            "total_messages": total_messages
        }
    }

@router.delete("/users/{user_id}")
async def delete_user(user_id: int, admin: Admin = Depends(verify_admin_token), db: Session = Depends(get_db)):
    """Delete a user account"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Soft delete - just mark as inactive
    user.is_active = False
    db.commit()
    
    return {"status": "ok", "message": "User deleted successfully"}

@router.put("/credentials")
async def update_admin_credentials(request: AdminCredentialsUpdate, admin: Admin = Depends(verify_admin_token), db: Session = Depends(get_db)):
    """Update admin username and/or password"""
    if not pwd_context.verify(request.current_password, admin.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect current password")
    
    if request.new_username:
        # Check if username is taken
        existing = db.query(Admin).filter(Admin.username == request.new_username, Admin.id != admin.id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Username already taken")
        admin.username = request.new_username
    
    if request.new_password:
        admin.hashed_password = pwd_context.hash(request.new_password)
    
    db.commit()
    return {"status": "ok", "message": "Credentials updated successfully"}
```

### Don't forget to:

1. **Run the migration** in `migrations/001_create_admin_table.sql`
2. **Register the admin router** in your FastAPI app:
   ```python
   from routers import admin
   app.include_router(admin.router, prefix="/api/v1")
   ```
3. **Add the Admin model** to your models:
   ```python
   class Admin(Base):
       __tablename__ = "admins"
       id = Column(Integer, primary_key=True, index=True)
       username = Column(String(50), unique=True, nullable=False)
       hashed_password = Column(String(255), nullable=False)
       is_active = Column(Boolean, default=True)
       created_at = Column(DateTime(timezone=True), server_default=func.now())
       updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
   ```

### Testing Admin API

```bash
# Admin login
curl -X POST http://localhost:8000/api/v1/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin"}'

# Get all users (use token from login response)
curl http://localhost:8000/api/v1/admin/users \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Delete user
curl -X DELETE http://localhost:8000/api/v1/admin/users/5 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Update admin credentials
curl -X PUT http://localhost:8000/api/v1/admin/credentials \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"current_password": "admin", "new_password": "newSecurePass123"}'
```

