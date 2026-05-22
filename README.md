# Neuro Pulse

**AI-Powered Early Parkinson Disease Risk Screening System**

Secure authentication, MongoDB user data, conversational symptom screening, optional voice biomarkers, and ML risk prediction.

## Features

- JWT authentication (signup, login, logout)
- Google Sign-In (Firebase)
- MongoDB Atlas — users, predictions, chat history
- Optional Cloudinary audio storage
- Password reset (email or dev token)
- 12-question chatbot + optional voice + PDF reports

## Setup

### 1. MongoDB Atlas

1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create database user and allow your IP
3. Copy connection string

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env: MONGODB_URI, JWT_SECRET_KEY, FLASK_SECRET_KEY
pip install -r requirements.txt
python app.py
```

**Required in `backend/.env`:**
```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET_KEY=your-long-secret
FLASK_SECRET_KEY=your-flask-secret
```

**Optional:**
```env
GOOGLE_CLIENT_ID=...          # Firebase web client ID
FIREBASE_PROJECT_ID=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
SMTP_HOST=...                   # Password reset emails
FRONTEND_URL=http://localhost:5173
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env
# Set VITE_API_URL=http://127.0.0.1:5000
# Add Firebase keys for Google login
npm install
npm run dev
```

**Firebase (Google login):** Create a project at [Firebase Console](https://console.firebase.google.com), enable Authentication → Google, copy web app config into `frontend/.env`.

### 4. Run

| Service   | URL                      |
|-----------|--------------------------|
| API       | http://127.0.0.1:5000    |
| Web app   | http://localhost:5173    |

## API endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/signup` | Create account |
| POST | `/login` | Login → JWT |
| POST | `/google` | Google ID token login |
| POST | `/logout` | Logout (JWT required) |
| GET | `/profile` | User profile (JWT) |
| POST | `/forgot-password` | Request reset |
| POST | `/reset-password` | Set new password |

### Screening (JWT required)
| Method | Endpoint |
|--------|----------|
| GET | `/questions` |
| POST | `/predict-symptoms` |
| POST | `/chat/messages` |
| POST | `/upload-audio` |
| POST | `/extract-features` |
| POST | `/predict` |
| GET | `/history` |
| GET | `/download-report/<id>` |

## User flow

1. **Start screening** — no login required (guest mode)
2. **Optional:** Sign up / Login to save history in MongoDB cloud
3. **Chat** — 12 questions → symptoms-only result or optional voice
4. **History** — guests: this browser only; logged-in: cloud sync + PDF

## Medical disclaimer

This AI system is for early screening and education only — not a medical diagnosis. Consult certified healthcare professionals for evaluation and treatment.

## Project structure

```
neuro pulse/
├── parkinsons_model.pkl
├── backend/
│   ├── routes/auth_routes.py
│   ├── routes/prediction_routes.py
│   ├── models/
│   └── .env
└── frontend/
    └── src/pages/Login.jsx, Signup.jsx, Dashboard.jsx, ...
```
