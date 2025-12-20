# CreateReport Testing Checklist

## Pre-Testing Setup

### Backend Requirements
- [ ] Backend server running on `http://localhost:5000`
- [ ] MongoDB connected and accessible
- [ ] Ollama running (`ollama list` shows models)
- [ ] LLaVA:7b model loaded (`ollama pull llava:7b`)
- [ ] Llama3:8b model loaded (`ollama pull llama3:8b`)
- [ ] Environment variables set in `.env`:
  ```
  ENABLE_FORENSIC_ANALYSIS=true
  ENABLE_LINGUISTIC_ANALYSIS=true
  ```

### Frontend Requirements
- [ ] Frontend running on `http://localhost:5173`
- [ ] User logged in (authentication token valid)
- [ ] Browser console shows no errors
- [ ] Network tab accessible (for debugging API calls)

### Test Files Prepared
- [ ] Valid civic issue images (pothole, garbage, streetlight)
- [ ] Invalid images (selfies, screenshots, indoor photos)
- [ ] Test audio phrases in different languages
- [ ] Location permission granted in browser

---

## Test Suite 1: SmartImageUpload Component

### Happy Path Tests
- [ ] **Test 1.1**: Drag and drop valid image
  - Action: Drag `pothole.jpg` to upload zone
  - Expected: Upload zone highlights blue → Image uploaded → "Scanning for Spam..." → ✅ Verified badge
  - Result: `_____`

- [ ] **Test 1.2**: Click to browse valid image
  - Action: Click upload zone → Select `garbage.jpg`
  - Expected: File picker opens → Image selected → Verification starts → Category detected
  - Result: `_____`

- [ ] **Test 1.3**: Image auto-resized
  - Action: Upload 5MB high-res image
  - Expected: Image resized to ~500KB → Upload successful
  - Check: Network tab shows ~500KB upload, not 5MB
  - Result: `_____`

### Error Case Tests
- [ ] **Test 1.4**: Upload selfie
  - Action: Upload photo with person's face
  - Expected: ❌ Red overlay → "Selfie detected" → "Try Again" button
  - Result: `_____`

- [ ] **Test 1.5**: Upload screenshot
  - Action: Upload screenshot with UI elements
  - Expected: ❌ Red overlay → "Screenshot detected" → "Try Again" button
  - Result: `_____`

- [ ] **Test 1.6**: Upload oversized file
  - Action: Upload 15MB image
  - Expected: Red banner → "File size exceeds 10MB limit"
  - Result: `_____`

- [ ] **Test 1.7**: Upload non-image file
  - Action: Upload `document.pdf`
  - Expected: Red banner → "Please select an image file"
  - Result: `_____`

### Relay Race Tests
- [ ] **Test 1.8**: Voice disabled during image verification
  - Action: Upload image → Try to record voice during verification
  - Expected: Voice "Start Recording" button disabled/grayed
  - Result: `_____`

- [ ] **Test 1.9**: Location disabled during image verification
  - Action: Upload image → Try to detect location during verification
  - Expected: Location buttons disabled
  - Result: `_____`

### Auto-Fill Tests
- [ ] **Test 1.10**: Category auto-filled
  - Action: Upload pothole image
  - Expected: Category dropdown shows "Pothole" selected
  - Result: `_____`

- [ ] **Test 1.11**: Description auto-filled
  - Action: Upload garbage image
  - Expected: Description textarea contains visual evidence text
  - Result: `_____`

- [ ] **Test 1.12**: Severity auto-calculated
  - Action: Upload critical issue image
  - Expected: Severity radio "High" selected (if severity_score ≥ 7)
  - Result: `_____`

---

## Test Suite 2: VoiceInput Component

### Happy Path Tests
- [ ] **Test 2.1**: Record voice in English
  - Action: Click "Start Recording" → Say "There is a big pothole on MG Road" → Click "Stop"
  - Expected: Audio processed → Transcription appears → Language badge "English"
  - Result: `_____`

- [ ] **Test 2.2**: Record voice in Hindi
  - Action: Record Hindi voice: "MG Road par bada gadha hai"
  - Expected: Transcription in English → Language badge "Hindi"
  - Result: `_____`

- [ ] **Test 2.3**: Record voice in Marathi
  - Action: Record Marathi voice
  - Expected: Transcription in English → Language badge "Marathi"
  - Result: `_____`

- [ ] **Test 2.4**: Audio visualization works
  - Action: Start recording → Make noise
  - Expected: Audio bars animate with voice volume
  - Result: `_____`

- [ ] **Test 2.5**: Duration counter works
  - Action: Start recording → Wait 10 seconds → Check counter
  - Expected: Counter shows "0:10" and increments
  - Result: `_____`

- [ ] **Test 2.6**: Auto-stop at max duration
  - Action: Start recording → Wait 60 seconds
  - Expected: Recording auto-stops at 1:00
  - Result: `_____`

### Error Case Tests
- [ ] **Test 2.7**: Microphone permission denied
  - Action: Deny mic permission → Try to record
  - Expected: Red banner → "Unable to access microphone. Please grant permission."
  - Result: `_____`

- [ ] **Test 2.8**: Very short recording
  - Action: Record for only 1 second
  - Expected: Processing attempts → May show error or low confidence
  - Result: `_____`

- [ ] **Test 2.9**: API error handling
  - Action: Stop backend → Try to process voice
  - Expected: Red banner → "Failed to process audio. Please try again."
  - Result: `_____`

### Relay Race Tests
- [ ] **Test 2.10**: Image upload disabled during voice processing
  - Action: Stop recording → Try to upload image during processing
  - Expected: Image upload disabled (can't drag/click)
  - Result: `_____`

- [ ] **Test 2.11**: Location disabled during voice processing
  - Action: Processing voice → Try to detect location
  - Expected: Location buttons disabled
  - Result: `_____`

### Auto-Fill Tests
- [ ] **Test 2.12**: Description updated from voice
  - Action: Record voice with issue description
  - Expected: Description textarea updates with transcription
  - Result: `_____`

- [ ] **Test 2.13**: Sentiment detected
  - Action: Record frustrated voice tone
  - Expected: Sentiment badge shows "Frustrated" or "Angry"
  - Result: `_____`

- [ ] **Test 2.14**: Urgency detected
  - Action: Say "urgent" or "immediate" in voice
  - Expected: Urgency badge shows "High" → Severity set to "High"
  - Result: `_____`

- [ ] **Test 2.15**: Location extracted from voice
  - Action: Say "near City Hospital" in voice
  - Expected: Toast notification → "📍 Location detected: Near City Hospital"
  - Result: `_____`

---

## Test Suite 3: LocationVerifier Component

### Happy Path Tests
- [ ] **Test 3.1**: Auto-detect location with permission
  - Action: Click "Auto-Detect Location" → Grant permission
  - Expected: GPS coordinates appear → Address auto-filled → ✅ Verified badge
  - Result: `_____`

- [ ] **Test 3.2**: GPS accuracy shown
  - Action: Auto-detect location
  - Expected: "Accuracy: ±15m" (or similar) displayed
  - Result: `_____`

- [ ] **Test 3.3**: Reverse geocoding works
  - Action: Auto-detect location
  - Expected: Full address displayed (street, city, state, pincode)
  - Result: `_____`

- [ ] **Test 3.4**: Manual address entry
  - Action: Click "Enter Manually" → Type address → Click "Verify Location"
  - Expected: Address saved → ✅ Verified badge
  - Result: `_____`

- [ ] **Test 3.5**: Landmark added
  - Action: Enter landmark "Near Metro Station"
  - Expected: Landmark saved in location data
  - Result: `_____`

- [ ] **Test 3.6**: Edit location after verification
  - Action: Click "Edit Location" on verified location
  - Expected: Fields become editable → Can modify address
  - Result: `_____`

### Error Case Tests
- [ ] **Test 3.7**: Location permission denied
  - Action: Deny location permission
  - Expected: Red banner → "Please grant location permission" → "Enter location manually" link
  - Result: `_____`

- [ ] **Test 3.8**: GPS unavailable
  - Action: Test in area with no GPS signal
  - Expected: Error after timeout → Fallback to manual entry
  - Result: `_____`

- [ ] **Test 3.9**: Network error during reverse geocoding
  - Action: Disconnect internet → Auto-detect location
  - Expected: GPS coordinates captured but address shows coordinates
  - Result: `_____`

- [ ] **Test 3.10**: Empty address submission
  - Action: Enter manual mode → Leave address empty → Click "Verify"
  - Expected: Red banner → "Please enter an address"
  - Result: `_____`

### Relay Race Tests
- [ ] **Test 3.11**: Other components disabled during detection
  - Action: Click "Auto-Detect" → Try to upload image
  - Expected: Image upload disabled during GPS detection
  - Result: `_____`

---

## Test Suite 4: Form Integration & Validation

### Form Validation Tests
- [ ] **Test 4.1**: Submit disabled initially
  - Action: Load page
  - Expected: Submit button disabled (gray, cursor-not-allowed)
  - Result: `_____`

- [ ] **Test 4.2**: Submit enabled when all complete
  - Action: Complete all 4 sections
  - Expected: Submit button enabled (blue gradient, clickable)
  - Result: `_____`

- [ ] **Test 4.3**: Missing title validation
  - Action: Fill all except title → Try to submit
  - Expected: Red error → "Title is required"
  - Result: `_____`

- [ ] **Test 4.4**: Missing description validation
  - Action: Fill all except description → Try to submit
  - Expected: Red error → "Description is required"
  - Result: `_____`

- [ ] **Test 4.5**: Missing category validation
  - Action: Fill all except category → Try to submit
  - Expected: Red error → "Category is required"
  - Result: `_____`

- [ ] **Test 4.6**: Image not verified validation
  - Action: Upload image but don't wait for verification → Try to submit
  - Expected: Red error → "Image must be verified"
  - Result: `_____`

- [ ] **Test 4.7**: Location not verified validation
  - Action: Type address but don't click "Verify" → Try to submit
  - Expected: Red error → "Location is required"
  - Result: `_____`

### Auto-Fill Integration Tests
- [ ] **Test 4.8**: Image → Form auto-fill
  - Action: Upload pothole image
  - Expected: Category = "Pothole", Description = visual evidence, Severity = calculated
  - Result: `_____`

- [ ] **Test 4.9**: Voice → Form auto-fill
  - Action: Record voice description
  - Expected: Description updated, Severity updated from urgency
  - Result: `_____`

- [ ] **Test 4.10**: Voice overrides image description
  - Action: Upload image (description filled) → Record voice
  - Expected: Description replaced with voice transcript
  - Result: `_____`

- [ ] **Test 4.11**: Manual edits preserved
  - Action: Upload image → Edit title manually → Record voice
  - Expected: Manually edited title not overwritten by voice
  - Result: `_____`

### Completion Checklist Tests
- [ ] **Test 4.12**: Checklist updates in real-time
  - Action: Complete each section one by one
  - Expected: Checkmarks appear as sections complete
  - Result: `_____`

- [ ] **Test 4.13**: AI Processing indicator
  - Action: Upload image → Check completion status
  - Expected: "AI Processing" shows spinner during verification
  - Result: `_____`

---

## Test Suite 5: Submission & Navigation

### Submit Tests
- [ ] **Test 5.1**: Successful submission
  - Action: Complete all fields → Click "Submit Report"
  - Expected: Loading spinner → Success toast → Navigate to /dashboard
  - Result: `_____`

- [ ] **Test 5.2**: Report appears in dashboard
  - Action: After submission → Check dashboard
  - Expected: New report visible in reports list
  - Result: `_____`

- [ ] **Test 5.3**: Report data correct
  - Action: View submitted report details
  - Expected: Title, description, category, location all match input
  - Result: `_____`

- [ ] **Test 5.4**: Image uploaded correctly
  - Action: View report → Check image
  - Expected: Image visible and matches uploaded image
  - Result: `_____`

- [ ] **Test 5.5**: AI metadata saved
  - Action: Check report in database
  - Expected: `aiAnalysis` field contains forensic + linguistic data
  - Result: `_____`

### Error Tests
- [ ] **Test 5.6**: Network error during submission
  - Action: Disconnect internet → Try to submit
  - Expected: Error toast → "Failed to submit report. Please try again."
  - Result: `_____`

- [ ] **Test 5.7**: Backend error handling
  - Action: Stop backend → Try to submit
  - Expected: Error toast with error message
  - Result: `_____`

- [ ] **Test 5.8**: Authentication error
  - Action: Clear auth token → Try to submit
  - Expected: Redirected to /login
  - Result: `_____`

---

## Test Suite 6: Relay Race State Management

### Sequential AI Processing Tests
- [ ] **Test 6.1**: Image → Voice sequence
  - Action: Upload image → Wait for verification → Record voice
  - Expected: Voice disabled during image verification → Enabled after → Voice processes successfully
  - Result: `_____`

- [ ] **Test 6.2**: Voice → Location sequence
  - Action: Record voice → Wait for processing → Detect location
  - Expected: Location disabled during voice processing → Enabled after → Location detects successfully
  - Result: `_____`

- [ ] **Test 6.3**: Image → Location sequence (skip voice)
  - Action: Upload image → Wait → Detect location
  - Expected: Both process successfully without interference
  - Result: `_____`

### Concurrent Attempt Tests
- [ ] **Test 6.4**: Try to upload image while voice processing
  - Action: Record voice → Try to upload image during processing
  - Expected: Image upload disabled (grayed out, no interaction)
  - Result: `_____`

- [ ] **Test 6.5**: Try to record voice while image verifying
  - Action: Upload image → Try to record voice during verification
  - Expected: "Start Recording" button disabled
  - Result: `_____`

- [ ] **Test 6.6**: Try to detect location while AI processing
  - Action: Upload image OR record voice → Try "Auto-Detect Location"
  - Expected: Location buttons disabled
  - Result: `_____`

### Global Loading Indicator Tests
- [ ] **Test 6.7**: Banner appears during processing
  - Action: Upload image
  - Expected: Blue banner appears → "⟳ AI Processing in Progress..."
  - Result: `_____`

- [ ] **Test 6.8**: Banner disappears after processing
  - Action: Wait for verification to complete
  - Expected: Blue banner disappears
  - Result: `_____`

- [ ] **Test 6.9**: Submit disabled during AI processing
  - Action: Upload image → Try to submit during verification
  - Expected: Submit button disabled
  - Result: `_____`

---

## Test Suite 7: UI/UX & Responsiveness

### Desktop Tests (1920x1080)
- [ ] **Test 7.1**: Layout renders correctly
  - Action: View page on desktop
  - Expected: Single column, max-width container, proper spacing
  - Result: `_____`

- [ ] **Test 7.2**: All components visible without scrolling
  - Action: View page
  - Expected: Header visible, can scroll to see all sections
  - Result: `_____`

### Mobile Tests (375x667)
- [ ] **Test 7.3**: Layout responsive
  - Action: View on mobile browser or DevTools mobile view
  - Expected: Single column, full-width cards, readable text
  - Result: `_____`

- [ ] **Test 7.4**: Touch-friendly buttons
  - Action: Tap buttons on mobile
  - Expected: All buttons large enough to tap (min 44x44px)
  - Result: `_____`

- [ ] **Test 7.5**: Image upload works on mobile
  - Action: Upload image from mobile camera
  - Expected: Camera/gallery picker opens → Image uploads
  - Result: `_____`

- [ ] **Test 7.6**: Voice recording works on mobile
  - Action: Record voice on mobile
  - Expected: Microphone access → Recording works
  - Result: `_____`

### Dark Mode Tests
- [ ] **Test 7.7**: Dark mode renders correctly
  - Action: Enable dark mode (system or toggle)
  - Expected: All text readable, proper contrast, no white flashes
  - Result: `_____`

- [ ] **Test 7.8**: Components adapt to dark mode
  - Action: Check each component in dark mode
  - Expected: Backgrounds dark, text light, proper colors
  - Result: `_____`

### Animation Tests
- [ ] **Test 7.9**: Loading spinners animate
  - Action: Trigger loading states
  - Expected: Smooth rotation animation
  - Result: `_____`

- [ ] **Test 7.10**: Transitions smooth
  - Action: Enable/disable buttons, show/hide errors
  - Expected: Smooth fade/slide transitions (no janky movements)
  - Result: `_____`

---

## Test Suite 8: Edge Cases & Stress Tests

### Edge Cases
- [ ] **Test 8.1**: Upload image at exactly 10MB
  - Action: Upload 10MB image
  - Expected: Accepted and processed
  - Result: `_____`

- [ ] **Test 8.2**: Upload image at 10.1MB
  - Action: Upload 10.1MB image
  - Expected: Rejected with size error
  - Result: `_____`

- [ ] **Test 8.3**: Record for exactly 60 seconds
  - Action: Record for 1:00
  - Expected: Auto-stops at 1:00, processes successfully
  - Result: `_____`

- [ ] **Test 8.4**: Very long description (500+ chars)
  - Action: Paste 500 character description
  - Expected: Accepted, textarea expands, submission works
  - Result: `_____`

- [ ] **Test 8.5**: Special characters in title/description
  - Action: Enter `< > & " ' \` in fields
  - Expected: Characters sanitized, no XSS, submission works
  - Result: `_____`

### Stress Tests
- [ ] **Test 8.6**: Rapid image uploads
  - Action: Upload → Clear → Upload → Clear (repeat 5x fast)
  - Expected: No crashes, each upload processes correctly
  - Result: `_____`

- [ ] **Test 8.7**: Multiple voice recordings
  - Action: Record → Clear → Record → Clear (repeat 5x)
  - Expected: No memory leaks, each recording processes
  - Result: `_____`

- [ ] **Test 8.8**: Switch between manual/auto location multiple times
  - Action: Auto-detect → Manual → Auto-detect → Manual
  - Expected: State resets correctly each time
  - Result: `_____`

### Browser Tests
- [ ] **Test 8.9**: Chrome
  - Action: Test all features in Chrome
  - Expected: Everything works
  - Result: `_____`

- [ ] **Test 8.10**: Firefox
  - Action: Test all features in Firefox
  - Expected: Everything works
  - Result: `_____`

- [ ] **Test 8.11**: Safari (Mac/iOS)
  - Action: Test all features in Safari
  - Expected: Everything works (check MediaRecorder support)
  - Result: `_____`

- [ ] **Test 8.12**: Edge
  - Action: Test all features in Edge
  - Expected: Everything works
  - Result: `_____`

---

## Test Summary

### Total Tests: 120+

**Component Breakdown:**
- SmartImageUpload: 12 tests
- VoiceInput: 15 tests
- LocationVerifier: 11 tests
- Form Integration: 13 tests
- Submission: 8 tests
- Relay Race: 9 tests
- UI/UX: 10 tests
- Edge Cases: 12 tests

### Pass Criteria
- ✅ **Critical**: 100% pass (image upload, voice recording, location detection, submission)
- ✅ **High**: 90%+ pass (relay race, validation, auto-fill)
- ✅ **Medium**: 80%+ pass (UI/UX, animations, dark mode)
- ✅ **Low**: 70%+ pass (edge cases, stress tests)

### Bug Tracking Template
```
Bug ID: _____
Test: _____
Severity: Critical / High / Medium / Low
Steps to Reproduce:
1. 
2. 
3. 
Expected: _____
Actual: _____
Browser: _____
Screenshot: _____
```

---

## Post-Testing Checklist

- [ ] All critical tests passed
- [ ] Bugs documented and logged
- [ ] Performance acceptable (no lag, fast load)
- [ ] No console errors
- [ ] No memory leaks
- [ ] Accessibility tested (keyboard navigation, screen reader)
- [ ] Cross-browser compatibility verified
- [ ] Mobile experience verified
- [ ] Dark mode verified
- [ ] Ready for production deployment

---

**Start testing!** Check off each test as you complete it. Good luck! 🚀
