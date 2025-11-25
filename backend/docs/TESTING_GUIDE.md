# AI Features Testing Guide

## Prerequisites
✅ Server running: `npm start` in backend folder
✅ MongoDB connected
✅ Redis running (for BullMQ)
✅ Ollama running with llama3:8b and mistral:7b models

---

## Test 1: Report Triage with Geospatial Context

### Step 1: Create a Test Report
```powershell
# Create a report with location coordinates
curl -X POST http://localhost:5000/api/reports `
  -H "Content-Type: application/json" `
  -d '{
    "title": "Overflowing garbage bin near market",
    "description": "Large garbage bin is overflowing with waste. Bad smell and flies everywhere. Located near the vegetable market.",
    "category": "Garbage Collection",
    "location": {
      "type": "Point",
      "coordinates": [77.1025, 28.7041],
      "address": "Connaught Place, New Delhi"
    },
    "images": [],
    "reportedBy": "YOUR_USER_ID_HERE"
  }'
```

### What to Check:
1. **Server Logs** - Look for:
   ```
   🤖 Processing AI triage for report: [Report ID]
   📊 Report triage completed
   ```

2. **Response** - Should include:
   ```json
   {
     "aiAnalysis": {
       "category": "Garbage Collection",
       "severity": "medium" or "high",
       "priority": "medium" or "high",
       "confidence": 0.8-0.95,
       "suggestedDepartment": "Waste Management",
       "estimatedResolutionTime": "24-48 hours",
       "keywords": ["garbage", "overflowing", "sanitation"]
     }
   }
   ```

3. **Check AI Logs**:
   ```powershell
   curl http://localhost:5000/api/ai/logs?limit=5
   ```
   - Look for `operation: "triage"`
   - Check if `result.geoContext` exists (nearby reports data)

### Expected Behavior:
- AI analyzes text description
- Fetches nearby reports within 500m radius
- Includes geospatial context in classification
- Higher priority/severity if it's a hotspot area (5+ recent reports)

---

## Test 2: Inspector Assignment with Notifications

### Step 1: Trigger AI Assignment
```powershell
# Replace REPORT_ID with the ID from Test 1
curl -X POST http://localhost:5000/api/ai/assign `
  -H "Content-Type: application/json" `
  -d '{
    "reportId": "REPORT_ID"
  }'
```

### What to Check:
1. **Server Logs** - Look for:
   ```
   🔔 Notifying inspector about assignment
   📧 [NotificationService] Sending notification to user
   ✅ Socket notification sent
   📧 [NotificationService] SMS sent via console
   📧 [NotificationService] Email sent via console
   ```

2. **Response** - Should include:
   ```json
   {
     "assignedInspector": {
       "_id": "inspector_id",
       "name": "Inspector Name",
       "email": "inspector@example.com"
     },
     "assignmentConfidence": 0.85-0.95,
     "reasoning": "Explanation of why this inspector was chosen"
   }
   ```

3. **Socket.io Test** (Optional):
   - Open browser console on frontend
   - Run: `socket.emit('join', { userId: 'INSPECTOR_ID' })`
   - Should receive notification in real-time

### Expected Behavior:
- AI assigns inspector based on expertise and workload
- Socket.io notification sent to inspector's user room
- SMS logged to console (or sent if Twilio configured)
- Email logged to console (or sent if SendGrid configured)

---

## Test 3: Automated Follow-up Trigger

### Step 1: Mark Report as Resolved
```powershell
# Replace REPORT_ID with your report ID
curl -X PATCH http://localhost:5000/api/reports/REPORT_ID `
  -H "Content-Type: application/json" `
  -d '{
    "status": "resolved",
    "resolutionNotes": "Garbage bin emptied and area cleaned"
  }'
```

### What to Check:
1. **Server Logs** - Look for:
   ```
   ⏰ Follow-up scheduled for report REPORT_ID in 48 hours
   ```

2. **Check BullMQ Queue**:
   ```powershell
   # Query AI processing logs
   curl http://localhost:5000/api/ai/logs?operation=followup&limit=5
   ```
   - Should show a queued follow-up job
   - Check `createdAt` timestamp

3. **Check Follow-up Record**:
   ```powershell
   curl http://localhost:5000/api/ai/followups/stats
   ```
   - Should show `pending: 1` (or more)
   - Look for your report in pending list

### Expected Behavior:
- Status change from non-resolved → resolved triggers follow-up
- BullMQ job queued with 48-hour delay
- FollowUp record created with `status: 'pending'`
- User language preserved from original AI analysis

---

## Test 4: Follow-up Cron Job (Immediate Test)

**Note**: The cron runs every 5 minutes, but we can test immediately by creating a follow-up with scheduledAt in the past.

### Step 1: Create Immediate Follow-up (Manual DB Insert)
```javascript
// Run this in MongoDB Compass or mongo shell
db.followups.insertOne({
  reportId: ObjectId("YOUR_REPORT_ID"),
  userId: ObjectId("YOUR_USER_ID"),
  messageText: "Test follow-up message: How was your experience with the resolution?",
  messageType: "resolution",
  userLanguage: "en",
  scheduledAt: new Date(Date.now() - 1000), // 1 second ago
  channel: "in-app",
  status: "pending",
  createdAt: new Date()
})
```

### Step 2: Wait for Next Cron Run
- Cron runs every 5 minutes
- Server logs will show:
  ```
  🔄 Checking for pending follow-ups...
  📧 Processing 1 pending follow-ups
  ✅ Follow-up sent to user YOUR_USER_ID
  ✅ Sent 1 follow-ups successfully, 0 failed
  ```

### What to Check:
1. **Server Logs** - Every 5 minutes:
   ```
   🔄 Checking for pending follow-ups...
   ✅ No pending follow-ups
   ```
   OR (if pending exists):
   ```
   📧 Processing X pending follow-ups
   ✅ Follow-up sent to user [USER_ID]
   ```

2. **Follow-up Status Updated**:
   ```powershell
   curl http://localhost:5000/api/ai/followups/stats
   ```
   - Status should change from `pending` → `sent`
   - Check `sentAt` timestamp

### Expected Behavior:
- Cron job runs every 5 minutes
- Processes up to 50 pending follow-ups per run
- Sends via Socket.io + SMS (console) + Email (console)
- Updates FollowUp status to 'sent' with deliveryAttempts incremented

---

## Test 5: AI Logs and Metrics

### Check All AI Operations
```powershell
# Get recent AI logs (all operations)
curl http://localhost:5000/api/ai/logs?limit=20

# Get only triage operations
curl http://localhost:5000/api/ai/logs?operation=triage&limit=10

# Get only assignment operations
curl http://localhost:5000/api/ai/logs?operation=assignment&limit=10

# Get only follow-up operations
curl http://localhost:5000/api/ai/logs?operation=followup&limit=10

# Get follow-up statistics
curl http://localhost:5000/api/ai/followups/stats
```

### What to Check:
1. **AI Logs Response**:
   ```json
   {
     "logs": [
       {
         "operation": "triage",
         "reportId": "...",
         "result": {
           "category": "Garbage Collection",
           "geoContext": {
             "nearbyReports": 3,
             "isHotspot": true
           }
         },
         "status": "completed",
         "processingTime": 2500,
         "createdAt": "2025-11-24T..."
       }
     ]
   }
   ```

2. **Follow-up Stats Response**:
   ```json
   {
     "total": 5,
     "byStatus": {
       "pending": 2,
       "sent": 3,
       "failed": 0
     },
     "byType": {
       "resolution": 5
     },
     "averageDeliveryTime": 172800000,
     "pendingFollowups": [
       {
         "reportId": "...",
         "scheduledAt": "2025-11-26T...",
         "timeUntilDelivery": "47 hours"
       }
     ]
   }
   ```

---

## Test 6: Image Analysis (Optional - Requires LLaVA Model)

### Prerequisites:
```powershell
# Download LLaVA model (4.5GB)
ollama pull llava:7b

# Enable vision in .env
# Set: ENABLE_AI_VISION=true
```

### Step 1: Create Report with Images
```powershell
# Upload image first
curl -X POST http://localhost:5000/api/reports/upload `
  -F "image=@path/to/garbage-image.jpg"

# Create report with image URL
curl -X POST http://localhost:5000/api/reports `
  -H "Content-Type: application/json" `
  -d '{
    "title": "Garbage dumping on street",
    "description": "See attached image",
    "category": "Garbage Collection",
    "images": ["http://localhost:5000/uploads/1234567890-image.jpg"],
    "location": {
      "type": "Point",
      "coordinates": [77.1025, 28.7041]
    },
    "reportedBy": "YOUR_USER_ID"
  }'
```

### What to Check:
1. **Server Logs** - Look for:
   ```
   🖼️ Analyzing images for triage...
   ✅ Image analysis completed
   ```

2. **AI Log Result**:
   ```powershell
   curl http://localhost:5000/api/ai/logs?limit=1
   ```
   - Should include `result.imageAnalysis`:
     ```json
     {
       "caption": "Description of what's in the image",
       "issues_detected": ["garbage_pile", "sanitation_issue"],
       "severity": "high",
       "confidence": 0.85
     }
     ```

### Expected Behavior:
- Images converted from URLs to file paths
- LLaVA model analyzes each image
- Caption and issues included in triage prompt
- More accurate classification with visual context

---

## Common Issues & Troubleshooting

### Issue 1: "No pending follow-ups" always shown
**Cause**: Follow-ups scheduled for future (48 hours delay)
**Solution**: Either wait 48 hours OR manually insert a follow-up with past scheduledAt (see Test 4)

### Issue 2: Notifications not appearing
**Cause**: SMS_PROVIDER and EMAIL_PROVIDER set to 'console'
**Check**: Look in server logs, not email/SMS
**Solution**: This is expected for development. Configure Twilio/SendGrid for production.

### Issue 3: Geospatial context not appearing
**Cause**: Reports don't have location coordinates OR no nearby reports exist
**Solution**: Create multiple reports with similar coordinates (within 500m)

### Issue 4: AI triage slow or timing out
**Cause**: Ollama models not loaded OR geospatial queries slow
**Check**: Run `ollama ps` to see loaded models
**Solution**: Warm up models with test request

### Issue 5: BullMQ jobs not processing
**Cause**: Redis not running OR AI worker crashed
**Check**: Server logs for "🤖 AI worker started"
**Solution**: Restart Redis (`memurai.exe`) and restart server

---

## Quick Verification Checklist

- [ ] ✅ Server starts with "NotificationService initialized"
- [ ] ✅ Server shows "AI worker started"
- [ ] ✅ Server shows "Follow-up sender cron job started"
- [ ] ✅ Create report → AI triage completes in 2-5 seconds
- [ ] ✅ AI logs show operation: "triage" with geoContext
- [ ] ✅ Trigger assignment → Inspector notification logged to console
- [ ] ✅ Mark resolved → Server logs "Follow-up scheduled in 48 hours"
- [ ] ✅ Follow-up stats show pending count increased
- [ ] ✅ Cron runs every 5 minutes → "Checking for pending follow-ups..."
- [ ] ✅ All API endpoints respond without errors

---

## Monitoring Commands (Run These Regularly)

```powershell
# Watch server logs in real-time
cd D:\Project\SwachhSetu\backend
npm start

# Check AI processing status
curl http://localhost:5000/api/ai/logs?limit=10

# Check follow-up queue
curl http://localhost:5000/api/ai/followups/stats

# Check Redis queue (if redis-cli available)
redis-cli LLEN bull:ai-worker:wait
redis-cli LLEN bull:ai-worker:delayed

# Check MongoDB follow-ups
# In MongoDB Compass: db.followups.find().sort({createdAt: -1}).limit(10)
```

---

## Success Criteria

Your AI system is working correctly if:

1. **Triage**: Reports get AI classification within 5 seconds
2. **Geospatial**: AI logs show `geoContext` with nearby report data
3. **Assignment**: Inspectors get multi-channel notifications (logged to console)
4. **Follow-ups**: Resolved reports trigger 48hr delayed jobs
5. **Cron**: Follow-up sender runs every 5 minutes without errors
6. **Logs**: All operations logged to AIProcessingLog collection
7. **No Errors**: Server logs show no red error messages

---

## Next Steps After Testing

1. **Test end-to-end flow** with real user accounts
2. **Monitor for 48 hours** to see first real follow-up delivery
3. **Configure Twilio/SendGrid** for production SMS/Email
4. **Download LLaVA** model if image analysis needed
5. **Set up monitoring** with Prometheus/Grafana (optional)
6. **Load test** with multiple concurrent reports
7. **Review AI logs** for accuracy and performance tuning

---

## Support

If tests fail:
1. Check server logs for detailed error messages
2. Verify Redis is running: `redis-cli ping` (or memurai equivalent)
3. Verify Ollama is running: `ollama ps`
4. Check MongoDB connection: Look for "✅ MongoDB Connected" in logs
5. Review PRODUCTION_READY.md for configuration details
