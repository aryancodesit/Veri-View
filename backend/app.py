import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from analysis_engine import analyze_image
from utils import download_image_to_memory, generate_pdf_report
import traceback
import time

app = Flask(__name__)
CORS(app)  # Enable CORS for Extension

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy", "service": "Veri-View Backend"})

@app.route('/check', methods=['POST'])
def check_image():
    """
    Analyzes an image URL for deepfakes.
    Payload: { "url": "http://..." }
    """
    try:
        data = request.json
        image_url = data.get('url')
        if not image_url:
            return jsonify({"error": "No URL provided"}), 400

        # Step 1: Download Image (RAM)
        image_bytes = download_image_to_memory(image_url)
        if not image_bytes:
            return jsonify({"error": "Failed to download image"}), 400

        # Step 2: Analyze (with Latency)
        start_time = time.time()
        result = analyze_image(image_bytes, url=image_url)
        latency = round(time.time() - start_time, 2)
        
        result['latency'] = latency
        
        # Step 3: Return Result
        return jsonify(result)

    except Exception as e:
        print(f"Error processing image: {e}")
        traceback.print_exc()
        return jsonify({"error": "Internal Server Error"}), 500

@app.route('/report', methods=['POST'])
def create_report():
    """
    Generates a legal PDF report.
    Payload: { "url": "...", "metadata": {...}, "evidence": {...} }
    """
    try:
        data = request.json
        pdf_path = generate_pdf_report(data)
        # In a real app, upload PDF to cloud and return URL. 
        # For now, return a success message or the local path.
        return jsonify({"status": "generated", "path": pdf_path})
    except Exception as e:
        print(f"Error generating report: {e}")
        return jsonify({"error": "Report generation failed"}), 500

if __name__ == '__main__':
    # SECURITY: Disable debug mode in production to prevent RCE/Info Leak
    app.run(debug=False, port=5000)
