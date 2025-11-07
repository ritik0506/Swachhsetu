# SwachhSetu - Enhanced Civic Hygiene Platform 🌱

## Overview
SwachhSetu is a comprehensive citizen-driven hygiene platform that empowers communities to actively participate in maintaining public cleanliness. The platform includes real-time reporting, gamification, analytics, and community engagement features.

## 🚀 New Features Added

### Backend Enhancements
- ✅ Complete Express.js server with MongoDB integration
- ✅ Real-time notifications using Socket.io
- ✅ Gamification system (Points, Badges, Leaderboards, Levels)
- ✅ Advanced report management with geospatial queries
- ✅ JWT-based authentication with role-based access
- ✅ Image upload with Multer
- ✅ Comprehensive API endpoints for all features

### Frontend Enhancements
- ✅ Modern UI with CSS variables and dark mode support
- ✅ Enhanced Dashboard with Recharts (Line, Bar, Pie charts)
- ✅ Interactive map integration with React-Leaflet
- ✅ Multi-step form for report submission
- ✅ Real-time updates via Socket.io
- ✅ Gamification UI (Leaderboard, Badges, Points)
- ✅ Loading states and skeleton loaders
- ✅ Toast notifications for better UX
- ✅ Responsive design for all devices
- ✅ Smooth animations with Framer Motion

### Key Additions
1. **Gamification System**
   - Points for reporting and resolving issues
   - Achievement badges
   - User levels and XP
   - Global and local leaderboards

2. **Analytics Dashboard**
   - Real-time statistics
   - Reports timeline visualization
   - Category and severity breakdown
   - Heatmaps for issue hotspots
   - Resolution rate tracking

3. **Enhanced Report System**
   - Multi-step form wizard
   - Image upload (up to 5 images)
   - Interactive map for location selection
   - Upvote/downvote functionality
   - Comments system

4. **Real-time Features**
   - Live report updates
   - Push notifications
   - Status change alerts

## 📦 Installation

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your API URL
npm run dev
```

## 🗄️ Database Models
- **User**: Authentication, profile, gamification data
- **Report**: Issue reports with geospatial data
- **POI**: Points of Interest (toilets, restaurants, etc.)
- **Gamification**: User achievements and progress
- **Notification**: Real-time alerts and updates

## 🎨 UI/UX Improvements
- Modern color palette with CSS variables
- Dark mode support
- Smooth animations and transitions
- Micro-interactions
- Consistent design system
- Mobile-first responsive design
- Accessibility improvements

## 🔐 Authentication
- JWT-based authentication
- Protected routes
- Role-based access control (User, Admin, Moderator)
- Password hashing with bcrypt

## 🗺️ Map Features
- Interactive map using Leaflet
- Click to set report location
- Geospatial queries for nearby reports
- Heatmap visualization

## 📊 Analytics
- Total reports and resolution metrics
- Time-series data visualization
- Category distribution
- Average resolution time
- User engagement metrics

## 🏆 Gamification
- Points system for actions
- Achievement badges
- Level progression
- Leaderboards (Global, Local, Category-wise)
- Daily streaks

## 🔔 Notifications
- Real-time Socket.io notifications
- Toast notifications
- Report status updates
- Achievement unlocks
- Level-up celebrations

## 📱 Responsive Design
- Mobile-optimized
- Tablet-friendly
- Desktop-enhanced
- Touch-friendly interactions

## 🚧 Future Enhancements
- [ ] AI-powered image analysis for cleanliness scoring
- [ ] PWA capabilities (offline support, installable)
- [ ] Community forum
- [ ] Volunteer event management
- [ ] Social media sharing
- [ ] Email notifications
- [ ] Advanced filtering and search
- [ ] Waste collection route optimization
- [ ] Multi-language support
- [ ] Admin panel for moderation

## 🛠️ Technologies Used

### Backend
- Node.js & Express.js
- MongoDB & Mongoose
- Socket.io
- JWT Authentication
- Multer (File uploads)
- Bcrypt.js

### Frontend
- React 19
- React Router DOM
- Axios
- Socket.io Client
- React-Leaflet (Maps)
- Recharts (Charts)
- Framer Motion (Animations)
- React-Toastify (Notifications)
- Lucide React (Icons)

## 📝 API Endpoints

### Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login user
- GET `/api/auth/me` - Get current user
- PUT `/api/auth/profile` - Update profile

### Reports
- POST `/api/reports` - Create report
- GET `/api/reports` - Get all reports
- GET `/api/reports/:id` - Get single report
- GET `/api/reports/my-reports` - Get user's reports
- POST `/api/reports/:id/upvote` - Upvote report
- POST `/api/reports/:id/comment` - Add comment
- PUT `/api/reports/:id/status` - Update status (Admin)

### Dashboard
- GET `/api/dashboard/stats` - Get statistics
- GET `/api/dashboard/leaderboard` - Get leaderboard
- GET `/api/dashboard/activity` - Get recent activity
- GET `/api/dashboard/heatmap` - Get heatmap data

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License
MIT License

## 👨‍💻 Author
SwachhSetu Team

---
Made with ❤️ for cleaner cities
