# MailFort - AI-Powered Email Phishing Detection System

A production-ready, BERT-based AI email phishing detection system with a modern three-pane Gmail-integrated interface.

## 🎯 Project Overview

**MailFort** is a full-stack web application that helps users identify phishing emails using state-of-the-art BERT machine learning technology. It integrates seamlessly with Gmail to analyze emails in real-time and display comprehensive risk assessments.

## ✨ Key Features

- 🤖 **BERT AI Model** - Advanced transformer-based neural network for phishing detection
- 🔐 **Secure Google OAuth** - Server-side authentication with Gmail API integration
- 📊 **Risk Assessment** - Confidence scores, severity levels (high/medium/low), and detailed predictions
- 🎨 **Modern UI** - Beautiful three-pane email client interface with Tailwind CSS and shadcn/ui
- ⚡ **Real-Time Analysis** - Instant email scanning before display
- 🛡️ **Security-First** - OAuth tokens never exposed to client, read-only Gmail access

## 🏗️ Architecture

```
┌─────────────┐     Google OAuth      ┌──────────────────┐
│    User     │ ◄──────────────────► │   Next.js BFF    │
└─────────────┘                       │  (Server-side)   │
                                      └──────────────────┘
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    │                         │                         │
                    ▼                         ▼                         ▼
            ┌──────────────┐        ┌──────────────┐         ┌──────────────┐
            │  Gmail API   │        │   FastAPI    │         │  Dashboard   │
            │  (Read-Only) │        │ BERT Engine  │         │     UI       │
            └──────────────┘        └──────────────┘         └──────────────┘
```

## 📁 Project Structure

```
MailFort/
├── frontend/          # Next.js Frontend
│   ├── app/
│   │   ├── api/               # API routes
│   │   │   ├── auth/          # NextAuth OAuth
│   │   │   ├── emails/        # Gmail integration
│   │   │   └── analyze/       # BERT analysis endpoint
│   │   ├── dashboard/         # Main dashboard
│   │   └── auth/signin/       # Sign-in page
│   ├── components/
│   │   ├── dashboard/         # Dashboard components
│   │   └── ui/                # shadcn/ui components
│   └── lib/                   # Utilities
│
├── backend/          # FastAPI Backend
│   ├── main.py               # BERT inference server
│   └── requirements.txt      # Python dependencies
│
└── README.md                 # This file
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.9+
- **Google Cloud** account with Gmail API enabled

### 1. Clone Repository

```bash
git clone <repository-url>
cd MailFort
```

### 2. Google Cloud Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable **Gmail API**
4. Create **OAuth 2.0 credentials**:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
   - Add scopes: `gmail.readonly`, `openid`, `email`, `profile`
5. Download credentials (Client ID & Client Secret)

### 3. Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend runs at: `http://localhost:8000`

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local

# Edit .env.local and add:
# NEXTAUTH_URL=http://localhost:3000
# NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
# GOOGLE_CLIENT_ID=<your-google-client-id>
# GOOGLE_CLIENT_SECRET=<your-google-client-secret>
# NEXT_PUBLIC_API_URL=http://localhost:8000

# Start development server
npm run dev
```

Frontend runs at: `http://localhost:3000`

### 5. Access Application

1. Open `http://localhost:3000`
2. Click "Get Started"
3. Sign in with Google
4. Grant Gmail read permissions
5. View your analyzed emails in the dashboard!

## 🎨 User Interface

### Landing Page
- Hero section with feature highlights
- Call-to-action for Google sign-in

### Dashboard (Three-Pane Layout)
1. **Left Sidebar**: Navigation and filters
   - Inbox (all emails)
   - Phishing Detected
   - Safe Emails

2. **Middle Pane**: Email list
   - Sender information
   - Subject and snippet
   - Risk badges (Safe/Risk)
   - Confidence meters

3. **Right Pane**: Email viewer
   - BERT verdict card with confidence bar
   - Severity indicator (High/Medium/Low)
   - Full email content
   - Sender/recipient details

## 🔧 Technology Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **Next.js 14** | React framework with App Router |
| **TypeScript** | Type-safe development |
| **Tailwind CSS** | Utility-first styling |
| **shadcn/ui** | High-quality UI components |
| **Framer Motion** | Smooth animations |
| **NextAuth.js** | Authentication with OAuth |
| **Lucide React** | Icon library |

### Backend
| Technology | Purpose |
|------------|---------|
| **FastAPI** | High-performance Python API |
| **PyTorch** | Deep learning framework |
| **Transformers** | Hugging Face BERT models |
| **BeautifulSoup4** | HTML parsing |
| **Uvicorn** | ASGI server |

## 📡 API Endpoints

### Frontend API Routes (Next.js)

#### `GET /api/emails?maxResults=50`
Fetch emails from Gmail (authenticated)

**Response:**
```json
{
  "emails": [
    {
      "id": "string",
      "from": "string",
      "subject": "string",
      "body": "string",
      "snippet": "string",
      "date": "string"
    }
  ]
}
```

#### `GET /api/analyze?maxResults=50`
Fetch and analyze emails with BERT

**Response:**
```json
{
  "emails": [
    {
      "id": "string",
      "from": "string",
      "subject": "string",
      "body": "string",
      "prediction": {
        "label": "phishing | legitimate",
        "confidence": 0.95,
        "severity": "high | medium | low",
        "phishing_type": null
      }
    }
  ]
}
```

### Backend API Routes (FastAPI)

#### `POST /analyze-email`
Analyze single email for phishing

**Request:**
```json
{
  "message_id": "string",
  "subject": "string",
  "from_": "string",
  "body": "string"
}
```

**Response:**
```json
{
  "label": "phishing",
  "confidence": 0.95,
  "severity": "high",
  "phishing_type": null
}
```

#### `GET /health`
Health check endpoint

**Response:**
```json
{
  "status": "healthy",
  "model_loaded": true,
  "device": "cpu"
}
```

## 🔒 Security Features

- ✅ **Server-side OAuth** - Access tokens never exposed to client
- ✅ **Read-only Gmail access** - No modification permissions
- ✅ **Environment variables** - Sensitive data protected
- ✅ **NextAuth session management** - Secure JWT tokens
- ✅ **CORS protection** - Restricted API access
- ✅ **Middleware authentication** - Protected routes

## 🧠 BERT Model Pipeline

1. **Preprocessing**:
   - Strip HTML tags
   - Remove email signatures
   - Normalize whitespace
   - Concatenate subject + body

2. **Tokenization**:
   - BERT tokenizer with max length 512
   - Padding and truncation

3. **Inference**:
   - Forward pass through BERT model
   - Softmax probability calculation

4. **Post-processing**:
   - Label determination (phishing/legitimate)
   - Confidence score (0.0 - 1.0)
   - Severity classification:
     - **High**: confidence ≥ 0.90
     - **Medium**: confidence ≥ 0.70
     - **Low**: confidence < 0.70

## 🎯 Development Roadmap

- [x] Phase 1: Project setup
- [x] Phase 2: Google OAuth authentication
- [x] Phase 3: Gmail API integration
- [x] Phase 4: BERT model integration
- [x] Phase 5: Three-pane UI implementation
- [x] Phase 6: Polishing and optimization

## 📝 License

MIT License - See LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## 📧 Support

For questions or issues, please open a GitHub issue.

---

**Built with ❤️ using Next.js, FastAPI, and BERT**
