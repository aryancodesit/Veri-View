import hashlib
import io
import cv2
import numpy as np
import base64
from PIL import Image
from PIL.ExifTags import TAGS
from urllib.parse import urlparse
from transformers import pipeline
import mediapipe as mp

# Initialize AI Pipeline (Mock/Stub for now or Real if weights existed)
# using a placeholder classification model for demo purposes
try:
    pipe = pipeline("image-classification", model="google/vit-base-patch16-224")
except:
    pipe = None

# Trust Score Helper
TRUSTED_DOMAINS = {
    'wikipedia.org': 'High',
    'gov.in': 'High',
    'nytimes.com': 'High',
    'bbc.com': 'High',
    'reuters.com': 'High',
    'twitter.com': 'Medium',
    'facebook.com': 'Medium',
    'instagram.com': 'Low',
    'whatsapp.com': 'Low'
}

def get_domain_trust(url):
    try:
        domain = urlparse(url).netloc
        # Handle subdomains (e.g., en.wikipedia.org)
        for d in TRUSTED_DOMAINS:
            if domain.endswith(d):
                return {"domain": domain, "trust": TRUSTED_DOMAINS[d]}
        return {"domain": domain, "trust": "Neutral"}
    except:
        return {"domain": "Unknown", "trust": "Unknown"}

def get_image_hash(image_bytes):
    return hashlib.sha256(image_bytes).hexdigest()

def get_image_metadata(pil_image):
    meta_dict = {}
    try:
        info = pil_image.getexif()
        if info:
            for tag, value in info.items():
                decoded = TAGS.get(tag, tag)
                # Filter useful tags
                if decoded in ['Make', 'Model', 'Software', 'DateTime', 'DateTimeOriginal']:
                    meta_dict[decoded] = str(value)
    except Exception as e:
        print(f"Metadata Error: {e}")
    
    if not meta_dict:
        return "Stripped / None Found"
    return meta_dict

def analyze_image(image_bytes, url=""):
    """
    Enhanced Forensic Analysis with MediaPipe.
    Returns: Score, Verdict, Hash, Metadata, Domain Trust.
    """
    try:
        # 1. Image Forensics (Hash & Metadata)
        img_hash = get_image_hash(image_bytes)
        
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            return {"score": 0, "verdict": "ERROR", "details": "Image decode failed"}

        # 2. Face Detection (MediaPipe) - UPDATED
        mp_face_detection = mp.solutions.face_detection
        
        # model_selection=1 is better for faces > 2m away or smaller faces. 0 is for close range.
        # We use 1 for robustness on web images.
        with mp_face_detection.FaceDetection(model_selection=1, min_detection_confidence=0.5) as face_detection:
            
            # MediaPipe requires RGB
            img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            results = face_detection.process(img_rgb)
            
            face_count = 0
            face_img = None
            
            if results.detections:
                face_count = len(results.detections)
                
                # Get the first face (usually the most prominent)
                detection = results.detections[0]
                bboxC = detection.location_data.relative_bounding_box
                ih, iw, _ = img.shape
                
                x = int(bboxC.xmin * iw)
                y = int(bboxC.ymin * ih)
                w = int(bboxC.width * iw)
                h = int(bboxC.height * ih)
                
                # Add margin
                margin = 20
                x_start = max(0, x - margin)
                y_start = max(0, y - margin)
                x_end = min(iw, x + w + margin)
                y_end = min(ih, y + h + margin)
                
                face_img = img[y_start:y_end, x_start:x_end]

        # Domain Trust
        trust_info = get_domain_trust(url)

        # AI Analysis
        fake_score = 0
        verdict = "REAL"
        
        if face_count > 0 and face_img is not None and face_img.size > 0:
            
            face_rgb = cv2.cvtColor(face_img, cv2.COLOR_BGR2RGB)
            pil_image = Image.fromarray(face_rgb)
            
            # Extract Metadata from PIL (re-open from bytes for full headers?)
            full_pil = Image.open(io.BytesIO(image_bytes))
            metadata = get_image_metadata(full_pil)

            # AI Inference
            if pipe:
                predictions = pipe(pil_image)
                fake_prob = 0
                for pred in predictions:
                    if pred['label'] == 'FAKE': # Note: ViT labels are just random for this mock, need real model
                        fake_prob = pred['score']
                    # MOCK LOGIC for demo:
                    # If we don't have a real Deepfake model loaded, we'll simulate based on trust/random
                    # For now, let's keep the mock deterministic-ish
                
                # SIMULATED SCORE DO NOT DEPLOY WITHOUT REAL MODEL WEIGHTS
                # Just generating a score for UI demonstration if model returns unrelated classes
                fake_score = predictions[0]['score'] * 100 
            else:
                 fake_score = 45.0 # Fallback if pipe fails
            
            # Logic: 
            # Fake > 60 => RED (FAKE)
            # 30 < Fake <= 60 => YELLOW (UNCERTAIN)
            # Fake <= 30 => GREEN (REAL)
            
            if fake_score > 60:
                verdict = "FAKE"
            elif fake_score > 30:
                verdict = "WARNING"
            else:
                verdict = "REAL"
            
        else:
            # No face found
            verdict = "SKIPPED"
            metadata = "N/A"

        return {
            "score": round(fake_score, 2),
            "verdict": verdict,
            "face_count": face_count,
            "hash": img_hash,
            "metadata": metadata,
            "trust_idx": trust_info
        }

    except Exception as e:
        print(f"Analysis Error: {e}")
        return {"score": 0, "verdict": "ERROR", "details": str(e)}
