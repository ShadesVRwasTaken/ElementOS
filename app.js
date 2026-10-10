let sessionData = null;
let currentActiveRoomId = null;
let nextSyncBatchToken = null;
let roomsCache = {};

function toggleElement(id) {
    document.getElementById(id).classList.toggle('hidden');
}

document.getElementById('taskbar-profile').addEventListener('click', () => toggleElement('friends-panel'));
document.getElementById('btn-show-add-friend').addEventListener('click', () => toggleElement('add-friend-ui'));

// Automatic session check on page boot
window.addEventListener('DOMContentLoaded', () => {
    const saved = localStorage.getItem('elementos_session');
    if (saved) {
        sessionData = JSON.parse(saved);
        enterDesktopMode();
    }
});

// Native HTTP Matrix Login
document.getElementById('btn-login').addEventListener('click', async () => {
    let baseUrl = document.getElementById('login-homeserver').value.trim();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value.trim();

    if (!baseUrl.startsWith('http')) baseUrl = 'https://' + baseUrl;
    if (!username || !password) return alert('Missing fields!');

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

        if (!response.ok) throw new Error(await response.text());
        const data = await response.json();

        sessionData = {
            baseUrl: baseUrl,
            accessToken: data.access_token,
            userId: data.user_id
        };

        localStorage.setItem('elementos_session', JSON.stringify(sessionData));
        enterDesktopMode();
    } catch (err) {
        alert('Login failed: ' + err.message);
    }
});

function enterDesktopMode() {
    document.getElementById('user-displayname').textContent = sessionData.userId.split(':')[0];
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('desktop').classList.remove('hidden');
    
    // Begin background network synchronization loop
    startSyncLoop();
}

// Background long polling loop mimicking matrix-js-sdk sync stream
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
            // Cool down on network drops before re-trying loop
            await new Promise(r => setTimeout(r, 10000));
        }
    }
}

function processSyncPayload(data) {
    if (data.rooms && data.rooms.join) {
        for (const roomId in data.rooms.join) {
            if (!roomsCache[roomId]) roomsCache[roomId] = { messages: [], name: roomId };
            
            // Extract Timeline Events
            const timelineEvents = data.rooms.join[roomId].timeline?.events || [];
            timelineEvents.forEach(ev => {
                if (ev.type === 'm.room.message') {
                    roomsCache[roomId].messages.push({
                        sender: ev.sender,
                        body: ev.content?.body || ''
                    });
                    
                    // If live chat is focused on this room, inject message immediately
                    if (roomId === currentActiveRoomId) {
                        appendLiveMessage(ev.sender, ev.content?.body || '');
                    }
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
        listDiv.innerHTML = `<p class="text-xs text-gray-500 text-center py-8">No active chats found.</p>`;
        return;
    }

    listDiv.innerHTML = '';
    roomKeys.forEach(roomId => {
        const shortName = roomId.substring(0, 8);
        const item = document.createElement('div');
        item.className = "flex items-center justify-between p-2.5 hover:bg-white/5 rounded-xl cursor-pointer transition";
        item.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="w-9 h-9 bg-teal-800 rounded-full flex items-center justify-center font-bold text-xs">💬</div>
                <div class="truncate max-w-[130px]">
                    <p class="text-sm font-medium text-gray-200 truncate">${shortName}...</p>
                </div>
            </div>
            <div class="flex gap-1">
                <button class="btn-msg p-1.5 hover:bg-white/10 rounded-lg text-teal-400 text-xs">💬</button>
                <button class="btn-call p-1.5 hover:bg-white/10 rounded-lg text-emerald-400 text-xs">📞</button>
            </div>
        `;

        item.querySelector('.btn-msg').addEventListener('click', () => openChatWindow(roomId));
        item.querySelector('.btn-call').addEventListener('click', () => alert("Webrtc channels initializing..."));
        listDiv.appendChild(item);
    });
}

// Room invitation setup
document.getElementById('btn-add-friend').addEventListener('click', async () => {
    const targetMxid = document.getElementById('friend-mxid').value.trim();
    if (!targetMxid.startsWith('@')) return alert('User ID format must be @username:server.com');

    try {
        const res = await fetch(`${sessionData.baseUrl}/_matrix/client/v3/createRoom`, {
            method: 'POST',
            body: JSON.stringify({
                invite: [targetMxid],
                preset: 'trusted_private_chat',
                is_direct: true
            }),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionData.accessToken}`
            }
        });
        if (!res.ok) throw new Error(await res.text());
        
        alert('Direct Chat Room successfully established!');
        document.getElementById('friend-mxid').value = '';
        document.getElementById('add-friend-ui').classList.add('hidden');
    } catch (err) {
        alert('Failed generating room invite: ' + err.message);
    }
});

function openChatWindow(roomId) {
    currentActiveRoomId = roomId;
    document.getElementById('chat-title').textContent = `Room Chat: ${roomId.substring(0, 10)}`;
    document.getElementById('chat-window').classList.remove('hidden');
    
    const msgBox = document.getElementById('chat-messages');
    msgBox.innerHTML = '';
    
    // Load local history from sync cache
    if (roomsCache[roomId]) {
        roomsCache[roomId].messages.forEach(m => appendLiveMessage(m.sender, m.body));
    }
}

function appendLiveMessage(sender, body) {
    const container = document.getElementById('chat-messages');
    const isMe = sender === sessionData.userId;

    const msgHtml = `
        <div class="flex flex-col ${isMe ? 'items-end' : 'items-start'}">
            <span class="text-[10px] text-gray-500 mb-0.5">${sender.split(':')[0]}</span>
            <div class="${isMe ? 'bg-teal-600 text-white rounded-l-xl rounded-tr-xl' : 'bg-white/10 text-gray-100 rounded-r-xl rounded-tl-xl'} px-3 py-2 max-w-[85%] break-words">
                ${body}
            </div>
        </div>
    `;
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
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionData.accessToken}`
            }
        });
        input.value = '';
    } catch (e) {
        alert('Failed transmission.');
    }
}

document.getElementById('btn-logout').addEventListener('click', () => {
    localStorage.removeItem('elementos_session');
    window.location.reload();
});
