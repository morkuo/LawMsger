function setMsg(message, type, autoRemove = true) {
  const pane = document.querySelector('#pane');

  const msgDiv = document.createElement('div');
  const msg = document.createElement('p');
  msgDiv.setAttribute('id', 'msgBox');

  if (type === 'error') {
    addClass('error', msgDiv);
  }

  msg.innerText = message;

  pane.appendChild(msgDiv);
  msgDiv.appendChild(msg);

  if (autoRemove) {
    setTimeout(() => {
      msgDiv.remove();
    }, 3000);
  }
}

function addClass(className, ...tags) {
  for (let tag of tags) {
    tag.classList.add(className);
  }
}

function storeToken(token) {
  localStorage.setItem('token', token);
}

function getJwtToken() {
  let authorization = 'Bearer ';
  let tokenJson = localStorage.getItem('token');
  if (tokenJson) authorization += tokenJson;

  return authorization;
}

async function setMessage(msg, time, senderSocketId, more, fileUrls) {
  const messages = document.getElementById('messages');

  if (!messages) return;

  const item = document.createElement('li');

  const senderDiv = document.createElement('div');
  const messageDiv = document.createElement('div');
  const messageText = document.createElement('p');
  const filesDiv = document.createElement('div');
  const timeDiv = document.createElement('div');

  timeDiv.innerText = time;

  senderDiv.setAttribute('class', 'chat-sender-picture');
  messageDiv.setAttribute('class', 'chat-message-text');

  item.appendChild(senderDiv);
  item.appendChild(messageDiv);
  item.appendChild(timeDiv);

  if (msg !== '') {
    messageText.innerText = msg;
    messageDiv.appendChild(messageText);
  }

  let urls = null;
  if (fileUrls) {
    urls = await JSON.parse(fileUrls).data;

    if (urls.length !== 0) {
      for (let url of urls) {
        if (isImage(url)) {
          const image = document.createElement('img');
          image.setAttribute('class', 'chat-message-image-preview');
          image.src = url;
          filesDiv.appendChild(image);
        } else {
          const file = document.createElement('div');
          file.setAttribute('class', 'chat-message-file-preview');
          file.innerText = 'File';
          filesDiv.appendChild(file);
        }
      }

      messageDiv.appendChild(filesDiv);
    }
  }

  if (!more) messages.appendChild(item);
  else messages.insertAdjacentElement('afterbegin', item);

  if (!senderSocketId) {
    senderDiv.innerText = '自己';
    if (!more) messages.scrollTo(0, messages.scrollHeight);
    return;
  }

  const contactDiv = document.querySelector(`.contacts [data-socket-id="${senderSocketId}"]`);
  const contactPictureDiv = contactDiv.querySelector('.contact-picture');

  senderDiv.innerText = contactPictureDiv.innerText;
  if (!more) messages.scrollTo(0, messages.scrollHeight);
  return;
}

async function fetchGet(apiPath) {
  const apiUrl = `${window.location.origin}/api/1.0${apiPath}`;

  let authorization = getJwtToken();

  const res = await fetch(apiUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authorization,
    },
  });

  const response = await res.json();

  if (response.error) return setMsg(response.error, 'error');

  return response;
}

function isImage(url) {
  return /\.(jpg|jpeg|png|gif|svg)$/.test(url);
}

export { setMsg, addClass, storeToken, getJwtToken, setMessage, fetchGet, isImage };
