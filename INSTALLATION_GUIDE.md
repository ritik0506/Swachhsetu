# SwachhSetu - Installation & Setup Guide 🚀

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (v5 or higher) - [Download](https://www.mongodb.com/try/download/community)
- **Git** - [Download](https://git-scm.com/)
- **VS Code** (recommended) - [Download](https://code.visualstudio.com/)

---

## Step-by-Step Installation

### 1. Verify Node.js and npm Installation

```powershell
node --version
npm --version
```

You should see version numbers. If not, install Node.js.

---

### 2. Install Backend Dependencies

```powershell
cd d:\Project\SwachhSetu\backend
npm install
```

This will install:
- express, mongoose, cors, dotenv
- bcryptjs, jsonwebtoken
- multer, socket.io
- nodemon, express-validator, sharp

---

### 3. Install Frontend Dependencies

```powershell
cd d:\Project\SwachhSetu\frontend
npm install
```

This will install:
- react, react-dom, react-router-dom
- axios, socket.io-client
- leaflet, react-leaflet
- recharts, framer-motion
- react-toastify, lucide-react

---

### 4. Setup MongoDB

#### Option A: Local MongoDB
```powershell
# Start MongoDB service
net start MongoDB

# Verify it's running
mongosh
# Should connect successfully
```

#### Option B: MongoDB Atlas (Cloud - Recommended)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a new cluster (free tier)
4. Click "Connect" → "Connect your application"
5. Copy the connection string
6. Replace `<password>` with your database user password

---

### 5. Configure Backend Environment

```powershell
cd d:\Project\SwachhSetu\backend

# Create .env file from example
copy .env.example .env

# Open .env in notepad or VS Code
notepad .env
```

Edit the `.env` file:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/swachhsetu
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/swachhsetu

JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

**Important**: Change `JWT_SECRET` to a random string for security!

---

### 6. Configure Frontend Environment

```powershell
cd d:\Project\SwachhSetu\frontend

# Create .env file from example
copy .env.example .env

# Open .env
notepad .env
```

Edit the `.env` file:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_ENV=development
```

---

### 7. Start the Backend Server

```powershell
cd d:\Project\SwachhSetu\backend
npm run dev
```

You should see:
```
✅ MongoDB Connected: localhost
🚀 Server running on port 5000
📡 Socket.io ready for real-time updates
```

**Keep this terminal running!**

---

### 8. Start the Frontend Development Server

Open a **NEW PowerShell terminal**:

```powershell
cd d:\Project\SwachhSetu\frontend
npm run dev
```

You should see:
```
VITE v7.x.x ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

**Keep this terminal running too!**

---

### 9. Access the Application

Open your browser and navigate to:
```
http://localhost:5173
```

You should see the SwachhSetu homepage! 🎉

---

## Verify Installation

### Backend Health Check
Visit: `http://localhost:5000/api/health`

Should return:
```json
{
  "status": "OK",
  "message": "SwachhSetu API is running"
}
```

### Test User Registration
1. Go to `http://localhost:5173/register`
2. Create a test account
3. Login with those credentials
4. Navigate to different pages

---

## Common Issues & Solutions

### Issue 1: MongoDB Connection Failed
**Error**: `MongoNetworkError: connect ECONNREFUSED`

**Solution**:
```powershell
# Check if MongoDB is running
net start MongoDB

# Or restart it
net stop MongoDB
net start MongoDB
```

---

### Issue 2: Port 5000 Already in Use
**Error**: `EADDRINUSE: address already in use :::5000`

**Solution**:
```powershell
# Find what's using port 5000
netstat -ano | findstr :5000

# Kill that process (replace PID with actual number)
taskkill /PID <PID> /F

# Or change port in backend/.env
PORT=5001
```

---

### Issue 3: Port 5173 Already in Use
**Error**: `Port 5173 is in use`

**Solution**:
Vite will automatically try the next available port (5174, 5175, etc.)
Just use the URL shown in the terminal.

---

### Issue 4: Module Not Found
**Error**: `Cannot find module 'express'` or similar

**Solution**:
```powershell
# Reinstall dependencies
cd backend
rm -rf node_modules
rm package-lock.json
npm install

# Same for frontend if needed
cd frontend
rm -rf node_modules
rm package-lock.json
npm install
```

---

### Issue 5: CORS Errors
**Error**: `Access-Control-Allow-Origin` errors

**Solution**:
Make sure frontend URL matches in `backend/.env`:
```env
CLIENT_URL=http://localhost:5173
```

---

### Issue 6: Images Not Uploading
**Error**: 413 Entity Too Large or file upload fails

**Solution**:
Check if `backend/uploads` folder exists:
```powershell
cd backend
mkdir uploads
```

---

## Development Workflow

### Starting Development Session
```powershell
# Terminal 1 - Backend
cd d:\Project\SwachhSetu\backend
npm run dev

# Terminal 2 - Frontend (new terminal)
cd d:\Project\SwachhSetu\frontend
npm run dev
```

### Stopping Servers
Press `Ctrl + C` in each terminal to stop the servers.

---

## Database Management

### View Database in MongoDB Compass
1. Download [MongoDB Compass](https://www.mongodb.com/products/compass)
2. Connect to `mongodb://localhost:27017`
3. View `swachhsetu` database
4. Browse collections: users, reports, pois, gamifications, notifications

### Clear Database (if needed)
```powershell
mongosh
use swachhsetu
db.dropDatabase()
```

---

## Testing the Application

### 1. Create Test User
```
Email: test@swachhsetu.com
Password: Test123!
Name: Test User
```

### 2. Test Report Creation
1. Go to "Report Issue"
2. Select category: "Public Toilet"
3. Fill in details
4. Upload test images
5. Click on map to set location
6. Submit report

### 3. Test Dashboard
1. Go to "Analytics Dashboard"
2. View charts and statistics
3. Check leaderboard
4. View recent activity

### 4. Test Real-Time Features
Open app in two browser windows:
- Create a report in one
- See real-time notification in the other

---

## Production Build

### Frontend Build
```powershell
cd frontend
npm run build
```

This creates a `dist` folder with optimized production files.

### Backend Production
```powershell
cd backend
npm start
```

Make sure to:
- Set `NODE_ENV=production` in `.env`
- Use strong `JWT_SECRET`
- Use MongoDB Atlas instead of local
- Enable proper CORS settings

---

## Deployment

### Backend Deployment (Railway/Render)
1. Push code to GitHub
2. Connect Railway/Render to your repo
3. Set environment variables
4. Deploy

### Frontend Deployment (Vercel/Netlify)
1. Push code to GitHub
2. Connect Vercel/Netlify to your repo
3. Set build command: `npm run build`
4. Set output directory: `dist`
5. Set environment variables
6. Deploy

---

## Environment Variables Summary

### Backend (.env)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/swachhsetu
JWT_SECRET=your_super_secret_key
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_ENV=development
```

---

## Useful Commands

### Backend
```powershell
npm run dev      # Start development server with nodemon
npm start        # Start production server
npm test         # Run tests (when implemented)
```

### Frontend
```powershell
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

---

## VS Code Extensions (Recommended)

Install these for better development experience:
- **ES7+ React/Redux/React-Native snippets**
- **Prettier - Code formatter**
- **ESLint**
- **MongoDB for VS Code**
- **Thunder Client** (API testing)
- **GitLens**

---

## API Testing

Use Thunder Client (VS Code extension) or Postman to test APIs:

### Register User
```
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "name": "Test User",
  "email": "test@example.com",
  "password": "password123",
  "phone": "1234567890"
}
```

### Login
```
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123"
}
```

### Get Reports
```
GET http://localhost:5000/api/reports
```

---

## Troubleshooting Checklist

- [ ] Node.js and npm installed?
- [ ] MongoDB running?
- [ ] Backend dependencies installed?
- [ ] Frontend dependencies installed?
- [ ] .env files created and configured?
- [ ] Backend server running on port 5000?
- [ ] Frontend server running on port 5173?
- [ ] No firewall blocking ports?
- [ ] CORS configured correctly?

---

## Getting Help

If you encounter issues:
1. Check the error message carefully
2. Review the Common Issues section above
3. Check backend/frontend console for errors
4. Verify all environment variables are set
5. Try clearing node_modules and reinstalling

---

## Next Steps

Once everything is running:
1. ✅ Explore all features
2. ✅ Test user registration and login
3. ✅ Create sample reports
4. ✅ View analytics dashboard
5. ✅ Test real-time notifications
6. ✅ Check gamification features
7. ✅ Test on mobile devices
8. ✅ Customize branding and colors
9. ✅ Add your own data
10. 🚀 Deploy to production!

---

**Congratulations! Your SwachhSetu platform is now running! 🎉**

Happy Coding! 💻✨
