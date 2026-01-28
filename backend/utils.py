import requests
import io
import hashlib
from reportlab.pdfgen import canvas
import os
import datetime

import base64

def download_image_to_memory(url):
    """
    Downloads image to bytes buffer. Supports HTTP/S and Base64 Data URIs.
    """
    try:
        # Handle Base64 Data URIs (Common on Google Images)
        if url.startswith("data:image"):
            header, encoded = url.split(",", 1)
            return base64.b64decode(encoded)

        # Handle Standard URLs
        headers = {'User-Agent': 'Mozilla/5.0'}
        response = requests.get(url, headers=headers, timeout=5)
        if response.status_code == 200:
            return response.content
        return None
    except Exception as e:
        print(f"Download Error: {e}")
        return None

def generate_pdf_report(data):
    """
    Generates a basic PDF report for legal usage.
    """
    timestamp = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
    filename = f"report_{timestamp}.pdf"
    path = os.path.join("reports", filename)
    
    if not os.path.exists("reports"):
        os.makedirs("reports")

    c = canvas.Canvas(path)
    # Layout Constants
    y_position = 780
    
    # Title
    c.setFont("Helvetica-Bold", 18)
    c.drawString(50, 800, "Veri-View Forensic Analysis Report")
    
    c.setFont("Helvetica", 10)
    c.drawString(50, y_position, f"Generated On: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    y_position -= 20
    c.drawString(50, y_position, f"Target URL: {data.get('url')[:60]}...") # Truncate URL if long
    y_position -= 40
    
    # Verdict Section
    c.setFont("Helvetica-Bold", 14)
    verdict = data.get('score', 0)
    verdict_text = "AUTHENTIC MEDIA" if verdict < 30 else "MANIPULATION DETECTED"
    
    if verdict > 60:
        c.setFillColorRGB(0.8, 0, 0) # Red
    elif verdict > 30:
        c.setFillColorRGB(1, 0.6, 0) # Orange
        verdict_text = "INCONCLUSIVE / SUSPICIOUS"
    else:
        c.setFillColorRGB(0, 0.6, 0) # Green
        
    c.drawString(50, y_position, f"VERDICT: {verdict_text}")
    c.setFillColorRGB(0, 0, 0) # Reset
    y_position -= 20
    c.setFont("Helvetica", 12)
    c.drawString(50, y_position, f"Deepfake Probability Score: {verdict}%")
    y_position -= 40
    
    # Forensic Evidence Table
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, y_position, "Forensic Evidence:")
    y_position -= 20
    c.setFont("Helvetica", 10)
    
    # Hash
    c.drawString(50, y_position, f"SHA-256 Signature:")
    y_position -= 15
    c.setFont("Courier", 9)
    c.drawString(50, y_position, f"{data.get('hash', 'N/A')}")
    c.setFont("Helvetica", 10)
    y_position -= 25
    
    # Metadata
    c.drawString(50, y_position, f"Exif Metadata:")
    y_position -= 15
    metadata = data.get('metadata')
    if isinstance(metadata, dict):
        for k, v in metadata.items():
            if y_position < 100: c.showPage(); y_position = 800 # New Page check
            c.drawString(70, y_position, f"- {k}: {v}")
            y_position -= 15
    else:
        c.drawString(70, y_position, f"- {metadata}")
        y_position -= 25

    y_position -= 20
    
    # Legal Context
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, y_position, "Legal Context (India):")
    y_position -= 20
    c.setFont("Helvetica", 10)
    
    legal_text = [
        "This report indicates potential violation of Section 66D of the Information Technology Act, 2000.",
        "(Punishment for cheating by personation by using computer resource).",
        "If this image is used to defame or impersonate, it may be admissible as digital evidence",
        "under Section 65B of the Indian Evidence Act."
    ]
    
    for line in legal_text:
        c.drawString(50, y_position, line)
        y_position -= 15

    c.save()
    return path
