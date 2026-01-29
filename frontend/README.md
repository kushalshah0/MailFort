# MailFort - AI-Powered Email Phishing Detection

A production-ready BERT-based email phishing detection system with Gmail integration.

## Features

- 🛡️ **BERT-Powered Detection** - Advanced machine learning for accurate phishing detection
- 🔐 **Secure OAuth** - Google OAuth 2.0 with server-side token management
- 📧 **Gmail Integration** - Seamless inbox access with read-only permissions
- 🎨 **Modern UI** - Three-pane email client with risk indicators
- ⚡ **Real-Time Analysis** - Instant predictions with confidence scores
- 🎯 **Severity Levels** - High, medium, and low risk classifications

## Tech Stack

### Frontend
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- Framer Motion
- NextAuth.js

### Backend
- FastAPI
- PyTorch
- Transformers (BERT)
- BeautifulSoup4

## Setup

### Prerequisites
- Node.js 18+
- Python 3.9+
- Google Cloud Project with Gmail API enabled

### 1. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Gmail API
4. Create OAuth 2.0 credentials:
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
   - Scopes: `gmail.readonly`, `userinfo.email`, `userinfo.profile`

### 2. Frontend Setup

```bash
cd mailfort-frontend
npm install

# Copy environment variables
cp .env.example .env.local

# Edit .env.local with your Google OAuth credentials
# GOOGLE_CLIENT_ID=your-client-id
# GOOGLE_CLIENT_SECRET=your-client-secret
# NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32

# Run development server
npm run dev
```

Frontend will be available at `http://localhost:3000`

### 3. Backend Setup

```bash
cd mailfort-backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run FastAPI server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend API will be available at `http://localhost:8000`

## Usage

1. **Sign In**: Click "Get Started" and sign in with Google
2. **View Emails**: Browse your inbox in the three-pane layout
3. **Check Risk**: View real-time phishing predictions with confidence scores
4. **Filter**: Use sidebar to filter by All, Phishing, or Safe emails
5. **Refresh**: Click refresh to fetch latest emails

## Security Features

- OAuth tokens stored server-side only
- No client-side exposure of credentials
- Read-only Gmail access
- Secure session management with NextAuth.js
- Environment variable protection

## License

MIT
