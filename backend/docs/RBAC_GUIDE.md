# SwachhSetu - Role-Based Access Control (RBAC) Guide

## 🔐 User Roles

SwachhSetu implements a three-tier role system:

### 1. **User** (Default Role)
- **Access Level**: Basic
- **Capabilities**:
  - Report civic hygiene issues with images and location
  - View their own dashboard with submitted reports
  - Track report status (Pending, In Progress, Resolved)
  - Earn points and badges through gamification
  - View leaderboards and analytics
  - Access public features (Toilet Finder, Waste Schedule, etc.)

### 2. **Moderator**
- **Access Level**: Intermediate
- **Capabilities**: All User capabilities +
  - Access Admin Panel
  - View all reports from all users
  - Update report status (Pending → In Progress → Resolved)
  - Filter and search reports by status, category, severity
  - Perform bulk operations on reports
  - View admin statistics and analytics

### 3. **Admin**
- **Access Level**: Full
- **Capabilities**: All Moderator capabilities +
  - Delete reports permanently
  - Manage user accounts
  - Assign/change user roles (User ↔ Moderator ↔ Admin)
  - View comprehensive admin dashboard
  - Access system-wide statistics

---

## 🎯 Admin Panel Features

### Overview Tab
- **Quick Statistics**:
  - Pending Reports count
  - In Progress Reports count
  - Resolved Reports count
  - Active Users / Total Users

- **Critical Reports Section**:
  - Lists high-priority unresolved issues
  - Quick status update dropdown
  - Reporter information

- **Top Contributors**:
  - Monthly leaderboard of most active reporters
  - Shows report count and points earned

### Manage Reports Tab
- **Advanced Filtering**:
  - Search by title, description, location
  - Filter by status: Pending, In Progress, Resolved, Rejected
  - Filter by severity: Low, Medium, High, Critical

- **Bulk Operations**:
  - Select multiple reports with checkboxes
  - Bulk status updates (Mark In Progress, Mark Resolved)
  - Clear selection

- **Individual Actions**:
  - Update report status via dropdown
  - Delete report (Admin only)
  - View full report details

### Manage Users Tab (Admin Only)
- **User Management Table**:
  - View all registered users
  - See gamification stats (Level, Points, Reports)
  - Change user roles with dropdown
  - View user profiles
  - Sort and filter users

---

## 🚀 Getting Started

### Create Admin Account

**Option 1: Using Seeding Script (Recommended)**
```bash
cd backend
node scripts/createAdmin.js
```

This creates:
- **Admin**: admin@swachhsetu.com / admin123
- **Moderator**: moderator@swachhsetu.com / moderator123

**Option 2: Manual Database Update**
```javascript
// Connect to MongoDB
use swachhsetu

// Update existing user to admin
db.users.updateOne(
  { email: "user@example.com" },
  { $set: { role: "admin" } }
)
```

**Option 3: Register via API (for development)**
```bash
# Register new user
POST http://localhost:5000/api/auth/register
{
  "name": "Admin Name",
  "email": "admin@example.com",
  "password": "secure123"
}

# Manually update role in database
```

---

## 🔒 Protected Routes

### Backend Routes
```javascript
// Public Routes
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me

// Protected Routes (Requires Authentication)
GET    /api/reports
POST   /api/reports
GET    /api/dashboard/stats

// Admin/Moderator Routes
GET    /api/admin/reports          // All reports
PUT    /api/admin/reports/:id      // Update report
DELETE /api/admin/reports/:id      // Delete (admin only)
GET    /api/admin/users            // All users (admin only)
PUT    /api/admin/users/:id/role   // Update role (admin only)
GET    /api/admin/statistics       // Admin stats
PUT    /api/admin/reports/bulk     // Bulk update
```

### Frontend Routes
```javascript
// Public Routes
/
/login
/register
/toilets
/waste-report
/restaurant
/garbage
/health-guide

// Protected Routes (Requires Login)
/report-issue
/dashboard
/analytics

// Admin/Moderator Routes
/admin (Requires admin or moderator role)
```

---

## 🛡️ Middleware & Authorization

### Authentication Middleware (`authMiddleware.js`)
```javascript
// Verifies JWT token
exports.protect = async (req, res, next) => {
  // Extracts token from Authorization header
  // Verifies token validity
  // Attaches user to request object
}

// Checks user role
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    next();
  };
};
```

### Frontend Protected Route Component
```javascript
<ProtectedRoute allowedRoles={['admin', 'moderator']}>
  <AdminDashboard />
</ProtectedRoute>
```

---

## 📊 API Response Format

### Success Response
```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error (development only)"
}
```

---

## 🎮 User Flows

### Regular User Flow
1. Register → Login
2. Submit civic hygiene report with photos
3. Track report status on dashboard
4. Earn points (10 pts per report)
5. Level up and earn badges
6. View leaderboard position

### Admin/Moderator Flow
1. Login with elevated credentials
2. Access Admin Panel from navbar
3. View overview statistics
4. Manage pending reports
5. Update report statuses
6. Assign tasks (coming soon)
7. Monitor user activity

---

## 🔐 Security Features

1. **Password Hashing**: bcryptjs with salt rounds
2. **JWT Authentication**: Secure token-based auth
3. **Role-Based Authorization**: Middleware checks
4. **Protected API Endpoints**: Token validation
5. **Frontend Route Guards**: Role verification
6. **Environment Variables**: Sensitive data protection

---

## 🧪 Testing Accounts

After running the seed script:

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| Admin | admin@swachhsetu.com | admin123 | Full access |
| Moderator | moderator@swachhsetu.com | moderator123 | Report management |
| User | (register new) | (your password) | Basic access |

---

## 📱 Mobile Responsive

The Admin Dashboard is fully responsive:
- Desktop: Full table view with all columns
- Tablet: Optimized layout with scrollable tables
- Mobile: Stacked cards with essential info

---

## 🚧 Future Enhancements

- [ ] Task Assignment System (assign reports to specific moderators)
- [ ] Activity Logs (track all admin actions)
- [ ] Advanced Analytics (charts for report trends)
- [ ] Email Notifications (status updates to users)
- [ ] Report Comments (communication thread)
- [ ] File Management (view uploaded images in admin panel)
- [ ] Export Reports (CSV/PDF export)
- [ ] User Ban/Suspend functionality

---

## 📝 Notes

- Default role for new registrations: **user**
- Only admins can delete reports
- Only admins can manage user roles
- Moderators and admins can update report status
- JWT tokens expire after 30 days
- Use environment variables for sensitive data

---

## 🆘 Troubleshooting

### "Access Denied" Error
- Ensure you're logged in
- Check user role in MongoDB
- Verify JWT token is being sent

### Admin Panel Not Showing
- Confirm user role is 'admin' or 'moderator'
- Clear browser cache
- Check console for errors

### API 403 Forbidden
- Token might be expired → Re-login
- Insufficient permissions → Check role
- Middleware not applied → Check routes

---

For more information, see:
- [API Documentation](./API_DOCS.md)
- [Installation Guide](./INSTALL.md)
- [Contributing Guidelines](./CONTRIBUTING.md)
