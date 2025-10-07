// const $ = document

// let loginShow = $.querySelector('.login-show'),
//     modalBackgroundParent = $.querySelector('.modal-background-parent'),
//     closeModal = $.querySelector('.close-modal'),
//     chatModalButton = $.querySelector('.chat-modal-button'),
//     chatUserParent = $.querySelector('.chat-user-parent'),
//     closeButton = $.querySelector('.close-button'),
//     adminStatus = $.querySelector('.admin-status'),
//     sendMessage = $.querySelector('.send-message'),
//     email = $.querySelector('.email'),
//     number = $.querySelector('.number'),
//     sendInfoButton = $.querySelector('.send-info-button'),
//     userInfo = $.querySelector('.user-info'),
//     text = $.querySelector('.text'),
//     chatUserBody = $.querySelector('.chat-user-body'),
//     isTyping = $.querySelector('.isTyping');

// // scroll
// let scroll = () => {
//     chatUserBody.scrollTo(0, chatUserBody.scrollHeight)
// }

// // login modal
// if(loginShow){
//     loginShow.addEventListener('click', (e) =>{
//         e.preventDefault()
//         modalBackgroundParent.style.display = 'block';
//     })
// }
// closeModal.addEventListener('click', () =>{
//     modalBackgroundParent.style.display = 'none';
// })

// // chat modal
// chatModalButton.addEventListener('click', () =>{
//     chatUserParent.classList.toggle('show');
//     scroll()
// })
// closeButton.addEventListener('click', () =>{
//     chatUserParent.classList.remove('show');
// })

// function getCookie(name) {
//     let cookieValue = null;
//     if (document.cookie && document.cookie !== '') {
//         const cookies = document.cookie.split(';');
//         for (let i = 0; i < cookies.length; i++) {
//             const cookie = cookies[i].trim();
//             if (cookie.substring(0, name.length + 1) === (name + '=')) {
//                 cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
//                 break;
//             }
//         }
//     }
//     return cookieValue;
// }
// const csrftoken = getCookie('csrftoken');

// array = []

// let chatSocket;

// // ======= WebSocket connection =======
// function connectSocket() {
//     if(localStorage.getItem('user')){
//         const userData = JSON.parse(localStorage.getItem('user'))[0];
//         chatSocket = new WebSocket(
//             'ws://' + window.location.host + '/ws/chat/main_room/'
//         );

//         chatSocket.onopen = function(e){
//             console.log('WebSocket connected!');
//         }

//         chatSocket.onmessage = function(e){
//             const data = JSON.parse(e.data);

//             if(data.sender_name && data.sender_name !== userData.userEmail){
//                 // پیام ادمین
//                 adminMessageCreator([{
//                     msgSender: data.sender_name,
//                     dateTimeText: data.time,
//                     msgText: data.message
//                 }])
//             }
//             else if(data.sender === userData.userEmail){
//                 // پیام خود کاربر (برای نمایش آن در سمت خود)
//                 messageCreator({
//                     msgText: data.message,
//                     dateTimeStatus: data.time
//                 })
//             }
//         }

//         chatSocket.onclose = function(e){
//             console.log('Chat socket closed unexpectedly');
//         }
//     }
// }

// // ======= Update existing functions to use WebSocket =======

// // send message from user to admin
// sendMessage.addEventListener('click', () => {
//     if(localStorage.getItem('user') && text.value.length > 0 && chatSocket){
//         const userData = JSON.parse(localStorage.getItem('user'))[0];
//         const adminStored = JSON.parse(localStorage.getItem('admin'));

//         const payload = {
//             message: text.value,
//             sender: userData.userEmail,
//             sender_name: userData.userEmail,
//             receiver: adminStored || 'admin'
//         }

//         chatSocket.send(JSON.stringify(payload));

//         // نمایش پیام ارسال شده در UI
//         messageCreator({
//             msgText: text.value,
//             dateTimeStatus: new Date().toLocaleTimeString()
//         });

//         text.value = '';
//     }
// })

// // connect after sending user info
// sendInfoButton.addEventListener('click', () => {
//     const emailValue = email.value;
//     const numberValue = number.value;
    
//     if(emailValue.toString().toLowerCase().match('^([0-9a-zA-Z]([-.\w]*[0-9a-zA-Z])*@([0-9a-zA-Z][-\w]*[0-9a-zA-Z]\.)+[a-zA-Z]{2,9})$')
//      && numberValue.match('^(\\+98|0)?9\\d{9}$')){
//         array.push({'userEmail':emailValue, 'userNumber':numberValue})
//         connect(emailValue, numberValue);
//         email.value = '';
//         number.value = '';
        
//         // اتصال WebSocket بعد از ورود کاربر
//         connectSocket();
//     } else {
//         alert('لطفا شماره همراه و ایمیل صحیح وارد کنید');
//     }
// })


const $ = document

let loginShow = $.querySelector('.login-show'),
    modalBackgroundParent = $.querySelector('.modal-background-parent'),
    closeModal = $.querySelector('.close-modal'),
    chatModalButton = $.querySelector('.chat-modal-button'),
    chatUserParent = $.querySelector('.chat-user-parent'),
    closeButton = $.querySelector('.close-button'),
    adminStatus = $.querySelector('.admin-status'),
    sendMessage = $.querySelector('.send-message'),
    email = $.querySelector('.email'),
    number = $.querySelector('.number'),
    sendInfoButton = $.querySelector('.send-info-button'),
    userInfo = $.querySelector('.user-info'),
    text = $.querySelector('.text'),
    chatUserBody = $.querySelector('.chat-user-body'),
    isTyping = $.querySelector('.isTyping');

let array = [];
let chatSocket;

// Scroll function
let scroll = () => {
    chatUserBody.scrollTo(0, chatUserBody.scrollHeight)
}

// Login modal
if(loginShow){
    loginShow.addEventListener('click', (e) =>{
        e.preventDefault()
        modalBackgroundParent.style.display = 'block';
    })
}
closeModal.addEventListener('click', () =>{
    modalBackgroundParent.style.display = 'none';
})

// Chat modal
chatModalButton.addEventListener('click', () =>{
    chatUserParent.classList.toggle('show');
    scroll()
})
closeButton.addEventListener('click', () =>{
    chatUserParent.classList.remove('show');
})

// Get CSRF token
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

// ======= WebSocket connection =======
function connectSocket() {
    if(localStorage.getItem('user')){
        const userData = JSON.parse(localStorage.getItem('user'))[0];
        chatSocket = new WebSocket(
            'ws://' + window.location.host + '/ws/chat/main_room/'
        );

        chatSocket.onopen = function(e){
            console.log('WebSocket connected!');
        }

        chatSocket.onmessage = function(e){
            const data = JSON.parse(e.data);

            if(data.sender_name && data.sender_name !== userData.userEmail){
                // پیام ادمین
                adminMessageCreator([{
                    msgSender: data.sender_name,
                    dateTimeText: data.time,
                    msgText: data.message
                }])
            }
            else if(data.sender === userData.userEmail){
                // پیام خود کاربر
                messageCreator({
                    msgText: data.message,
                    dateTimeStatus: data.time
                })
            }
        }

        chatSocket.onclose = function(e){
            console.log('Chat socket closed unexpectedly');
        }
    }
}

// Scroll message into view and create chat message
let messageCreator = (data) => {
    let chatMessageBox = $.createElement('div');
    chatMessageBox.setAttribute('class', 'sent-chat-box-parent');
    chatMessageBox.innerHTML = `
    <div class="sent-chat-box">
        <div class="header">
            <p>${data.dateTimeStatus}</p>
            <p>شما</p>
        </div>
        <div class="body">${data.msgText}</div>
    </div>` 
    chatUserBody.append(chatMessageBox)
    scroll()
}

// Admin messages
let adminMessageCreator = (data) => {
    data.forEach((item) => {
        let chatMessageBox = $.createElement('div');
        chatMessageBox.setAttribute('class', 'received-chat-box-parent');
        chatMessageBox.innerHTML = `
        <div class="received-chat-box">
            <div class="header">
                <p>${item.msgSender}</p>
                <p>${item.dateTimeText}</p>
            </div>
            <div class="body">${item.msgText}</div>
        </div>`
        chatUserBody.append(chatMessageBox)
    })
    scroll()
}

// Send message from user
sendMessage.addEventListener('click', () => {
    if(localStorage.getItem('user') && text.value.length > 0 && chatSocket){
        const userData = JSON.parse(localStorage.getItem('user'))[0];
        const adminStored = JSON.parse(localStorage.getItem('admin'));

        const payload = {
            message: text.value,
            sender: userData.userEmail,
            sender_name: userData.userEmail,
            receiver: adminStored || 'admin'
        }

        chatSocket.send(JSON.stringify(payload));

        // نمایش پیام در UI
        messageCreator({
            msgText: text.value,
            dateTimeStatus: new Date().toLocaleTimeString()
        });

        text.value = '';
    }
})

// ======= Send user info and connect WebSocket =======
function connect(emailValue, numberValue){
    fetch('http://127.0.0.1:8000/connect/', {
        method:'POST',
        headers:{
            'Content-Type':'application/json',
            'X-CSRFToken':csrftoken,
        },
        body:JSON.stringify({'userEmail': emailValue, 'userNumber': numberValue}),
    })
    .then(res => res.json())
    .then(data => {
        console.log(data)
        userInfo.remove()
        localStorage.setItem('user', JSON.stringify(array))
        localStorage.setItem('admin', JSON.stringify(data.admin || 'offline'))
        if(JSON.parse(localStorage.getItem('admin')) === 'offline'){
            adminStatus.style.visibility = 'visible';
            adminStatus.firstElementChild.innerHTML = 'متاسفانه فعلا آنلاین نیستیم'
        }
        else{
            adminStatus.style.visibility = 'visible';
            adminStatus.firstElementChild.innerHTML = `${data.admin} پاسخگوی سوالات شما خواهد بود`
        }
        getAllMessages();
    })
}

// Send info button
sendInfoButton.addEventListener('click', () => {
    const emailValue = email.value;
    const numberValue = number.value;
    
    if(emailValue.toString().toLowerCase().match('^([0-9a-zA-Z]([-.\w]*[0-9a-zA-Z])*@([0-9a-zA-Z][-\w]*[0-9a-zA-Z]\.)+[a-zA-Z]{2,9})$')
     && numberValue.match('^(\\+98|0)?9\\d{9}$')){
        array.push({'userEmail':emailValue, 'userNumber':numberValue})
        connect(emailValue, numberValue);
        email.value = '';
        number.value = '';
        
        // اتصال WebSocket بعد از ورود کاربر
        connectSocket();
    } else {
        alert('لطفا شماره همراه و ایمیل صحیح وارد کنید');
    }
})

// ======= Get all messages =======
let allMessageCreator = (data) => {
    data.forEach((item) => {
        if(item.sent_for){
            let chatMessageBox = $.createElement('div');
            chatMessageBox.setAttribute('class', 'sent-chat-box-parent');
            chatMessageBox.innerHTML = `
                <div class="sent-chat-box">
                    <div class="header">
                        <p>${item.dateTimeStatus}</p>
                        <p>شما</p>
                    </div>
                    <div class="body">${item.msgText}</div>
                </div>`
            chatUserBody.append(chatMessageBox)
        } else if(item.received_from){
            let chatMessageBox = $.createElement('div');
            chatMessageBox.setAttribute('class', 'received-chat-box-parent');
            chatMessageBox.innerHTML = `
                <div class="received-chat-box">
                    <div class="header">
                        <p>${item.msgSender}</p>
                        <p>${item.dateTimeStatus}</p>
                    </div>
                    <div class="body">${item.msgText}</div>
                </div>`
            chatUserBody.append(chatMessageBox)
        }
    })
    scroll()
}

let getAllMessages = () => {
    if(JSON.parse(localStorage.getItem('user'))){
        fetch('http://127.0.0.1:8000/all-messages/',{
            method:'POST',
            headers:{
                'Content-Type':'application/json',
                'X-CSRFToken':csrftoken,
            },
            body:JSON.stringify({msg_sender_admin:JSON.parse(localStorage.getItem('admin')) ,
                                msg_sender:JSON.parse(localStorage.getItem('user'))[0].userEmail ,
                                msg_sender_number:JSON.parse(localStorage.getItem('user'))[0].userNumber }),
        })
        .then(res => res.json())
        .then(data =>{
            console.log(data)
            allMessageCreator(data)
        })
    }
}

getAllMessages()
