# Veri-View

**Project Status:** 🚧 Development

Veri-View is a Chrome/Edge extension that turns your browser into a passive deepfake detector. It automatically scans images on webpages, analyzes them using a local AI backend, and provides immediate visual feedback (Green for Authentic, Red for Fake) to the user. Includes legal reporting tools for Indian Cyber Laws.

## Architecture

- **Frontend:** Chrome Extension (Manifest V3) with React/Vite.
- **Backend:** Python Flask API with Deepfake Analysis (Mock/Stub for prototype).
- **Database:** Supabase (Hash Caching) & Redis (Rate Limiting).

## Setup

### Backend
1. `cd backend`
2. `python -m venv venv`
3. `venv\Scripts\activate`
4. `pip install -r requirements.txt`
5. `python app.py`

### Extension
1. `cd extension`
2. `npm install`
3. `npm run build`
4. Load `dist` folder as Unpacked Extension in Chrome.
