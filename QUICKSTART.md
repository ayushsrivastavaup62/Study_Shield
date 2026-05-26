# Quick Start Guide - StudyShield

## 🚀 Get Started in 5 Minutes

### Step 1: Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### Step 2: Configure Environment Variables

1. Copy `backend/.env.example` to `backend/.env`
2. Fill in the required API keys:
   - `MONGODB_URI` - Your MongoDB connection string
   - `JWT_SECRET` - Generate a random secret key
   - `GEMINI_API_KEY` - Get from [Google AI Studio](https://makersuite.google.com/)
   - `YOUTUBE_API_KEY` - Get from [Google Cloud Console](https://console.cloud.google.com/)

### Step 3: Start MongoDB

```bash
# Local MongoDB
mongod

# Or use MongoDB Atlas (update MONGODB_URI in .env)
```

### Step 4: Run the Application

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start
```

### Step 5: Access the App

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 📝 Getting API Keys

### YouTube Data API
1. Go to https://console.cloud.google.com/
2. Create project → Enable YouTube Data API v3
3. Create credentials → API Key
4. Copy to `.env`

### Gemini AI API
1. Go to https://makersuite.google.com/
2. Click "Get API Key"
3. Copy to `.env`

### MongoDB Atlas (Cloud)
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free cluster
3. Get connection string
4. Copy to `.env`

## 🎯 First Time Use

1. Open http://localhost:3000
2. Click "Time To Study"
3. Search for educational content (e.g., "React tutorial")
4. Select a video
5. AI will classify it automatically
6. Use the Pomodoro timer for focused study

## ❓ Troubleshooting

**MongoDB Connection Error**
- Ensure MongoDB is running
- Check connection string in `.env`

**API Key Errors**
- Verify API keys are correct
- Check API quotas and limits

**Frontend Not Loading**
- Ensure backend is running on port 5000
- Check `REACT_APP_API_URL` in frontend `.env`

## 📚 Need More Details?

See the full [README.md](README.md) for comprehensive documentation.
