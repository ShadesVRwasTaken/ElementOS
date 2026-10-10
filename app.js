// Global System Environment Channels
let sessionData = null;
let currentActiveRoomId = null;
let nextSyncBatchToken = null;
let roomsCache = {};
let isSyncing = false;

// Custom Local Repositories for Apps, Avatars, and Tracked Members
let customFriendAvatars = JSON.parse(localStorage.getItem('os_friend_avatars') || '{}');
let osInstalledApps = JSON.parse(localStorage.getItem('os_installed_apps') || '[]');
let registeredFriendHandles = JSON.parse(localStorage.getItem('os_known_friends') || '[]');
let targetAvatarUploadRoomId = null;

// Window Layout geometric context caching states
let regularWindowPositions = {};

const elementNotificationSound = new Audio('https://mixkit.co');

function toggleVisibility(id) {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('hidden');
}

// Bind System Shelf Tray Interface Click Handlers
document.getElementById('taskbar-status-tray').addEventListener('click', () => toggleVisibility('friends-panel'));
document.getElementById('btn-show-add-friend').addEventListener('click', () => toggleVisibility('add-friend-ui'));
document.getElementById('btn-cancel-friend').addEventListener('click', () => toggleVisibility('add-friend-ui'));

document.getElementById('btn-show-create-group').addEventListener('click', () => {
    populateGroupMembersCheckboxes();
    toggleVisibility('create-group-ui');
});
document.getElementById('btn-cancel-group').addEventListener('click', () => toggleVisibility('create-group-ui'));

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
    } else { batteryEl.textContent = '🔋 100%'; }
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
// Advanced Resizable, Draggable, and Chrome Snap-Splitting Window Engine Component
function initInteractiveOSWindow(winId, headerId) {
    const win = document.getElementById(winId);
    const header = document.getElementById(headerId);
    const resizeHandle = win.querySelector('.window-resize-handle');
    const shield = win.querySelector('.iframe-drag-shield');
    
    let posX = 0, posY = 0, mouseX = 0, mouseY = 0;
    regularWindowPositions[winId] = { isFullscreen: false, top: "15%", left: "15%", width: "420px", height: "500px" };

    // Draggable Heading Setup
    header.onmousedown = (e) => {
        if (regularWindowPositions[winId].isFullscreen) return;
        if (e.target.closest('.window-controls-shelf')) return;
        e.preventDefault(); if (shield) shield.classList.remove('hidden');
        mouseX = e.clientX; mouseY = e.clientY;
        document.onmouseup = () => { document.onmouseup = null; document.onmousemove = null; if (shield) shield.classList.add('hidden'); };
        document.onmousemove = (ev) => {
            ev.preventDefault(); posX = mouseX - ev.clientX; posY = mouseY - ev.clientY; mouseX = ev.clientX; mouseY = ev.clientY;
            win.style.top = (win.offsetTop - posY) + "px"; win.style.left = (win.offsetLeft - posX) + "px";
        };
    };

    // Resizable Corner Handle Grip Setup
    if (resizeHandle) {
        resizeHandle.onmousedown = (e) => {
            e.preventDefault(); if (shield) shield.classList.remove('hidden');
            document.onmouseup = () => { document.onmouseup = null; document.onmousemove = null; if (shield) shield.classList.add('hidden'); };
            document.onmousemove = (ev) => {
                ev.preventDefault(); const w = ev.clientX - win.offsetLeft; const h = ev.clientY - win.offsetTop;
                if (w > 280) win.style.width = w + "px"; if (h > 200) win.style.height = h + "px";
            };
        };
    }

    // Chrome Window Splitter Snap Controls Setup
    const snapLeftBtn = win.querySelector('.btn-snap-left');
    const snapRightBtn = win.querySelector('.btn-snap-right');
    if (snapLeftBtn && snapRightBtn) {
        snapLeftBtn.addEventListener('click', () => {
            regularWindowPositions[winId].isFullscreen = false;
            win.style.top = "0px"; win.style.left = "0px"; win.style.width = "50vw"; win.style.height = "calc(100vh - 3.25rem)";
        });
        snapRightBtn.addEventListener('click', () => {
            regularWindowPositions[winId].isFullscreen = false;
            win.style.top = "0px"; win.style.left = "50vw"; win.style.width = "50vw"; win.style.height = "calc(100vh - 3.25rem)";
        });
    }

    // Fullscreen Toggler Logic Implementation Block
    const fsBtn = win.querySelector('#btn-fullscreen-chat') || win.querySelector('.btn-fullscreen-app');
    if (fsBtn) {
        fsBtn.addEventListener('click', () => {
            const state = regularWindowPositions[winId];
            if (!state.isFullscreen) {
                state.top = win.style.top || "15%"; state.left = win.style.left || "15%";
                state.width = win.style.width || "420px"; state.height = win.style.height || "500px";
                win.style.top = "0px"; win.style.left = "0px"; win.style.width = "100vw"; win.style.height = "calc(100vh - 3.25rem)";
                fsBtn.textContent = "❐"; state.isFullscreen = true;
            } else {
                win.style.top = state.top; win.style.left = state.left; win.style.width = state.width; win.style.height = state.height;
                fsBtn.textContent = "🔲"; state.isFullscreen = false;
            }
        });
    }
}

// Settings Customization Handlers
function initSystemSettings() {
    const colorPicker = document.getElementById('setting-theme-color');
    const bgUpload = document.getElementById('setting-wallpaper-upload');
    const defaultWallpaper = 'https://unsplash.com';

    const savedColor = localStorage.getItem('os_theme_color') || '#0d9488';
    colorPicker.value = savedColor; document.documentElement.style.setProperty('--theme-primary', savedColor);
    document.body.style.backgroundImage = `url('${localStorage.getItem('os_desktop_bg') || defaultWallpaper}')`;

    colorPicker.addEventListener('input', (e) => { document.documentElement.style.setProperty('--theme-primary', e.target.value); localStorage.setItem('os_theme_color', e.target.value); });
    bgUpload.addEventListener('change', (e) => {
        const file = e.target.files;
        if (file) { const reader = new FileReader(); reader.onload = (event) => { document.body.style.backgroundImage = `url('${event.target.result}')`; localStorage.setItem('os_desktop_bg', event.target.result); }; reader.readAsDataURL(file); }
    });

    document.getElementById('btn-reset-color').addEventListener('click', () => { colorPicker.value = '#0d9488'; document.documentElement.style.setProperty('--theme-primary', '#0d9488'); localStorage.setItem('os_theme_color', '#0d9488'); });
    document.getElementById('btn-reset-wallpaper').addEventListener('click', () => { document.body.style.backgroundImage = `url('${defaultWallpaper}')`; localStorage.setItem('os_desktop_bg', defaultWallpaper); });

    document.getElementById('tab-btn-friends').addEventListener('click', () => switchDrawerTab('friends'));
    document.getElementById('tab-btn-apps').addEventListener('click', () => switchDrawerTab('apps'));
    document.getElementById('tab-btn-settings').addEventListener('click', () => switchDrawerTab('settings'));
}

function switchDrawerTab(target) {
    const tabs = ['friends', 'apps', 'settings'];
    tabs.forEach(t => {
        document.getElementById(`tab-btn-${t}`).classList.toggle('active-tab', t === target);
        document.getElementById(`tab-content-${t}`).classList.toggle('hidden', t !== target);
    });
}
// Window Management Actions Mapping
document.getElementById('btn-close-chat').addEventListener('click', () => { document.getElementById('chat-window').classList.add('hidden'); document.getElementById('minimized-dock-indicator').classList.add('hidden'); currentActiveRoomId = null; });
document.getElementById('btn-minimize-chat').addEventListener('click', () => { document.getElementById('minimized-dock-label').textContent = roomsCache[currentActiveRoomId]?.customName || "Active Chat"; document.getElementById('chat-window').classList.add('hidden'); document.getElementById('minimized-dock-indicator').classList.remove('hidden'); });
document.getElementById('minimized-dock-indicator').addEventListener('click', () => { document.getElementById('chat-window').classList.remove('hidden'); document.getElementById('minimized-dock-indicator').classList.add('hidden'); });

function triggerSystemMessageToast(roomId, body) {
    const toast = document.getElementById('system-message-toast');
    document.getElementById('toast-sender-title').textContent = `Message from ${roomsCache[roomId]?.customName || "Friend Chat"}`;
    document.getElementById('toast-message-body').textContent = body;
    try { elementNotificationSound.currentTime = 0; elementNotificationSound.play(); } catch(e){}
    toast.classList.remove('hidden'); setTimeout(() => toast.classList.add('hidden'), 4000);
}

document.getElementById('btn-logout').addEventListener('click', () => { localStorage.removeItem('elementos_session'); window.location.reload(); });

window.addEventListener('load', () => {
    runSystemClock(); initInteractiveOSWindow('chat-window', 'chat-header');
    initBatterySync(); initSystemSettings(); renderAppsEcosystem();
    
    document.getElementById('friend-avatar-file-proxy').addEventListener('change', (e) => {
        const file = e.target.files;
        if (file && targetAvatarUploadRoomId) {
            const reader = new FileReader(); reader.onload = (ev) => { customFriendAvatars[targetAvatarUploadRoomId] = ev.target.result; localStorage.setItem('os_friend_avatars', JSON.stringify(customFriendAvatars)); renderFriendsList(); }; reader.readAsDataURL(file);
        }
    });

    const saved = localStorage.getItem('elementos_session'); if (saved) { sessionData = JSON.parse(saved); enterDesktopMode(); }
});

document.getElementById('btn-login').addEventListener('click', async () => {
    let baseUrl = document.getElementById('login-homeserver').value.trim(); let username = document.getElementById('login-username').value.trim(); const password = document.getElementById('login-password').value.trim();
    if (!baseUrl.startsWith('http')) baseUrl = 'https://' + baseUrl; if (!username || !password) return alert('Missing fields.');
    if (!username.includes(':') && username.startsWith('@')) username = `${username}:${baseUrl.replace('https://','').replace('http://','')}`;

    try {
        const response = await fetch(`${baseUrl}/_matrix/client/v3/login`, { method: 'POST', body: JSON.stringify({ type: "m.login.password", identifier: { type: "m.id.user", user: username }, password }), headers: { 'Content-Type': 'application/json' } });
        if (!response.ok) { const errDetails = await response.json(); throw new Error(errDetails.error || "Login rejection."); }
        const data = await response.json();
        sessionData = { baseUrl, accessToken: data.access_token, userId: data.user_id }; localStorage.setItem('elementos_session', JSON.stringify(sessionData)); enterDesktopMode();
    } catch (err) { alert('Authentication Error: ' + err.message); }
});

function enterDesktopMode() {
    if (!sessionData) return;
    document.getElementById('menu-displayname').textContent = sessionData.userId;
    document.getElementById('menu-avatar').textContent = sessionData.userId.replace('@','').substring(0,2).toUpperCase();
    document.getElementById('login-screen').classList.add('hidden'); document.getElementById('desktop').classList.remove('hidden');
    if (!isSyncing) { isSyncing = true; startSyncLoop(); }
}
async function startSyncLoop() {
    while (sessionData) {
        let url = `${sessionData.baseUrl}/_matrix/client/v3/sync?timeout=30000`; if (nextSyncBatchToken) url += `&since=${nextSyncBatchToken}`;
        try {
            const response = await fetch(url, { headers: { 'Authorization': `Bearer ${sessionData.accessToken}` } });
            const syncData = await response.json(); nextSyncBatchToken = syncData.next_batch; processSyncPayload(syncData);
        } catch (e) { await new Promise(r => setTimeout(r, 6000)); }
    }
    isSyncing = false;
}

function processSyncPayload(data) {
    if (data.rooms && data.rooms.join) {
        for (const roomId in data.rooms.join) {
            if (!roomsCache[roomId]) roomsCache[roomId] = { messages: [], customName: null, isGroup: false };
            data.rooms.join[roomId].state?.events?.forEach(ev => { if (ev.type === "m.room.name" && ev.content?.name) roomsCache[roomId].customName = ev.content.name; });
            const timelineEvents = data.rooms.join[roomId].timeline?.events || [];
            timelineEvents.forEach(ev => {
                if (ev.type === 'm.room.message' && ev.content?.body) {
                    const isDup = roomsCache[roomId].messages.some(m => m.txnId === ev.event_id || (m.body === ev.content.body && m.origin_server_ts === ev.origin_server_ts));
                    if (!isDup) {
                        roomsCache[roomId].messages.push({ txnId: ev.event_id, sender: ev.sender, body: ev.content.body, origin_server_ts: ev.origin_server_ts });
                        if (ev.sender !== sessionData.userId && (roomId !== currentActiveRoomId || document.getElementById('chat-window').classList.contains('hidden'))) {
                            triggerSystemMessageToast(roomId, ev.content.body);
                        }
                        if (roomId === currentActiveRoomId) appendLiveMessage(ev.sender, ev.content.body, ev.origin_server_ts);
                    }
                }
            });
        }
    }
    renderFriendsList();
}
function renderFriendsList() {
    const listDiv = document.getElementById('friends-list'); const roomKeys = Object.keys(roomsCache);
    if (roomKeys.length === 0) { listDiv.innerHTML = `<p class="loading-label">No active channels.</p>`; return; }
    listDiv.innerHTML = '';
    roomKeys.forEach(roomId => {
        const room = roomsCache[roomId]; let displayLabel = room.customName || (roomId.length > 15 ? roomId.substring(0, 12) + '...' : roomId);
        const savedAvatar = customFriendAvatars[roomId];

        const item = document.createElement('div'); item.className = "friend-item";
        item.innerHTML = `
            <div class="friend-meta">
                <div class="friend-avatar">${room.isGroup ? '👥' : '👤'}</div>
                <div class="friend-name" title="${roomId}">${displayLabel}</div>
            </div>
            <div class="friend-actions-group">
                <button class="action-icon-btn btn-chat">Chat</button>
                <button class="action-icon-btn btn-rename">✏️</button>
                <button class="action-icon-btn btn-avatar-up">${room.isGroup ? '⚙' : '🖼️'}</button>
                <button class="action-icon-btn btn-leave" style="background: rgba(239, 68, 68, 0.15); color: #f87171; border-color: rgba(239, 68, 68, 0.25);">❌</button>
            </div>`;

        if (savedAvatar && !room.isGroup) { const avatarEl = item.querySelector('.friend-avatar'); avatarEl.style.backgroundImage = `url('${savedAvatar}')`; avatarEl.style.textIndent = '-9999px'; }
        item.querySelector('.btn-chat').addEventListener('click', () => openChatWindow(roomId));
        item.querySelector('.btn-leave').addEventListener('click', () => { if(confirm(room.isGroup ? "Leave group chat space?" : "Delete friend DM?")) leaveFriendRoom(roomId); });
        item.querySelector('.btn-rename').addEventListener('click', (e) => {
            e.stopPropagation(); const newName = prompt(room.isGroup ? "Rename group chat space:" : "Enter a nickname for this friend:", room.customName || displayLabel);
            if (newName && newName.trim() !== "") { roomsCache[roomId].customName = newName.trim(); renderFriendsList(); }
        });
        item.querySelector('.btn-avatar-up').addEventListener('click', (e) => { e.stopPropagation(); if (room.isGroup) { alert("Group profile configuration coming in a downstream core patch!"); } else { targetAvatarUploadRoomId = roomId; document.getElementById('friend-avatar-file-proxy').click(); } });
        listDiv.appendChild(item);
    });
}

document.getElementById('btn-add-friend').addEventListener('click', async () => {
    let targetMxid = document.getElementById('friend-mxid').value.trim(); if (!targetMxid) return;
    if (!targetMxid.startsWith('@')) { const domain = sessionData.baseUrl.replace('https://','').replace('http://',''); targetMxid = `@${targetMxid}:${domain}`; }
    try {
        const res = await fetch(`${sessionData.baseUrl}/_matrix/client/v3/createRoom`, { method: 'POST', body: JSON.stringify({ invite: [targetMxid], preset: 'trusted_private_chat', is_direct: true }), headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionData.accessToken}` } });
        const data = await res.json(); roomsCache[data.room_id] = { messages: [], customName: targetMxid.replace('@','').split(':'), isGroup: false };
        if (!registeredFriendHandles.includes(targetMxid)) { registeredFriendHandles.push(targetMxid); localStorage.setItem('os_known_friends', JSON.stringify(registeredFriendHandles)); }
        document.getElementById('friend-mxid').value = ''; document.getElementById('add-friend-ui').classList.add('hidden'); renderFriendsList();
    } catch (err) { alert('Friend creation failed.'); }
});

document.getElementById('btn-add-app').addEventListener('click', () => {
    const nameInput = document.getElementById('app-input-name'); const urlInput = document.getElementById('app-input-url');
    let name = nameInput.value.trim(); let url = urlInput.value.trim();
    if (!name || !url) return alert('Please complete fields.'); if (!url.startsWith('http')) url = 'https://' + url;
    
    // FIXED: Generates clean 1-letter or 2-letter uppercase initials text blocks matching your app nickname fields
    const words = name.split(/\s+/).filter(w => w.length > 0);
    let initialText = words.length >= 2 ? (words[0].substring(0,1) + words[1].substring(0,1)) : (words[0] ? words[0].substring(0,1) : 'A');
    initialText = initialText.toUpperCase();

    osInstalledApps.push({ id: "win_" + Date.now(), name, url, initials: initialText }); localStorage.setItem('os_installed_apps', JSON.stringify(osInstalledApps));
    nameInput.value = ''; urlInput.value = ''; renderAppsEcosystem();
});
function renderAppsEcosystem() {
    const listDiv = document.getElementById('os-apps-list'); 
    const gridDiv = document.getElementById('desktop-apps-grid');
    gridDiv.innerHTML = ''; 
    if (osInstalledApps.length === 0) { listDiv.innerHTML = `<p class="loading-label">No custom web apps installed.</p>`; return; }
    listDiv.innerHTML = '';
    osInstalledApps.forEach((app, index) => {
        const item = document.createElement('div'); 
        item.className = "friend-item";
        item.innerHTML = `
            <div class="friend-meta">
                <div class="friend-avatar" style="background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.1); font-size:0.75rem; font-weight:bold; color:var(--theme-primary); display:flex; align-items:center; justify-content:center; border-radius:50%; width:32px; height:32px;">${app.initials}</div>
                <div class="friend-name">${app.name}</div>
            </div>
            <div class="friend-actions-group">
                <button class="action-icon-btn btn-app-rename">✏️</button>
                <button class="action-icon-btn btn-app-del" style="background: rgba(239, 68, 68, 0.15); color: #f87171; border-color: rgba(239, 68, 68, 0.25);">❌</button>
            </div>`;
        item.querySelector('.btn-app-rename').addEventListener('click', () => { 
            const newName = prompt("Rename app:", app.name); 
            if (newName && newName.trim() !== "") { 
                const words = newName.trim().split(/\s+/).filter(w => w.length > 0);
                app.initials = words.length >= 2 ? (words[0].substring(0,1) + words[1].substring(0,1)) : words[0].substring(0,1);
                app.initials = app.initials.toUpperCase(); app.name = newName.trim(); 
                localStorage.setItem('os_installed_apps', JSON.stringify(osInstalledApps)); renderAppsEcosystem(); 
            } 
        });
        item.querySelector('.btn-app-del').addEventListener('click', () => { if(confirm("Uninstall app?")) { osInstalledApps.splice(index, 1); localStorage.setItem('os_installed_apps', JSON.stringify(osInstalledApps)); renderAppsEcosystem(); } });
        listDiv.appendChild(item);

        const iconNode = document.createElement('div'); 
        iconNode.className = "desktop-shortcut-node";
        iconNode.innerHTML = `
            <div class="desktop-app-icon" style="background:var(--theme-primary); color:#fff; display:flex; align-items:center; justify-content:center; font-size:1.1rem; font-weight:700; box-shadow:0 8px 16px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.25);">${app.initials}</div>
            <div class="desktop-app-label">${app.name}</div>`;
        
        iconNode.addEventListener('dblclick', () => {
            if (document.getElementById(app.id)) return;
            const container = document.getElementById('app-windows-layer');
            const winFrame = document.createElement('div');
            winFrame.id = app.id; winFrame.className = "window glass-panel flex-column liquid-glass";
            winFrame.style.top = "18%"; winFrame.style.left = "22%"; winFrame.style.width = "640px"; winFrame.style.height = "480px";
            winFrame.innerHTML = `
                <div class="window-header" id="head_${app.id}">
                    <span class="window-title">🚀 ${app.name}</span>
                    <div class="window-controls-shelf" style="display: flex; align-items: center; gap: 8px;">
                        <button class="btn-snap-left window-control-action" title="Snap Left">◀</button>
                        <button class="btn-snap-right window-control-action" title="Snap Right">▶</button>
                        <button class="btn-fullscreen-app window-control-action" title="Fullscreen">🔲</button>
                        <button class="window-close" id="close_${app.id}">&times;</button>
                    </div>
                </div>
                <div style="flex:1; width:100%; height:100%; background:#fff; position:relative;">
                    <div class="iframe-drag-shield hidden" style="position:absolute; inset:0; z-index:10; background:transparent;"></div>
                    <iframe src="${app.url}" style="width:100%; height:100%; border:none;"></iframe>
                </div>
                <div class="window-resize-handle"></div>`;
            container.appendChild(winFrame); 
            initInteractiveOSWindow(app.id, `head_${app.id}`);
            document.getElementById(`close_${app.id}`).addEventListener('click', () => winFrame.remove());
        });
        gridDiv.appendChild(iconNode);
    });
}
async function leaveFriendRoom(roomId) {
    try {
        const res = await fetch(`${sessionData.baseUrl}/_matrix/client/v3/rooms/${encodeURIComponent(roomId)}/leave`, { method: 'POST', body: JSON.stringify({}), headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionData.accessToken}` } });
        if (res.ok) { delete roomsCache[roomId]; renderFriendsList(); }
    } catch(e) {}
}

function openChatWindow(roomId) {
    currentActiveRoomId = roomId; const room = roomsCache[roomId];
    document.getElementById('chat-title').textContent = `${room.isGroup ? '👥 Group space' : 'Chatting with'}: ${room.customName || roomId.substring(0, 10)}`;
    document.getElementById('chat-window').classList.remove('hidden'); document.getElementById('minimized-dock-indicator').classList.add('hidden');
    const msgBox = document.getElementById('chat-messages'); msgBox.innerHTML = '';
    if (roomsCache[roomId]) roomsCache[roomId].messages.forEach(m => appendLiveMessage(m.sender, m.body, m.origin_server_ts));
}

function appendLiveMessage(sender, body, timestamp) {
    const container = document.getElementById('chat-messages'); const isMe = sender === sessionData.userId;
    const timeStr = timestamp ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
    const cleanSender = sender.replace('@', '').split(':')[0];
    const msgHtml = `
        <div class="msg-wrap ${isMe ? 'me' : 'them'}">
            <span class="msg-sender">${cleanSender} • <span style="opacity:0.6;">${timeStr}</span></span>
            <div class="msg-bubble">${body}</div>
        </div>`;
    container.insertAdjacentHTML('beforeend', msgHtml); container.scrollTop = container.scrollHeight;
}

document.getElementById('btn-send').addEventListener('click', sendMessage);
document.getElementById('chat-input').addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });

async function sendMessage() {
    const input = document.getElementById('chat-input'); const text = input.value.trim(); if (!text || !currentActiveRoomId) return;
    try {
        const txnId = Date.now();
        await fetch(`${sessionData.baseUrl}/_matrix/client/v3/rooms/${encodeURIComponent(currentActiveRoomId)}/send/m.room.message/${txnId}`, { method: 'PUT', body: JSON.stringify({ msgtype: "m.text", body: text }), headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionData.accessToken}` } });
        input.value = '';
    } catch (e) {}
}
