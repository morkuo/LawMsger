import { setMsg, addClass, getJwtToken, setMessage, fetchGet } from './helper.js';
import { socket } from './socket.js';
import { addChatListenerToContactDivs, addGroupChatListenerToGroupDivs } from './chat.js';

async function drawSidebar() {
  const contacts = await getContacts();

  const allContactsDiv = document.querySelector(`#all .contacts`);
  const starContactsDiv = document.querySelector(`#star .contacts`);
  const groupsDiv = document.querySelector(`.groups`);

  allContactsDiv.innerHTML = '';
  starContactsDiv.innerHTML = '';
  groupsDiv.innerHTML = '';

  drawContactDivs(contacts, 'all');
  addChatListenerToContactDivs(allContactsDiv);

  const starContacts = await getStarContacts();
  drawContactDivs(starContacts, 'star');
  addChatListenerToContactDivs(starContactsDiv);

  drawAddStarButton(contacts, starContacts);
  drawDeleteStarButton(starContacts);

  const groups = await getGroups();
  drawGroups(groups);
  setParticipantsInfoToGroup(groups);
  addGroupChatListenerToGroupDivs(groupsDiv);
  drawDeleteGroupButton(groups);

  collapseSidebar();

  socket.emit('join', groups);

  listenToChatWindow();

  groupAddParticipantsButton();
  signOutButton();

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

async function drawDeleteGroupButton(groups) {
  const groupIds = groups.map(group => group.id);

  groupIds.forEach(groupId => {
    const groupDiv = document.querySelector(`.group[data-socket-id="${groupId}"]`);
    const groupNameDiv = groupDiv.querySelector('.group-name');
    const deleteStarButton = document.createElement('div');

    deleteStarButton.setAttribute('class', 'group-delete-button');
    groupDiv.appendChild(deleteStarButton);

    deleteStarButton.innerText = '-';

    deleteStarButton.addEventListener('click', async e => {
      let authorization = getJwtToken();

      const api = `${window.location.origin}/api/1.0/group/leave`;

      const payload = {
        groupName: groupNameDiv.innerText,
      };

      const res = await fetch(api, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authorization,
        },
        body: JSON.stringify(payload),
      });

      const response = await res.json();

      if (response.error) return setMsg(response.error, 'error');

      groupDiv.remove();

      return setMsg(response.data);
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
    // emailDiv.innerText = contact.email;
    if (contact.unread) unreadCountDiv.innerText = contact.unread;

    contactDiv.setAttribute('data-id', contact.id);
    if (contact.socket_id === undefined || null) contact.socket_id = '';
    contactDiv.setAttribute('data-socket-id', contact.socket_id);
    contactDiv.setAttribute('title', contact.email);

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
    const statusDiv = document.createElement('div');
    const nameDiv = document.createElement('div');
    const unreadCountDiv = document.createElement('div');

    addClass('group', groupDiv);
    addClass('group-status', statusDiv);
    addClass('group-name', nameDiv);
    addClass('group-unread-count', unreadCountDiv);

    nameDiv.innerText = group.name;
    if (group.unread) unreadCountDiv.innerText = group.unread;

    groupDiv.setAttribute('data-socket-id', group.id);

    groupsDiv.appendChild(groupDiv);
    groupDiv.appendChild(statusDiv);
    groupDiv.appendChild(nameDiv);
    groupDiv.appendChild(unreadCountDiv);
  }
}

async function setParticipantsInfoToGroup(groups) {
  let authorization = getJwtToken();

  for (let group of groups) {
    const api = `${window.location.origin}/api/1.0/group/participants?groupName=${group.name}`;

    const res = await fetch(api, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authorization,
      },
    });

    const response = await res.json();

    if (response.error) return setMsg(response.error, 'error');

    const groupDiv = document.querySelector(`[data-socket-id="${group.id}"]`);

    let titleAttribute = '';
    for (let user of response) {
      titleAttribute += `${user.name} - ${user.email}\n`;
    }

    const lastLineBreak = titleAttribute.lastIndexOf('\n');
    titleAttribute = titleAttribute.slice(0, lastLineBreak);

    groupDiv.setAttribute('title', titleAttribute);
  }
}

function groupAddParticipantsButton() {
  const groupAddParticipants = document.getElementById('groupAddParticipants');

  groupAddParticipants.addEventListener('click', () => {
    drawCreateGroupForm();
    drawAddAndDeleteParticipantsForm();
    addEmailInputLitener();
  });
}

function drawCreateGroupForm() {
  const pane = document.querySelector('#pane');
  const manageDiv = document.createElement('div');
  const formDiv = document.createElement('div');
  const infoDiv = document.createElement('div');
  const header = document.createElement('h3');
  const createForm = document.createElement('form');
  const namePTag = document.createElement('p');

  const nameInput = document.createElement('input');

  const button = document.createElement('button');

  pane.innerHTML = '';

  header.innerText = 'Create Group';
  namePTag.innerText = 'Name';

  button.innerText = 'Create';

  manageDiv.setAttribute('id', 'manageDiv');
  formDiv.setAttribute('id', 'formDiv');
  infoDiv.setAttribute('id', 'infoDiv');

  addClass('group-function', infoDiv, header, createForm, namePTag, nameInput, button);

  const api = `${window.location.origin}/api/1.0/group`;

  button.addEventListener('click', async e => {
    e.preventDefault();

    const payload = {
      name: nameInput.value,
    };

    let authorization = getJwtToken();

    const res = await fetch(api, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authorization,
      },
      body: JSON.stringify(payload),
    });

    const response = await res.json();

    if (response.error) return setMsg(response.error, 'error');

    const newGroup = [
      {
        id: response.group.id,
        name: nameInput.value,
        unread: 0,
      },
    ];

    drawGroups(newGroup);

    const username = localStorage.getItem('name');
    const userEmail = localStorage.getItem('email');

    const newGroupDiv = document.querySelector(`[data-socket-id="${response.group.id}"]`);
    const titleAttribute = `${username} - ${userEmail}`;
    newGroupDiv.setAttribute('title', titleAttribute);

    socket.emit('join', newGroup);

    drawDeleteGroupButton(newGroup);

    return setMsg(response.data);
  });

  pane.appendChild(manageDiv);
  manageDiv.appendChild(formDiv);
  manageDiv.appendChild(infoDiv);
  formDiv.appendChild(createForm);
  createForm.appendChild(header);
  createForm.appendChild(namePTag);
  createForm.appendChild(nameInput);

  createForm.appendChild(button);
}

function drawAddAndDeleteParticipantsForm() {
  //provide search users result in add group participants page
  //every time user enter into this page, reset selectedUser
  window.selectedUser = {};

  const pane = document.querySelector('#pane');
  const formDiv = pane.querySelector('#formDiv');
  const infoDiv = pane.querySelector('#infoDiv');
  const header = document.createElement('h3');
  const form = document.createElement('form');
  const groupNamePtag = document.createElement('p');
  const groupNameInput = document.createElement('input');
  const participantsPtag = document.createElement('p');
  const participantsInput = document.createElement('input');
  const searchResultDiv = document.createElement('div');
  const selectedUserDiv = document.createElement('div');
  const searchResultPtag = document.createElement('h3');
  const selectedUserPtag = document.createElement('h3');
  const buttonsDiv = document.createElement('div');
  const addButton = document.createElement('button');
  const deleteButton = document.createElement('button');

  header.innerText = 'Manage member';

  groupNamePtag.innerText = 'Group Name';
  participantsPtag.innerText = 'Search User';

  participantsInput.setAttribute('placeholder', 'attorney@email.com');
  participantsInput.setAttribute('id', 'groupParticipantsSearchEmailInput');
  searchResultDiv.setAttribute('id', 'groupParticipantsSearchResultDiv');
  selectedUserDiv.setAttribute('id', 'groupSelectedUserDiv');

  addButton.innerText = 'Add';
  deleteButton.innerText = 'Delete';

  searchResultPtag.innerText = 'Search Result';
  selectedUserPtag.innerText = 'Selected';

  addClass(
    'group-function',
    header,
    form,
    groupNamePtag,
    groupNameInput,
    participantsPtag,
    participantsInput,
    addButton,
    deleteButton
  );

  const api = `${window.location.origin}/api/1.0/group`;

  addButton.addEventListener('click', async e => {
    e.preventDefault();

    if (!groupNameInput.value) return setMsg('Please enter group name', 'error');

    const userIds = Object.keys(window.selectedUser);

    if (userIds.length === 0) return setMsg('Please select at least one participant', 'error');

    const payload = {
      groupName: groupNameInput.value,
      userIds,
      updateType: 1,
    };

    let authorization = getJwtToken();

    const res = await fetch(api, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authorization,
      },
      body: JSON.stringify(payload),
    });

    const response = await res.json();

    if (response.error) return setMsg(response.error, 'error');

    const currentUserId = localStorage.getItem('id');

    socket.emit('drawGroupDiv', userIds, currentUserId, response.group.id, groupNameInput.value);

    window.selectedUser = {};
    groupNameInput.value = '';
    participantsInput.value = '';
    searchResultDiv.innerHTML = '';
    selectedUserDiv.innerHTML = '';

    return setMsg(response.data);
  });

  deleteButton.addEventListener('click', async e => {
    e.preventDefault();

    if (!groupNameInput.value) return setMsg('Please enter group name', 'error');

    const userIds = Object.keys(window.selectedUser);

    if (userIds.length === 0) return setMsg('Please select at least one participant', 'error');

    const payload = {
      groupName: groupNameInput.value,
      userIds,
      updateType: 0,
    };

    let authorization = getJwtToken();

    const res = await fetch(api, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authorization,
      },
      body: JSON.stringify(payload),
    });

    const response = await res.json();

    if (response.error) return setMsg(response.error, 'error');

    window.selectedUser = {};
    groupNameInput.value = '';
    participantsInput.value = '';
    searchResultDiv.innerHTML = '';
    selectedUserDiv.innerHTML = '';

    return setMsg(response.data);
  });

  formDiv.appendChild(form);

  form.appendChild(header);
  form.appendChild(groupNamePtag);
  form.appendChild(groupNameInput);
  form.appendChild(participantsPtag);
  form.appendChild(participantsInput);
  form.appendChild(buttonsDiv);
  buttonsDiv.appendChild(addButton);
  buttonsDiv.appendChild(deleteButton);

  infoDiv.appendChild(searchResultPtag);
  infoDiv.appendChild(searchResultDiv);
  infoDiv.appendChild(selectedUserPtag);
  infoDiv.appendChild(selectedUserDiv);
}

function addEmailInputLitener() {
  const input = document.getElementById('groupParticipantsSearchEmailInput');

  const debouncedDetectInput = debounce(detectInput, 600);

  input.addEventListener('keydown', debouncedDetectInput);
}

function debounce(func, delay) {
  let timer = null;
  return function (...args) {
    if (timer) clearTimeout(timer);

    timer = setTimeout(() => {
      func.apply(null, args);
    }, delay);
  };
}

async function detectInput(e) {
  const currentInput = e.target.value;
  const suggestionsList = document.getElementById('groupParticipantsSearchResultDiv');

  if (!currentInput) return (suggestionsList.innerHTML = '');

  socket.emit('searchEamil', currentInput);
}

//Check whether current user is at chat window. If yes, highlight chatting contact div.
function listenToChatWindow() {
  const pane = document.getElementById('pane');

  const observer = new MutationObserver(function (mutations) {
    const sideBar = document.getElementById('sidebar');
    const allContactDivs = document.querySelectorAll('.contact');

    allContactDivs.forEach(contactDiv => {
      contactDiv.style.backgroundColor = '';
    });

    const allGroupDivs = document.querySelectorAll('.group');
    allGroupDivs.forEach(groupDiv => {
      groupDiv.style.backgroundColor = '';
    });

    const messages = document.getElementById('messages');
    if (!messages) return;

    //group
    if (messages.dataset.id === 'undefined') {
      const groupDiv = sideBar.querySelector(`[data-socket-id="${messages.dataset.socketId}"]`);
      groupDiv.style.backgroundColor = 'skyblue';

      return;
    }

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

function collapseSidebar() {
  const contents = document.querySelectorAll('.content');

  for (let content of contents) {
    content.setAttribute('style', 'height:0');
  }

  const headers = document.querySelectorAll('.header');

  for (let header of headers) {
    header.addEventListener('click', e => {
      const actives = document.querySelectorAll('.active');

      if (actives.length !== 0) {
        for (let active of actives) {
          active.classList.remove('active');
          active.parentElement.nextElementSibling.setAttribute('style', 'height: 0');
        }
      }

      //get current block root
      let headerParent = e.target;
      while (!headerParent.classList.contains('collapse')) {
        headerParent = headerParent.parentElement;
      }

      //get content div
      const content = headerParent.querySelector('.content');

      content.setAttribute('style', 'height: ' + 57 + 'vh');

      const symbol = headerParent.querySelector('.collapse-symbol');
      symbol.classList.toggle('active');
    });

    if (header.dataset.expanded === 'true') {
      header.click();
    }
  }
}

function signOutButton() {
  const signOutButton = document.getElementById('signOut');

  signOutButton.addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = `${window.location.origin}/index.html`;
  });
}

export { drawContactDivs, drawSidebar, drawGroups, drawDeleteGroupButton };
