# Document Canvas Feature Guide

## Overview

The Document Canvas is a split-view feature that automatically activates when you attach a PDF document and receive a response from the AI model. It provides a focused workspace for viewing and editing document-related responses.

## How It Works

### Activation
1. Click the **+** button in the message input
2. Select **"Attach document or image"** from the dropdown
3. Choose a PDF file
4. Send your question about the document
5. The canvas automatically opens when the AI response is received

### Features
- **Split View**: Chat on the left (40%), Canvas on the right (60%)
- **Auto-sidebar Close**: The conversation sidebar automatically closes for more space
- **Edit/View Modes**: Toggle between viewing and editing the content
- **Copy Button**: Easily copy the entire content
- **Word/Character Count**: Track document statistics
- **Smooth Animation**: Clean slide-in effect from the right

### Canvas Controls
- **Edit/View Toggle**: Switch between read-only and edit modes
- **Copy Button**: Copy all content to clipboard
- **Close (X)**: Close canvas and return to normal chat view

### Important Notes
- Canvas only activates for PDF attachments (not OCR mode)
- Sidebar automatically closes when canvas opens
- Sidebar automatically reopens when canvas closes
- Changes in edit mode are automatically saved locally
- Animation duration is 500ms with smooth easing

## Technical Implementation

### State Management
```javascript
const [showCanvas, setShowCanvas] = useState(false);
const [canvasContent, setCanvasContent] = useState('');
const [lastMessageHasDocument, setLastMessageHasDocument] = useState(false);
```

### Trigger Logic
The canvas opens when:
1. A PDF attachment is detected in the message
2. The AI response is received successfully
3. The response contains content

### Layout Structure
```jsx
<div className="flex-1 flex">
  {/* Chat section - responsive width */}
  <div className={showCanvas ? 'w-2/5' : 'w-full'}>
    <MessageList />
    <MessageInput />
  </div>
  
  {/* Canvas section - slides in from right */}
  <div className={showCanvas ? 'w-3/5' : 'w-0'}>
    <DocumentCanvas />
  </div>
</div>
```

## User Experience Flow

1. **Attach Document** → User attaches PDF
2. **Send Question** → User asks about the document
3. **Processing** → AI analyzes the document
4. **Canvas Opens** → Response appears in canvas view
5. **Edit/Review** → User can edit or copy the content
6. **Close Canvas** → Return to normal chat view

## Tips
- Use the canvas for document summaries, analysis, and extraction
- Edit mode is perfect for refining AI-generated content
- The split view keeps your conversation context visible
- Canvas content persists until closed or new document is processed















