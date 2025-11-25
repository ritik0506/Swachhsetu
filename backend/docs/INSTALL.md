# SwachhSetu - Installation & Setup Guide

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (v4.4 or higher) - [Download](https://www.mongodb.com/try/download/community)
- **Git** - [Download](https://git-scm.com/)
- **Code Editor** - VS Code recommended

## 🚀 Quick Start (5 Minutes)

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/swachhsetu.git
cd swachhsetu
```

### 2. Backend Setup

#### Install Dependencies
```bash
cd backend
npm install
```

#### Create Environment File
Create `.env` file in the backend directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/swachhsetu
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
NODE_ENV=development
```

#### Start MongoDB
```bash
# Windows (if MongoDB is installed as a service)
net start MongoDB

# macOS/Linux
sudo systemctl start mongod

# Or use MongoDB Compass to start the service
```

#### Create Admin Account
```bash
node scripts/createAdmin.js
```

Expected output:
```
✅ Admin user created successfully!
Email: admin@swachhsetu.com
Password: admin123
Role: admin
✅ Moderator user created successfully!
Email: moderator@swachhsetu.com
Password: moderator123
Role: moderator
```

#### Start Backend Server
```bash
npm run dev
```

Expected output:
```
Server running on port 5000
MongoDB Connected
```

### 3. Frontend Setup

Open a **new terminal window** and navigate to the frontend directory:

#### Install Dependencies
```bash
cd frontend
npm install --legacy-peer-deps
```

> **Note**: The `--legacy-peer-deps` flag is needed for React 19 compatibility with react-leaflet.

#### Create Environment File
Create `.env` file in the frontend directory:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

#### Start Frontend Development Server
```bash
npm run dev
```

Expected output:
```
VITE v7.1.9  ready in 500 ms
➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### 4. Access the Application

Open your browser and navigate to:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000/api

---

## 🧪 Test the Setup

### 1. Login as Admin
- Go to http://localhost:5173/login
- Email: `admin@swachhsetu.com`
- Password: `admin123`
- You should see "Admin Panel" link in the navbar

### 2. Login as Moderator
- Email: `moderator@swachhsetu.com`
- Password: `moderator123`
- You should see "Admin Panel" link (with limited permissions)

### 3. Register as Regular User
- Go to http://localhost:5173/register
- Fill in the form
- You should NOT see "Admin Panel" link

### 4. Submit a Test Report
- Login as a user
- Click "Report Issue"
- Fill in the form with test data
- Upload an image
- Select location on map
- Submit

### 5. Test Admin Features
- Login as admin
- Click "Admin Panel" in navbar
- View the test report you created
- Change its status from "Pending" to "In Progress"
- View statistics on the Overview tab

---

## 📦 Project Structure

```
SwachhSetu/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB configuration
│   ├── controllers/
│   │   ├── authController.js      # Authentication logic
│   │   ├── reportController.js    # Report CRUD operations
│   │   ├── dashboardController.js # Dashboard stats
│   │   └── adminController.js     # Admin operations
│   ├── middleware/
│   │   ├── authMiddleware.js      # JWT verification & authorization
│   │   └── uploadMiddleware.js    # File upload handling
│   ├── models/
│   │   ├── User.js                # User schema
│   │   ├── Report.js              # Report schema
│   │   ├── Gamification.js        # Achievements schema
│   │   └── Notification.js        # Notifications schema
│   ├── routes/
│   │   ├── authRoutes.js          # Auth endpoints
│   │   ├── reportRoutes.js        # Report endpoints
│   │   ├── dashboardRoutes.js     # Dashboard endpoints
│   │   └── adminRoutes.js         # Admin endpoints
│   ├── scripts/
│   │   └── createAdmin.js         # Admin seeding script
│   ├── uploads/                   # Uploaded images
│   ├── .env                       # Environment variables
│   ├── package.json               # Backend dependencies
│   └── server.js                  # Express server entry point
│
├── frontend/
│   ├── public/                    # Static assets
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx         # Navigation with role-based menu
│   │   │   ├── Footer.jsx         # Footer component
│   │   │   ├── ProtectedRoute.jsx # Route guard component
│   │   │   ├── LoadingSpinner.jsx # Loading states
│   │   │   └── Leaderboard.jsx    # Gamification leaderboard
│   │   ├── pages/
│   │   │   ├── Home.jsx           # Landing page
│   │   │   ├── Login.jsx          # Login page
│   │   │   ├── Register.jsx       # Registration page
│   │   │   ├── Dashboard.jsx      # User dashboard
│   │   │   ├── EnhancedDashboard.jsx # Analytics dashboard
│   │   │   ├── EnhancedReportIssue.jsx # Report form
│   │   │   ├── AdminDashboard.jsx # Admin panel
│   │   │   └── [other pages]
│   │   ├── context/
│   │   │   ├── AuthContext.jsx    # Auth state management
│   │   │   └── SocketContext.jsx  # Real-time connection
│   │   ├── utils/
│   │   │   └── api.js             # API endpoints configuration
│   │   ├── styles/
│   │   │   ├── global.css         # Design system
│   │   │   └── [component].css    # Component styles
│   │   ├── App.jsx                # Main app component
│   │   └── main.jsx               # React entry point
│   ├── .env                       # Environment variables
│   ├── package.json               # Frontend dependencies
│   └── vite.config.js             # Vite configuration
│
├── RBAC_GUIDE.md                  # Role-based access control docs
├── FEATURE_SUMMARY.md             # Complete feature list
├── INSTALL.md                     # This file
└── README.md                      # Project overview
```

---

## 🛠️ Troubleshooting

### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```

**Solution**:
- Ensure MongoDB is running: `mongod` or start via MongoDB Compass
- Check if MongoDB service is installed: `net start MongoDB` (Windows)
- Verify MONGODB_URI in backend/.env

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```

**Solution**:
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:5000 | xargs kill -9
```

### Missing Dependencies
```
Error: Cannot find module 'express'
```

**Solution**:
```bash
cd backend
npm install

cd ../frontend
npm install --legacy-peer-deps
```

### JWT Token Invalid
```
Error: 401 Unauthorized
```

**Solution**:
- Clear browser localStorage
- Logout and login again
- Check if JWT_SECRET matches in .env

### Image Upload Failing
```
Error: ENOENT: no such file or directory, open 'uploads/...'
```

**Solution**:
```bash
cd backend
mkdir uploads
```

### React Leaflet Peer Dependency Warning
```
npm ERR! Could not resolve dependency
```

**Solution**:
```bash
npm install --legacy-peer-deps
```

---

## 🔧 Development Commands

### Backend
```bash
cd backend

# Start development server (with nodemon)
npm run dev

# Start production server
npm start

# Create admin account
node scripts/createAdmin.js

# Run tests (if configured)
npm test
```

### Frontend
```bash
cd frontend

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

---

## 📊 Database Management

### Using MongoDB Compass (GUI)
1. Download and install [MongoDB Compass](https://www.mongodb.com/try/download/compass)
2. Connect to: `mongodb://localhost:27017`
3. View `swachhsetu` database
4. Browse collections: `users`, `reports`, `gamifications`, `notifications`

### Using MongoDB Shell
```bash
# Connect to database
mongosh
use swachhsetu

# View all users
db.users.find().pretty()

# View all reports
db.reports.find().pretty()

# Update user role to admin
db.users.updateOne(
  { email: "user@example.com" },
  { $set: { role: "admin" } }
)

# Delete all reports (caution!)
db.reports.deleteMany({})
```

---

## 🚀 Deployment

### Backend (Node.js Server)

#### Option 1: Heroku
```bash
# Install Heroku CLI
heroku login

# Create app
heroku create swachhsetu-backend

# Set environment variables
heroku config:set MONGODB_URI=your_mongodb_atlas_uri
heroku config:set JWT_SECRET=your_secret_key

# Deploy
git push heroku main
```

#### Option 2: Railway/Render
1. Connect GitHub repository
2. Set environment variables
3. Deploy automatically on push

### Frontend (Static Site)

#### Option 1: Vercel
```bash
# Install Vercel CLI
npm i -g vercel

cd frontend
vercel
```

#### Option 2: Netlify
1. Connect GitHub repository
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Set environment variable: `VITE_API_URL`

---

## 🔒 Production Checklist

Before deploying to production:

- [ ] Change JWT_SECRET to a strong random string
- [ ] Use MongoDB Atlas for cloud database
- [ ] Enable CORS for your domain only
- [ ] Set NODE_ENV=production
- [ ] Enable HTTPS
- [ ] Configure rate limiting
- [ ] Set up backup strategy
- [ ] Enable monitoring (PM2, New Relic)
- [ ] Configure CDN for static assets
- [ ] Enable gzip compression
- [ ] Set up error logging (Sentry)
- [ ] Create admin account with strong password
- [ ] Test all features thoroughly

---

## 📝 Environment Variables Reference

### Backend (.env)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/swachhsetu
JWT_SECRET=your_super_secret_jwt_key_min_32_chars
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

---

## 🎓 Learning Resources

- **Express.js**: https://expressjs.com/
- **React**: https://react.dev/
- **MongoDB**: https://www.mongodb.com/docs/
- **Socket.io**: https://socket.io/docs/
- **React Leaflet**: https://react-leaflet.js.org/
- **Recharts**: https://recharts.org/

---

## 🤝 Need Help?

- **Documentation**: See `RBAC_GUIDE.md` and `FEATURE_SUMMARY.md`
- **Issues**: Create an issue on GitHub
- **Discussions**: Join community discussions

---

## 📜 License

MIT License - feel free to use this project for learning and development.

---

Happy Coding! 🎉
