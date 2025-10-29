# File Attachment Feature - Complete Guide

## 📎 Overview

Users can attach PDF files and images to their chat messages. The files are automatically read, converted to base64, and sent to the backend for processing.

---

## 🎯 How It Works

### Frontend Flow:
1. User clicks 📎 button
2. User selects a PDF file
3. Frontend reads file and converts to base64
4. File data is stored in browser memory
5. When user sends message, file data is included in the request
6. Backend receives base64 data and processes it

### Backend Flow:
1. Receive chat request with `attachments` array
2. Loop through each attachment
3. Decode base64 data to get file bytes
4. Extract text from PDF using PyPDF2
5. Add PDF text to the user's message
6. Send enhanced message to LM Studio
7. Return AI response

---

## 📤 What Frontend Sends

### Request Format

```json
POST /api/v1/orcha/chat
Content-Type: application/json

{
  "user_id": "user123",
  "tenant_id": "tenant456",
  "message": "What's in this document?",
  "use_rag": false,
  "attachments": [
    {
      "uri": "blob:http://localhost:3000/abc-123",
      "type": "application/pdf",
      "filename": "resume.pdf",
      "data": "JVBERi0xLjQKJeLjz9MK...",
      "size": 245632
    }
  ]
}
```

### Attachment Object Fields

| Field | Type | Description | Backend Should Use? |
|-------|------|-------------|---------------------|
| `uri` | string | Browser blob URL (e.g., `blob:http://...`) | ❌ **NO** - Cannot be accessed |
| `type` | string | MIME type (e.g., `application/pdf`) | ✅ **YES** - To identify file type |
| `filename` | string | Original filename (e.g., `resume.pdf`) | ✅ **YES** - For logging/display |
| `data` | string | **Base64 encoded file content** | ✅ **YES** - This is the file! |
| `size` | number | File size in bytes | ✅ **YES** - For validation |

---

## 🔧 Backend Implementation

### Step 1: Install Dependencies

```bash
pip install PyPDF2
```

### Step 2: Add to Your Models

```python
from pydantic import BaseModel
from typing import List, Optional

class Attachment(BaseModel):
    uri: str          # Ignore this
    type: str         # Use this
    filename: Optional[str] = None  # Use this
    data: Optional[str] = None      # USE THIS! (base64)
    size: Optional[int] = None      # Use this

class ChatRequest(BaseModel):
    user_id: str
    tenant_id: Optional[str] = None
    message: str
    use_rag: Optional[bool] = False
    attachments: Optional[List[Attachment]] = None
    conversation_history: Optional[List[dict]] = None
```

### Step 3: Create PDF Extraction Function

```python
import base64
import io
import PyPDF2

def extract_pdf_text(base64_data: str) -> str:
    """
    Extract text from a base64-encoded PDF file.
    
    Args:
        base64_data: Base64 string (the 'data' field from attachment)
    
    Returns:
        Extracted text from all PDF pages
    """
    # Decode base64 to bytes
    file_bytes = base64.b64decode(base64_data)
    
    # Create a file-like object
    pdf_file = io.BytesIO(file_bytes)
    
    # Read PDF
    pdf_reader = PyPDF2.PdfReader(pdf_file)
    
    # Extract text from all pages
    text = ""
    for page_num, page in enumerate(pdf_reader.pages, start=1):
        page_text = page.extract_text()
        text += f"\n--- Page {page_num} ---\n{page_text}"
    
    return text
```

### Step 4: Update Your Chat Endpoint

```python
from fastapi import FastAPI

app = FastAPI()

@app.post("/api/v1/orcha/chat")
async def chat_endpoint(request: ChatRequest):
    # Step 1: Extract text from PDF attachments
    pdf_content = ""
    
    if request.attachments:
        for attachment in request.attachments:
            # ✅ Check if data exists (not all attachments may have it)
            if not attachment.data:
                print(f"⚠️ Attachment {attachment.filename} has no data, skipping")
                continue
            
            # ✅ Check if it's a PDF
            if attachment.type == "application/pdf":
                try:
                    print(f"📄 Processing PDF: {attachment.filename}")
                    
                    # ✅ Extract text from PDF
                    pdf_text = extract_pdf_text(attachment.data)
                    
                    print(f"✅ Extracted {len(pdf_text)} characters from {attachment.filename}")
                    
                    # ✅ Add to context
                    pdf_content += f"\n\n=== Document: {attachment.filename} ===\n"
                    pdf_content += pdf_text
                    pdf_content += f"\n=== End of {attachment.filename} ===\n"
                    
                except Exception as e:
                    print(f"❌ Error processing {attachment.filename}: {e}")
                    # Continue with other attachments
    
    # Step 2: Build enhanced message with PDF content
    if pdf_content:
        # Prepend PDF content to user's message
        enhanced_message = f"""The user has attached a document with the following content:

{pdf_content}

User's question: {request.message}

Please answer the user's question based on the document content above."""
    else:
        # No PDF attached, use original message
        enhanced_message = request.message
    
    # Step 3: Send to LM Studio
    try:
        lm_response = call_lm_studio(
            message=enhanced_message,
            conversation_history=request.conversation_history
        )
        
        # Extract response
        if lm_response.get("choices"):
            ai_message = lm_response["choices"][0]["message"]["content"]
            
            return {
                "status": "ok",
                "message": ai_message
            }
        else:
            return {
                "status": "error",
                "error": "No response from LM Studio"
            }
    
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }
```

### Step 5: LM Studio Call Function

```python
import requests

def call_lm_studio(message: str, conversation_history: list = None) -> dict:
    """
    Send message to LM Studio and get response.
    """
    # Build messages array
    messages = []
    
    # Add conversation history if exists
    if conversation_history:
        for msg in conversation_history:
            messages.append({
                "role": msg["role"],
                "content": msg["content"]
            })
    
    # Add current message
    messages.append({
        "role": "user",
        "content": message
    })
    
    # Call LM Studio API
    url = "http://192.168.1.37:1234/v1/chat/completions"
    
    payload = {
        "model": "openai/gpt-oss-20b",
        "messages": messages,
        "temperature": 0.7,
        "max_tokens": 2000
    }
    
    response = requests.post(url, json=payload, timeout=60)
    response.raise_for_status()
    
    return response.json()
```

---

## ✅ Complete Working Example

```python
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional
import base64
import io
import PyPDF2
import requests

app = FastAPI()

# Models
class Attachment(BaseModel):
    uri: str
    type: str
    filename: Optional[str] = None
    data: Optional[str] = None
    size: Optional[int] = None

class ChatRequest(BaseModel):
    user_id: str
    message: str
    attachments: Optional[List[Attachment]] = None
    conversation_history: Optional[List[dict]] = None

# Helper function
def extract_pdf_text(base64_data: str) -> str:
    file_bytes = base64.b64decode(base64_data)
    pdf_file = io.BytesIO(file_bytes)
    pdf_reader = PyPDF2.PdfReader(pdf_file)
    
    text = ""
    for page in pdf_reader.pages:
        text += page.extract_text()
    return text

# Main endpoint
@app.post("/api/v1/orcha/chat")
async def chat(request: ChatRequest):
    # Process PDFs
    pdf_content = ""
    if request.attachments:
        for att in request.attachments:
            if att.data and att.type == "application/pdf":
                pdf_text = extract_pdf_text(att.data)
                pdf_content += f"\n\nDocument: {att.filename}\n{pdf_text}\n"
    
    # Build message
    if pdf_content:
        message = f"{pdf_content}\n\nUser: {request.message}"
    else:
        message = request.message
    
    # Call LM Studio
    lm_url = "http://192.168.1.37:1234/v1/chat/completions"
    response = requests.post(lm_url, json={
        "model": "openai/gpt-oss-20b",
        "messages": [{"role": "user", "content": message}]
    })
    
    result = response.json()
    return {
        "status": "ok",
        "message": result["choices"][0]["message"]["content"]
    }
```

---

## 🧪 Testing

### Test 1: Verify Frontend is Sending Data

Attach a PDF in the UI. Check your backend logs. You should see the request arrive with:

```python
print(request.dict())
# Output:
{
    "user_id": "user123",
    "message": "Summarize this",
    "attachments": [
        {
            "uri": "blob:...",
            "type": "application/pdf",
            "filename": "resume.pdf",
            "data": "JVBERi0xLjQK...",  # Long base64 string
            "size": 245632
        }
    ]
}
```

### Test 2: Verify PDF Extraction

Add debug logging:

```python
if attachment.data and attachment.type == "application/pdf":
    print(f"📄 Filename: {attachment.filename}")
    print(f"📊 Size: {attachment.size} bytes")
    print(f"📏 Base64 length: {len(attachment.data)} chars")
    
    pdf_text = extract_pdf_text(attachment.data)
    
    print(f"✅ Extracted text length: {len(pdf_text)} chars")
    print(f"📝 First 200 chars: {pdf_text[:200]}")
```

### Test 3: Test with curl

```bash
# Create test base64 data (use a real PDF)
base64 test.pdf | tr -d '\n' > test.b64

# Send request
curl -X POST http://localhost:8000/api/v1/orcha/chat \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test",
    "message": "What is in this PDF?",
    "attachments": [{
      "uri": "",
      "type": "application/pdf",
      "filename": "test.pdf",
      "data": "'$(cat test.b64)'",
      "size": 12345
    }]
  }'
```

---

## ⚠️ Common Mistakes

### ❌ WRONG: Trying to download from URI

```python
# DON'T DO THIS!
for attachment in request.attachments:
    url = attachment.uri  # This is "blob:http://..."
    response = requests.get(url)  # ❌ ERROR: Can't download blob URLs!
```

### ✅ CORRECT: Use the data field

```python
# DO THIS!
for attachment in request.attachments:
    if attachment.data:
        file_bytes = base64.b64decode(attachment.data)  # ✅ Works!
```

---

## 🐛 Troubleshooting

### Issue: "All connection attempts failed"

**Cause:** Backend trying to download from `attachment.uri`

**Solution:** Use `attachment.data` instead

### Issue: "Invalid base64 string"

**Cause:** Might have data URL prefix

**Solution:** Frontend already strips it, but if needed:
```python
if attachment.data.startswith("data:"):
    base64_data = attachment.data.split(",", 1)[1]
else:
    base64_data = attachment.data
```

### Issue: "Empty text extracted"

**Cause:** PDF contains only images (scanned document)

**Solution:** Use OCR:
```python
from pdf2image import convert_from_bytes
import pytesseract

def extract_with_ocr(file_bytes: bytes) -> str:
    images = convert_from_bytes(file_bytes)
    text = ""
    for img in images:
        text += pytesseract.image_to_string(img)
    return text
```

### Issue: "No data field in attachment"

**Cause:** Frontend might not be reading files correctly

**Solution:** Check browser console for logs:
```
📎 Files attached: [{hasData: true, dataLength: 123456}]
```

---

## 📊 Expected Behavior

### User Flow:

1. User attaches `resume.pdf`
2. User types: "Summarize this resume"
3. User clicks Send

### What Happens:

1. Frontend reads PDF file
2. Frontend converts to base64
3. Frontend sends request with file data
4. Backend receives request
5. Backend decodes base64
6. Backend extracts text: "John Doe, Software Engineer..."
7. Backend sends to LM Studio: "Here's a resume: [full text]... User asks: Summarize this"
8. LM Studio responds: "This resume belongs to John Doe, a Software Engineer with..."
9. Backend returns response
10. Frontend displays AI message

---

## 📋 Checklist for Backend

- [ ] Installed PyPDF2: `pip install PyPDF2`
- [ ] Added `Attachment` model with `data` field
- [ ] Created `extract_pdf_text()` function
- [ ] Updated chat endpoint to process attachments
- [ ] Using `attachment.data` (NOT `attachment.uri`)
- [ ] Decoding base64 correctly
- [ ] Adding PDF text to prompt
- [ ] Sending enhanced prompt to LM Studio
- [ ] Returning correct response format
- [ ] Added logging for debugging
- [ ] Tested with a real PDF file

---

## 🎯 Quick Reference

### Frontend sends:
```json
{
  "attachments": [
    {
      "data": "JVBERi0xLjQK...",  // ← USE THIS!
      "type": "application/pdf",
      "filename": "resume.pdf"
    }
  ]
}
```

### Backend does:
```python
# 1. Decode
file_bytes = base64.b64decode(attachment.data)

# 2. Extract
pdf_text = extract_pdf_text(attachment.data)

# 3. Enhance prompt
message = f"{pdf_text}\n\nUser: {request.message}"

# 4. Send to LM Studio
response = call_lm_studio(message)

# 5. Return
return {"status": "ok", "message": response}
```

---

## ✅ Summary

1. Frontend reads files and converts to base64 ✅
2. Frontend sends base64 in `attachment.data` field ✅
3. Backend receives and decodes base64 ✅
4. Backend extracts PDF text ✅
5. Backend adds text to LM Studio prompt ✅
6. LM Studio reads the document and responds ✅

**The file is already in the request - just decode it and use it!**

---

**Last Updated:** October 21, 2025


