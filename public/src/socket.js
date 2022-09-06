import { addClass, setMessage } from './helper.js';

let jwtToken = localStorage.getItem('token');

const socket = io({ query: { jwtToken } });

socket.on('msg', (msg, senderSocketId) => {
  console.log('From server:' + senderSocketId);

  //check if current user is at chat window
  const messages = document.getElementById('messages');
  if (!messages) return;

  //if message is not for current window contact, do nothing
  if (senderSocketId !== messages.dataset.socketId) return;

  //append message from the sender to chat window
  setMessage(msg, Date.now(), senderSocketId);
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

  const contactSocketId = createdDiv.dataset.socketId;

  const contactPicture = contactPictureDiv.innerText;
  const contactName = contactNameDiv.innerText;
  const contactEmail = contactEmailDiv.innerText;

  const contactDiv = document.createElement('div');
  const pictureDiv = document.createElement('div');
  const infoDiv = document.createElement('div');
  const nameDiv = document.createElement('div');
  const emailDiv = document.createElement('div');

  addClass('contact', contactDiv);
  addClass('contact-picture', pictureDiv);
  addClass('contact-info', infoDiv);

  pictureDiv.innerText = contactPicture;
  nameDiv.innerText = contactName;
  emailDiv.innerText = contactEmail;

  contactDiv.setAttribute('data-id', targetContactUserId);
  contactDiv.setAttribute('data-socket-id', contactSocketId);

  contactDiv.appendChild(pictureDiv);
  contactDiv.appendChild(infoDiv);
  infoDiv.appendChild(nameDiv);
  infoDiv.appendChild(emailDiv);

  const starContactsDiv = document.querySelector('#star .contacts');

  starContactsDiv.appendChild(contactDiv);

  //add delete star button
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

export { socket };
