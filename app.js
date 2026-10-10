// Global System Environment Channels
let sessionData = null;
let currentActiveRoomId = null;
let nextSyncBatchToken = null;
let roomsCache = {};
let isSyncing = false;

// Custom Local Avatar Photo Registry Database Storage
let customFriendAvatars = JSON.parse(localStorage.getItem('os_friend_avatars') || '{}');
let targetAvatarUploadRoomId = null;

// Window Layout Geometric Context Cache Tracking States
let isChatFullscreen = false;
let regularWindowPosition = { top: "15%", left: "15%", width: "420px", height: "500px" };

const elementNotificationSound = new Audio('https://mixkit.co');

function toggleVisibility(id) {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('hidden');
}

// Bind System Shelf Tray Interface Click Handlers
document.getElementById('taskbar-status-tray').addEventListener('click', () => toggleVisibility('friends-panel'));
document.getElementById('btn-show-add-friend').addEventListener('click', () => toggleVisibility('add-friend-ui'));
document.getElementById('btn-cancel-friend').addEventListener('click', () => toggleVisibility('add-friend-ui'));

// Active Hardware Chromebook Battery Synchronization API Component Module
function initBatterySync() {
    const batteryEl = document.getElementById('tray-battery');
    if (navigator.getBattery) {
        navigator.getBattery().then(battery => {
            function updateBatteryUI() {
                const pct = Math.floor(battery.level * 100);
                batteryEl.textContent = `${battery.charging ? '⚡' : '🔋'} ${pct}%`;
            }
            updateBatteryUI();
            battery.addEventListener('levelchange', updateBatteryUI);
            battery.addEventListener('chargingchange', updateBatteryUI);
        });
    } else {
        batteryEl.textContent = '🔋 100%';
    }
}

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

// ChromeOS Settings & Customization Initialization Handlers
function initSystemSettings() {
    const colorPicker = document.getElementById('setting-theme-color');
    const bgUpload = document.getElementById('setting-wallpaper-upload');
    const defaultWallpaper = 'https://unsplash.com';

    // Load cached preferences safely
    const savedColor = localStorage.getItem('os_theme_color') || '#0d9488';
    colorPicker.value = savedColor;
    document.documentElement.style.setProperty('--theme-primary', savedColor);

    const savedBg = localStorage.getItem('os_desktop_bg') || defaultWallpaper;
    document.body.style.backgroundImage = `url('${savedBg}')`;

    // Bind setting adjustments listeners
    colorPicker.addEventListener('input', (e) => {
        const val = e.target.value;
        document.documentElement.style.setProperty('--theme-primary', val);
        localStorage.setItem('os_theme_color', val);
    });

    bgUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const imgData = event.target.result;
                document.body.style.backgroundImage = `url('${imgData}')`;
                localStorage.setItem('os_desktop_bg', imgData);
            };
            reader.readAsDataURL(file);
        }
    });

    // Native Settings Workspace Reset Actions
    document.getElementById('btn-reset-color').addEventListener('click', () => {
        colorPicker.value = '#0d9488';
        document.documentElement.style.setProperty('--theme-primary', '#0d9488');
        localStorage.setItem('os_theme_color', '#0d9488');
    });

    document.getElementById('btn-reset-wallpaper').addEventListener('click', () => {
        document.body.style.backgroundImage = `url('${defaultWallpaper}')`;
        localStorage.setItem('os_desktop_bg', defaultWallpaper);
    });

    // Handle Split Layout Menu Tab Toggling
    document.getElementById('tab-btn-friends').addEventListener('click', () => switchDrawerTab('friends'));
    document.getElementById('tab-btn-settings').addEventListener('click', () => switchDrawerTab('settings'));
}

function switchDrawerTab(target) {
    const tabFriends = document.getElementById('tab-btn-friends');
    const tabSettings = document.getElementById('tab-btn-settings');
    const contentFriends = document.getElementById('tab-content-friends');
    const contentSettings = document.getElementById('tab-content-settings');

    if (target === 'friends') {
        tabFriends.classList.add('active-tab'); tabSettings.classList.remove('active-tab');
        contentFriends.classList.remove('hidden'); contentSettings.classList.add('hidden');
    } else {
        tabSettings.classList.add('active-tab'); tabFriends.classList.remove('active-tab');
        contentSettings.classList.remove('hidden'); contentFriends.classList.add('hidden');
    }
}

// Window Management Actions Mapping
document.getElementById('btn-close-chat').addEventListener('click', () => {
    document.getElementById('chat-window').classList.add('hidden');
    document.getElementById('minimized-dock-indicator').classList.add('hidden');
    currentActiveRoomId = null;
});

document.getElementById('btn-minimize-chat').addEventListener('click', () => {
    const room = roomsCache[currentActiveRoomId];
    document.getElementById('minimized-dock-label').textContent = room?.customName || "Active Chat";
    document.getElementById('chat-window').classList.add('hidden');
    document.getElementById('minimized-dock-indicator').classList.remove('hidden');
});

document.getElementById('minimized-dock-indicator').addEventListener('click', () => {
    document.getElementById('chat-window').classList.remove('hidden');
    document.getElementById('minimized-dock-indicator').classList.add('hidden');
});

document.getElementById('btn-fullscreen-chat').addEventListener('click', () => {
    const win = document.getElementById('chat-window');
    const btn = document.getElementById('btn-fullscreen-chat');
    if (!isChatFullscreen) {
        regularWindowPosition.top = win.style.top || "15%"; regularWindowPosition.left = win.style.left || "15%";
        regularWindowPosition.width = win.style.width || "420px"; regularWindowPosition.height = win.style.height || "500px";
        win.style.top = "0px"; win.style.left = "0px"; win.style.width = "100vw"; win.style.height = "calc(100vh - 3.25rem)";
        btn.textContent = "❐"; isChatFullscreen = true;
    } else {
        win.style.top = regularWindowPosition.top; win.style.left = regularWindowPosition.left; win.style.width = regularWindowPosition.width; win.style.height = regularWindowPosition.height;
        btn.textContent = "🔲"; isChatFullscreen = false;
    }
});

// FIXED: Resolves notification username tag strings using active local custom nicknames
function triggerSystemMessageToast(roomId, body) {
    const toast = document.getElementById('system-message-toast');
    const room = roomsCache[roomId];
    let displayTitle = room?.customName || "Friend Chat";
    
    document.getElementById('toast-sender-title').textContent = `Message from ${displayTitle}`;
    document.getElementById('toast-message-body').textContent = body;
    try { elementNotificationSound.currentTime = 0; elementNotificationSound.play(); } catch(e){}
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 4000);
}

document.getElementById('btn-logout').addEventListener('click', () => { localStorage.removeItem('elementos_session'); window.location.reload(); });
// Native Matrix Core Client Initializer Hook Handlers
window.addEventListener('load', () => {
    runSystemClock(); makeWindowDraggable(); initBatterySync(); initSystemSettings();
    document.getElementById('chat-window').classList.add('hidden');
    
    // Bind Local Contact Avatar File upload observer proxy changes
    document.getElementById('friend-avatar-file-proxy').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && targetAvatarUploadRoomId) {
            const reader = new FileReader();
            reader.onload = (event) => {
                customFriendAvatars[targetAvatarUploadRoomId] = event.target.result;
                localStorage.setItem('os_friend_avatars', JSON.stringify(customFriendAvatars));
                renderFriendsList();
            };
            reader.readAsDataURL(file);
        }
    });

    try {
        const saved = localStorage.getItem('elementos_session');
        if (saved) { sessionData = JSON.parse(saved); enterDesktopMode(); }
    } catch (err) {}
});

document.getElementById('btn-login').addEventListener('click', async () => {
    let baseUrl = document.getElementById('login-homeserver').value.trim();
    let username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value.trim();
    if (!baseUrl.startsWith('http')) baseUrl = 'https://' + baseUrl;
    if (!username || !password) return alert('Missing fields.');
    if (!username.includes(':') && username.startsWith('@')) username = `${username}:${baseUrl.replace('https://','').replace('http://','')}`;

    try {
        const response = await fetch(`${baseUrl}/_matrix/client/v3/login`, { method: 'POST', body: JSON.stringify({ type: "m.login.password", identifier: { type: "m.id.user", user: username }, password: password }), headers: { 'Content-Type': 'application/json' } });
        if (!response.ok) throw new Error((await response.json()).error || "Login rejection.");
        const data = await response.json();
        sessionData = { baseUrl, accessToken: data.access_token, userId: data.user_id };
        localStorage.setItem('elementos_session', JSON.stringify(sessionData));
        enterDesktopMode();
    } catch (err) { alert('Authentication Error: ' + err.message); }
});

function enterDesktopMode() {
    if (!sessionData) return;
    document.getElementById('menu-displayname').textContent = sessionData.userId;
    document.getElementById('menu-avatar').textContent = sessionData.userId.replace('@','').substring(0,2).toUpperCase();
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('desktop').classList.remove('hidden');
    if (!isSyncing) { isSyncing = true; startSyncLoop(); }
}

async function startSyncLoop() {
    while (sessionData) {
        let url = `${sessionData.baseUrl}/_matrix/client/v3/sync?timeout=30000`;
        if (nextSyncBatchToken) url += `&since=${nextSyncBatchToken}`;
        try {
            const response = await fetch(url, { headers: { 'Authorization': `Bearer ${sessionData.accessToken}` } });
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
            if (!roomsCache[roomId]) roomsCache[roomId] = { messages: [], customName: null };
            data.rooms.join[roomId].state?.events?.forEach(ev => { if (ev.type === "m.room.name" && ev.content?.name) roomsCache[roomId].customName = ev.content.name; });
            data.rooms.join[roomId].timeline?.events?.forEach(ev => {
                if (ev.type === 'm.room.message' && ev.content?.body) {
                    roomsCache[roomId].messages.push({ sender: ev.sender, body: ev.content.body });
                    if (ev.sender !== sessionData.userId && (roomId !== currentActiveRoomId || document.getElementById('chat-window').classList.contains('hidden'))) {
                        triggerSystemMessageToast(roomId, ev.content.body);
                    }
                    if (roomId === currentActiveRoomId) appendLiveMessage(ev.sender, ev.content.body);
                }
            });
        }
    }
    if (data.rooms && data.rooms.leave) data.rooms.leave.forEach(roomId => { delete roomsCache[roomId]; if(currentActiveRoomId===roomId){document.getElementById('chat-window').classList.add('hidden');currentActiveRoomId=null;} });
    renderFriendsList();
}
function renderFriendsList() {
    const listDiv = document.getElementById('friends-list');
    const roomKeys = Object.keys(roomsCache);
    if (roomKeys.length === 0) { listDiv.innerHTML = `<p class="loading-label">No active channels.</p>`; return; }
    listDiv.innerHTML = '';
    roomKeys.forEach(roomId => {
        const room = roomsCache[roomId];
        let displayLabel = room.customName || (roomId.length > 15 ? roomId.substring(0, 12) + '...' : roomId);
        const savedAvatar = customFriendAvatars[roomId];

        const item = document.createElement('div');
        item.className = "friend-item";
        item.innerHTML = `
            <div class="friend-meta">
                <div class="friend-avatar">👤</div>
                <div class="friend-name" title="${roomId}">${displayLabel}</div>
            </div>
            <div class="friend-actions-group">
                <button class="action-icon-btn btn-chat">Chat</button>
                <button class="action-icon-btn btn-rename">✏️</button>
                <button class="action-icon-btn btn-avatar-up" style="background: rgba(59, 130, 246, 0.15); color: #60a5fa; border-color: rgba(59, 130, 246, 0.25);">🖼️</button>
                <button class="action-icon-btn btn-leave" style="background: rgba(239, 68, 68, 0.15); color: #f87171; border-color: rgba(239, 68, 68, 0.25);">❌</button>
            </div>`;

        if (savedAvatar) {
            const avatarEl = item.querySelector('.friend-avatar');
            avatarEl.style.backgroundImage = `url('${savedAvatar}')`;
            avatarEl.style.textIndent = '-9999px';
        }

        item.querySelector('.btn-chat').addEventListener('click', () => openChatWindow(roomId));
        item.querySelector('.btn-leave').addEventListener('click', () => { if(confirm("Delete friend DM?")) leaveFriendRoom(roomId); });
        
        item.querySelector('.btn-rename').addEventListener('click', async (e) => {
            e.stopPropagation();
            const newName = prompt("Enter a nickname for this friend:", room.customName || displayLabel);
            if (newName && newName.trim() !== "") {
                renameFriendRoom(roomId, newName.trim());
            }
        });

        item.querySelector('.btn-avatar-up').addEventListener('click', (e) => {
            e.stopPropagation();
            targetAvatarUploadRoomId = roomId;
            document.getElementById('friend-avatar-file-proxy').click();
        });

        listDiv.appendChild(item);
    });
}

async function renameFriendRoom(roomId, newName) {
    try {
        const res = await fetch(`${sessionData.baseUrl}/_matrix/client/v3/rooms/${encodeURIComponent(roomId)}/state/m.room.name/`, { method: 'PUT', body: JSON.stringify({ name: newName }), headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionData.accessToken}` } });
        if (res.ok) {
            roomsCache[roomId].customName = newName;
            renderFriendsList();
        }
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
    if (!targetMxid.startsWith('@')) return alert('Use handle format: @user:server.com');
    try {
        const res = await fetch(`${sessionData.baseUrl}/_matrix/client/v3/createRoom`, { method: 'POST', body: JSON.stringify({ invite: [targetMxid], preset: 'trusted_private_chat', is_direct: true }), headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionData.accessToken}` } });
        const data = await res.json();
        roomsCache[data.room_id] = { messages: [], customName: targetMxid.replace('@','').split(':')[0] };
        document.getElementById('friend-mxid').value = ''; document.getElementById('add-friend-ui').classList.add('hidden');
        renderFriendsList();
    } catch (err) { alert('Friend creation failed.'); }
});

function openChatWindow(roomId) {
    currentActiveRoomId = roomId;
    const room = roomsCache[roomId];
    document.getElementById('chat-title').textContent = `Chatting with: ${room.customName || roomId.substring(0, 10)}`;
    document.getElementById('chat-window').classList.remove('hidden');
    document.getElementById('minimized-dock-indicator').classList.add('hidden');
    const msgBox = document.getElementById('chat-messages');
    msgBox.innerHTML = '';
    if (roomsCache[roomId]) roomsCache[roomId].messages.forEach(m => appendLiveMessage(m.sender, m.body));
}

function appendLiveMessage(sender, body) {
    const container = document.getElementById('chat-messages');
    const isMe = sender === sessionData.userId;
    const msgHtml = `
        <div class="msg-wrap ${isMe ? 'me' : 'them'}">
            <span class="msg-sender">${sender.split(':')[0].replace('@','')}</span>
            <div class="msg-bubble">${body}</div>
        </div>`;
    container.insertAdjacentHTML('beforeend', msgHtml); container.scrollTop = container.scrollHeight;
}

document.getElementById('btn-send').addEventListener('click', sendMessage);
document.getElementById('chat-input').addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });

async function sendMessage() {
    const input = document.getElementById('chat-input'); const text = input.value.trim();
    if (!text || !currentActiveRoomId) return;
    try {
        const txnId = Date.now();
        await fetch(`${sessionData.baseUrl}/_matrix/client/v3/rooms/${encodeURIComponent(currentActiveRoomId)}/send/m.room.message/${txnId}`, { method: 'PUT', body: JSON.stringify({ msgtype: "m.text", body: text }), headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionData.accessToken}` } });
        input.value = '';
    } catch (e) {}
}
