# Updates Component Integration Guide

## Overview
The Updates component provides real-time visibility into AI agent activities, showing every step of AI processing, translations, notifications, and messages.

---

## 📦 **What You Get**

### Features:
- ✅ **Real-time AI Processing Steps** - See language detection, classification, translation
- ✅ **Geospatial Analysis Updates** - Nearby reports, hotspot detection
- ✅ **Inspector Assignment Notifications** - Who was assigned and why
- ✅ **Follow-up Messages** - Scheduled and sent follow-ups
- ✅ **Report Status Updates** - Track your report progress
- ✅ **Live Connection Status** - Know when updates are flowing
- ✅ **Filtering** - All, AI Activity, Notifications, Messages
- ✅ **Mark as Read** - Individual or bulk
- ✅ **Export Data** - Download your update history

---

## 🚀 **Step 1: Add Updates Component to Your App**

### **1.1: Import and Add Route**

**File:** `frontend/src/App.jsx`

```jsx
import Updates from './components/Updates';

// Add to your routes
<Route path="/updates" element={<Updates />} />
```

### **1.2: Add Navigation Link**

**File:** `frontend/src/components/Navbar.jsx`

Find the navigation menu and add:

```jsx
import { Bell } from 'lucide-react';

// In your nav menu:
{user && (
  <li>
    <Link 
      to="/updates" 
      className={isActive('/updates') ? 'active' : ''}
    >
      <Bell size={18} />
      <span>Updates</span>
      {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
    </Link>
  </li>
)}
```

---

## 🔌 **Step 2: Enable Socket.IO Event Emissions (Backend)**

### **2.1: Update AI Worker to Emit Events**

**File:** `backend/queues/aiWorker.js`

Add Socket.IO emissions at each processing step:

```javascript
const { aiQueue } = require('./aiQueue');

// Get Socket.IO instance (add at top of file)
let io = null;

function setSocketIO(socketIO) {
  io = socketIO;
}

// In processTriageJob - ADD THESE EMISSIONS:
async function processTriageJob(job) {
  const { reportId, reportData, userId } = job.data;
  
  // EMIT: Triage started
  if (io && userId) {
    io.to(`user_${userId}`).emit('ai:triage:start', {
      reportId,
      reportTitle: reportData.title,
      timestamp: new Date()
    });
  }
  
  // Perform AI triage
  const triageResult = await aiTriageService.triageReport(reportData);
  
  if (!triageResult.success) {
    // EMIT: Triage failed
    if (io && userId) {
      io.to(`user_${userId}`).emit('ai:triage:failed', {
        reportId,
        error: triageResult.error,
        timestamp: new Date()
      });
    }
    throw new Error(`Triage failed: ${triageResult.error}`);
  }
  
  // Update report...
  await Report.findByIdAndUpdate(reportId, { /* ... */ });
  
  // EMIT: Triage complete
  if (io && userId) {
    io.to(`user_${userId}`).emit('ai:triage:complete', {
      reportId,
      category: triageResult.category,
      severity: triageResult.severity,
      priority: triageResult.priority,
      confidence: triageResult.confidence,
      keywords: triageResult.keywords,
      timestamp: new Date()
    });
  }
  
  // Log processing...
  await AIProcessingLog.create({ /* ... */ });
  
  return triageResult;
}

// In processTranslationJob - ADD THESE EMISSIONS:
async function processTranslationJob(job) {
  const { text, targetLanguage, userId, reportId } = job.data;
  
  const translationResult = await aiTranslationService.translate(
    text,
    targetLanguage
  );
  
  if (translationResult.success) {
    // EMIT: Translation complete
    if (io && userId) {
      io.to(`user_${userId}`).emit('ai:translation:complete', {
        reportId,
        original: translationResult.original.substring(0, 100),
        translated: translationResult.translated.substring(0, 100),
        sourceLang: translationResult.source_lang,
        targetLang: translationResult.target_lang,
        timestamp: new Date()
      });
    }
  }
  
  return translationResult;
}

// Export setSocketIO function
module.exports = { aiWorker, setSocketIO };
```

### **2.2: Initialize Socket.IO in AI Worker**

**File:** `backend/server.js`

```javascript
const { aiWorker, setSocketIO } = require('./queues/aiWorker');

// After Socket.IO setup:
io.on('connection', (socket) => {
  console.log('New socket connection:', socket.id);

  // User joins their room
  socket.on('join', ({ userId }) => {
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined their room`);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

// Pass io to AI worker
setSocketIO(io);
```

---

## 🎨 **Step 3: Emit Events from AI Services**

### **3.1: Geospatial Analysis Event**

**File:** `backend/services/aiTriageService.js`

In the `triageReport` method, after geospatial analysis:

```javascript
// After geospatial context enrichment
if (geoContext) {
  // Emit geospatial analysis result
  const io = require('../server').io; // or pass as parameter
  if (io && report.userId) {
    io.to(`user_${report.userId}`).emit('ai:geospatial:analyzed', {
      reportId: report._id,
      nearbyReports: geoContext.nearbyReports || 0,
      isHotspot: geoContext.isHotspot || false,
      ward: geoContext.ward,
      timestamp: new Date()
    });
  }
}
```

### **3.2: Inspector Assignment Event**

**File:** `backend/routes/aiRoutes.js`

In the `/api/ai/assign` endpoint:

```javascript
router.post('/assign', protect, async (req, res) => {
  try {
    const { reportId } = req.body;
    
    // ... existing assignment logic ...
    
    // After successful assignment
    if (result.success && result.recommendedInspector) {
      // Notify the inspector
      await notificationService.notifyInspectorAssignment(
        result.recommendedInspector,
        ticket
      );
      
      // EMIT: Notify report creator
      const report = await Report.findById(reportId);
      if (report && report.userId) {
        req.app.get('io').to(`user_${report.userId}`).emit('ai:assignment:suggested', {
          reportId,
          inspectorName: result.recommendedInspector.name,
          confidence: result.confidence,
          distance: result.distance || 'N/A',
          timestamp: new Date()
        });
      }
    }
    
    res.json(result);
  } catch (error) {
    // ...
  }
});
```

### **3.3: Follow-up Events**

**File:** `backend/controllers/reportController.js`

In the `updateReportStatus` method:

```javascript
// After queueing follow-up job
if (status === 'resolved' && oldStatus !== 'resolved') {
  // ... queue follow-up job ...
  
  // EMIT: Follow-up scheduled
  const io = req.app.get('io');
  if (io) {
    io.to(`user_${report.userId}`).emit('ai:followup:scheduled', {
      reportId: report._id.toString(),
      scheduledAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      timestamp: new Date()
    });
  }
}
```

**File:** `backend/jobs/followUpSender.js`

In the `sendPendingFollowUps` function:

```javascript
// After sending follow-up
if (sent) {
  followUp.status = 'sent';
  followUp.sentAt = new Date();
  followUp.deliveryAttempts += 1;
  await followUp.save();
  
  // EMIT: Follow-up sent
  const io = global.io; // Store io in global or pass as parameter
  if (io) {
    io.to(`user_${followUp.userId}`).emit('ai:followup:sent', {
      reportId: followUp.reportId,
      message: followUp.messageText,
      channels: ['in-app', 'sms', 'email'], // or actual channels used
      timestamp: new Date()
    });
  }
  
  sentCount++;
}
```

---

## 🔧 **Step 4: Update Report Controller to Pass User ID**

**File:** `backend/controllers/reportController.js`

In `createReport`:

```javascript
// Queue AI triage (async - don't wait)
try {
  if (process.env.ENABLE_AI_TRIAGE === 'true') {
    await aiQueue.add('triage-report', {
      reportId: report._id.toString(),
      userId: req.user.id, // ← ADD THIS
      reportData: {
        category: report.category,
        title: report.title,
        description: report.description,
        location: report.location,
        severity: report.severity,
        images: report.images
      }
    });
    console.log(`AI triage queued for report ${report._id}`);
  }
} catch (aiError) {
  console.warn('Failed to queue AI triage:', aiError.message);
}
```

---

## 📡 **Step 5: Update SocketContext to Join User Room**

**File:** `frontend/src/context/SocketContext.jsx`

```jsx
useEffect(() => {
  const socketInstance = io(SOCKET_URL, {
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
  });

  socketInstance.on('connect', () => {
    console.log('✅ Socket connected');
    setConnected(true);
    
    // JOIN USER ROOM - ADD THIS
    if (user && user.id) {
      socketInstance.emit('join', { userId: user.id });
      console.log(`📡 Joined user room: user_${user.id}`);
    }
  });

  // ... rest of socket setup ...

  setSocket(socketInstance);

  return () => {
    socketInstance.disconnect();
  };
}, []);

// ADD THIS: Rejoin room when user changes
useEffect(() => {
  if (socket && connected && user && user.id) {
    socket.emit('join', { userId: user.id });
    console.log(`📡 Joined user room: user_${user.id}`);
  }
}, [socket, connected, user]);
```

---

## 🧪 **Step 6: Test the Updates Component**

### **Test 1: Create Report and Watch Updates**

1. **Open Updates Page:** Navigate to `/updates`
2. **Open Browser Console:** Press F12
3. **Create a Hindi Report:**
   ```javascript
   fetch('http://localhost:5000/api/reports', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'Authorization': 'Bearer YOUR_TOKEN'
     },
     body: JSON.stringify({
       title: "सड़क पर कचरा",
       description: "बहुत सारा कचरा फैला है",
       category: "Garbage Collection"
     })
   });
   ```

4. **Watch Updates Appear:**
   - ⏱️ "AI Triage Started" (immediately)
   - 🤖 "AI Analysis Complete" (2-5 seconds)
   - 🌍 "Translation Complete" (if Hindi detected)
   - 📍 "Location Analysis" (if coordinates provided)
   - ✅ "Report Created" notification

### **Test 2: Report Status Change**

1. **Mark Report as In-Progress:** (as admin/inspector)
2. **Watch Updates Page:**
   - "Your report status updated: in-progress"

3. **Mark as Resolved:**
   - "Report Status Updated: resolved"
   - "Follow-up Scheduled" (48 hours)

### **Test 3: Inspector Assignment**

1. **Trigger AI Assignment:**
   ```powershell
   curl -X POST http://localhost:5000/api/ai/assign `
     -H "Authorization: Bearer TOKEN" `
     -d '{"reportId": "REPORT_ID"}'
   ```

2. **Watch Updates:**
   - "Inspector Assigned: [Name]"
   - "Confidence: 92% | Distance: 2.3km"

---

## 🎨 **Step 7: Customize Update Messages**

You can customize the messages in the Updates component:

**File:** `frontend/src/components/Updates.jsx`

```jsx
// Customize these helper functions:

const getAIMessage = (log) => {
  if (log.operation === 'triage' && log.result) {
    return `✨ Your report about ${log.result.category} has been analyzed. We detected ${log.result.severity} severity and assigned ${log.result.priority} priority.`;
  }
  if (log.operation === 'translation' && log.result) {
    return `🌍 We translated your message from ${log.result.source_lang} to ${log.result.target_lang} to help our team understand better.`;
  }
  // ... add more customizations
};
```

---

## 📊 **Step 8: Backend API Endpoints (Already Implemented)**

The Updates component uses these endpoints:

### **GET /api/notifications**
Returns user's notifications
```javascript
// Response:
[
  {
    "_id": "...",
    "title": "Report Status Updated",
    "message": "Your report is now in-progress",
    "type": "report_update",
    "read": false,
    "createdAt": "2025-11-25T..."
  }
]
```

### **GET /api/ai/logs?limit=20**
Returns AI processing logs
```javascript
// Response:
{
  "logs": [
    {
      "operation": "triage",
      "reportId": "...",
      "result": {
        "category": "Garbage Collection",
        "severity": "medium",
        "confidence": 0.92
      },
      "status": "completed",
      "processingTime": 2340,
      "createdAt": "2025-11-25T..."
    }
  ]
}
```

### **GET /api/notifications/unread/count**
Returns unread notification count
```javascript
// Response:
{
  "count": 5
}
```

### **PATCH /api/notifications/:id/read**
Marks notification as read

### **PATCH /api/notifications/read-all**
Marks all notifications as read

---

## 🔔 **Step 9: Add Notifications API Routes (If Missing)**

**File:** `backend/routes/notificationRoutes.js` (create if doesn't exist)

```javascript
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Notification = require('../models/Notification');

// Get all notifications for user
router.get('/', protect, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get unread count
router.get('/unread/count', protect, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      userId: req.user.id,
      read: false
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark as read
router.patch('/:id/read', protect, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { read: true },
      { new: true }
    );
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark all as read
router.patch('/read-all', protect, async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, read: false },
      { read: true }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
```

**Add to server.js:**
```javascript
const notificationRoutes = require('./routes/notificationRoutes');
app.use('/api/notifications', notificationRoutes);
```

---

## ✅ **Complete Checklist**

- [ ] Created `Updates.jsx` component
- [ ] Created `Updates.css` styles
- [ ] Added `/updates` route to App.jsx
- [ ] Added Updates link to Navbar
- [ ] Updated `aiWorker.js` to emit events
- [ ] Added `setSocketIO` function to worker
- [ ] Called `setSocketIO(io)` in server.js
- [ ] Updated SocketContext to join user rooms
- [ ] Added userId to AI queue jobs
- [ ] Created notification API routes
- [ ] Tested real-time updates
- [ ] Tested filtering and mark as read

---

## 🎉 **You're Done!**

Now users can see:
- ✅ Every AI processing step in real-time
- ✅ Language detection and translation
- ✅ Geospatial analysis results
- ✅ Inspector assignments with reasoning
- ✅ Follow-up scheduling and delivery
- ✅ All status updates and notifications

**The Updates component gives complete transparency into what your AI agents are doing!** 🚀
