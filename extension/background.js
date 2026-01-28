// Veri-View Background Script

const API_URL = "http://localhost:5000/check";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "CHECK_IMAGE") {
        handleCheckImage(message.url, sendResponse);
        return true; // Keep channel open for async response
    }

    if (message.type === "OPEN_REPORT") {
        // Save data to storage so Popup can read it
        chrome.storage.local.set({ reportData: message.payload }, () => {
            // For V3 compliance, we might just Badge the icon or open a new tab.
            // We try to open a window, but if it fails (popup blocker), user can click extension.
            chrome.windows.create({
                url: "popup.html",
                type: "popup",
                width: 400,
                height: 600
            });
        });
    }

    if (message.type === "SET_CONTEXT") {
        // Just save state (for when user clicks toolbar icon manually)
        chrome.storage.local.set({ reportData: message.payload });
    }
});

async function handleCheckImage(url, sendResponse) {
    try {
        console.log("Checking:", url);
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: url })
        });
        const data = await response.json();
        console.log("Result:", data);
        sendResponse({ success: true, data: data });
    } catch (error) {
        console.error("API Error:", error);
        sendResponse({ success: false, error: error.message });
    }
}
