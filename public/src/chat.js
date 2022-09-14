import { setMsg, addClass, getJwtToken, setMessage, fetchGet, isImage } from './helper.js';
import { socket } from './socket.js';

let uploadfilesQueue = [];

function addChatListenerToContactDivs(contactsDiv) {
  /*
    Click Specific Contact then draw Chat Window
    */
  contactsDiv.addEventListener('click', chatListener);
}

function addGroupChatListenerToGroupDivs(groupsDiv) {
  /*
    Click Specific Contact then draw Chat Window
    */
  groupsDiv.addEventListener('click', groupChatListener);
}

async function chatListener(e) {
  // click on add star button, then return
  if (e.target.classList.contains('contact-add-star-button') && e.target.innerText !== '') return;
  if (e.target.classList.contains('contact-delete-star-button')) return;

  //look for the clicked element's user id
  let targetContact = e.target;
  while (!targetContact.hasAttribute('data-socket-id')) {
    targetContact = targetContact.parentElement;
  }

  //remove unread count
  const unreadCountDivs = document.querySelectorAll(
    `.contacts [data-id="${targetContact.dataset.id}"] .contact-unread-count`
  );
  unreadCountDivs.forEach(div => {
    div.innerText = '';
  });

  drawChatWindow(targetContact.dataset.id, targetContact.dataset.socketId);

  //append history message to chat window
  const { data: history } = await getMessages(targetContact.dataset.id);

  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].sender_id !== targetContact.dataset.id) {
      setMessage(history[i].message, history[i].created_at, null, null, history[i].files, 'read');
    } else {
      setMessage(
        history[i].message,
        history[i].created_at,
        targetContact.dataset.socketId,
        null,
        history[i].files,
        history[i].isRead
      );
    }
  }

  //get more messages when scroll to top
  const messages = document.getElementById('messages');

  messages.addEventListener('scroll', async e => {
    // console.log(e.target.scrollTop);

    if (e.target.scrollTop === 0) {
      // console.log('Pull New data');

      let oldestMessageTimeDiv = messages.querySelector('li:first-child .chat-message-time');
      let baselineTime = oldestMessageTimeDiv.dataset.rawTime;

      const { data: moreMessages } = await getMessages(targetContact.dataset.id, baselineTime);

      if (moreMessages.length === 0) return setMsg('No More Messages');

      for (let msg of moreMessages) {
        if (msg.sender_id !== targetContact.dataset.id) {
          setMessage(msg.message, msg.created_at, null, 'more', msg.files, 'read');
        } else {
          setMessage(
            msg.message,
            msg.created_at,
            targetContact.dataset.socketId,
            'more',
            msg.files,
            msg.isRead
          );
        }
      }
    }
  });

  //suggestions
  const input = document.getElementById('input');
  const sugesstionsList = document.getElementById('suggestions');
  const form = document.getElementById('form');

  const debouncedDetectInput = debounce(detectInput, 600);

  input.addEventListener('keydown', debouncedDetectInput);

  // sugesstionsList.addEventListener('click', async e => {
  //   if (e.target.tagName === 'LI') input.value = e.target.innerText;
  // });

  // Send message
  form.addEventListener('submit', async e => {
    e.preventDefault();

    const messages = document.getElementById('messages');
    const contactUserSocketId = messages.dataset.socketId;
    const contactUserId = messages.dataset.id;
    const contactDiv = document.querySelector(`[data-id="${contactUserId}"]`);

    const contactNameDiv = contactDiv.querySelector('.contact-info div:first-child');
    const contactName = contactNameDiv.innerText;

    const uploadButton = document.querySelector('#chatUploadButton');

    if (input.value || uploadButton.value) {
      const authorization = getJwtToken();
      const response = await uploadFile(authorization);

      if (response.error) return alert(response.error);

      // console.log('Got fileUrls from server:', rawfileUrls);

      const filesInfo = JSON.stringify(response);

      socket.emit('msg', input.value, contactUserSocketId, contactUserId, contactName, filesInfo);

      setMessage(input.value, Date.now(), null, null, filesInfo, 'read');

      input.value = '';
    }
  });
}

async function groupChatListener(e) {
  // click on leave button, then return
  if (e.target.classList.contains('group-delete-button')) return;

  //look for the clicked element's socket id
  let targetContact = e.target;
  while (!targetContact.hasAttribute('data-socket-id')) {
    targetContact = targetContact.parentElement;
  }

  console.log(targetContact);

  //remove unread count
  const unreadCountDiv = targetContact.querySelector('.group-unread-count');

  unreadCountDiv.innerText = '';

  drawChatWindow(targetContact.dataset.id, targetContact.dataset.socketId);

  //append history message to chat window
  const { data: history } = await getGroupMessages(targetContact.dataset.socketId);

  for (let i = history.length - 1; i >= 0; i--) {
    const contactDiv = document.querySelector(`.contacts [data-id="${history[i].sender_id}"]`);

    //other users
    if (contactDiv) {
      const userId = localStorage.getItem('id');
      const isRead = history[i].isRead.includes(userId);

      setMessage(
        history[i].message,
        history[i].created_at,
        contactDiv.dataset.socketId,
        null,
        history[i].files,
        isRead
      );
    } else {
      setMessage(history[i].message, history[i].created_at, null, null, history[i].files, 'read');
    }
  }

  //get more messages when scroll to top
  const messages = document.getElementById('messages');

  messages.addEventListener('scroll', async e => {
    // console.log(e.target.scrollTop);

    if (e.target.scrollTop === 0) {
      // console.log('Pull New data');

      let oldestMessageTimeDiv = messages.querySelector('li:first-child .chat-message-time');
      let baselineTime = oldestMessageTimeDiv.dataset.rawTime;

      console.log(baselineTime);

      const { data: moreMessages } = await getGroupMessages(
        targetContact.dataset.socketId,
        baselineTime
      );

      if (moreMessages.length === 0) return setMsg('No More Messages');

      for (let msg of moreMessages) {
        if (msg.sender_id !== targetContact.dataset.id) {
          setMessage(msg.message, msg.created_at, null, 'more', msg.files, 'read');
        } else {
          setMessage(
            msg.message,
            msg.created_at,
            targetContact.dataset.socketId,
            'more',
            msg.files,
            msg.isRead
          );
        }
      }
    }
  });

  //suggestions
  const input = document.getElementById('input');
  const sugesstionsList = document.getElementById('suggestions');
  const form = document.getElementById('form');

  const debouncedDetectInput = debounce(detectInput, 600);

  input.addEventListener('keydown', debouncedDetectInput);

  sugesstionsList.addEventListener('click', async e => {
    if (e.target.tagName === 'LI') input.value = e.target.innerText;
  });

  // Send message
  form.addEventListener('submit', async e => {
    e.preventDefault();

    const messages = document.getElementById('messages');
    const contactUserSocketId = messages.dataset.socketId;
    const contactUserId = messages.dataset.id;
    const contactDiv = document.querySelector(`[data-id="${contactUserId}"]`);

    // const contactNameDiv = contactDiv.querySelector('.contact-info div:first-child');
    // const contactName = contactNameDiv.innerText;

    const uploadButton = document.querySelector('#chatUploadButton');

    if (input.value || uploadButton.value) {
      const authorization = getJwtToken();
      const response = await uploadFile(authorization);

      if (response.error) return alert(response.error);

      // console.log('Got fileUrls from server:', rawfileUrls);

      const filesInfo = JSON.stringify(response);

      socket.emit('groupmsg', input.value, contactUserSocketId, filesInfo);

      setMessage(input.value, Date.now(), null, null, filesInfo, 'read');

      input.value = '';
    }
  });
}

function drawChatWindow(targetContactUserId, targetContactSocketId) {
  const pane = document.getElementById('pane');
  const messages = document.createElement('ul');
  const suggestions = document.createElement('ul');
  const input = document.createElement('input');
  const form = document.createElement('form');
  const sendButton = document.createElement('button');
  const uploadButtonWrapper = document.createElement('label');
  const uploadButton = document.createElement('input');
  const previewImageDiv = document.createElement('div');
  const unloadButton = document.createElement('div');

  pane.innerHTML = '';

  messages.setAttribute('id', 'messages');
  messages.setAttribute('data-id', targetContactUserId);
  messages.setAttribute('data-socket-id', targetContactSocketId);
  suggestions.setAttribute('id', 'suggestions');
  form.setAttribute('id', 'form');
  input.setAttribute('id', 'input');
  input.setAttribute('autocomplete', 'off');

  sendButton.innerText = 'Send';

  uploadButtonWrapper.setAttribute('id', 'chatUploadButtonWrapper');
  uploadButton.setAttribute('id', 'chatUploadButton');
  uploadButton.setAttribute('type', 'file');
  uploadButton.setAttribute('name', 'images');
  uploadButton.setAttribute('multiple', '');
  uploadButton.style.visibility = 'hidden';

  unloadButton.setAttribute('id', 'chatUnloadFileButton');
  unloadButton.innerText = 'X';

  previewImageDiv.setAttribute('id', 'previewImageDiv');
  previewImageDiv.setAttribute('data-file', 'false');

  form.appendChild(input);
  form.appendChild(sendButton);

  pane.appendChild(messages);
  pane.appendChild(suggestions);
  pane.appendChild(form);

  form.appendChild(uploadButtonWrapper);
  uploadButtonWrapper.appendChild(uploadButton);
  pane.appendChild(previewImageDiv);
  previewImageDiv.appendChild(unloadButton);

  addUploadFileListener();
  addUnloadFileListener();
}

async function getMessages(targetContactUserId, baselineTime) {
  let messageApiPath = `/message`;

  if (!baselineTime) messageApiPath += `?contactUserId=${targetContactUserId}`;
  else messageApiPath += `/more?contactUserId=${targetContactUserId}&baselineTime=${baselineTime}`;

  const response = await fetchGet(messageApiPath);
  return response;
}

async function getGroupMessages(targetGroupId, baselineTime) {
  let apiPath = `/groupmessage`;

  if (!baselineTime) apiPath += `?groupId=${targetGroupId}`;
  else apiPath += `/more?groupId=${targetGroupId}&baselineTime=${baselineTime}`;

  const response = await fetchGet(apiPath);
  return response;
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
  const suggestionsList = document.getElementById('suggestions');
  const input = document.getElementById('input');

  if (!currentInput) return (suggestionsList.innerHTML = '');

  const wordSuggestion = currentInput.indexOf('`');
  const clauseSuggestion = currentInput.indexOf('``');
  const matchclausesContent = currentInput.indexOf('|');

  if (wordSuggestion > -1 && clauseSuggestion === -1) {
    socket.emit('suggestion', currentInput.slice(wordSuggestion + 1));

    //tab listener
    input.addEventListener(
      'keydown',
      e => {
        if (e.key === 'Tab') {
          //to stay in the input field
          e.preventDefault();

          const sugesstion = suggestionsList.querySelector('li');

          if (sugesstion.innerText !== 'undefined') {
            e.target.value = currentInput.slice(0, wordSuggestion) + sugesstion.innerText;
            suggestionsList.innerHTML = '';
          }
        }
      },
      //once the eventlistener has been fired once, remove itself
      { once: true }
    );

    return;
  }

  if (clauseSuggestion > -1) {
    socket.emit('suggestion', currentInput.slice(clauseSuggestion + 2), 'clauses');

    //tab listener
    input.addEventListener(
      'keydown',
      e => {
        if (e.key === 'Tab') {
          e.preventDefault();

          const sugesstion = suggestionsList.querySelector('li');

          if (sugesstion.innerText !== 'undefined') {
            e.target.value = currentInput.slice(0, clauseSuggestion) + sugesstion.dataset.body;
            suggestionsList.innerHTML = '';
          }
        }
      },
      { once: true }
    );
    return;
  }

  if (matchclausesContent > -1) {
    socket.emit('matchedClauses', currentInput.slice(matchclausesContent + 1));

    suggestionsList.addEventListener(
      'click',
      async e => {
        if (e.target.tagName === 'LI') {
          e.stopPropagation();
          input.value = currentInput.slice(0, matchclausesContent) + e.target.dataset.body;

          suggestionsList.innerHTML = '';

          const title = e.target.dataset.title;
          const number = e.target.dataset.number;

          const now = new Date();
          const origin = now.toISOString();

          socket.emit('updateMatchedClauses', origin, title, number);
        }
      },
      { once: true }
    );

    //tab listener
    input.addEventListener(
      'keydown',
      async e => {
        if (e.key === 'Tab') {
          e.preventDefault();

          const suggestion = suggestionsList.querySelector('li');

          e.target.value = currentInput.slice(0, matchclausesContent) + suggestion.dataset.body;
          suggestionsList.innerHTML = '';

          const title = suggestion.dataset.title;
          const number = suggestion.dataset.number;

          const now = new Date();
          const origin = now.toISOString();

          socket.emit('updateMatchedClauses', origin, title, number);
        }
      },
      { once: true }
    );

    return;
  }
}

function addUploadFileListener() {
  const chatUploadButton = document.querySelector('#chatUploadButton');

  chatUploadButton.addEventListener('change', e => {
    previewFile(e.target);
  });
}

function previewFile(filesInput) {
  const previewImageDiv = document.querySelector('#previewImageDiv');

  // console.log(filesInput.files);
  previewImageDiv.setAttribute('data-file', 'true');

  for (let i = 0; i < filesInput.files.length; i++) {
    const file = filesInput.files[i];
    const reader = new FileReader();

    if (file) {
      reader.readAsDataURL(file);
    }

    reader.addEventListener(
      'load',
      () => {
        if (isImage(file.name)) {
          const previewImage = document.createElement('img');
          previewImage.setAttribute('class', 'chat-upload-image-preview');
          previewImage.src = reader.result;

          previewImageDiv.appendChild(previewImage);
          uploadfilesQueue.push(file);
        } else {
          const fileDiv = document.createElement('div');
          fileDiv.setAttribute('class', 'chat-upload-file-preview');
          fileDiv.innerText = file.name;
          previewImageDiv.appendChild(fileDiv);
          uploadfilesQueue.push(file);
        }
      },
      false
    );
  }
}

async function uploadFile(authorization) {
  const formData = new FormData();

  console.log('before:' + uploadfilesQueue.length);

  const uploadfilesQueueLength = uploadfilesQueue.length;

  for (let i = 0; i < uploadfilesQueueLength; i++) {
    formData.append('images', uploadfilesQueue.shift());
  }

  console.log('after:' + uploadfilesQueue.length);

  // console.log('Going to upload this: ', filesInput);

  const api = `${window.location.origin}/api/1.0/message/upload`;

  const res = await fetch(api, {
    method: 'POST',
    headers: {
      'Authorization': authorization,
    },
    body: formData,
  });

  clearUploadFiles();

  const response = await res.json();

  return response;
}

function addUnloadFileListener() {
  const unloadFileButton = document.querySelector('#chatUnloadFileButton');
  // const uploadButton = document.querySelector('#chatUploadButton');

  //Remove all selected files
  unloadFileButton.addEventListener('click', e => {
    e.preventDefault();

    clearUploadFiles();
  });
}

function clearUploadFiles() {
  const uploadButton = document.querySelector('#chatUploadButton');
  const previewImageDiv = document.querySelector('#previewImageDiv');
  const previewImage = document.querySelectorAll('.chat-upload-image-preview');
  const previewFile = document.querySelectorAll('.chat-upload-file-preview');

  for (let image of previewImage) image.remove();
  for (let file of previewFile) file.remove();

  uploadButton.value = '';
  uploadfilesQueue = [];
  previewImageDiv.setAttribute('data-file', 'false');
}

export { addChatListenerToContactDivs, addGroupChatListenerToGroupDivs };
