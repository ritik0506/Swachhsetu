# Netlify Deployment Checklist ✅

## Files Already Created
- ✅ `public/_redirects` - SPA routing fix
- ✅ `netlify.toml` - Complete deployment configuration
- ✅ `src/config.js` - Environment variable management

## Step-by-Step Deployment Guide

### 1. Commit New Configuration Files
```bash
cd D:\Project\SwachhSetu
git add frontend/public/_redirects frontend/netlify.toml frontend/src/config.js
git commit -m "Add Netlify configuration for SPA routing and environment variables"
git push origin main
```

### 2. Set Environment Variables in Netlify Dashboard

**Navigate to:** Netlify Dashboard → Your Site → Site settings → Environment variables

Add these variables:
```
VITE_API_URL=https://your-backend-api.com
VITE_SOCKET_URL=https://your-backend-api.com
```

⚠️ **IMPORTANT:** Replace `your-backend-api.com` with your actual backend API URL

### 3. Update Frontend Code to Use config.js

#### A. Update Axios Configuration
Find where axios is configured (likely `src/main.jsx` or `src/utils/api.js`):

```javascript
// Add this import
import { API_URL } from './config'; // or '../config' depending on file location

// Update axios baseURL
axios.defaults.baseURL = API_URL;
```

#### B. Update Socket.IO Configuration
In `src/context/SocketContext.jsx`:

```javascript
// Add this import
import { SOCKET_URL } from '../config';

// Update Socket.IO connection
const socketInstance = io(SOCKET_URL, {
  withCredentials: true,
  transports: ['websocket', 'polling'],
});
```

### 4. Fix Socket.IO Room Joining (For Notifications)

In `src/context/SocketContext.jsx`, add user room joining:

```javascript
// Inside SocketContext component, after socket initialization
useEffect(() => {
  if (!socketInstance) return;

  socketInstance.on('connect', () => {
    console.log('✅ Socket connected');
    setConnected(true);
    
    // Join user-specific room for notifications
    if (user && user.id) {
      socketInstance.emit('join', { userId: user.id });
      console.log(`📡 Joined user room: user_${user.id}`);
    }
  });

  socketInstance.on('disconnect', () => {
    console.log('❌ Socket disconnected');
    setConnected(false);
  });

  return () => {
    socketInstance.off('connect');
    socketInstance.off('disconnect');
  };
}, [user]);

// Also add useEffect to rejoin when user changes
useEffect(() => {
  if (socket && connected && user && user.id) {
    socket.emit('join', { userId: user.id });
  }
}, [socket, connected, user]);
```

### 5. Integrate Updates Component (Optional but Recommended)

#### A. Add Route in `src/App.jsx`
```javascript
import Updates from './components/Updates';

// Inside your Routes
<Route 
  path="/updates" 
  element={
    <ProtectedRoute>
      <Updates />
    </ProtectedRoute>
  } 
/>
```

#### B. Add Link in `src/components/Navbar.jsx`
```javascript
import { Bell } from 'lucide-react';

// Inside navbar links
<Link to="/updates" className="nav-link">
  <Bell size={20} />
  <span>Updates</span>
</Link>
```

### 6. Test Build Locally
```bash
cd frontend
npm run build
```

**Expected output:**
- `dist` folder created
- `dist/index.html` exists
- `dist/assets/` contains JS/CSS files

### 7. Deploy to Netlify

**Option A: Automatic (if connected to Git)**
- Push to GitHub → Netlify auto-deploys
- Check deploy logs in Netlify dashboard

**Option B: Manual Deploy**
```bash
cd frontend
npm run build
netlify deploy --prod --dir=dist
```

### 8. Verify Deployment

Test these URLs on your deployed site (replace with your Netlify URL):
- ✅ `https://your-site.netlify.app/` - Homepage
- ✅ `https://your-site.netlify.app/updates` - Updates page
- ✅ `https://your-site.netlify.app/dashboard` - Dashboard
- ✅ `https://your-site.netlify.app/profile` - Profile
- ✅ `https://your-site.netlify.app/report-issue` - Report issue

**All routes should load without "Page not found" error!**

### 9. Test Real-time Features

1. **Login** to your deployed site
2. **Submit a report** (try Hindi/Marathi text to test translation)
3. **Check Updates page** - Should show AI processing events
4. **Check notifications** - Should receive real-time updates

---

## Troubleshooting

### Issue: Routes still showing 404
**Solution:** Make sure `_redirects` file is in `public/` folder (not `src/`)

### Issue: Can't connect to backend API
**Solution:** Check environment variables in Netlify dashboard are set correctly

### Issue: Build fails
**Solution:** 
```bash
cd frontend
rm -rf node_modules
npm install
npm run build
```

### Issue: No real-time notifications
**Solution:** Verify Socket.IO room joining code was added to SocketContext.jsx

---

## Backend Deployment (If Not Done Yet)

Your frontend is now configured, but you also need to deploy your backend API:

**Options:**
1. **Render.com** (Free tier available)
2. **Railway.app** (Free tier available)
3. **Heroku** (Paid)
4. **DigitalOcean App Platform** (Paid)
5. **AWS/Azure** (Complex but scalable)

**Backend Requirements:**
- Node.js environment
- MongoDB database (MongoDB Atlas recommended)
- Redis instance (Redis Cloud free tier or Upstash)
- Ollama models (requires GPU - consider running locally or cloud GPU)

---

## Summary of Changes

| File | Purpose | Status |
|------|---------|--------|
| `public/_redirects` | Fix SPA routing | ✅ Created |
| `netlify.toml` | Deployment config | ✅ Created |
| `src/config.js` | Environment variables | ✅ Created |
| Environment vars | Backend API URLs | ⏳ Need to set |
| axios config | Use API_URL | ⏳ Need to update |
| SocketContext | Use SOCKET_URL + room join | ⏳ Need to update |
| Updates route | Navigation | ⏳ Optional |

---

## Next Steps

1. ✅ Commit & push new files
2. ✅ Set environment variables in Netlify
3. ✅ Update axios and Socket.IO to use config.js
4. ✅ Deploy to Netlify
5. ✅ Test all routes work
6. ⏳ Fix Socket.IO room joining (for notifications)
7. ⏳ Add Updates component to navigation (optional)
8. ⏳ Deploy backend API (if not already deployed)

---

**Your Netlify deployment is now ready! 🚀**

All configuration files are in place. Just follow the steps above to complete the deployment.
