# SwachhSetu - Quick Reference Cheat Sheet 📋

## 🚀 Quick Start (Copy & Paste)

```powershell
# Setup Backend
cd d:\Project\SwachhSetu\backend
npm install
copy .env.example .env
# Edit .env with your MongoDB URI
npm run dev

# Setup Frontend (New Terminal)
cd d:\Project\SwachhSetu\frontend
npm install
copy .env.example .env
npm run dev
```

---

## 📁 Project Structure

```
SwachhSetu/
├── backend/              # Node.js + Express API
│   ├── server.js        # Main entry point
│   ├── config/db.js     # MongoDB connection
│   ├── models/          # Mongoose schemas
│   ├── controllers/     # Business logic
│   ├── middleware/      # Auth & uploads
│   ├── routes/          # API endpoints
│   └── uploads/         # Uploaded images
│
└── frontend/            # React + Vite
    ├── src/
    │   ├── components/  # Reusable UI
    │   ├── pages/       # Route pages
    │   ├── context/     # State management
    │   ├── utils/       # Helper functions
    │   └── styles/      # CSS files
    └── public/          # Static assets
```

---

## 🔑 Key Technologies

| Category | Technology |
|----------|-----------|
| **Backend** | Node.js, Express, MongoDB |
| **Frontend** | React 19, Vite |
| **Auth** | JWT, bcryptjs |
| **Real-time** | Socket.io |
| **Maps** | Leaflet, React-Leaflet |
| **Charts** | Recharts |
| **Animation** | Framer Motion |
| **Notifications** | React-Toastify |

---

## 🛣️ API Endpoints

### Authentication
```
POST   /api/auth/register    # Create account
POST   /api/auth/login       # Login
GET    /api/auth/me          # Get profile (auth)
PUT    /api/auth/profile     # Update profile (auth)
```

### Reports
```
POST   /api/reports                # Create report (auth)
GET    /api/reports                # Get all reports
GET    /api/reports/:id            # Get single report
GET    /api/reports/my-reports     # Get user reports (auth)
POST   /api/reports/:id/upvote     # Upvote (auth)
POST   /api/reports/:id/comment    # Comment (auth)
PUT    /api/reports/:id/status     # Update status (admin)
```

### Dashboard
```
GET    /api/dashboard/stats        # Statistics
GET    /api/dashboard/leaderboard  # Top users
GET    /api/dashboard/activity     # Recent activity
GET    /api/dashboard/heatmap      # Heatmap data
```

---

## 🎨 Component Usage

### Loading Spinner
```jsx
import LoadingSpinner from './components/LoadingSpinner';

<LoadingSpinner size="medium" />
<LoadingSpinner size="large" fullScreen />
```

### Leaderboard
```jsx
import Leaderboard from './components/Leaderboard';

<Leaderboard leaders={data} type="points" />
<Leaderboard leaders={data} type="reports" />
```

### Toast Notifications
```jsx
import { toast } from 'react-toastify';

toast.success('Success message! 🎉');
toast.error('Error message');
toast.info('Info message');
toast.warning('Warning message');
```

---

## 🔐 Authentication Flow

```jsx
import { useAuth } from './context/AuthContext';

function MyComponent() {
  const { user, login, logout, register } = useAuth();
  
  // Register
  await register({ name, email, password });
  
  // Login
  await login(email, password);
  
  // Logout
  logout();
  
  // Check if authenticated
  if (user) {
    // User is logged in
  }
}
```

---

## 📡 Socket.io Events

### Server Emits
```javascript
io.emit('newReport', report);      // New report created
io.emit('reportUpdated', report);   // Report status changed
io.emit('notification', data);      // System notification
```

### Client Listens
```jsx
import { useSocket } from './context/SocketContext';

const { socket } = useSocket();

useEffect(() => {
  socket.on('newReport', (report) => {
    // Handle new report
  });
  
  return () => socket.off('newReport');
}, [socket]);
```

---

## 🎯 Gamification Points

| Action | Points |
|--------|--------|
| Create Report | +10 |
| Report Resolved | +20 |
| Add Comment | +5 |
| Upvote Received | +2 |
| Verify Report | +15 |

---

## 🏆 Achievement Badges

| Badge | Requirement |
|-------|-------------|
| First Reporter | Submit first report |
| Civic Hero | 10 reports submitted |
| Problem Solver | 5 reports resolved |
| Community Leader | 100 points earned |
| Streak Master | 7 day streak |

---

## 🗺️ Map Integration

```jsx
import { MapContainer, TileLayer, Marker } from 'react-leaflet';

<MapContainer center={[lat, lng]} zoom={13}>
  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
  <Marker position={[lat, lng]} />
</MapContainer>
```

---

## 📊 Chart Examples

### Line Chart
```jsx
import { LineChart, Line, XAxis, YAxis } from 'recharts';

<LineChart data={data}>
  <XAxis dataKey="date" />
  <YAxis />
  <Line dataKey="count" stroke="var(--primary)" />
</LineChart>
```

### Pie Chart
```jsx
import { PieChart, Pie, Cell } from 'recharts';

<PieChart>
  <Pie data={data} dataKey="value">
    {data.map((entry, index) => (
      <Cell key={index} fill={COLORS[index]} />
    ))}
  </Pie>
</PieChart>
```

---

## 🎨 CSS Variables

```css
/* Colors */
--primary: #10b981
--secondary: #3b82f6
--danger: #ef4444
--success: #10b981

/* Spacing */
--spacing-sm: 0.5rem
--spacing-md: 1rem
--spacing-lg: 1.5rem
--spacing-xl: 2rem

/* Border Radius */
--radius-md: 0.5rem
--radius-lg: 0.75rem
--radius-full: 9999px

/* Shadows */
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1)
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1)
```

---

## 🌙 Dark Mode

```jsx
// Toggle dark mode
const { toggleDarkMode, user } = useAuth();

<button onClick={toggleDarkMode}>
  {user?.darkMode ? '☀️ Light' : '🌙 Dark'}
</button>
```

---

## 📱 Responsive Breakpoints

```css
/* Mobile */
@media (max-width: 768px) { }

/* Tablet */
@media (min-width: 769px) and (max-width: 1024px) { }

/* Desktop */
@media (min-width: 1025px) { }
```

---

## 🔍 Useful Queries

### Find Reports Near Location
```javascript
const reports = await Report.find({
  location: {
    $near: {
      $geometry: {
        type: 'Point',
        coordinates: [lng, lat]
      },
      $maxDistance: 5000 // 5km
    }
  }
});
```

### Get User Stats
```javascript
const stats = await Gamification.findOne({ userId })
  .populate('userId', 'name avatar');
```

---

## 🐛 Debug Commands

```powershell
# Check if ports are in use
netstat -ano | findstr :5000
netstat -ano | findstr :5173

# View MongoDB logs
mongosh
show dbs
use swachhsetu
db.reports.find().pretty()

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

---

## ⚡ Performance Tips

1. **Lazy Load Routes**
   ```jsx
   const Dashboard = lazy(() => import('./pages/Dashboard'));
   ```

2. **Optimize Images**
   - Use WebP format
   - Compress before upload
   - Implement lazy loading

3. **Use Pagination**
   ```javascript
   const page = 1;
   const limit = 10;
   const reports = await Report.find()
     .limit(limit)
     .skip((page - 1) * limit);
   ```

4. **Cache Frequent Queries**
   - Use Redis for caching
   - Implement query memoization

---

## 🔒 Security Checklist

- [ ] Change JWT_SECRET to random string
- [ ] Use HTTPS in production
- [ ] Validate all inputs
- [ ] Sanitize user data
- [ ] Rate limit API endpoints
- [ ] Enable CORS for specific origins
- [ ] Hash passwords (already done)
- [ ] Use environment variables
- [ ] Implement file upload limits
- [ ] Add request logging

---

## 📦 Build & Deploy

### Build Frontend
```powershell
cd frontend
npm run build
# Output in 'dist' folder
```

### Deploy Backend (Railway)
```powershell
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

### Deploy Frontend (Vercel)
```powershell
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

---

## 🎓 Learning Resources

- React Docs: https://react.dev
- Express Guide: https://expressjs.com/en/guide/routing.html
- MongoDB Manual: https://docs.mongodb.com
- Socket.io Docs: https://socket.io/docs/v4
- Leaflet Tutorial: https://leafletjs.com/examples.html

---

## 📊 Monitoring (Production)

Monitor these metrics:
- API response times
- Error rates
- User registrations
- Reports created per day
- Active users
- Database performance
- Socket connections

Tools:
- **Backend**: PM2, New Relic, Sentry
- **Frontend**: Google Analytics, Vercel Analytics
- **Database**: MongoDB Atlas Monitoring

---

## 🎯 Testing

```javascript
// Unit test example (with Jest)
describe('Report Controller', () => {
  it('should create a new report', async () => {
    const res = await request(app)
      .post('/api/reports')
      .send(mockReportData)
      .expect(201);
    
    expect(res.body.success).toBe(true);
  });
});
```

---

## 🔄 Git Workflow

```powershell
# Create feature branch
git checkout -b feature/new-feature

# Stage and commit changes
git add .
git commit -m "Add new feature"

# Push to remote
git push origin feature/new-feature

# Create Pull Request on GitHub
```

---

## 💡 Pro Tips

1. **Use React DevTools** for debugging
2. **Install MongoDB Compass** for database GUI
3. **Use Thunder Client** for API testing in VS Code
4. **Enable auto-save** in VS Code
5. **Use Prettier** for code formatting
6. **Git commit often** with clear messages
7. **Test on mobile** frequently
8. **Monitor console** for errors
9. **Use .env** for all secrets
10. **Document your code** with comments

---

## 🆘 Quick Fixes

### "Cannot find module"
```powershell
npm install
```

### "Port already in use"
```powershell
# Kill process or change port in .env
```

### "MongoDB connection failed"
```powershell
net start MongoDB
```

### "CORS error"
```javascript
// In backend server.js
app.use(cors({
  origin: process.env.CLIENT_URL
}));
```

### "Build fails"
```powershell
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

---

## 📞 Support

If you need help:
1. Check error messages carefully
2. Review documentation
3. Search Stack Overflow
4. Check GitHub issues
5. Ask in developer communities

---

**Remember**: This is a living document. Update it as you add more features! 📝

Happy Coding! 🚀
