# SwachhSetu - Enhanced Civic Hygiene Platform 🌱

## Overview
SwachhSetu is a comprehensive citizen-driven hygiene platform that empowers communities to actively participate in maintaining public cleanliness. The platform includes real-time reporting, gamification, analytics, and community engagement features.

## 🚀 New Features Added

### AI-Powered Features ✨
- ✅ **Voice Input with Speech Recognition** - Record complaints in 10+ Indian languages with real-time transcription
- ✅ **Linguistic Analysis Service** - AI-powered translation, sentiment analysis, and urgency detection using Llama3:8b
- ✅ **Smart Image Upload** - Forensic spam detection and automatic categorization using LLaVA vision model
- ✅ **Location Verification** - GPS auto-detection with reverse geocoding
- ✅ **AI Chatbot** - Conversational guided reporting with Llama3

### Backend Enhancements
- ✅ Complete Express.js server with MongoDB integration
- ✅ Real-time notifications using Socket.io
- ✅ **Ollama Integration** - Local AI model hosting (Llama3:8b, LLaVA)
- ✅ **Linguistic Analyst Service** - Multilingual transcript analysis with translation, sentiment, urgency detection
- ✅ **Forensic Spam Detector** - AI-powered image verification and spam detection
- ✅ Gamification system (Points, Badges, Leaderboards, Levels)
- ✅ Advanced report management with geospatial queries
- ✅ JWT-based authentication with role-based access
- ✅ Image upload with Multer
- ✅ Comprehensive API endpoints for all features

### Frontend Enhancements
- ✅ Modern UI with CSS variables and dark mode support
- ✅ **Voice Input Component** - Real-time speech-to-text with Web Speech API
- ✅ **Smart Image Upload Component** - AI-powered image analysis and spam detection
- ✅ **Location Verifier Component** - GPS detection with OpenStreetMap reverse geocoding
- ✅ **CreateReport Page** - Complete AI-powered report creation with relay race state management
- ✅ Enhanced Dashboard with Recharts (Line, Bar, Pie charts)
- ✅ Interactive map integration with React-Leaflet
- ✅ Multi-step form for report submission
- ✅ Real-time updates via Socket.io
- ✅ Gamification UI (Leaderboard, Badges, Points)
- ✅ Loading states and skeleton loaders
- ✅ Toast notifications for better UX
- ✅ Responsive design for all devices
- ✅ Smooth animations with Framer Motion
- ✅ **PWA Support** - Offline capabilities with service worker

### Key Additions

1. **🎤 Voice Input with AI Analysis** (NEW!)
   - Real-time speech-to-text using Web Speech API
   - Supports 10+ Indian languages (Hindi, Marathi, Tamil, Telugu, Kannada, etc.)
   - Automatic language detection
   - AI-powered translation to English using Llama3:8b
   - Sentiment analysis (Neutral/Frustrated/Angry/Urgent)
   - Urgency rating (High/Medium/Low)
   - Location extraction from speech
   - Retry logic for network errors
   - Browser compatibility checks
   - **How to use:**
     - Click the purple microphone button 🎤 next to description field
     - Grant microphone permission
     - Speak your complaint in any language
     - AI automatically translates and analyzes

2. **🖼️ Smart Image Upload with Forensic Analysis** (NEW!)
   - AI-powered spam detection using LLaVA vision model
   - Automatic category detection from images
   - Image authenticity verification
   - Description generation from images
   - Severity assessment
   - Confidence scoring
   - Multiple image support

3. **📍 Location Verification** (NEW!)
   - GPS auto-detection
   - Reverse geocoding via OpenStreetMap Nominatim
   - Manual address entry fallback
   - Landmark support
   - Accuracy tracking

4. **Gamification System**
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

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (running locally or cloud)
- **Ollama** (for AI features) - [Install from ollama.ai](https://ollama.ai)

### Ollama Setup (Required for AI Features)
```bash
# Install Ollama from https://ollama.ai
# Then pull required models:
ollama pull llama3:8b
ollama pull llava:13b

# Start Ollama service:
ollama serve
```

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

### Quick Start (All Services)
Use the automated setup script:
```powershell
# Windows PowerShell
cd D:\Project\SwachhSetu
.\start-voice-testing.ps1
```

This will:
- ✅ Check if Ollama is running
- ✅ Check if MongoDB is running
- ✅ Start backend server (port 5000)
- ✅ Start frontend dev server (port 5173)
- ✅ Test voice input API
- ✅ Open browser automatically

## 🗄️ Database Models
- **User**: Authentication, profile, gamification data
- **Report**: Issue reports with geospatial data, AI analysis metadata
- **POI**: Points of Interest (toilets, restaurants, etc.)
- **Gamification**: User achievements and progress
- **Notification**: Real-time alerts and updates

## 🤖 AI Services

### 1. Linguistic Analyst Service
**Purpose:** Analyze multilingual voice transcripts

**Model:** Llama3:8b (via Ollama)

**Features:**
- Multilingual support (Hindi, Marathi, Tamil, Telugu, Kannada, Malayalam, Bengali, Gujarati, Punjabi, English)
- English translation
- Professional complaint summarization
- Language detection
- Location extraction from speech
- Sentiment analysis (Neutral/Frustrated/Angry/Urgent)
- Urgency rating (High/Medium/Low)
- Confidence scoring

**API Endpoint:**
```
POST /api/ai/linguistic/analyze
Body: { transcript: "string" }
```

**Example Response:**
```json
{
  "success": true,
  "english_translation": "There is a big pothole on MG Road",
  "summarized_complaint": "Large pothole on MG Road requiring repair",
  "detected_language": "Hindi",
  "extracted_location": "MG Road",
  "sentiment_tone": "Frustrated",
  "urgency_rating": "Medium",
  "confidence": 0.85,
  "processing_time_ms": 25000
}
```

### 2. Forensic Spam Detector Service
**Purpose:** Verify image authenticity and detect spam

**Model:** LLaVA:13b (via Ollama)

**Features:**
- Image spam detection
- Category detection (Garbage, Pothole, Sewage, etc.)
- Severity assessment
- Description generation
- Authenticity verification
- Confidence scoring

**API Endpoint:**
```
POST /api/ai/forensic/analyze
Body: { image: "base64_string" }
```

### 3. AI Chatbot Service
**Purpose:** Guided conversational reporting

**Model:** Llama3:8b (via Ollama)

**Features:**
- Conversational interface
- Context-aware responses
- Report data extraction
- Category suggestion
- Follow-up questions

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
- [x] **AI-powered voice input with speech recognition**
- [x] **AI-powered image analysis for spam detection**
- [x] **PWA capabilities (offline support, installable)**
- [x] **AI Chatbot for guided reporting**
- [ ] OCR Service for License Plates (Tesseract.js)
- [ ] Sentiment Analysis Service (enhanced)
- [ ] Report Summarization
- [ ] Duplicate Detection (geospatial + image similarity)
- [ ] Caching Layer with Redis
- [ ] Community forum
- [ ] Volunteer event management
- [ ] Social media sharing
- [ ] Email notifications
- [ ] Advanced filtering and search
- [ ] Waste collection route optimization
- [ ] Multi-language UI support
- [ ] Admin panel for moderation

## 🛠️ Technologies Used

### Backend
- Node.js & Express.js
- MongoDB & Mongoose
- Socket.io
- **Ollama** - Local AI model hosting
- **Llama3:8b** - Linguistic analysis & chatbot
- **LLaVA:13b** - Vision model for image analysis
- JWT Authentication
- Multer (File uploads)
- Bcrypt.js
- Axios (API calls to Ollama)

### Frontend
- React 19
- React Router DOM
- Axios
- Socket.io Client
- **Web Speech API** - Browser-native speech recognition
- React-Leaflet (Maps)
- Recharts (Charts)
- Framer Motion (Animations)
- React-Toastify (Notifications)
- Lucide React (Icons)
- **Service Worker** - PWA offline support

### AI/ML
- **Ollama** - Open-source local AI platform
- **Llama3:8b** - Meta's language model for text analysis
- **LLaVA:13b** - Large Language and Vision Assistant
- **Web Speech API** - Real-time speech recognition

## 📝 API Endpoints

### AI Endpoints (NEW!)
- POST `/api/ai/linguistic/analyze` - Analyze voice transcript (multilingual)
- POST `/api/ai/forensic/analyze` - Verify image and detect spam
- POST `/api/ai/chatbot` - Conversational AI assistant

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

## 📚 Documentation

### Voice Input Feature
- **VOICE_INPUT_TESTING_GUIDE.md** - Complete testing guide with 7 test cases
- **VOICE_INPUT_OPTIMIZATION_SUMMARY.md** - Technical implementation details

### Quick Start
- **start-voice-testing.ps1** - Automated setup script for Windows

### Testing Voice Input
1. Navigate to `/report-issue` or `/create-report`
2. Click the purple microphone button 🎤
3. Grant microphone permission (first time)
4. Click "Start Recording"
5. Speak clearly in any language: "There is a big pothole on Market Road"
6. Click "Stop Recording"
7. Wait 20-30 seconds for AI processing
8. Description field auto-fills with translated, analyzed text!

**Supported Browsers:**
- ✅ Chrome (Desktop & Mobile) - Full support
- ✅ Edge - Full support
- ✅ Safari - Basic support
- ⚠️ Firefox - Limited support

**Supported Languages:**
- Hindi, Marathi, Tamil, Telugu, Kannada
- Malayalam, Bengali, Gujarati, Punjabi
- English (Indian accent optimized)

## 🐛 Troubleshooting

### Voice Input Issues

**"Speech recognition not supported"**
- Use Chrome, Edge, or Safari
- Update browser to latest version

**"Microphone access denied"**
- Click lock icon in address bar
- Set Microphone to "Allow"
- Refresh page

**"No speech detected"**
- Check microphone is working
- Speak louder and clearer
- Reduce background noise
- Test microphone in system settings

**"Failed to process audio"**
- Ensure backend is running (`npm start` in backend folder)
- Ensure Ollama is running (`ollama serve`)
- Check Llama3 model is installed (`ollama list`)
- Wait 30 seconds for first request (model loading)

**API 404 Error**
- Refresh browser (F5)
- Clear browser cache
- Check backend logs for errors

### Backend Issues

**"Cannot connect to Ollama service"**
```bash
# Install Ollama from https://ollama.ai
ollama serve
ollama pull llama3:8b
```

**"Port 5000 already in use"**
```powershell
# Find and kill process
netstat -ano | findstr :5000
taskkill /PID <process_id> /F
```

## 📄 License
MIT License

## 👨‍💻 Author
SwachhSetu Team

---
Made with ❤️ for cleaner cities
