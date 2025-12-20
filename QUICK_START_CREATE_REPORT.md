# Quick Start Guide - CreateReport Page

## Files Created

### ✅ **3 New Components**
1. `frontend/src/components/SmartImageUpload.jsx` (457 lines)
2. `frontend/src/components/VoiceInput.jsx` (500+ lines) - **NEW**
3. `frontend/src/components/LocationVerifier.jsx` (400+ lines) - **NEW**

### ✅ **1 New Page**
4. `frontend/src/pages/CreateReport.jsx` (600+ lines) - **NEW**

### ✅ **Routes Updated**
5. `frontend/src/App.jsx` - Added `/create-report` route

---

## Installation Steps

### 1. Verify Files Exist

```bash
# Check if files were created
ls frontend/src/components/VoiceInput.jsx
ls frontend/src/components/LocationVerifier.jsx
ls frontend/src/pages/CreateReport.jsx
```

### 2. No New Dependencies Needed

All components use existing dependencies:
- ✅ `react` (already installed)
- ✅ `lucide-react` (already installed)
- ✅ `react-router-dom` (already installed)
- ✅ `react-toastify` (already installed)

---

## Testing

### 1. Start Frontend

```bash
cd frontend
npm run dev
```

### 2. Start Backend (Required for AI features)

```bash
cd backend
npm start
```

### 3. Ensure Ollama is Running

```bash
# Check Ollama status
ollama list

# Should see:
# llava:7b
# llama3:8b
```

### 4. Navigate to Page

Open browser: `http://localhost:5173/create-report`

---

## Usage Flow

### Step 1: Upload Image
1. Drag and drop OR click to browse
2. Select civic issue photo (pothole, garbage, etc.)
3. Wait for AI verification (3-5 seconds)
4. ✅ Green "Verified" badge appears
5. **Category and description auto-filled**

### Step 2: Voice Description (Optional)
1. Click "Start Recording"
2. Grant microphone permission
3. Speak in any language (Hindi, English, etc.)
4. Click "Stop Recording"
5. Wait for AI processing (5-10 seconds)
6. ✅ Transcription appears
7. **Description auto-filled with your voice input**

### Step 3: Review Details
1. Check category (auto-filled from image)
2. Edit title if needed
3. Review description (auto-filled)
4. Select severity level

### Step 4: Add Location
1. Click "Auto-Detect Location" (or "Enter Manually")
2. Wait for GPS detection (2-3 seconds)
3. ✅ Address appears
4. Optionally add landmark

### Step 5: Submit
1. Review completion checklist
2. Click "Submit Report"
3. ✅ Success toast → Redirected to dashboard

---

## Relay Race Example

**Scenario**: User uploads image while AI is still processing voice

```
User uploads image
├─ setGlobalAILoading(true)
├─ Voice Input DISABLED (button grayed out)
├─ Location DISABLED
├─ Submit DISABLED
│
Image verified (3 seconds later)
├─ setGlobalAILoading(false)
├─ Voice Input ENABLED
├─ Location ENABLED
├─ Submit ENABLED (if all complete)
```

---

## Troubleshooting

### Image Upload Not Working
**Check**:
- Backend running on port 5000
- API endpoint: `POST /api/ai/forensic/analyze`
- Ollama has LLaVA:7b model loaded

**Test Manually**:
```bash
curl -X POST http://localhost:5000/api/ai/forensic/analyze \
  -F "image=@test-pothole.jpg"
```

### Voice Input Not Working
**Check**:
- Microphone permission granted in browser
- Backend running
- API endpoint: `POST /api/ai/linguistic/analyze`
- Ollama has Llama3:8b model loaded

**Browser Console**:
```javascript
// Should see:
"MediaRecorder is supported"
// If not, browser doesn't support audio recording
```

### Location Not Detecting
**Check**:
- Location permission granted in browser
- GPS enabled on device
- Internet connection (for reverse geocoding)

**Fallback**: Click "Enter Manually" to type address

### Submit Button Always Disabled
**Check Completion Status**:
- ✅ Image verified (green badge visible)
- ✅ Category selected
- ✅ Title entered
- ✅ Description entered
- ✅ Location verified
- ✅ AI not processing (no loading indicator)

**Debug**:
```javascript
// In browser console
console.log('isFormComplete:', isFormComplete());
console.log('formData:', formData);
console.log('isGlobalAILoading:', isGlobalAILoading);
```

---

## Testing Without Backend

**Mock Mode** (for frontend-only testing):

1. Create `frontend/src/utils/mockApi.js`:
```javascript
export const mockImageVerify = () => ({
  is_spam: false,
  civic_category: 'Pothole',
  visual_evidence: 'Deep pothole on main road',
  severity_score: 7,
  confidence: 0.92
});

export const mockVoiceTranscript = () => ({
  transcript: 'There is a big pothole on MG Road',
  summary: 'Pothole on MG Road',
  language: 'English',
  sentiment: 'Neutral',
  urgency: 'Medium',
  confidence: 0.88
});
```

2. In components, replace API calls:
```javascript
// Instead of:
const response = await api.post(...);

// Use:
const result = mockImageVerify();
```

---

## Component Props Reference

### SmartImageUpload
```javascript
<SmartImageUpload
  onVerify={(result) => {
    // result: { is_spam, civic_category, visual_evidence, severity_score, confidence }
  }}
  onChange={(file) => {
    // file: File object (resized to 1024px)
  }}
  maxWidth={1024}
  maxSizeMB={10}
  isGlobalAILoading={isGlobalAILoading}
  setGlobalAILoading={setGlobalAILoading}
/>
```

### VoiceInput
```javascript
<VoiceInput
  onChange={(voiceData) => {
    // voiceData: { transcript, summary, language, sentiment, urgency, location }
  }}
  isGlobalAILoading={isGlobalAILoading}
  setGlobalAILoading={setGlobalAILoading}
  maxDurationSeconds={60}
/>
```

### LocationVerifier
```javascript
<LocationVerifier
  onChange={(locationData) => {
    // locationData: { coordinates: {lat, lng}, address, landmark, verified }
  }}
  isGlobalAILoading={isGlobalAILoading}
  setGlobalAILoading={setGlobalAILoading}
/>
```

---

## API Endpoints Required

### Backend Must Implement:

1. **Image Verification**
   - `POST /api/ai/forensic/analyze`
   - Body: `FormData { image }`
   - Response: `{ is_spam, civic_category, severity_score, visual_evidence }`

2. **Voice Transcription**
   - `POST /api/ai/linguistic/analyze`
   - Body: `{ audio: base64, format: 'webm' }`
   - Response: `{ english_translation, detected_language, sentiment_tone, urgency_rating }`

3. **Report Submission**
   - `POST /api/reports`
   - Body: `FormData { title, description, category, image, latitude, longitude, aiAnalysis }`
   - Response: `{ success: true, report: {...} }`

---

## Navigation Links

Add link in Navbar or Dashboard:

```javascript
// In Navbar.jsx
<Link to="/create-report" className="nav-link">
  Create Report
</Link>

// Or as button
<button onClick={() => navigate('/create-report')}>
  📝 New Report
</button>
```

---

## Next Steps

1. **Test Happy Path**:
   - Upload valid civic issue image
   - Record voice description
   - Auto-detect location
   - Submit report

2. **Test Error Cases**:
   - Upload selfie (should be rejected)
   - Deny microphone permission
   - Deny location permission

3. **Test Relay Race**:
   - Upload image → record voice (should wait)
   - Record voice → add location (should wait)

4. **Customize**:
   - Change category options
   - Adjust severity levels
   - Modify success redirect

5. **Deploy**:
   - Build frontend: `npm run build`
   - Deploy to hosting (Vercel, Netlify, etc.)

---

## Common Customizations

### Change Categories
In `CreateReport.jsx`:
```javascript
<option value="Pothole">Pothole</option>
<option value="Garbage">Garbage</option>
<option value="Your Custom Category">Your Custom Category</option>
```

### Change Max Voice Duration
```javascript
<VoiceInput
  maxDurationSeconds={120}  // 2 minutes instead of 60 seconds
/>
```

### Change Image Size Limit
```javascript
<SmartImageUpload
  maxWidth={2048}   // 2048px instead of 1024px
  maxSizeMB={20}    // 20MB instead of 10MB
/>
```

### Change Success Redirect
```javascript
// In handleSubmit()
if (response.data.success) {
  toast.success('Report submitted!');
  navigate('/my-reports');  // Instead of /dashboard
}
```

---

## Performance Tips

1. **Image Optimization**:
   - Client-side resize saves 80-90% bandwidth
   - Keep maxWidth at 1024px for best balance

2. **Voice Recording**:
   - Keep maxDuration under 60 seconds
   - Longer recordings = slower processing

3. **Location Detection**:
   - GPS is fastest (2-3 seconds)
   - Manual entry is instant

4. **Relay Race**:
   - Prevents server overload
   - Improves user experience
   - Reduces API errors

---

## Success Criteria

✅ All components visible and styled correctly
✅ Image upload works and verifies
✅ Voice recording works and transcribes
✅ Location auto-detects successfully
✅ Form auto-fills from AI results
✅ Relay race prevents multiple AI calls
✅ Submit button enables when form complete
✅ Report submits successfully
✅ Redirects to dashboard on success

---

## Support

Questions or issues?
- Check `CREATE_REPORT_PAGE.md` for detailed documentation
- Check `SMART_IMAGE_UPLOAD.md` for component details
- Open GitHub issue: https://github.com/ritik0506/Swachhsetu/issues

---

**Ready to test!** Navigate to `/create-report` and create your first AI-powered civic report! 🚀
