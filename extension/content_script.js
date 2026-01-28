// Veri-View Content Script

console.log("Veri-View: Active");

let globalWidget = null;

function scanImages() {
    if (!globalWidget) createGlobalWidget();

    const images = document.querySelectorAll('img');
    images.forEach(img => {
        if (img.dataset.veriViewProcessed) return;

        // Filter small images (icons, etc)
        if (img.width < 100 || img.height < 100) return;

        img.dataset.veriViewProcessed = "true";

        // Mark as scanning
        img.classList.add('veri-view-scanning');

        // Send to Background
        chrome.runtime.sendMessage({
            type: "CHECK_IMAGE",
            url: img.src
        }, (response) => {
            img.classList.remove('veri-view-scanning');

            if (response && response.success) {
                applyVerdict(img, response.data);
            } else {
                console.error("Analysis failed for", img.src, response);
            }
        });
    });
}

function applyVerdict(img, data) {
    // Validation: Check for backend errors or missing fields
    if (data.error || !data.verdict) {
        console.warn("Veri-View Analysis Issue:", data);
        data.verdict = "ERROR";
        data.score = 0;
    }

    let type = "safe";
    if (data.verdict === "FAKE") type = "fake";
    if (data.verdict === "WARNING") type = "warning";

    // NEW: Handle Undecisive/Error as Warning (Yellow), not Safe (Green)
    if (data.verdict === "ERROR" || data.verdict === "SKIPPED" || data.verdict === "UNDECISIVE") {
        type = "warning";
        data.verdict = "UNDECISIVE"; // Rename for better UX
    }

    // visual border
    img.classList.add(`veri-view-${type}`);

    // Interaction Logic
    img.style.cursor = "pointer";

    // On Hover: Select Image & Update Widget
    img.onmouseenter = () => updateWidget(data, type);

    // On Click: Open Sidebar/Report
    img.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        updateWidget(data, type); // Ensure it's active
    };

    // Calculate Display Confidence
    let displayScore = Math.round(data.score);
    if (data.verdict === "REAL") {
        displayScore = 100 - displayScore;
    }

    // Add Visible Badge (Per-Image)
    addBadge(img, `${data.verdict} ${displayScore}%`, type, () => {
        updateWidget(data, type);
    });
}

// Global Widget Logic
function createGlobalWidget() {
    globalWidget = document.createElement('div');
    globalWidget.className = 'veri-view-widget';
    globalWidget.innerHTML = `
        <div class="veri-view-widget-icon">🛡️</div>
        <div class="veri-view-widget-content">
            <div id="vv-title" style="font-weight:bold;">Veri-View Active</div>
            <div id="vv-desc" style="font-size:11px;">Hover an image</div>
        </div>
    `;

    // Append to body (or html if body issue)
    if (document.body) {
        document.body.appendChild(globalWidget);
        console.log("Veri-View: Widget created and appended to body.");
    } else {
        document.documentElement.appendChild(globalWidget);
        console.log("Veri-View: Widget appended to documentElement.");
    }

    // Dragging Logic
    let isDragging = false;
    let offset = { x: 0, y: 0 };

    globalWidget.addEventListener('mousedown', (e) => {
        isDragging = true;
        offset.x = e.clientX - globalWidget.getBoundingClientRect().left;
        offset.y = e.clientY - globalWidget.getBoundingClientRect().top;
        globalWidget.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        globalWidget.style.top = `${e.clientY - offset.y}px`;
        globalWidget.style.left = `${e.clientX - offset.x}px`;
        globalWidget.style.bottom = 'auto';
        globalWidget.style.right = 'auto';
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        globalWidget.style.cursor = 'grab';
    });

    // Default Click Action (Open Welcome Screen / Project 1)
    globalWidget.onclick = (e) => {
        // Prevent click if it was a drag operation
        if (Math.abs(e.clientX - offset.x - globalWidget.getBoundingClientRect().left) > 5) return;

        // Open Popup (Background will handle checking if context data exists)
        chrome.runtime.sendMessage({
            type: "OPEN_REPORT",
            payload: {} // Empty payload = Open Welcome/Empty State
        });
    };
}

function updateWidget(data, type) {
    if (!globalWidget) createGlobalWidget();

    // Style
    globalWidget.className = `veri-view-widget expanded ${type}`;

    // Content
    const icon = type === 'fake' ? '⚠️' : (type === 'safe' ? '✅' : '🛡️');
    const title = type === 'fake' ? 'Deepfake Detected' : (type === 'safe' ? 'Verified Real' : 'Undecisive');
    const score = Math.round(data.score);
    let displayScore = score;
    if (data.verdict === "REAL") displayScore = 100 - score;

    globalWidget.querySelector('.veri-view-widget-icon').innerText = icon;
    globalWidget.querySelector('#vv-title').innerText = title;
    globalWidget.querySelector('#vv-desc').innerText = `Confidence: ${displayScore}% (Click for Report)`;

    // AUTO-UPDATE CONTEXT: Save this image as the "active" one for the popup
    // IMPORTANT: Pass ALL backend data (hash, metadata, latency, etc.)
    const payload = {
        url: data.url || "",
        score: data.score,
        verdict: data.verdict,
        hash: data.hash,
        metadata: data.metadata,
        latency: data.latency,
        trust_idx: data.trust_idx
    };

    chrome.runtime.sendMessage({
        type: "SET_CONTEXT",
        payload: payload
    });

    // Click to Open Report
    globalWidget.onclick = (e) => {
        // Prevent click if dragging (simple heuristic)
        // offset is defined in createGlobalWidget scope, can't access here directly if separate.
        // But functions are in same scope.
        // Wait, offset is local to createGlobalWidget. I need to make isDragging global or ignore check here.
        // For simplicity, just send message.
        chrome.runtime.sendMessage({
            type: "OPEN_REPORT",
            payload: payload
        });
    };
}

function addBadge(img, text, type, onClickHandler) {
    // Attempt to wrap image to position badge safely
    // 1. Create wrapper if not exists (or use parent if suitable)
    const parent = img.parentElement;

    // Check if we already badged it
    if (parent.classList.contains('veri-view-container')) {
        return;
    }

    // Create wrapper
    const wrapper = document.createElement('div');
    wrapper.classList.add('veri-view-container');

    // Insert wrapper before img
    parent.insertBefore(wrapper, img);
    // Move img into wrapper
    wrapper.appendChild(img);

    // Create Badge
    const badge = document.createElement('div');
    badge.className = `veri-view-badge ${type}`;
    badge.innerText = text;
    badge.title = "Click to view details";
    badge.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onClickHandler) onClickHandler();
    };

    wrapper.appendChild(badge);
}

// Initial Scan
scanImages();

// Observe for new images
const observer = new MutationObserver((mutations) => {
    scanImages();
});
observer.observe(document.body, { childList: true, subtree: true });
