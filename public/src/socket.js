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

socket.on('groupmsg', (msg, senderSocketId, groupId, filesInfo) => {
  console.log('From server:' + senderSocketId);

  //check if current user is at chat window
  const messages = document.getElementById('messages');
  if (!messages) return;

  //if message is not for current window contact, do nothing
  if (groupId !== messages.dataset.socketId) return;

  //append message from the sender to chat window
  setMessage(msg, Date.now(), senderSocketId, null, filesInfo, 'read');
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

socket.on('clauses', suggestions => {
  const suggestionsList = document.getElementById('suggestions');
  // const input = document.getElementById('input');
  suggestionsList.innerHTML = '';

  if (suggestions.length === 0) return;

  for (let suggestion of suggestions) {
    const li = document.createElement('li');

    if (suggestion) {
      const clauseTitle = suggestion.title;
      const clauseBody = suggestion.body;

      if (clauseBody.length > 50) {
        li.innerText = `${clauseTitle} ${clauseBody.slice(0, 50)}...`;
        li.setAttribute('data-body', clauseBody);
      } else {
        li.innerText = `${clauseTitle} ${clauseBody}`;
        li.setAttribute('data-body', clauseBody);
      }
    } else li.innerText = suggestion;

    suggestionsList.appendChild(li);
  }
});

socket.on('matchedClauses', suggestions => {
  const suggestionsList = document.getElementById('suggestions');
  // const input = document.getElementById('input');
  suggestionsList.innerHTML = '';

  if (suggestions.length === 0) return;

  for (let suggestion of suggestions) {
    const li = document.createElement('li');

    if (suggestion) {
      const clauseTitle = suggestion.title;
      const clauseBody = suggestion.body;
      const clauseNumber = suggestion.number;

      if (clauseBody.length > 50) {
        li.innerText = `${clauseBody.slice(0, 50)}...`;
        li.setAttribute('data-body', clauseBody);
        li.setAttribute('data-title', clauseTitle);
        li.setAttribute('data-number', clauseNumber);
      } else {
        li.innerText = `${clauseBody}`;
        li.setAttribute('data-body', clauseBody);
        li.setAttribute('data-title', clauseTitle);
        li.setAttribute('data-number', clauseNumber);
      }
    } else li.innerText = suggestion;

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

socket.on(
  'checkGroupChatWindow',
  (msg, fromSocketId, fromUserId, fromUserName, groupId, messageId, filesInfo) => {
    console.log('Check Window!');

    //check if current user is at group chat window
    const messages = document.getElementById('messages');

    if (!messages || messages.dataset.socketId !== groupId) {
      console.log('Here');

      // Unread
      const groupDiv = document.querySelector(`[data-socket-id="${groupId}"]`);

      console.log('Incrementing!');
      const unreadCountDiv = groupDiv.querySelector('.group-unread-count');
      unreadCountDiv.innerText++;

      return;
    }

    const userId = localStorage.getItem('id');

    //user is at window
    socket.emit('checkGroupChatWindow', userId, messageId);

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
  if (chatWindow && chatWindow.dataset.id === userId) {
    chatWindow.dataset.socketId = socketId;
  }
});

//provide search users result in add group participants page
window.selectedUser = {};
socket.on('searchEamil', users => {
  const suggestionsList = document.getElementById('groupParticipantsSearchResultDiv');
  const selectedUserDiv = document.getElementById('groupSelectedUserDiv');

  suggestionsList.innerHTML = '';

  users.forEach(user => {
    const suggestionDiv = document.createElement('div');
    const info = document.createElement('div');
    const addButton = document.createElement('div');

    addClass('group-participants-option', suggestionDiv);

    info.innerText = user.name;
    addButton.innerText = '+';

    addButton.addEventListener('click', e => {
      window.selectedUser[user.id] = user.name;

      selectedUserDiv.innerHTML = '';

      for (let userId in window.selectedUser) {
        const userDiv = document.createElement('div');
        const info = document.createElement('div');
        const deleteButton = document.createElement('div');

        info.innerText = window.selectedUser[userId];
        deleteButton.innerText = '-';

        addClass('group-participants-selected', userDiv);

        selectedUserDiv.appendChild(userDiv);
        userDiv.appendChild(info);
        userDiv.appendChild(deleteButton);

        deleteButton.addEventListener('click', () => {
          delete window.selectedUser[userId];
          userDiv.remove();
        });
      }
    });

    suggestionsList.appendChild(suggestionDiv);
    suggestionDiv.appendChild(info);
    suggestionDiv.appendChild(addButton);
  });
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
