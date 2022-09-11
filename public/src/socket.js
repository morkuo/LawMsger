import { addClass, setMessage } from './helper.js';
import { drawContactDivs, drawSidebar } from './sidebar.js';

let jwtToken = localStorage.getItem('token');

const socket = io({ query: { jwtToken } });

socket.on('connect', async () => {
  drawSidebar();
});

socket.on('connect_error', err => {
  console.log(err.message);
});

socket.on('msg', (msg, senderSocketId, filesInfo) => {
  console.log('From server:' + senderSocketId);

  //check if current user is at chat window
  const messages = document.getElementById('messages');
  if (!messages) return;

  //if message is not for current window contact, do nothing
  if (senderSocketId !== messages.dataset.socketId) return;

  //append message from the sender to chat window
  setMessage(msg, Date.now(), senderSocketId, null, filesInfo);
});

socket.on('suggestion', suggestions => {
  const suggestionsList = document.getElementById('suggestions');
  // const input = document.getElementById('input');
  suggestionsList.innerHTML = '';

  if (suggestions.length === 0) return;

  for (let suggestion of suggestions) {
    const li = document.createElement('li');

    if (suggestion) li.innerText = suggestion;
    else li.innerText = suggestion;

    suggestionsList.appendChild(li);
  }
});

socket.on(
  'checkChatWindow',
  (
    msg,
    fromSocketId,
    fromUserId,
    fromUserName,
    targetSocketId,
    targetUserId,
    targetUserName,
    filesInfo
  ) => {
    console.log('Check Window!');

    //check if current user is at targetUser's chat window
    const messages = document.getElementById('messages');
    let messagesUserId = null;
    if (messages) messagesUserId = messages.dataset.id;

    if (!messages || messagesUserId !== fromUserId) {
      socket.emit(
        'checkChatWindow',
        msg,
        fromSocketId,
        fromUserId,
        fromUserName,
        targetSocketId,
        targetUserId,
        targetUserName,
        filesInfo,
        false
      );

      const contactDivs = document.querySelectorAll(`[data-id="${fromUserId}"]`);

      contactDivs.forEach(div => {
        console.log('Incrementing!');
        const unreadCountDiv = div.querySelector('.contact-unread-count');
        unreadCountDiv.innerText++;
      });

      return;
    }

    socket.emit(
      'checkChatWindow',
      msg,
      fromSocketId,
      fromUserId,
      fromUserName,
      targetSocketId,
      targetUserId,
      targetUserName,
      filesInfo,
      true
    );

    //append message from the sender to chat window
    setMessage(msg, Date.now(), fromSocketId, null, filesInfo, 'read');
  }
);

socket.on('createStarContact', response => {
  if (response.error) return;

  const {
    data: { targetContactUserId },
  } = response;

  //append new star to star block
  const createdDiv = document.querySelector(`#all div.contact[data-id="${targetContactUserId}"]`);
  const contactPictureDiv = createdDiv.querySelector('.contact-picture');
  const contactNameDiv = createdDiv.querySelector('.contact-info div:first-child');
  const contactEmailDiv = createdDiv.querySelector('.contact-info div:last-child');
  const contactUnreadDiv = createdDiv.querySelector('.contact-unread-count');

  const contacts = [
    {
      id: targetContactUserId,
      name: contactNameDiv.innerText,
      email: contactEmailDiv.innerText,
      picture: contactPictureDiv.innerText,
      socket_id: createdDiv.dataset.socketId,
      unread: contactUnreadDiv.innerText,
    },
  ];

  drawContactDivs(contacts, 'star');

  //add delete star button
  const contactDiv = document.querySelector(`#star div.contact[data-id="${targetContactUserId}"]`);
  const deleteStarButton = document.createElement('div');
  deleteStarButton.setAttribute('class', 'contact-delete-star-button');
  contactDiv.appendChild(deleteStarButton);

  deleteStarButton.innerText = '-';

  deleteStarButton.addEventListener('click', e => {
    socket.emit('deleteStarContact', targetContactUserId);
    contactDiv.remove();
  });
});

socket.on('deleteStarContact', response => {
  if (response.error) return;

  const { data: targetContactUserId } = response;

  //append new star to star block
  const contactDiv = document.querySelector(`#all div.contact[data-id="${targetContactUserId}"]`);
  const addStarButton = document.createElement('div');

  addStarButton.setAttribute('class', 'contact-add-star-button');
  contactDiv.appendChild(addStarButton);

  addStarButton.innerText = '+';

  addStarButton.addEventListener('click', e => {
    socket.emit('createStarContact', targetContactUserId);
    addStarButton.remove();
  });
});

socket.on('onlineStatus', (userId, socketId, status) => {
  const contactDivs = document.querySelectorAll(`.contact[data-id="${userId}"]`);

  console.log(userId, socketId, status);

  contactDivs.forEach(div => {
    const statusDiv = div.querySelector('.contact-status');

    if (status === 'on') {
      statusDiv.classList.add('on');
      div.dataset.socketId = socketId;
    } else {
      statusDiv.classList.remove('on');
      div.dataset.socketId = '';
    }
  });

  const chatWindow = document.querySelector('#messages');
  if (chatWindow) chatWindow.dataset.socketId = socketId;
});

//Change online status to 'off' when disonnected
socket.on('disconnect', () => {
  console.log('Server down');

  const contactDivs = document.querySelectorAll(`.contact`);

  contactDivs.forEach(div => {
    const statusDiv = div.querySelector('.contact-status');

    statusDiv.classList.remove('on');
    div.dataset.socketId = '';
  });
});

export { socket };
