import { addClass, setMessage } from './helper.js';
import { drawContactDivs, drawSidebar } from './sidebar.js';

let jwtToken = localStorage.getItem('token');

const socket = io({ query: { jwtToken } });

socket.on('connect', () => {
  drawSidebar();
});

socket.on('msg', (msg, senderSocketId, fileUrls) => {
  console.log('From server:' + senderSocketId);

  //check if current user is at chat window
  const messages = document.getElementById('messages');
  if (!messages) return;

  //if message is not for current window contact, do nothing
  if (senderSocketId !== messages.dataset.socketId) return;

  //append message from the sender to chat window
  setMessage(msg, Date.now(), senderSocketId, null, fileUrls);
});

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

  const contacts = [
    {
      id: targetContactUserId,
      name: contactNameDiv.innerText,
      email: contactEmailDiv.innerText,
      picture: contactPictureDiv.innerText,
      socket_id: createdDiv.dataset.socketId,
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

socket.on('onlineStatus', (socketId, status) => {
  //append new star to star block
  const contactDivs = document.querySelectorAll(`.contact[data-socket-id="${socketId}"]`);

  contactDivs.forEach(div => {
    const statusDiv = div.querySelector('.contact-status');

    if (status === 'on') statusDiv.classList.add('on');
    else {
      statusDiv.classList.remove('on');
      div.setAttribute('data-socket-id', '');
    }
  });
});

//Change online status to 'off' when disonnected
socket.on('disconnect', () => {
  console.log('Server down');

  const contactDivs = document.querySelectorAll(`.contact`);

  contactDivs.forEach(div => {
    const statusDiv = div.querySelector('.contact-status');

    statusDiv.classList.remove('on');
    div.setAttribute('data-socket-id', '');
  });
});

socket.on('file', location => {
  console.log(location);
});

export { socket };
