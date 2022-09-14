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
  drawGroupHeaderButton();
  addGroupChatListenerToGroupDivs(groupsDiv);
  drawDeleteGroupButton(groups);

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
    emailDiv.innerText = contact.email;
    unreadCountDiv.innerText = contact.unread;

    contactDiv.setAttribute('data-id', contact.id);
    if (contact.socket_id === undefined || null) contact.socket_id = '';
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

    addClass('group', groupDiv);
    addClass('group-name', nameDiv);

    nameDiv.innerText = group.name;

    groupDiv.setAttribute('data-socket-id', group.id);

    groupsDiv.appendChild(groupDiv);
    groupDiv.appendChild(nameDiv);

    groupDiv.addEventListener('contextmenu', async e => {
      e.preventDefault();

      // click on leave button, then return
      if (e.target.classList.contains('group-delete-button')) return;

      let authorization = getJwtToken();

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

      let groupPaticipantsList = document.getElementById('groupParticipantsList');

      if (!groupPaticipantsList) groupPaticipantsList = document.createElement('div');
      else groupPaticipantsList.innerHTML = '';

      const closeButton = document.createElement('div');

      groupPaticipantsList.setAttribute('id', 'groupParticipantsList');

      closeButton.innerText = 'X';

      closeButton.addEventListener('click', e => {
        groupPaticipantsList.remove();
      });

      groupPaticipantsList.appendChild(closeButton);

      for (let user of response) {
        const userDiv = document.createElement('div');
        userDiv.innerText = `${user.name} - ${user.email}`;
        groupPaticipantsList.appendChild(userDiv);
      }

      const body = document.querySelector('body');

      body.appendChild(groupPaticipantsList);

      return setMsg(response.data);
    });
  }
}

function drawGroupHeaderButton() {
  const groupHeaderOption = document.querySelector('#group .header .options');

  groupHeaderOption.innerHTML = '';

  const manageButton = document.createElement('a');
  manageButton.innerText = '+';
  groupHeaderOption.appendChild(manageButton);

  manageButton.addEventListener('click', () => {
    drawCreateGroupForm();
    drawAddAndDeleteParticipantsForm();
    addEmailInputLitener();
  });
}

function drawCreateGroupForm() {
  const pane = document.querySelector('#pane');
  const createGroupDiv = document.createElement('div');
  const header = document.createElement('h3');
  const form = document.createElement('form');
  const namePTag = document.createElement('p');

  const nameInput = document.createElement('input');

  const button = document.createElement('button');

  pane.innerHTML = '';

  header.innerText = 'Create Group';
  namePTag.innerText = 'Name';

  button.innerText = 'Create';

  addClass('auth', createGroupDiv, header, form, namePTag, nameInput, button);

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

    return setMsg(response.data);
  });

  pane.appendChild(createGroupDiv);
  createGroupDiv.appendChild(form);
  form.appendChild(header);
  form.appendChild(namePTag);
  form.appendChild(nameInput);

  form.appendChild(button);
}

function drawAddAndDeleteParticipantsForm() {
  const pane = document.querySelector('#pane');
  const manageDiv = pane.querySelector('div');
  const header = document.createElement('h3');
  const form = document.createElement('form');
  const groupNamePtag = document.createElement('p');
  const groupNameInput = document.createElement('input');
  const participantsPtag = document.createElement('p');
  const participantsInput = document.createElement('input');
  const searchResultDiv = document.createElement('div');
  const selectedUserDiv = document.createElement('div');
  const addButton = document.createElement('button');
  const deleteButton = document.createElement('button');

  header.innerText = 'Manage Participants';

  groupNamePtag.innerText = 'Group Name';
  participantsPtag.innerText = 'Search Participants Email';

  participantsInput.setAttribute('id', 'groupParticipantsSearchEmailInput');
  searchResultDiv.setAttribute('id', 'groupParticipantsSearchResultDiv');
  selectedUserDiv.setAttribute('id', 'groupSelectedUserDiv');

  addButton.innerText = 'Add';
  deleteButton.innerText = 'Delete';

  addClass(
    'auth',
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

    if (!groupNameInput.value) return setMsg('Please enter group name');

    const userIds = Object.keys(window.selectedUser);

    if (userIds.length === 0) return setMsg('Please select at least one participant');

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

    window.selectedUser = {};
    groupNameInput.value = '';
    participantsInput.value = '';
    searchResultDiv.innerHTML = '';
    selectedUserDiv.innerHTML = '';

    return setMsg(response.data);
  });

  deleteButton.addEventListener('click', async e => {
    e.preventDefault();

    if (!groupNameInput.value) return setMsg('Please enter group name');

    const userIds = Object.keys(window.selectedUser);

    if (userIds.length === 0) return setMsg('Please select at least one participant');

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

  manageDiv.appendChild(form);

  form.appendChild(header);
  form.appendChild(groupNamePtag);
  form.appendChild(groupNameInput);
  form.appendChild(participantsPtag);
  form.appendChild(participantsInput);
  form.appendChild(searchResultDiv);
  form.appendChild(selectedUserDiv);
  form.appendChild(addButton);
  form.appendChild(deleteButton);
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
