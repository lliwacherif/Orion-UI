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

