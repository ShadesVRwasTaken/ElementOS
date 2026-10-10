let matrixClient = null;
let currentActiveRoomId = null;

function toggleElement(id) {
    const el = document.getElementById(id);
    el.classList.toggle('hidden');
}

document.getElementById('taskbar-profile').addEventListener('click', () => {
    toggleElement('friends-panel');
});

document.getElementById('btn-show-add-friend').addEventListener('click', () => {
    toggleElement('add-friend-ui');
});

// Check if a saved session already exists on load
window.addEventListener('DOMContentLoaded', async () => {
    const savedSession = localStorage.getItem('elementos_session');
    if (savedSession) {
        const session = JSON.parse(savedSession);
        initializeClient(session.baseUrl, session.accessToken, session.userId);
    }
});

// Login button click handler
document.getElementById('btn-login').addEventListener('click', async () => {
    const baseUrl = document.getElementById('login-homeserver').value.trim();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value.trim();

    if(!username || !password) return alert('Please enter login credentials');

    try {
        const tempClient = matrixcs.createClient({ baseUrl });
        const loginData = await tempClient.login('m.login.password', {
            user: username,
            password: password
        });

        // Save session credentials to keep the user logged in across refreshes
        localStorage.setItem('elementos_session', JSON.stringify({
            baseUrl: baseUrl,
            accessToken: loginData.access_token,
            userId: loginData.user_id
        }));

        initializeClient(baseUrl, loginData.access_token, loginData.user_id);

    } catch (err) {
        alert('Authentication failed: ' + err.message);
    }
});

// Setup client session
async function initializeClient(baseUrl, accessToken, userId) {
    matrixClient = matrixcs.createClient({ baseUrl, accessToken, userId });

    await matrixClient.startClient({ initialSyncLimit: 20 });

    document.getElementById('user-displayname').textContent = matrixClient.getUserId();
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('desktop').classList.remove('hidden');

    setupMatrixListeners();
}

function setupMatrixListeners() {
    matrixClient.on("Sync", (state) => {
        if (state === "PREPARED" || state === "SYNCING") {
            renderFriendsList();
        }
    });

    matrixClient.on("Room.timeline", (event, room, toStartOfTimeline) => {
        if (toStartOfTimeline) return; 
        if (event.getType() !== "m.room.message") return;
        if (room.roomId === currentActiveRoomId) {
            appendMessage(event);
        }
    });
}

function renderFriendsList() {
    const friendsListDiv = document.getElementById('friends-list');
    const rooms = matrixClient.getRooms();
    
    if(rooms.length === 0) {
        friendsListDiv.innerHTML = `<p class="text-xs text-gray-500 text-center py-8">No friends added yet.</p>`;
        return;
    }

    friendsListDiv.innerHTML = '';
    rooms.forEach(room => {
        const friendName = room.name || room.roomId;
        
        const item = document.createElement('div');
        item.className = "flex items-center justify-between p-2.5 hover:bg-white/5 rounded-xl cursor-pointer transition";
        item.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="w-9 h-9 bg-gray-700 rounded-full flex items-center justify-center font-bold text-xs uppercase">${friendName.substring(0,2)}</div>
                <div class="truncate max-w-[130px]">
                    <p class="text-sm font-medium text-gray-200 truncate">${friendName}</p>
                </div>
            </div>
            <div class="flex gap-1">
                <button class="btn-msg p-1.5 hover:bg-white/10 rounded-lg text-teal-400 text-xs">💬</button>
                <button class="btn-call p-1.5 hover:bg-white/10 rounded-lg text-emerald-400 text-xs">📞</button>
            </div>
        `;

        item.querySelector('.btn-msg').addEventListener('click', (e) => {
            e.stopPropagation();
            openChatWindow(room.roomId, friendName);
        });

        item.querySelector('.btn-call').addEventListener('click', (e) => {
            e.stopPropagation();
            alert(`Initiating secure Matrix WebRTC Call to ${friendName}...`);
        });

        friendsListDiv.appendChild(item);
    });
}

document.getElementById('btn-add-friend').addEventListener('click', async () => {
    const targetMxid = document.getElementById('friend-mxid').value.trim();
    if(!targetMxid.startsWith('@')) return alert('Invalid User ID format!');

    try {
        await matrixClient.createRoom({
            invite: [targetMxid],
            preset: 'trusted_private_chat',
            is_direct: true
        });
        
        alert('Friend invitation transmitted successfully!');
        document.getElementById('friend-mxid').value = '';
        document.getElementById('add-friend-ui').classList.add('hidden');
        renderFriendsList();
    } catch(err) {
        alert('Failed creating connection: ' + err.message);
    }
});

function openChatWindow(roomId, name) {
    currentActiveRoomId = roomId;
    document.getElementById('chat-title').textContent = `Chatting with ${name}`;
    document.getElementById('chat-window').classList.remove('hidden');
    document.getElementById('chat-messages').innerHTML = '';

    const room = matrixClient.getRoom(roomId);
    if (room && room.timeline) {
        room.timeline.forEach(event => {
            if(event.getType() === 'm.room.message') appendMessage(event);
        });
    }
}

function appendMessage(event) {
    const container = document.getElementById('chat-messages');
    const sender = event.getSender();
    const body = event.getContent().body;
    const isMe = sender === matrixClient.getUserId();

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
document.getElementById('chat-input').addEventListener('keypress', (e) => { if(e.key === 'Enter') sendMessage(); });

async function sendMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if(!text || !currentActiveRoomId) return;

    try {
        await matrixClient.sendMessage(currentActiveRoomId, {
            msgtype: "m.text",
            body: text
        });
        input.value = '';
    } catch(err) {
        alert("Failed sending transmission: " + err.message);
    }
}

// Logout feature to clear the saved credentials
document.getElementById('btn-logout').addEventListener('click', () => {
    localStorage.removeItem('elementos_session');
    window.location.reload();
});
