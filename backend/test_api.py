import requests
import time
import sys

BASE_URL = "http://localhost:5000"

def test_health():
    try:
        r = requests.get(f"{BASE_URL}/health")
        if r.status_code == 200:
            print("✅ Health Check Passed")
            return True
        else:
            print(f"❌ Health Check Failed: {r.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health Check Error: {e}")
        return False

def test_check_image():
    # URL of a random image (e.g., from Wikipedia or placeholder)
    # Using a reliable public image
    url = "https://upload.wikimedia.org/wikipedia/commons/8/85/Elon_Musk_Royal_Society_%28crop1%29.jpg" 
    payload = {"url": url}
    
    try:
        r = requests.post(f"{BASE_URL}/check", json=payload)
        if r.status_code == 200:
            data = r.json()
            print(f"✅ Analysis Passed: {data}")
            return True
        else:
            print(f"❌ Analysis Failed: {r.text}")
            return False
    except Exception as e:
        print(f"❌ Analysis Error: {e}")
        return False

if __name__ == "__main__":
    print("Waiting for server to start...")
    retries = 10
    while retries > 0:
        if test_health():
            break
        time.sleep(2)
        retries -= 1
        
    if retries == 0:
        print("Server failed to start.")
        sys.exit(1)
        
    print("Running Tests...")
    test_check_image()
