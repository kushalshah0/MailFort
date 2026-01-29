# Getting Started with MailFort

This guide will help you set up and run MailFort on your local machine.

## Prerequisites Checklist

- [ ] Node.js 18 or higher installed
- [ ] Python 3.9 or higher installed
- [ ] Google Cloud account created
- [ ] Git installed

## Step-by-Step Setup

### Step 1: Google Cloud Configuration (15 minutes)

#### 1.1 Create Google Cloud Project
1. Visit [Google Cloud Console](https://console.cloud.google.com)
2. Click "Select a Project" → "New Project"
3. Name it "MailFort" and click "Create"
4. Wait for project creation

#### 1.2 Enable Gmail API
1. In the project dashboard, go to "APIs & Services" → "Library"
2. Search for "Gmail API"
3. Click "Enable"

#### 1.3 Configure OAuth Consent Screen
1. Go to "APIs & Services" → "OAuth consent screen"
2. Select "External" and click "Create"
3. Fill in:
   - App name: `MailFort`
   - User support email: Your email
   - Developer contact: Your email
4. Click "Save and Continue"
5. Add scopes:
   - Click "Add or Remove Scopes"
   - Select: `userinfo.email`, `userinfo.profile`, `gmail.readonly`
   - Click "Update" then "Save and Continue"
6. Add test users (your Gmail account)
7. Click "Save and Continue"

#### 1.4 Create OAuth Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Application type: "Web application"
4. Name: `MailFort Web Client`
5. Authorized redirect URIs:
   - Add: `http://localhost:3000/api/auth/callback/google`
6. Click "Create"
7. **SAVE YOUR CLIENT ID AND CLIENT SECRET** - You'll need these!

---

### Step 2: Backend Setup (5 minutes)

```bash
# Navigate to backend directory
cd backend

# Create Python virtual environment
python3 -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Start the FastAPI server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
INFO:     Loading BERT model...
INFO:     Using device: cpu
INFO:     BERT model loaded successfully!
```

**Leave this terminal running** and open a new terminal for the frontend.

---

### Step 3: Frontend Setup (5 minutes)

```bash
# Navigate to frontend directory (in a NEW terminal)
cd frontend

# Install Node.js dependencies
npm install

# Create environment file
cp .env.example .env.local

# Generate a secret key
openssl rand -base64 32
# Copy the output

# Edit .env.local with your favorite editor
nano .env.local
# or
code .env.local
```

Update `.env.local` with your values:
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<paste-the-generated-secret-here>
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
NEXT_PUBLIC_API_URL=http://localhost:8000
```

```bash
# Start the Next.js development server
npm run dev
```

You should see:
```
  ▲ Next.js 14.x.x
  - Local:        http://localhost:3000
  - Ready in XXXXms
```

---

### Step 4: Test the Application (2 minutes)

1. Open your browser to `http://localhost:3000`
2. You should see the MailFort landing page
3. Click "Get Started"
4. Sign in with your Google account
5. Grant permissions for Gmail read access
6. You'll be redirected to the dashboard
7. Your emails will be fetched and analyzed automatically!

---

## Troubleshooting

### "Model not loaded" error in FastAPI
- **Solution**: Wait a few seconds for the BERT model to download and load. Check the FastAPI terminal for loading status.

### "Unauthorized" error when accessing emails
- **Solution**: 
  1. Verify your Google OAuth credentials in `.env.local`
  2. Check that redirect URI matches exactly: `http://localhost:3000/api/auth/callback/google`
  3. Clear browser cookies and sign in again

### Gmail API "Access Not Configured" error
- **Solution**: Make sure you enabled the Gmail API in Google Cloud Console

### CORS errors
- **Solution**: Ensure FastAPI is running on port 8000 and NEXT_PUBLIC_API_URL is set correctly

### Port already in use
- **Backend**: Change the port with `uvicorn main:app --reload --port 8001`
- **Frontend**: Next.js will automatically suggest port 3001 if 3000 is taken

### Python dependencies fail to install
- **Solution**: Upgrade pip first: `pip install --upgrade pip`

---

## Quick Reference

### Start Backend
```bash
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Start Frontend
```bash
cd frontend
npm run dev
```

### Check Backend Health
```bash
curl http://localhost:8000/health
```

### View API Documentation
- FastAPI Swagger: `http://localhost:8000/docs`
- FastAPI ReDoc: `http://localhost:8000/redoc`

---

## What's Next?

Once you have MailFort running:

1. **Explore the Dashboard**: Browse your emails in the three-pane layout
2. **Test Phishing Detection**: Look for emails with high phishing confidence
3. **Use Filters**: Try filtering by "Phishing Detected" or "Safe Emails"
4. **Refresh Emails**: Click the refresh button to fetch new emails

---

## Development Tips

### Hot Reload
Both frontend and backend support hot reload:
- Frontend: Edit any `.tsx` file and see instant changes
- Backend: Edit `main.py` and the server restarts automatically

### Debugging
- Frontend: Use browser DevTools console (F12)
- Backend: Check terminal output for FastAPI logs

### Testing Different Emails
To test the phishing detection:
1. Use the refresh button to fetch latest emails
2. Look at confidence scores and severity levels
3. The BERT model analyzes subject + body content

---

## Need Help?

- Check the main [README.md](./README.md) for detailed documentation
- Review API endpoints in FastAPI docs: `http://localhost:8000/docs`
- Open an issue on GitHub for bugs or questions

---

**Estimated Total Setup Time: ~25-30 minutes**

Enjoy using MailFort! 🛡️📧
