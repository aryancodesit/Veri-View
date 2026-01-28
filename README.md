# Veri-View: AI-Powered Deepfake Detector 🛡️

![Veri-View Banner](https://img.shields.io/badge/Status-Production_Ready-success)
![Python](https://img.shields.io/badge/Backend-Flask_%2B_Transformers-blue)
![AI Model](https://img.shields.io/badge/Model-ViT_Deepfake_vs_Real-yellow)

**Veri-View** is a privacy-first Chrome Extension that passively scans web images to detect AI-generated content (Deepfakes) in real-time. It leverages a local Python backend running a **Vision Transformer (ViT)** model to analyze forensic artifacts and provides instant visual feedback.

> **Key Feature:** Generates legal-grade PDF reports containing hash signatures, metadata, and probability scores, designed to assist in reporting violations under **Section 66D of the IT Act (India)**.

## ✨ Key Features

- **🧠 Real-Time AI Analysis**: Uses the `dima806/deepfake_vs_real_image_detection` model (Hugging Face) for robust classification.
- **⚡ Passive Scanning**: Automatically highlights images on webpages:
  - 🟢 **Green Border**: Verified Authentic
  - 🔴 **Red Border**: High Probability Deepfake
  - 🟡 **Yellow Border**: Suspicious / Low Confidence
- **📄 Forensic Reporting**: One-click generation of PDF reports with:
  - SHA-256 Image Hash
  - EXIF Metadata Extraction
  - Timestamped Verdict
  - Legal Context (IT Act 2000)
- **🔒 Privacy First**: Images are processed logically in your local backend. No data is stored on external cloud servers.

## 🛠️ Tech Stack

- **Frontend**: Vanilla JavaScript (Manifest V3), HTML5, CSS3.
- **Backend**: Python (Flask).
- **AI Engine**: Hugging Face `transformers` (ViT), `torch`, `Pillow`.
- **Forensics**: `hashlib` (Hashing), `reportlab` (PDF Generation).

## 🚀 Installation & Setup

### Prerequisites
- Python 3.10+
- Google Chrome (or Edge/Brave)

### 1. Backend Setup
The backend handles the heavy AI lifting.

```bash
# Clone the repository
git clone https://github.com/aryancodesit/Veri-View.git
cd Veri-View/backend

# Create Virtual Environment
python -m venv venv

# Activate (Windows)
.\venv\Scripts\activate

# Install Dependencies (Important: includes torch & transformers)
pip install -r requirements.txt

# Start the Server
python app.py
```
*Server runs on `http://localhost:5000`*

### 2. Extension Setup
Load the frontend into your browser.

1.  Open Chrome and navigate to `chrome://extensions`.
2.  Enable **Developer Mode** (toggle in top-right).
3.  Click **Load Unpacked**.
4.  Select the `extension` folder from this project.
5.  Pin the 🛡️ Veri-View icon to your toolbar.

## 📖 Usage Guide

1.  **Start the Backend**: Ensure `app.py` is running (or double-click `start_server.bat`).
2.  **Browse**: Go to Google Images or a News site.
3.  **Visual Indicators**:
    - Hover over any image to see the **Veri-View Widget**.
    - Check the colored border for immediate status.
4.  **Get Details**: Click the Widget (or Extension Icon) to open the Forensic Dashboard.
5.  **Report**: Click **"Generate PDF Report"** to download the evidence file.

## ⚖️ Legal Disclaimer

This tool uses probabilistic AI models to estimate the likelihood of manipulation. It is intended as a **preliminary forensic aid** and not definitive proof in a court of law. Always corroborate findings with manual expert analysis.

---
*Developed by Aryan*
