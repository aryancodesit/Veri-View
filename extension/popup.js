// Popup Logic
document.addEventListener('DOMContentLoaded', () => {
    // Show Loading initially if we expect data to be fetched soon, 
    // but typically we read local storage instantly. 
    // For effect, we can show loader for 300ms if data exists.

    chrome.storage.local.get(['reportData'], (result) => {
        if (result.reportData && result.reportData.url) {
            showLoading();
            setTimeout(() => {
                renderDashboard(result.reportData);
            }, 400); // Artificial delay for premium feel
        } else {
            showEmptyState();
        }
    });

    // Empty State Buttons
    document.getElementById('btn-project').onclick = () => {
        // Placeholder for user's Project 1 URL
        chrome.tabs.create({ url: "https://google.com" });
    };
});

function showLoading() {
    document.getElementById('header').style.display = 'block';
    document.getElementById('header').className = 'header'; // Neutral
    document.getElementById('verdict-title').innerText = "Analyzing Evidence...";

    document.getElementById('loading-state').style.display = 'block';
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('empty-state').style.display = 'none';

    // Reset colors
    const header = document.getElementById('header');
    header.style.background = '#1f2937';
}

function showEmptyState() {
    document.getElementById('header').style.display = 'none'; // Hide header for clean look
    document.getElementById('loading-state').style.display = 'none';
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('empty-state').style.display = 'flex'; // Flex for centering
}

function renderDashboard(data) {
    document.getElementById('loading-state').style.display = 'none';
    document.getElementById('empty-state').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';

    const verdict = data.verdict || "UNKNOWN";
    let score = Math.round(data.score || 0);
    if (verdict === "REAL") score = 100 - score;

    // 1. BANNER & COLOR LOGIC
    const banner = document.getElementById('verdict-banner');
    const mainText = document.getElementById('verdict-main');
    const scoreVal = document.getElementById('score-value');
    const scoreValContainer = document.getElementById('score-value');

    // Reset Classes
    banner.className = 'alert-banner';

    // Set Colors & Text
    if (verdict === "FAKE") {
        banner.classList.add('fake');
        mainText.innerText = "Manipulated Image Detected";
        scoreVal.style.color = '#ce2e2e';
    }
    else if (verdict === "WARNING" || verdict === "UNDECISIVE") {
        banner.classList.add('warning');
        mainText.innerText = verdict === "WARNING" ? "Suspicious Activity" : "Analysis Inconclusive";
        scoreVal.style.color = '#f59e0b';
    }
    else {
        banner.classList.add('safe');
        mainText.innerText = "Verified Authentic";
        scoreVal.style.color = '#10b981';
    }

    // 2. DATA BINDING
    document.getElementById('url-text').innerText = data.url;
    document.getElementById('score-value').innerText = `${score}%`;
    document.getElementById('preview').src = data.url;

    // 3. LEGAL SECTION TOGGLE
    if (verdict === "FAKE" || verdict === "WARNING" || verdict === "UNDECISIVE") {
        document.getElementById('legal-section').style.display = 'block';
        document.getElementById('safe-section').style.display = 'none';
    } else {
        document.getElementById('legal-section').style.display = 'none';
        document.getElementById('safe-section').style.display = 'block';
    }

    // 4. TECH DETAILS (Hidden but populated)
    const hashShort = data.hash ? data.hash.substring(0, 12) + "..." : "N/A";
    document.getElementById('hash-short').innerText = hashShort;
    document.getElementById('hash-val').innerText = data.hash || "Pending";

    // Meta
    let metaStr = "None";
    if (data.metadata && typeof data.metadata === 'object') {
        // Just take first key for brevity
        metaStr = Object.keys(data.metadata).length + " Tags Found";
        // Or stringify
        document.getElementById('meta-val').innerText = JSON.stringify(data.metadata).substring(0, 50);
    } else {
        document.getElementById('meta-val').innerText = "Stripped";
    }

    document.getElementById('latency-val').innerText = data.latency + "s";

    if (data.trust_idx) {
        document.getElementById('domain-trust').innerText = `${data.trust_idx.domain} (${data.trust_idx.trust})`;
    }

    // Setup Buttons
    setupActions(data);
}

function setupActions(data) {
    document.getElementById('btn-report').onclick = () => generateReport(data);
    document.getElementById('btn-gov').onclick = () => chrome.tabs.create({ url: "https://cybercrime.gov.in/" });
}


function getTrustColor(trust) {
    if (trust === 'High') return '#10b981';
    if (trust === 'Medium') return '#f59e0b';
    return '#6b7280';
}

async function generateReport(data) {
    const statusEl = document.getElementById('status-msg');
    statusEl.innerText = "Generating PDF...";
    statusEl.style.color = "#3498db";

    try {
        const response = await fetch("http://localhost:5000/report", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                url: data.url,
                score: data.score,
                timestamp: new Date().toISOString(),
                hash: data.hash,
                metadata: data.metadata
            })
        });

        const resData = await response.json();

        if (resData.download_url) {
            statusEl.innerText = "Report Ready!";
            statusEl.style.color = "#10b981";

            // Open PDF in new tab (triggers download or viewer)
            chrome.tabs.create({ url: resData.download_url });
        } else {
            throw new Error("No download URL returned");
        }
    } catch (e) {
        statusEl.innerText = "Error: " + e.message;
        statusEl.style.color = "#ef4444";
    }
}
}
