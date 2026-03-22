# 🚀 Quick Start Guide - Testing Integrated Features

## Prerequisites
- Backend server running on `http://localhost:3000`
- Frontend dev server running on `http://localhost:5173`
- Ollama running with llama3:8b model

## Start Servers

### Terminal 1 - Backend
```bash
cd D:\Project\SwachhSetu\backend
npm start
```

### Terminal 2 - Frontend
```bash
cd D:\Project\SwachhSetu\frontend
npm run dev
```

### Terminal 3 - Check Ollama (if needed)
```bash
ollama list
ollama run llama3:8b
```

---

## Test Flow

### 1. Test SmartImageUpload (Step 2)

1. Open http://localhost:5173/report-issue
2. Select a category (e.g., "Waste Dump")
3. Click "Next"
4. **Upload an image** of a civic issue:
   - ✅ Should show "Scanning for Spam..." animation
   - ✅ Should display verification badge when done
   - ✅ Should auto-detect category (e.g., "Waste Management")
   - ✅ Should show severity score (e.g., "7/10")
   - ✅ Category dropdown should auto-select
   - ✅ Severity level should auto-adjust

**Expected Output:**
```
✓ Image verified: Waste Management
✓ AI detected severity: 7/10
✓ Category: Waste Dump (auto-selected)
```

### 2. Test VoiceInput (Step 2)

1. Fill in title field
2. Click the **microphone icon** next to Description
3. **Record voice** description:
   - ✅ Should show recording animation
   - ✅ Should transcribe speech to text
   - ✅ Should auto-fill description field
   - ✅ Should close modal

**Expected Output:**
```
✓ Voice input added to description
Description: "The garbage bin near the market..."
```

### 3. Test LocationVerifier (Step 3)

1. Click "Next" to go to Step 3
2. **Option A - Auto-detect:**
   - ✅ Should automatically detect GPS location
   - ✅ Should reverse geocode to address
   - ✅ Should show "Verified" badge
   - ✅ Address field should auto-fill

**Expected Output:**
```
✓ Location detected
GPS: 28.613900, 77.209000 (Accuracy: ±15m)
Address: "123 Main Street, Connaught Place, New Delhi 110001"
```

2. **Option B - Manual entry:**
   - Click "Enter Manually"
   - Type address
   - Click "Verify Location"
   - ✅ Should show verified state

### 4. Test Duplicate Detection

**Create First Report:**
1. Fill all details:
   - Category: Waste Dump
   - Title: "Overflowing garbage bin at Market Road"
   - Description: "The large green dumpster has been overflowing for days"
   - Location: Auto-detected (or manual)
2. Click "Submit Report"
3. ✅ Should submit successfully
4. ✅ Should show success toast: "Report submitted successfully! 🎉"

**Create Duplicate Report (Same Location):**
1. Click "Create New Report"
2. Fill similar details:
   - Category: Waste Dump
   - Title: "Trash container full on Market Road"
   - Description: "Big bin near Market Road junction is full"
   - Location: **Same or very close coordinates** (within 20 meters)
3. Click "Submit Report"
4. ✅ **Should show duplicate warning modal**

**Duplicate Warning Modal Should Show:**
```
⚠️ Similar Report Detected

Our AI detected a similar report in this location. 
Submitting duplicates may slow down response times.

Confidence: ████████████░░ 92%

Rationale: "Both reports describe the same overflowing 
dumpster on Market Road with identical core issue."

[Cancel]  [Submit Anyway]
```

5. **Test options:**
   - Click **"Cancel"**: Modal closes, report not submitted
   - Click **"Submit Anyway"**: Report is submitted with force flag

---

## Expected Behavior Summary

### SmartImageUpload ✅
- [x] Upload image
- [x] AI verification animation
- [x] Spam detection (blocks inappropriate images)
- [x] Category detection
- [x] Severity scoring
- [x] Auto-fill form fields
- [x] Visual feedback with badges

### LocationVerifier ✅
- [x] Auto-detect GPS on load
- [x] Reverse geocoding
- [x] Manual entry option
- [x] Address auto-fill
- [x] Landmark field
- [x] Verification badge
- [x] Error handling

### Duplicate Detection ✅
- [x] Semantic analysis of reports
- [x] Proximity check (20m radius)
- [x] Temporal window (72 hours)
- [x] Confidence scoring (85%+ triggers warning)
- [x] Warning modal with rationale
- [x] Cancel option
- [x] Force submit option
- [x] Success/error toasts

---

## Troubleshooting

### "Image verification failed"
- Check backend is running: `curl http://localhost:3000/api/ai/forensic/analyze`
- Check Ollama: `ollama list`
- Check browser console for errors

### "Unable to detect location"
- Check browser permissions (Allow location access)
- Try manual entry instead
- Check if using HTTPS (GPS requires secure context)

### "Duplicate detection not working"
- Check backend logs for deduplication service
- Verify `.env` has `ENABLE_DEDUPLICATION=true`
- Ensure Ollama is running
- Create reports within 20 meters of each other

### Backend not starting
```bash
cd backend
npm install
npm start
```

### Frontend not starting
```bash
cd frontend
npm install
npm run dev
```

---

## API Endpoints Reference

### SmartImageUpload
- `POST /api/ai/forensic/analyze`
- Body: `multipart/form-data` with `image` field
- Response: `{ is_spam, civic_category, severity_score, confidence }`

### Report Creation
- `POST /api/reports`
- Body: `FormData` with report details
- Response: `201 Created` or `409 Conflict` (duplicate)

### Geocoding (External)
- `GET https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lon}`
- Response: `{ display_name, address, ... }`

---

## Success Criteria

✅ **All features working** when:
1. Image uploads show AI verification
2. Location auto-detects with GPS
3. Duplicate warning appears for similar reports
4. All toasts show appropriate messages
5. Form auto-fills based on AI analysis
6. No console errors

---

## Demo Flow (2 minutes)

1. **Open app** → Auto-detects location
2. **Select category** → "Waste Dump"
3. **Upload image** → AI verifies, auto-fills severity
4. **Add voice description** → Transcribes to text
5. **Submit** → Success!
6. **Create similar report** → Duplicate warning appears
7. **Click "Cancel"** → Modal closes
8. **Resubmit with "Submit Anyway"** → Report created

---

## Next Steps

After testing, you can:
1. Deploy to production
2. Monitor duplicate prevention metrics
3. Fine-tune AI confidence thresholds
4. Add more categories
5. Enhance UI/UX based on feedback

---

**Status:** ✅ Ready to test!

**URL:** http://localhost:5173/report-issue
