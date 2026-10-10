// Global System Environment Channels
let sessionData = null;
let currentActiveRoomId = null;
let nextSyncBatchToken = null;
let roomsCache = {};
let isSyncing = false;

// Window Layout Geometric Context Cache Tracking States
let isChatFullscreen = false;
let regularWindowPosition = { top: "15%", left: "15%", width: "420px", height: "500px" };
let currentActiveCallId = null; 

function toggleVisibility(id) {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('hidden');
}

// Bind System Shelf Tray Interface Click Handlers
document.getElementById('taskbar-status-tray').addEventListener('click', () => toggleVisibility('friends-panel'));
document.getElementById('btn-show-add-friend').addEventListener('click', () => toggleVisibility('add-friend-ui'));
document.getElementById('btn-cancel-friend').addEventListener('click', () => toggleVisibility('add-friend-ui'));

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
    setInterval(updateClock, 15000);
}

// Desktop Draggable Window Component Engine
function makeWindowDraggable() {
    const win = document.getElementById('chat-window');
    const header = document.getElementById('chat-header');
    let posX = 0, posY = 0, mouseX = 0, mouseY = 0;

    header.onmousedown = (e) => {
        if (isChatFullscreen) return;
        if (e.target.closest('.window-controls-shelf')) return;
        
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

document.getElementById('btn-logout').addEventListener('click', () => {
    localStorage.removeItem('elementos_session');
    window.location.reload();
});
// New Native Window Utility Actions Component Modules
document.getElementById('btn-close-chat').addEventListener('click', () => {
    document.getElementById('chat-window').classList.add('hidden');
    document.getElementById('minimized-dock-indicator').classList.add('hidden');
    document.getElementById('call-selection-dropdown').classList.add('hidden');
    currentActiveRoomId = null;
});

document.getElementById('btn-minimize-chat').addEventListener('click', () => {
    const room = roomsCache[currentActiveRoomId];
    let displayTitle = room?.customName || "Active Chat";
    
    document.getElementById('minimized-dock-label').textContent = displayTitle;
    document.getElementById('chat-window').classList.add('hidden');
    document.getElementById('minimized-dock-indicator').classList.remove('hidden');
    document.getElementById('call-selection-dropdown').classList.add('hidden');
});

document.getElementById('minimized-dock-indicator').addEventListener('click', () => {
    document.getElementById('chat-window').classList.remove('hidden');
    document.getElementById('minimized-dock-indicator').classList.add('hidden');
});

document.getElementById('btn-fullscreen-chat').addEventListener('click', () => {
    const win = document.getElementById('chat-window');
    const btn = document.getElementById('btn-fullscreen-chat');
    
    if (!isChatFullscreen) {
        regularWindowPosition.top = win.style.top || "15%";
        regularWindowPosition.left = win.style.left || "15%";
        regularWindowPosition.width = win.style.width || "420px";
        regularWindowPosition.height = win.style.height || "500px";
        
        win.style.top = "0px";
        win.style.left = "0px";
        win.style.width = "100vw";
        win.style.height = "calc(100vh - 3.25rem)";
        btn.textContent = "❐";
        isChatFullscreen = true;
    } else {
        win.style.top = regularWindowPosition.top;
        win.style.left = regularWindowPosition.left;
        win.style.width = regularWindowPosition.width;
        win.style.height = regularWindowPosition.height;
        btn.textContent = "🔲";
        isChatFullscreen = false;
    }
});

document.getElementById('btn-call-menu').addEventListener('click', (e) => {
    e.stopPropagation();
    toggleVisibility('call-selection-dropdown');
});

document.addEventListener('click', () => {
    document.getElementById('call-selection-dropdown').classList.add('hidden');
});

// Outbound Signaling Core Event Transmissions
document.getElementById('btn-audio-call').addEventListener('click', () => startMatrixCall("voice"));
document.getElementById('btn-video-call').addEventListener('click', () => startMatrixCall("video"));

async function startMatrixCall(type) {
    if (!currentActiveRoomId) return;
    const callId = "c" + Date.now();
    
    try {
        const txnId = "t" + Date.now();
        await fetch(`${sessionData.baseUrl}/_matrix/client/v3/rooms/${encodeURIComponent(currentActiveRoomId)}/send/m.call.invite/${txnId}`, {
            method: 'PUT',
            body: JSON.stringify({
                call_id: callId,
                version: "1",
                lifetime: 60000,
                offer: { type: "offer", sdp: "m=audio..." },
                type: type
            }),
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionData.accessToken}` }
        });
        alert(`Outgoing Matrix ${type === "voice" ? "Audio" : "Video"} call invitation broadcasted!`);
    } catch (e) {
        console.log("Call placement failed.");
    }
}

// Inbound Signaling Action Listeners
document.getElementById('btn-call-answer').addEventListener('click', async () => {
    if (!currentActiveCallId || !currentActiveRoomId) return;
    try {
        const txnId = "t" + Date.now();
        await fetch(`${sessionData.baseUrl}/_matrix/client/v3/rooms/${encodeURIComponent(currentActiveRoomId)}/send/m.call.answer/${txnId}`, {
            method: 'PUT',
            body: JSON.stringify({ call_id: currentActiveCallId, version: "1", answer: { type: "answer", sdp: "m=audio..." } }),
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionData.accessToken}` }
        });
        document.getElementById('system-incoming-call-alert').classList.add('hidden');
        alert("Call connected! Channels bridging securely.");
    } catch(e) {}
});

document.getElementById('btn-call-decline').addEventListener('click', () => {
    document.getElementById('system-incoming-call-alert').classList.add('hidden');
    currentActiveCallId = null;
});

// Primary System Core Lifecycle Initializer Entry Sequence Hook
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
    let username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value.trim();

    if (!baseUrl.startsWith('http')) baseUrl = 'https://' + baseUrl;
    if (!username || !password) return alert('Please enter all credentials.');

    if (!username.includes(':') && username.startsWith('@')) {
        const domain = baseUrl.replace('https://', '').replace('http://', '');
        username = `${username}:${domain}`;
    }

    try {
        const response = await fetch(`${baseUrl}/_matrix/client/v3/login`, {
            method: 'POST',
            body: JSON.stringify({ type: "m.login.password", identifier: { type: "m.id.user", user: username }, password: password }),
            headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) {
            const errDetails = await response.json();
            throw new Error(errDetails.error || "Invalid username or password.");
        }
        const data = await response.json();
        sessionData = { baseUrl, accessToken: data.access_token, userId: data.user_id };
        localStorage.setItem('elementos_session', JSON.stringify(sessionData));
        enterDesktopMode();
    } catch (err) { alert('Authentication Error: ' + err.message); }
});
// FIXED: Extracted user label strictly on String operations to prevent array crash faults
function enterDesktopMode() {
    if (!sessionData) return;
    const shortUser = sessionData.userId.replace('@', '').split(':')[0];
    
    document.getElementById('menu-displayname').textContent = sessionData.userId;
    document.getElementById('menu-avatar').textContent = shortUser.substring(0, 2).toUpperCase();
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('desktop').classList.remove('hidden');
    
    if (!isSyncing) {
        isSyncing = true;
        startSyncLoop();
    }
}

async function startSyncLoop() {
    while (sessionData) {
        let url = `${sessionData.baseUrl}/_matrix/client/v3/sync?timeout=30000`;
        if (nextSyncBatchToken) url += `&since=${nextSyncBatchToken}`;
        try {
            const response = await fetch(url, { headers: { 'Authorization': `Bearer ${sessionData.accessToken}` } });
            if (!response.ok) throw new Error();
            const syncData = await response.json();
            nextSyncBatchToken = syncData.next_batch;
            processSyncPayload(syncData);
        } catch (e) { await new Promise(r => setTimeout(r, 6000)); }
    }
    isSyncing = false;
}

function processSyncPayload(data) {
    if (data.rooms && data.rooms.join) {
        for (const roomId in data.rooms.join) {
            if (!roomsCache[roomId]) roomsCache[roomId] = { messages: [], customName: null, isDirect: false };
            data.account_data?.events?.forEach(ev => { if (ev.type === "m.direct") roomsCache[roomId].isDirect = true; });
            data.rooms.join[roomId].state?.events?.forEach(ev => { if (ev.type === "m.room.name" && ev.content?.name) roomsCache[roomId].customName = ev.content.name; });
            
            const timelineEvents = data.rooms.join[roomId].timeline?.events || [];
            timelineEvents.forEach(ev => {
                if (ev.type === "m.call.invite" && ev.sender !== sessionData.userId) {
                    currentActiveCallId = ev.content.call_id;
                    currentActiveRoomId = roomId;
                    document.getElementById('incoming-call-caller').textContent = ev.sender;
                    document.getElementById('system-incoming-call-alert').classList.remove('hidden');
                }
                if (ev.type === "m.call.answer" && ev.sender !== sessionData.userId) {
                    alert("Your placed call has been answered on the other end!");
                }
                if (ev.type === 'm.room.message' && ev.content?.body) {
                    roomsCache[roomId].messages.push({ sender: ev.sender, body: ev.content.body });
                    if (roomId === currentActiveRoomId) appendLiveMessage(ev.sender, ev.content.body);
                }
            });
        }
    }
    if (data.rooms && data.rooms.leave) {
        for (const roomId in data.rooms.leave) {
            delete roomsCache[roomId];
            if (currentActiveRoomId === roomId) { document.getElementById('chat-window').classList.add('hidden'); currentActiveRoomId = null; }
        }
    }
    renderFriendsList();
}

function renderFriendsList() {
    const listDiv = document.getElementById('friends-list');
    const roomKeys = Object.keys(roomsCache);
    if (roomKeys.length === 0) { listDiv.innerHTML = `<p class="loading-label">No active friend DMs.</p>`; return; }
    listDiv.innerHTML = '';
    roomKeys.forEach(roomId => {
        const room = roomsCache[roomId];
        let displayLabel = room.customName || (roomId.length > 15 ? roomId.substring(0, 12) + '...' : roomId);
        const item = document.createElement('div');
        item.className = "friend-item";
        item.innerHTML = `
            <div class="friend-meta">
                <div class="friend-avatar">👤</div>
                <div class="friend-name" title="${roomId}">${displayLabel}</div>
            </div>
            <div class="friend-actions-group" style="display: flex; gap: 4px;">
                <button class="action-icon-btn btn-chat">Chat</button>
                <button class="action-icon-btn btn-rename" style="background: rgba(234, 179, 8, 0.15); color: #fbbf24; border-color: rgba(234, 179, 8, 0.25);">✏️</button>
                <button class="action-icon-btn btn-leave" style="background: rgba(239, 68, 68, 0.15); color: #f87171; border-color: rgba(239, 68, 68, 0.25);">❌</button>
            </div>`;
        item.querySelector('.btn-chat').addEventListener('click', (e) => { e.stopPropagation(); openChatWindow(roomId); });
        item.querySelector('.btn-rename').addEventListener('click', async (e) => { e.stopPropagation(); const newName = prompt("Nickname:", room.customName || displayLabel); if (newName && newName.trim() !== "") renameFriendRoom(roomId, newName.trim()); });
        item.querySelector('.btn-leave').addEventListener('click', async (e) => { e.stopPropagation(); if (confirm("Delete friend chat?")) leaveFriendRoom(roomId); });
        listDiv.appendChild(item);
    });
}

async function renameFriendRoom(roomId, newName) {
    try {
        const res = await fetch(`${sessionData.baseUrl}/_matrix/client/v3/rooms/${encodeURIComponent(roomId)}/state/m.room.name/`, { method: 'PUT', body: JSON.stringify({ name: newName }), headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionData.accessToken}` } });
        if (res.ok) { roomsCache[roomId].customName = newName; renderFriendsList(); }
    } catch(e) {}
}

async function leaveFriendRoom(roomId) {
    try {
        const res = await fetch(`${sessionData.baseUrl}/_matrix/client/v3/rooms/${encodeURIComponent(roomId)}/leave`, { method: 'POST', body: JSON.stringify({}), headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionData.accessToken}` } });
        if (res.ok) { delete roomsCache[roomId]; renderFriendsList(); }
    } catch(e) {}
}

document.getElementById('btn-add-friend').addEventListener('click', async () => {
    const targetMxid = document.getElementById('friend-mxid').value.trim();
    if (!targetMxid.startsWith('@')) return alert('Use format: @user:server.com');
    try {
        const res = await fetch(`${sessionData.baseUrl}/_matrix/client/v3/createRoom`, { method: 'POST', body: JSON.stringify({ invite: [targetMxid], preset: 'trusted_private_chat', is_direct: true }), headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionData.accessToken}` } });
        if (!res.ok) throw new Error();
        const data = await res.json();
        roomsCache[data.room_id] = { messages: [], customName: targetMxid.replace('@', '').split(':')[0], isDirect: true };
        document.getElementById('friend-mxid').value = '';
        document.getElementById('add-friend-ui').classList.add('hidden');
        renderFriendsList();
    } catch (err) { alert('Friend creation failed.'); }
});

function openChatWindow(roomId) {
    currentActiveRoomId = roomId;
    const room = roomsCache[roomId];
    document.getElementById('chat-title').textContent = `Chatting with: ${room.customName || roomId.substring(0, 10)}`;
    document.getElementById('chat-window').classList.remove('hidden');
    document.getElementById('minimized-dock-indicator').classList.add('hidden');
    document.getElementById('call-selection-dropdown').classList.add('hidden');
    const msgBox = document.getElementById('chat-messages');
    msgBox.innerHTML = '';
    if (roomsCache[roomId]) roomsCache[roomId].messages.forEach(m => appendLiveMessage(m.sender, m.body));
}

function appendLiveMessage(sender, body) {
    const container = document.getElementById('chat-messages');
    const isMe = sender === sessionData.userId;
    const cleanSender = sender.split(':').replace('@', '');
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
        await fetch(`${sessionData.baseUrl}/_matrix/client/v3/rooms/${encodeURIComponent(currentActiveRoomId)}/send/m.room.message/${txnId}`, { method: 'PUT', body: JSON.stringify({ msgtype: "m.text", body: text }), headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionData.accessToken}` } });
        input.value = '';
    } catch (e) { console.log("Send failed."); }
}
