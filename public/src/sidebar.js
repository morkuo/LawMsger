import { setMsg, addClass, getJwtToken, setMessage, fetchGet } from './helper.js';
import { socket } from './socket.js';
import { addChatListenerToContactDivs } from './chat.js';

async function drawSidebar() {
  const contacts = await getContacts();

  const allContactsDiv = document.querySelector(`#all .contacts`);
  const starContactsDiv = document.querySelector(`#star .contacts`);

  allContactsDiv.innerHTML = '';
  starContactsDiv.innerHTML = '';

  drawContactDivs(contacts, 'all');
  addChatListenerToContactDivs(allContactsDiv);

  const starContacts = await getStarContacts();
  drawContactDivs(starContacts, 'star');
  addChatListenerToContactDivs(starContactsDiv);

  drawAddStarButton(contacts, starContacts);
  drawDeleteStarButton(starContacts);

  const groups = await getGroups();
  drawGroups(groups);
  socket.emit('join', groups);

  listenToChatWindow();

  //if user is at chat window, renew the socket id of chat window
  const chatWindow = document.querySelector('#messages');
  if (chatWindow) {
    const contactDiv = document.querySelector(`.contact[data-id="${chatWindow.dataset.id}"]`);
    chatWindow.dataset.socketId = contactDiv.dataset.socketId;
  }
}

async function drawAddStarButton(contacts, starContacts) {
  const contactIds = contacts.map(contact => contact.id);
  const starIds = starContacts.reduce((acc, star) => {
    acc[star.id] = 1;
    return acc;
  }, {});

  contactIds.forEach(contactId => {
    //if current contact is a star , return
    if (starIds[contactId]) return;

    const contactDiv = document.querySelector(`.contact[data-id="${contactId}"]`);
    const addStarButton = document.createElement('div');

    addStarButton.setAttribute('class', 'contact-add-star-button');
    contactDiv.appendChild(addStarButton);

    addStarButton.innerText = '+';

    addStarButton.addEventListener('click', e => {
      socket.emit('createStarContact', contactId);
      addStarButton.remove();
    });
  });
}

async function drawDeleteStarButton(starContacts) {
  const starIds = starContacts.map(star => star.id);

  starIds.forEach(starId => {
    const contactDiv = document.querySelector(`#star .contact[data-id="${starId}"]`);
    const deleteStarButton = document.createElement('div');

    deleteStarButton.setAttribute('class', 'contact-delete-star-button');
    contactDiv.appendChild(deleteStarButton);

    deleteStarButton.innerText = '-';

    deleteStarButton.addEventListener('click', e => {
      socket.emit('deleteStarContact', starId);
      contactDiv.remove();
    });
  });
}

async function getContacts() {
  const response = await fetchGet('/contact');
  return response;
}

async function getStarContacts() {
  const response = await fetchGet('/contact/star');
  return response;
}

async function getGroups() {
  const response = await fetchGet('/group');
  return response;
}

function drawContactDivs(contacts, category) {
  const contactsDiv = document.querySelector(`#${category} .contacts`);

  for (let contact of contacts) {
    const contactDiv = document.createElement('div');
    const pictureDiv = document.createElement('div');
    const statusDiv = document.createElement('div');
    const infoDiv = document.createElement('div');
    const nameDiv = document.createElement('div');
    const emailDiv = document.createElement('div');
    const unreadCountDiv = document.createElement('div');

    addClass('contact', contactDiv);
    addClass('contact-picture', pictureDiv);
    addClass('contact-status', statusDiv);
    addClass('contact-info', infoDiv);
    addClass('contact-unread-count', unreadCountDiv);

    //if picture not url, then show initial
    if (contact.picture.length <= 1) pictureDiv.innerText = contact.name[0].toUpperCase();
    nameDiv.innerText = contact.name;
    emailDiv.innerText = contact.email;
    unreadCountDiv.innerText = contact.unread;

    contactDiv.setAttribute('data-id', contact.id);
    if (contact.socket_id === null) contact.socket_id = '';
    contactDiv.setAttribute('data-socket-id', contact.socket_id);

    if (contact.socket_id) statusDiv.classList.add('on');

    contactDiv.appendChild(statusDiv);
    contactDiv.appendChild(pictureDiv);
    contactDiv.appendChild(infoDiv);
    contactDiv.appendChild(unreadCountDiv);
    infoDiv.appendChild(nameDiv);
    infoDiv.appendChild(emailDiv);

    contactsDiv.appendChild(contactDiv);
  }
}

function drawGroups(groups) {
  const groupsDiv = document.querySelector(`.groups`);

  for (let group of groups) {
    const groupDiv = document.createElement('div');

    const nameDiv = document.createElement('div');

    addClass('contact', groupDiv);

    nameDiv.innerText = group.name;

    groupDiv.setAttribute('data-id', group.id);

    groupsDiv.appendChild(groupDiv);
    groupDiv.appendChild(nameDiv);
  }
}

//Check whether current user is at chat window. If yes, highlight chatting contact div.
function listenToChatWindow() {
  const pane = document.getElementById('pane');

  const observer = new MutationObserver(function (mutations) {
    const sideBar = document.getElementById('sidebar');
    const allContactDivs = document.querySelectorAll('.contact');

    allContactDivs.forEach(groupDiv => {
      contactDiv.style.backgroundColor = '';
    });

    const messages = document.getElementById('messages');
    if (!messages) return;

    const contactUserId = messages.dataset.id;

    const currentContactDivs = sideBar.querySelectorAll(`[data-id="${contactUserId}"]`);

    currentContactDivs.forEach(div => {
      div.style.backgroundColor = 'skyblue';
    });
  });

  observer.observe(pane, {
    childList: true,
    subtree: true,
  });
}

export { drawContactDivs, drawSidebar };
