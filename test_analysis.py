import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

try:
    from backend.analysis_engine import analyze_image
    print("Successfully imported analyze_image")
except Exception as e:
    print(f"Import Error: {e}")
    sys.exit(1)

import requests

def test():
    # Download a small image to test
    url = "https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png"
    print(f"Downloading {url}...")
    try:
        response = requests.get(url)
        if response.status_code == 200:
            print("Image downloaded. Running analysis...")
            result = analyze_image(response.content, url)
            print("Analysis Result:", result)
        else:
            print("Failed to download test image")
    except Exception as e:
        print(f"Execution Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test()
