# Memory Storage Backend Guide

## Overview

The frontend generates user memories and needs to store them in the database for future use.

---

## Frontend Behavior

1. User clicks Memory button
2. Frontend generates memory summary from recent conversations
3. Memory is displayed to user
4. **Frontend sends generated memory to backend for storage**

---

## Backend Implementation

### Step 1: Create Memory Model

```python
from sqlalchemy import Column, Integer, String, Text, DateTime
from datetime import datetime

class UserMemory(Base):
    __tablename__ = "user_memories"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=False)
    content = Column(Text, nullable=False)  # The generated memory
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

### Step 2: Create Endpoint to Save Memory

```python
from pydantic import BaseModel

class SaveMemoryRequest(BaseModel):
    user_id: int
    content: str

@app.post("/api/v1/memory")
async def save_memory(request: SaveMemoryRequest, db: Session = Depends(get_db)):
    """
    Save or update user memory in database.
    Only keeps the most recent memory per user.
    """
    # Check if user already has a memory
    existing = db.query(UserMemory).filter(
        UserMemory.user_id == request.user_id
    ).first()
    
    if existing:
        # Update existing memory
        existing.content = request.content
        existing.updated_at = datetime.utcnow()
    else:
        # Create new memory
        memory = UserMemory(
            user_id=request.user_id,
            content=request.content
        )
        db.add(memory)
    
    db.commit()
    
    return {
        "status": "ok",
        "message": "Memory saved successfully"
    }
```

### Step 3: Create Endpoint to Retrieve Memory

```python
@app.get("/api/v1/memory/{user_id}")
async def get_memory(user_id: int, db: Session = Depends(get_db)):
    """
    Retrieve user's stored memory.
    """
    memory = db.query(UserMemory).filter(
        UserMemory.user_id == user_id
    ).first()
    
    if not memory:
        return {
            "status": "ok",
            "memory": None
        }
    
    return {
        "status": "ok",
        "memory": {
            "content": memory.content,
            "created_at": memory.created_at.isoformat(),
            "updated_at": memory.updated_at.isoformat()
        }
    }
```

### Step 4: Use Memory in Chat

```python
@app.post("/api/v1/orcha/chat")
async def chat_endpoint(request: ChatRequest, db: Session = Depends(get_db)):
    # Load user memory from database
    user_memory = db.query(UserMemory).filter(
        UserMemory.user_id == int(request.user_id)
    ).first()
    
    # Build messages array
    messages = []
    
    # Add system prompt
    messages.append({
        "role": "system",
        "content": "You are AURA, an advanced assistant..."
    })
    
    # Add memory context if available
    if user_memory and user_memory.content:
        messages.append({
            "role": "system",
            "content": f"User Memory: {user_memory.content}"
        })
    
    # Add conversation history
    # ... rest of chat logic
```

---

## Frontend Integration ✅ (Already Implemented)

The frontend automatically saves memory after generation:

**API Functions (`src/api/orcha.ts`):**
- `saveMemory(userId, content)` - Saves memory to backend
- `getMemory(userId)` - Retrieves stored memory

**UserProfile Component:**
After memory is generated, it automatically calls:
```typescript
await saveMemory(user.id, analysisText);
```

The save happens in the background - user sees the memory immediately, and it's stored in DB for future use.

---

## Database Migration

```sql
CREATE TABLE user_memories (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_user_memories_user_id ON user_memories(user_id);
```

---

## Summary

1. **Database**: Single table `user_memories` with user_id and content
2. **Save Endpoint**: POST `/api/v1/memory` - stores/updates memory
3. **Get Endpoint**: GET `/api/v1/memory/{user_id}` - retrieves memory
4. **Chat Integration**: Load memory and inject as system message
5. **Frontend**: Will call save endpoint after memory generation

This keeps one memory per user (most recent), automatically updating when regenerated.

