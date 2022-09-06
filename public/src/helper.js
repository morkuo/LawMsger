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

function setMessage(msg, time, senderSocketId, more) {
  const messages = document.getElementById('messages');

  if (!messages) return;

  const item = document.createElement('li');

  const senderDiv = document.createElement('div');
  const messageDiv = document.createElement('div');
  const timeDiv = document.createElement('div');

  messageDiv.innerText = msg;
  timeDiv.innerText = time;

  messageDiv.setAttribute('class', 'messageTextDiv');

  item.appendChild(senderDiv);
  item.appendChild(messageDiv);
  item.appendChild(timeDiv);

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

export { setMsg, addClass, storeToken, getJwtToken, setMessage, fetchGet };
