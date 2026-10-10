// Global System Environment Channels
let sessionData = null;
let currentActiveRoomId = null;
let nextSyncBatchToken = null;
let roomsCache = {};
let isSyncing = false;

// Universal Visibility Menu Toggle
function toggleVisibility(id) {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('hidden');
}

// Bind System Shelf Tray Interface Click Handlers
document.getElementById('taskbar-status-tray').addEventListener('click', () => toggleVisibility('friends-panel'));
document.getElementById('btn-show-add-friend').addEventListener('click', () => toggleVisibility('add-friend-ui'));
document.getElementById('btn-cancel-friend').addEventListener('click', () => toggleVisibility('add-friend-ui'));
document.getElementById('btn-close-chat').addEventListener('click', () => {
    document.getElementById('chat-window').classList.add('hidden');
    currentActiveRoomId = null;
});

// Chromebook Real-Time Live Clock Component Engine
function runSystemClock() {
    const timeEl = document.getElementById('tray-time');
    const dateEl = document.getElementById('tray-date');
    
    function updateClock() {
        const now = new Date();
        timeEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        dateEl.textContent = now.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
    
    updateClock();
    setInterval(updateClock, 15000); // Check ticks
}

// Desktop Draggable Window Component Engine
function makeWindowDraggable() {
    const win = document.getElementById('chat-window');
    const header = document.getElementById('chat-header');
    let posX = 0, posY = 0, mouseX = 0, mouseY = 0;

    header.onmousedown = (e) => {
        e.preventDefault();
        mouseX = e.clientX;
        mouseY = e.clientY;
        document.onmouseup = () => {
            document.onmouseup = null;
            document.onmousemove = null;
        };
        document.onmousemove = (ev) => {
            ev.preventDefault();
            posX = mouseX - ev.clientX;
            posY = mouseY - ev.clientY;
            mouseX = ev.clientX;
            mouseY = ev.clientY;
            win.style.top = (win.offsetTop - posY) + "px";
            win.style.left = (win.offsetLeft - posX) + "px";
        };
    };
}

// System Disconnect Operation Handler
document.getElementById('btn-logout').addEventListener('click', () => {
    localStorage.removeItem('elementos_session');
    window.location.reload();
});

// Primary System Core Lifecycle Initializer
window.addEventListener('load', () => {
    runSystemClock();
    makeWindowDraggable();
    document.getElementById('chat-window').classList.add('hidden');
    
    try {
        const saved = localStorage.getItem('elementos_session');
        if (saved) {
            sessionData = JSON.parse(saved);
            enterDesktopMode();
        }
    } catch (err) {
        console.log("Cached access token handshake omitted.");
    }
});
// Native HTTP REST Authentication Protocol
document.getElementById('btn-login').addEventListener('click', async () => {
    let baseUrl = document.getElementById('login-homeserver').value.trim();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value.trim();

    if (!baseUrl.startsWith('http')) baseUrl = 'https://' + baseUrl;
    if (!username || !password) return alert('Please enter all system credentials.');

    try {
        const response = await fetch(`${baseUrl}/_matrix/client/v3/login`, {
            method: 'POST',
            body: JSON.stringify({
                type: "m.login.password",
                identifier: { type: "m.id.user", user: username },
                password: password
            }),
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) throw new Error("Incorrect parameters or server connection rejected.");
        const data = await response.json();

        sessionData = { baseUrl, accessToken: data.access_token, userId: data.user_id };
        localStorage.setItem('elementos_session', JSON.stringify(sessionData));
        enterDesktopMode();
    } catch (err) {
        alert('Authentication Error: ' + err.message);
    }
});

function enterDesktopMode() {
    if (!sessionData) return;
    const shortUser = sessionData.userId.split(':')[0].replace('@', '');
    
    document.getElementById('menu-displayname').textContent = sessionData.userId;
    document.getElementById('menu-avatar').textContent = shortUser.substring(0, 2).toUpperCase();
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('desktop').classList.remove('hidden');
    
    if (!isSyncing) {
        isSyncing = true;
        startSyncLoop();
    }
}

// Continuous Native HTTP matrix event long polling background pipeline
async function startSyncLoop() {
    while (sessionData) {
        let url = `${sessionData.baseUrl}/_matrix/client/v3/sync?timeout=30000`;
        if (nextSyncBatchToken) url += `&since=${nextSyncBatchToken}`;

        try {
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${sessionData.accessToken}` }
            });
            if (!response.ok) throw new Error();
            const syncData = await response.json();
            nextSyncBatchToken = syncData.next_batch;
            processSyncPayload(syncData);
        } catch (e) {
            await new Promise(r => setTimeout(r, 6000));
        }
    }
    isSyncing = false;
}

function processSyncPayload(data) {
    if (data.rooms && data.rooms.join) {
        for (const roomId in data.rooms.join) {
            if (!roomsCache[roomId]) roomsCache[roomId] = { messages: [] };
            const timelineEvents = data.rooms.join[roomId].timeline?.events || [];
            timelineEvents.forEach(ev => {
                if (ev.type === 'm.room.message' && ev.content?.body) {
                    roomsCache[roomId].messages.push({ sender: ev.sender, body: ev.content.body });
                    if (roomId === currentActiveRoomId) appendLiveMessage(ev.sender, ev.content.body);
                }
            });
        }
        renderFriendsList();
    }
}

function renderFriendsList() {
    const listDiv = document.getElementById('friends-list');
    const roomKeys = Object.keys(roomsCache);
    if (roomKeys.length === 0) {
        listDiv.innerHTML = `<p class="loading-label">No active friend channels.</p>`;
        return;
    }
    listDiv.innerHTML = '';
    roomKeys.forEach(roomId => {
        const displayLabel = roomId.length > 20 ? roomId.substring(0, 16) + '...' : roomId;
        const item = document.createElement('div');
        item.className = "friend-item";
        item.innerHTML = `
            <div class="friend-meta">
                <div class="friend-avatar">👤</div>
                <div class="friend-name" title="${roomId}">${displayLabel}</div>
            </div>
            <div class="friend-actions-group"><button class="action-icon-btn">Chat</button></div>`;
        item.querySelector('.action-icon-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            openChatWindow(roomId);
        });
        listDiv.appendChild(item);
    });
}

document.getElementById('btn-add-friend').addEventListener('click', async () => {
    const targetMxid = document.getElementById('friend-mxid').value.trim();
    if (!targetMxid.startsWith('@')) return alert('User handle format: @user:server.com');
    try {
        const res = await fetch(`${sessionData.baseUrl}/_matrix/client/v3/createRoom`, {
            method: 'POST',
            body: JSON.stringify({ invite: [targetMxid], preset: 'trusted_private_chat', is_direct: true }),
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionData.accessToken}` }
        });
        if (!res.ok) throw new Error();
        alert('Friend connection established! Waiting for system update.');
        document.getElementById('friend-mxid').value = '';
        document.getElementById('add-friend-ui').classList.add('hidden');
    } catch (err) {
        alert('Channel creation failed or server blocked standard request.');
    }
});

function openChatWindow(roomId) {
    currentActiveRoomId = roomId;
    document.getElementById('chat-title').textContent = `Room Channel: ${roomId.substring(0, 14)}...`;
    document.getElementById('chat-window').classList.remove('hidden');
    const msgBox = document.getElementById('chat-messages');
    msgBox.innerHTML = '';
    if (roomsCache[roomId]) {
        roomsCache[roomId].messages.forEach(m => appendLiveMessage(m.sender, m.body));
    }
}

function appendLiveMessage(sender, body) {
    const container = document.getElementById('chat-messages');
    const isMe = sender === sessionData.userId;
    const cleanSender = sender.split(':')[0].replace('@', '');
    const msgHtml = `
        <div class="msg-wrap ${isMe ? 'me' : 'them'}">
            <span class="msg-sender">${cleanSender}</span>
            <div class="msg-bubble">${body}</div>
        </div>`;
    container.insertAdjacentHTML('beforeend', msgHtml);
    container.scrollTop = container.scrollHeight;
}

document.getElementById('btn-send').addEventListener('click', sendMessage);
document.getElementById('chat-input').addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });

async function sendMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text || !currentActiveRoomId) return;
    try {
        const txnId = Date.now();
        await fetch(`${sessionData.baseUrl}/_matrix/client/v3/rooms/${encodeURIComponent(currentActiveRoomId)}/send/m.room.message/${txnId}`, {
            method: 'PUT',
            body: JSON.stringify({ msgtype: "m.text", body: text }),
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionData.accessToken}` }
        });
        input.value = '';
    } catch (e) {
        console.log("Transmission failed.");
    }
}
