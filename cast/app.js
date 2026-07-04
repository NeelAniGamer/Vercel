if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js");
}

let ws = null;
let connectionType = "local";
let currentIp = "";

// Tab Navigation Logic
const navBtns = document.querySelectorAll('.nav-btn');
const panels = document.querySelectorAll('.glass-panel');

navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active class from all
        navBtns.forEach(b => b.classList.remove('active'));
        panels.forEach(p => p.classList.remove('active'));
        
        // Add active class to clicked
        btn.classList.add('active');
        const targetId = btn.getAttribute('data-target');
        document.getElementById(targetId).classList.add('active');
    });
});

// Connection Logic
document.getElementById("connect-btn").addEventListener("click", () => {
    connectionType = document.getElementById("connection-type").value;
    const target = document.getElementById("target-ip").value;
    if (!target) return;
    
    currentIp = target;
    
    if (connectionType === "local") {
        connectLocal(target);
    } else {
        connectAzure(target);
    }
});

function connectLocal(ip) {
    if (ws) ws.close();
    ws = new WebSocket(`ws://${ip}:8080/ws`);
    setupWebSocket();
    
    document.getElementById("stream-img").src = `http://${ip}:8080/stream`;
    document.getElementById("stream-img").style.display = "block";
    document.getElementById("placeholder").style.display = "none";
}

function connectAzure(id) {
    alert("Azure Web PubSub requires backend provisioning. For demo, switching to local connection flow.");
}

function setupWebSocket() {
    ws.onopen = () => {
        document.getElementById("connection-status").className = "status-connected";
        document.getElementById("status-text").innerText = "Connected";
    };
    ws.onclose = () => {
        document.getElementById("connection-status").className = "status-disconnected";
        document.getElementById("status-text").innerText = "Disconnected";
    };
    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            if (data.type === "file_shared") {
                addSharedFile(data.file);
            }
        } catch(e) {
            console.error("Failed to parse message", e);
        }
    }
}

// TV Remote Navigation
const focusables = Array.from(document.querySelectorAll(".focusable"));
let focusIndex = 0;

document.addEventListener("keydown", (e) => {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        // Prevent scrolling
        if(!document.activeElement.matches("input")) {
            e.preventDefault();
        }
        
        // Remote logic sending to app
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "remote_key", key: e.key.replace("Arrow", "").toLowerCase() }));
        }

        // Local UI Navigation for TV browsers
        if (e.key === "ArrowRight") focusIndex = (focusIndex + 1) % focusables.length;
        if (e.key === "ArrowLeft") focusIndex = (focusIndex - 1 + focusables.length) % focusables.length;
        focusables[focusIndex].focus();
    }
    
    if (e.key === "Enter") {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "remote_key", key: "ok" }));
        }
    }
});

// Click handlers for the remote UI buttons
document.querySelectorAll(".d-btn, .action-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        const key = btn.dataset.key;
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "remote_key", key }));
        }
    });
});

// --- Share Panel Logic ---

const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const browseBtn = dropZone.querySelector('.glass-btn');

browseBtn.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleUpload(e.target.files);
    }
});

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults (e) {
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => {
        dropZone.classList.add('dragover');
    }, false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => {
        dropZone.classList.remove('dragover');
    }, false);
});

dropZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleUpload(files);
});

function handleUpload(files) {
    if (!currentIp) {
        alert("Please connect to the app first before sending files.");
        return;
    }
    
    const file = files[0]; // For demo, handle single file
    const formData = new FormData();
    formData.append('file', file);

    const originalText = dropZone.querySelector('h2').innerText;
    dropZone.querySelector('h2').innerText = "Uploading...";

    fetch(`http://${currentIp}:8080/upload`, {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (response.ok) {
            alert("File sent successfully!");
        } else {
            alert("Failed to send file.");
        }
    })
    .catch(err => {
        console.error(err);
        alert("Upload error.");
    })
    .finally(() => {
        dropZone.querySelector('h2').innerText = originalText;
    });
}

// Mock function to add shared files dynamically
function addSharedFile(file) {
    const container = document.getElementById('shared-files-container');
    const emptyState = container.querySelector('.empty-state');
    if(emptyState) {
        emptyState.style.display = 'none';
    }

    const sizeFormatted = (file.size / 1024 / 1024).toFixed(2) + " MB";
    
    const div = document.createElement('div');
    div.className = 'file-item';
    div.innerHTML = `
        <div class="file-info">
            <span class="file-name">${file.name}</span>
            <span class="file-meta">${sizeFormatted} &bull; ${file.mimeType}</span>
        </div>
        <a href="http://${currentIp}:8080/share/${file.id}/download" class="download-btn focusable" download>
            <i data-lucide="download"></i>
        </a>
    `;
    container.appendChild(div);
    if(window.lucide) {
        lucide.createIcons();
    }
}

// QR Code Logic
document.getElementById('show-qr-btn').addEventListener('click', () => {
    const qrContainer = document.getElementById('qr-code-container');
    qrContainer.innerHTML = '';
    
    // Just a demo URL or actual app URL
    const urlToShare = currentIp ? `http://${currentIp}:8080/` : 'https://castflow.app/download';
    
    new QRCode(qrContainer, {
        text: urlToShare,
        width: 180,
        height: 180,
        colorDark : "#0F172A",
        colorLight : "#FFFFFF",
        correctLevel : QRCode.CorrectLevel.H
    });
});

// Clock Overlay Logic
let clockInterval;

function updateClock() {
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();
    
    hours = hours < 10 ? '0' + hours : hours;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    
    document.getElementById('clock-time').textContent = `${hours}:${minutes}`;
    
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    document.getElementById('clock-date').textContent = now.toLocaleDateString(undefined, options);
}

document.getElementById('clock-toggle-btn').addEventListener('click', () => {
    const clockOverlay = document.getElementById('clock-overlay');
    clockOverlay.style.display = 'flex';
    updateClock();
    clockInterval = setInterval(updateClock, 1000);
});

document.getElementById('close-clock-btn').addEventListener('click', () => {
    const clockOverlay = document.getElementById('clock-overlay');
    clockOverlay.style.display = 'none';
    clearInterval(clockInterval);
});

// For demo purposes:
// setTimeout(() => {
//     addSharedFile({ id: "demo", name: "presentation.pdf", size: 4500000, mimeType: "application/pdf" });
// }, 2000);
