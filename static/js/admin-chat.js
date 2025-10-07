let $ = document,
    settingModal = $.querySelector('.setting-modal'),
    settingMenu = $.querySelector('.setting-menu'),
    onlineStatus = $.querySelector('.online-status'),
    connectionRemover = $.querySelector('#connection-remover'),
    customers = $.querySelector('.customers'),
    sendMessage = $.querySelector('.send-message'),
    text = $.querySelector('.text'),
    messageBox = $.querySelector('#body'),
    img = $.querySelector('.img');

// --- toggle setting menu ---
settingMenu.addEventListener('click', () => {
    settingModal.classList.toggle('show');
});

// --- scroll chat ---
let scroll = () => {
    messageBox.scrollTo(0, messageBox.scrollHeight);
};

// --- get CSRF token ---
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
const csrftoken = getCookie('csrftoken');

// --- online status changer ---
let onlineStatusChanger = () => {
    fetch('http://127.0.0.1:8000/online-status-changer/', { method: 'GET' })
        .then(res => res.json())
        .then(data => console.log(data));
};

// --- toggle admin online/offline ---
onlineStatus.addEventListener('click', (e) => {
    e.currentTarget.firstElementChild.classList.toggle('online');
    if (e.currentTarget.lastElementChild.innerHTML === 'online') {
        e.currentTarget.lastElementChild.innerHTML = 'offline';
    } else {
        e.currentTarget.lastElementChild.innerHTML = 'online';
    }
    onlineStatusChanger();
});

// --- remove admin connection ---
connectionRemover.addEventListener('click', () => {
    fetch('http://127.0.0.1:8000/admin-connection-remover/', { method: 'GET' })
        .then(res => res.json())
        .then(data => console.log(data));
});

// --- global variables ---
let userEmail = null,
    userNumber = null,
    displayedMessages = [];

// --- render messages ---
let renderMessages = (messages) => {
    messageBox.innerHTML = '';
    messages.sort((a, b) => new Date(a.dateTimeStatus || a.dateTimeText) - new Date(b.dateTimeStatus || b.dateTimeText));
    messages.forEach(msg => {
        let chatMessageBox = $.createElement('div');
        if (msg.sent_by_admin) {
            chatMessageBox.setAttribute('class', 'sent-chat-box-parent');
            chatMessageBox.innerHTML = `
                <div class="sent-chat-box">
                    <div class="admin-pic">
                        <img src="${img.id}" alt="">
                    </div>
                    <div class="header">
                        <p>شما</p>
                        <p>${msg.dateTimeStatus}</p>
                    </div>
                    <div class="body">
                        ${msg.msgText}
                    </div>
                </div>
            `;
        } else if (msg.sent_by_user) {
            chatMessageBox.setAttribute('class', 'received-chat-box-parent');
            chatMessageBox.innerHTML = `
                <div class="received-chat-box">
                    <div class="header">
                        <p>${msg.msgSender}</p>
                        <p>${msg.dateTimeStatus}</p>
                    </div>
                    <div class="body">
                        ${msg.msgText}
                    </div>
                </div>
            `;
        }
        messageBox.append(chatMessageBox);
    });
    scroll();
};

// --- fetch all messages for selected user ---
let getAllMessages = () => {
    if (userEmail && userNumber) {
        fetch('http://127.0.0.1:8000/get-all-messages/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrftoken },
            body: JSON.stringify({ msg_sender: userEmail, msg_sender_number: userNumber }),
        })
        .then(res => res.json())
        .then(data => {
            displayedMessages = data;
            renderMessages(displayedMessages);
        });
    }
};

// --- fetch new messages ---
let getUserMessages = () => {
    if (userEmail && userNumber) {
        fetch('http://127.0.0.1:8000/get-user-message/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrftoken },
            body: JSON.stringify({ msg_sender: userEmail, msg_sender_number: userNumber }),
        })
        .then(res => res.json())
        .then(data => {
            if (data.length > 0) {
                displayedMessages = [...displayedMessages, ...data];
                renderMessages(displayedMessages);
            }
        });
    }
};

// --- select user ---
let userSelection = (e) => {
    e.currentTarget.querySelector('.icon').style.visibility = 'hidden';
    userEmail = e.currentTarget.querySelector('.user-info').firstElementChild.innerHTML;
    userNumber = e.currentTarget.querySelector('.user-info').lastElementChild.innerHTML;
    displayedMessages = [];
    getAllMessages();
    if (window.userMessageInterval) clearInterval(window.userMessageInterval);
    window.userMessageInterval = setInterval(getUserMessages, 1000);
};

// --- add click event to all customers ---
Array.from(customers.children).forEach((item) => {
    item.addEventListener('click', (e) => userSelection(e));
});

// --- WebSocket for admin ---
let adminSocket = new WebSocket(
    'ws://' + window.location.host + '/ws/admin-chat/'
);

adminSocket.onopen = function(e) {
    console.log('Admin WebSocket connected.');
};

adminSocket.onmessage = function(e) {
    const data = JSON.parse(e.data);
    if (data.sender_name && data.message) {
        displayedMessages.push({
            msgText: data.message,
            sent_by_user: true,
            msgSender: data.sender_name,
            dateTimeStatus: data.time
        });
        renderMessages(displayedMessages);
    }
};

adminSocket.onclose = function(e) {
    console.log('Admin WebSocket closed.');
};

adminSocket.onerror = function(e) {
    console.error('Admin WebSocket error:', e);
};

// --- send admin message via WebSocket ---
sendMessage.addEventListener('click', () => {
    if (text.value.length > 0 && userEmail && userNumber) {
        const messageData = {
            message: text.value,
            receiver_email: userEmail,
            receiver_number: userNumber,
            sender_name: 'Admin'
        };
        adminSocket.send(JSON.stringify(messageData));
        displayedMessages.push({
            msgText: text.value,
            sent_by_admin: true,
            dateTimeStatus: new Date().toLocaleTimeString()
        });
        renderMessages(displayedMessages);
        text.value = '';
    }
});

// --- create user connection template ---
let connectionTemplateCreator = (data) => {
    data.forEach((item) => {
        let userConnection = $.createElement('div');
        userConnection.setAttribute('class', 'user');
        userConnection.innerHTML = `
            <div class="user-pic">
                <img src="../../static/home/img/chat2.png" alt="">
            </div>
            <div class="user-info">
                <div class="user-email">${item.userEmail}</div>
                <div class="user-number">${item.userNumber}</div>
            </div>
            <div class="icon"></div>
        `;
        userConnection.addEventListener('click', userSelection);
        customers.insertAdjacentElement("afterbegin", userConnection);
    });
};

// --- get admin connections ---
let getAdminConnections = () => {
    fetch('http://127.0.0.1:8000/admin-connections/', { method: 'GET' })
        .then(res => res.json())
        .then(data => {
            if (data.length > 0) connectionTemplateCreator(data);
        });
};
setInterval(getAdminConnections, 5000);

// --- check new messages ---
let newMessage = () => {
    Array.from(customers.children).forEach((item) => {
        let email = item.querySelector('.user-info').firstElementChild.innerHTML;
        let number = item.querySelector('.user-info').lastElementChild.innerHTML;
        fetch('http://127.0.0.1:8000/new-message/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrftoken },
            body: JSON.stringify({ msg_sender: email, msg_sender_number: number }),
        })
        .then(res => res.json())
        .then(data => {
            if (data.message === 'true') item.querySelector('.icon').style.visibility = 'visible';
            else item.querySelector('.icon').style.visibility = 'hidden';
        });
    });
};
setInterval(newMessage, 10000);
