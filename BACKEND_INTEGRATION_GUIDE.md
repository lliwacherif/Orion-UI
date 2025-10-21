# ORCHA Backend Integration Guide for File Attachments

## 🎯 What the Frontend Sends

When a user attaches a PDF and sends a message, the frontend sends this exact JSON structure:

```json
POST /api/v1/orcha/chat
Content-Type: application/json

{
  "user_id": "user123",
  "tenant_id": "tenant456",
  "message": "Summarize this document",
  "use_rag": true,
  "conversation_history": [
    {"role": "user", "content": "Previous question"},
    {"role": "assistant", "content": "Previous answer"}
  ],
  "attachments": [
    {
      "uri": "blob:http://localhost:3000/abc-123",
      "type": "application/pdf",
      "filename": "document.pdf",
      "data": "JVBERi0xLjQKJeLjz9MKMSAwIG9iag...",
      "size": 245632
    }
  ]
}
```

## ⚠️ CRITICAL: Do NOT Use the `uri` Field!

```python
# ❌ WRONG - This will fail!
for attachment in request.attachments:
    url = attachment.uri  # "blob:http://localhost:3000/..."
    response = requests.get(url)  # ERROR: Can't download blob URLs!

# ✅ CORRECT - Use the data field!
for attachment in request.attachments:
    file_bytes = base64.b64decode(attachment.data)  # This has the actual file!
```

### Why?

| Field | What It Is | Can Backend Use It? |
|-------|-----------|---------------------|
| `uri` | Browser-only blob URL | ❌ NO - only works in user's browser |
| `data` | Base64 encoded file content | ✅ YES - this is the actual file! |
| `filename` | Original filename | ✅ YES - for display/logging |
| `type` | MIME type | ✅ YES - to know file type |
| `size` | File size in bytes | ✅ YES - for validation |

---

## 📋 Step-by-Step Backend Implementation

### Step 1: Define Request Models

```python
from pydantic import BaseModel
from typing import List, Optional

class Attachment(BaseModel):
    uri: str  # Ignore this field
    type: str
    filename: Optional[str] = None
    data: Optional[str] = None  # ← USE THIS! Base64 encoded
    size: Optional[int] = None

class ConversationMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    user_id: str
    tenant_id: Optional[str] = None
    message: str
    use_rag: Optional[bool] = False
    conversation_history: Optional[List[ConversationMessage]] = None
    attachments: Optional[List[Attachment]] = None
```

### Step 2: Extract PDF Text

```python
import base64
import io
import PyPDF2

def extract_pdf_text(base64_data: str) -> str:
    """
    Extract text from a base64-encoded PDF.
    
    Args:
        base64_data: Base64 string (WITHOUT the data:application/pdf;base64, prefix)
    
    Returns:
        Extracted text from all pages
    """
    try:
        # Decode base64 to bytes
        file_bytes = base64.b64decode(base64_data)
        
        # Create BytesIO object
        pdf_file = io.BytesIO(file_bytes)
        
        # Read PDF
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        
        # Extract text from all pages
        text = ""
        for page_num, page in enumerate(pdf_reader.pages, 1):
            page_text = page.extract_text()
            text += f"\n--- Page {page_num} ---\n{page_text}"
        
        return text
    
    except Exception as e:
        print(f"❌ Error extracting PDF: {e}")
        raise
```

### Step 3: Process Attachments in Chat Endpoint

```python
@app.post("/api/v1/orcha/chat")
async def chat_endpoint(request: ChatRequest):
    print(f"📥 Received chat request from user: {request.user_id}")
    print(f"📝 Message: {request.message}")
    print(f"📎 Attachments: {len(request.attachments) if request.attachments else 0}")
    
    # Extract text from PDF attachments
    attachment_context = ""
    
    if request.attachments:
        for idx, attachment in enumerate(request.attachments, 1):
            print(f"\n--- Processing Attachment {idx} ---")
            print(f"  Filename: {attachment.filename}")
            print(f"  Type: {attachment.type}")
            print(f"  Size: {attachment.size} bytes")
            print(f"  Has data: {bool(attachment.data)}")
            
            # Check if data exists
            if not attachment.data:
                print(f"  ⚠️ No data field! Skipping.")
                continue
            
            print(f"  Base64 length: {len(attachment.data)} characters")
            
            try:
                # Handle PDFs
                if attachment.type == "application/pdf":
                    print(f"  Processing as PDF...")
                    pdf_text = extract_pdf_text(attachment.data)
                    print(f"  ✅ Extracted {len(pdf_text)} characters")
                    
                    # Add to context
                    attachment_context += f"\n\n--- Document: {attachment.filename} ---\n"
                    attachment_context += pdf_text
                    attachment_context += f"\n--- End of {attachment.filename} ---\n"
                
                # Handle images (optional)
                elif attachment.type.startswith("image/"):
                    print(f"  📷 Image received: {attachment.filename}")
                    # You can save the image or send to vision model
                    file_bytes = base64.b64decode(attachment.data)
                    # Save or process image here
                
            except Exception as e:
                print(f"  ❌ Error processing attachment: {e}")
                import traceback
                traceback.print_exc()
    
    # Build enhanced prompt with PDF content
    if attachment_context:
        enhanced_message = f"""The user has attached the following document(s):

{attachment_context}

User's question: {request.message}

Please answer the question based on the attached document. If the document is a resume or professional document, provide detailed analysis."""
    else:
        enhanced_message = request.message
    
    print(f"\n📤 Sending to LM Studio...")
    print(f"Enhanced message length: {len(enhanced_message)} characters")
    
    # Call LM Studio with enhanced message
    try:
        lm_response = call_lm_studio(
            message=enhanced_message,
            conversation_history=request.conversation_history,
            use_rag=request.use_rag
        )
        
        # Extract response content
        if lm_response.get("choices") and len(lm_response["choices"]) > 0:
            content = lm_response["choices"][0]["message"]["content"]
            
            return {
                "status": "ok",
                "message": content,
                "contexts": []  # Add RAG contexts if applicable
            }
        else:
            return {
                "status": "error",
                "error": "No response from LM Studio"
            }
    
    except Exception as e:
        print(f"❌ Error calling LM Studio: {e}")
        return {
            "status": "error",
            "error": str(e)
        }
```

### Step 4: LM Studio Integration Function

```python
import requests

def call_lm_studio(
    message: str,
    conversation_history: Optional[List[dict]] = None,
    use_rag: bool = False
) -> dict:
    """
    Call LM Studio API with the message and conversation history.
    
    Args:
        message: The user's message (with PDF content prepended if applicable)
        conversation_history: Previous messages for context
        use_rag: Whether to use RAG (handle separately if needed)
    
    Returns:
        LM Studio response
    """
    # Build messages array for OpenAI-compatible API
    messages = []
    
    # Add conversation history
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
    
    # Call LM Studio
    lm_studio_url = "http://192.168.1.37:1234/v1/chat/completions"
    
    payload = {
        "model": "openai/gpt-oss-20b",  # Or your model name
        "messages": messages,
        "temperature": 0.7,
        "max_tokens": 2000
    }
    
    response = requests.post(lm_studio_url, json=payload, timeout=60)
    response.raise_for_status()
    
    return response.json()
```

---

## 🧪 Testing

### Test 1: Check if Frontend is Sending Data

When user attaches a file, check your backend logs. You should see:

```
📥 Received chat request from user: user123
📝 Message: Summarize this document
📎 Attachments: 1

--- Processing Attachment 1 ---
  Filename: document.pdf
  Type: application/pdf
  Size: 245632 bytes
  Has data: True
  Base64 length: 327509 characters
  Processing as PDF...
  ✅ Extracted 3456 characters
```

### Test 2: Verify PDF Extraction Works

```python
# Test the extraction function directly
test_base64 = "JVBERi0xLjQKJeLjz9..."  # Your base64 PDF data
text = extract_pdf_text(test_base64)
print(f"Extracted: {text[:200]}")
```

### Test 3: Full Integration Test

```bash
# Create a small PDF
echo "Test PDF" > test.txt
# (Use a real PDF for better testing)

# Convert to base64
base64 test.pdf > test.b64

# Send request
curl -X POST http://localhost:8000/api/v1/orcha/chat \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user",
    "message": "What is in this document?",
    "attachments": [{
      "uri": "",
      "type": "application/pdf",
      "filename": "test.pdf",
      "data": "'$(cat test.b64 | tr -d '\n')'",
      "size": 12345
    }]
  }'
```

---

## 🔧 Install Dependencies

```bash
pip install PyPDF2 requests
```

---

## ✅ Expected Response Format

The frontend expects this response:

```json
{
  "status": "ok",
  "message": "The document is a resume for...",
  "contexts": []
}
```

Or for errors:

```json
{
  "status": "error",
  "error": "Failed to extract PDF: Invalid file format"
}
```

---

## 🐛 Common Issues

### Issue 1: "All connection attempts failed"

**Problem:** Backend trying to download from `attachment.uri`

**Solution:** Use `attachment.data` instead

### Issue 2: "Invalid base64"

**Problem:** Base64 string might have data URL prefix

**Solution:** Frontend already strips the prefix. If you still get errors:
```python
# Remove prefix if present
if attachment.data.startswith("data:"):
    base64_data = attachment.data.split(",", 1)[1]
else:
    base64_data = attachment.data
```

### Issue 3: "Empty PDF text"

**Problem:** PDF might be scanned (image-based)

**Solution:** Use OCR (pytesseract + pdf2image):
```python
from pdf2image import convert_from_bytes
import pytesseract

def extract_pdf_with_ocr(file_bytes: bytes) -> str:
    images = convert_from_bytes(file_bytes)
    text = ""
    for page_num, image in enumerate(images, 1):
        page_text = pytesseract.image_to_string(image)
        text += f"\n--- Page {page_num} ---\n{page_text}"
    return text
```

---

## 📊 Complete Working Example

```python
from fastapi import FastAPI, HTTPException
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
    tenant_id: Optional[str] = None
    message: str
    use_rag: Optional[bool] = False
    conversation_history: Optional[List[dict]] = None
    attachments: Optional[List[Attachment]] = None

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
async def chat_endpoint(request: ChatRequest):
    # Process attachments
    attachment_context = ""
    
    if request.attachments:
        for attachment in request.attachments:
            if attachment.data and attachment.type == "application/pdf":
                try:
                    pdf_text = extract_pdf_text(attachment.data)
                    attachment_context += f"\n\nDocument: {attachment.filename}\n{pdf_text}\n"
                    print(f"✅ Extracted {len(pdf_text)} chars from {attachment.filename}")
                except Exception as e:
                    print(f"❌ Error: {e}")
    
    # Build enhanced message
    if attachment_context:
        full_message = f"{attachment_context}\n\nUser question: {request.message}"
    else:
        full_message = request.message
    
    # Call LM Studio
    lm_url = "http://192.168.1.37:1234/v1/chat/completions"
    
    messages = []
    if request.conversation_history:
        messages.extend([{"role": m["role"], "content": m["content"]} 
                        for m in request.conversation_history])
    messages.append({"role": "user", "content": full_message})
    
    try:
        response = requests.post(lm_url, json={
            "model": "openai/gpt-oss-20b",
            "messages": messages,
            "temperature": 0.7
        }, timeout=60)
        
        lm_response = response.json()
        
        if lm_response.get("choices"):
            content = lm_response["choices"][0]["message"]["content"]
            return {"status": "ok", "message": content}
        else:
            return {"status": "error", "error": "No response"}
    
    except Exception as e:
        return {"status": "error", "error": str(e)}
```

---

## 🚀 Summary

1. ✅ Frontend sends file as base64 in `attachment.data`
2. ✅ Backend MUST use `attachment.data`, NOT `attachment.uri`
3. ✅ Decode base64 → Extract PDF text → Add to prompt
4. ✅ Send enhanced prompt to LM Studio
5. ✅ Return response in correct format

**The file data is ALREADY in the request - you just need to decode and use it!**

---

Last Updated: October 21, 2025

