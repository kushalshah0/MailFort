# MailFort Quick Reference

## 🚀 Quick Start Commands

### First Time Setup
```bash
# 1. Backend Setup
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# 2. Frontend Setup
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with your Google OAuth credentials
```

### Daily Development
```bash
# Terminal 1 - Backend
cd backend
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 - Frontend
cd frontend
npm run dev
```

---

## 📋 Environment Variables

### Frontend (.env.local)
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Generate Secret
```bash
openssl rand -base64 32
```

---

## 🔗 Important URLs

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | Next.js app |
| Backend API | http://localhost:8000 | FastAPI server |
| API Docs | http://localhost:8000/docs | Swagger UI |
| API ReDoc | http://localhost:8000/redoc | Alternative docs |
| Health Check | http://localhost:8000/health | Backend health |

---

## 📡 API Endpoints

### Frontend API Routes
```
GET  /api/emails?maxResults=50          # Fetch emails from Gmail
GET  /api/analyze?maxResults=50         # Fetch and analyze emails
POST /api/auth/[...nextauth]            # OAuth handling
```

### Backend API Routes
```
POST /analyze-email                     # Analyze single email
GET  /health                            # Health check
GET  /                                  # Service info
```

---

## 🧪 Testing

### Test Backend Health
```bash
curl http://localhost:8000/health
```

### Test Email Analysis (after backend is running)
```bash
curl -X POST http://localhost:8000/analyze-email \
  -H "Content-Type: application/json" \
  -d '{
    "message_id": "test123",
    "subject": "Verify your account",
    "from_": "noreply@suspicious.com",
    "body": "Click here to verify your account immediately!"
  }'
```

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Find and kill process on port 8000
lsof -ti:8000 | xargs kill -9
```

### Clear Next.js Cache
```bash
cd frontend
rm -rf .next
npm run dev
```

### Reinstall Dependencies
```bash
# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install

# Backend
cd backend
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Check Logs
```bash
# Backend logs are in the terminal where uvicorn is running
# Frontend logs are in the terminal where npm run dev is running
# Browser console (F12) for client-side errors
```

---

## 📂 Project Structure Overview

```
MailFort/
├── frontend/          # Next.js Frontend
│   ├── app/
│   │   ├── api/               # API routes (auth, emails, analyze)
│   │   ├── dashboard/         # Main dashboard page
│   │   └── auth/signin/       # Sign-in page
│   ├── components/
│   │   ├── dashboard/         # Dashboard components
│   │   └── ui/                # shadcn/ui components
│   └── lib/                   # Utilities & helpers
│
├── backend/          # FastAPI Backend
│   ├── main.py               # BERT inference server
│   └── requirements.txt      # Python dependencies
│
├── README.md                 # Main documentation
├── GETTING_STARTED.md        # Setup guide
├── PROJECT_SUMMARY.md        # Completion report
└── QUICK_REFERENCE.md        # This file
```

---

## 🎯 Common Tasks

### Add New UI Component
```bash
cd frontend
npx shadcn@latest add <component-name>
```

### Update Dependencies
```bash
# Frontend
cd frontend
npm update

# Backend
cd backend
source venv/bin/activate
pip list --outdated
pip install --upgrade <package-name>
```

### Run Verification Script
```bash
./verify-setup.sh
```

---

## 🔑 Key Files to Edit

### Customize Landing Page
`frontend/app/page.tsx`

### Modify Dashboard Layout
`frontend/app/dashboard/page.tsx`

### Adjust BERT Model
`backend/main.py` - Lines 61-85 (load_model function)

### Change Severity Thresholds
`backend/main.py` - Lines 89-97 (calculate_severity function)

### Update Email Preprocessing
`backend/main.py` - Lines 54-87 (preprocess_email function)

---

## 💡 Tips & Best Practices

### Development
- ✅ Keep both terminals running during development
- ✅ Check browser console for frontend errors
- ✅ Check terminal for backend errors
- ✅ Use the verification script to check setup
- ✅ Clear cache if you see stale data

### Security
- 🔒 Never commit .env.local to git
- 🔒 Use environment variables for all secrets
- 🔒 Keep OAuth credentials secure
- 🔒 Test with your own Gmail account first

### Performance
- ⚡ BERT model loads at startup (can take 10-30 seconds)
- ⚡ First email analysis may be slower
- ⚡ Subsequent analyses are faster due to model caching
- ⚡ Limit maxResults parameter for faster loading

---

## 📞 Need Help?

1. **Setup Issues**: See [GETTING_STARTED.md](./GETTING_STARTED.md)
2. **Project Overview**: See [README.md](./README.md)
3. **Technical Details**: See [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)
4. **API Documentation**: Visit http://localhost:8000/docs
5. **Run Verification**: Execute `./verify-setup.sh`

---

## 🎨 UI Components Used

- **Button** - Action buttons
- **Card** - Content containers
- **Badge** - Status indicators
- **Avatar** - User profile images
- **ScrollArea** - Scrollable regions
- **Separator** - Visual dividers
- **Skeleton** - Loading placeholders

All components from shadcn/ui with Tailwind CSS styling.

---

**Last Updated**: January 29, 2026  
**Version**: 1.0.0  
**Status**: Production Ready ✅
