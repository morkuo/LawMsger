function setMsg(messages, error = false, autoRemove = true, appendTo = '#main') {
  const container = document.querySelector(appendTo);

  const msgDiv = document.createElement('div');
  msgDiv.setAttribute('id', 'systemMsg');

  if (Array.isArray(messages)) {
    messages.forEach(message => {
      const msg = document.createElement('p');
      msg.innerText = `${message.param}: ${message.msg}`;
      msgDiv.appendChild(msg);
    });
  } else {
    const msg = document.createElement('p');
    msg.innerText = messages;
    msgDiv.appendChild(msg);
  }

  if (error) {
    addClass('error', msgDiv);
  }

  container.insertAdjacentElement('afterbegin', msgDiv);

  if (autoRemove) {
    setTimeout(() => {
      msgDiv.remove();
    }, 4000);
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

function storeUserId(userId) {
  localStorage.setItem('id', userId);
}

function getJwtToken() {
  let authorization = 'Bearer ';
  let tokenJson = localStorage.getItem('token');
  if (!tokenJson) return (window.location.href = `${window.location.origin}/index.html`);

  authorization += tokenJson;

  return authorization;
}

async function setMessage(msg, time, senderSocketId, more, filesInfo, isRead, senderName) {
  const messages = document.getElementById('messages');

  if (!messages) return;

  const item = document.createElement('li');

  const senderDiv = document.createElement('div');
  const messageDiv = document.createElement('div');
  const messageWrapper = document.createElement('div');
  const messageName = document.createElement('div');
  const messageText = document.createElement('p');
  const filesDiv = document.createElement('div');
  const timeDiv = document.createElement('div');

  //convert time format
  const relativeTime = changeTimeFormat(time);
  timeDiv.innerText = relativeTime;

  senderDiv.innerText = senderName[0].toUpperCase();
  messageName.innerText = senderName;
  senderDiv.setAttribute('class', 'chat-sender-picture');
  messageDiv.setAttribute('class', 'chat-message-text');
  timeDiv.setAttribute('class', 'chat-message-time');
  timeDiv.setAttribute('data-raw-time', time);

  item.appendChild(senderDiv);
  item.appendChild(messageDiv);
  item.appendChild(timeDiv);

  messageDiv.appendChild(messageWrapper);
  messageWrapper.appendChild(messageName);

  if (msg !== '') {
    messageText.innerText = msg;
    messageWrapper.appendChild(messageText);
  }

  if (filesInfo) {
    const infoArray = await JSON.parse(filesInfo).data;

    if (infoArray.length !== 0) {
      for (let info of infoArray) {
        const { location: url, originalName } = info;

        if (isImage(originalName)) {
          const aTag = document.createElement('a');
          aTag.setAttribute('href', `${url}`);

          const image = document.createElement('img');
          image.setAttribute('class', 'chat-message-image-preview');
          image.src = url;
          image.alt = originalName;

          filesDiv.appendChild(aTag);
          aTag.appendChild(image);
        } else {
          const file = document.createElement('a');
          file.setAttribute('class', 'chat-message-file-preview');
          file.setAttribute('href', `${url}`);
          file.setAttribute('download', `testname`);
          file.innerText = originalName;
          filesDiv.appendChild(file);
        }
      }

      messageWrapper.appendChild(filesDiv);
    }
  }

  if (!more) {
    messages.appendChild(item);
    if (!isRead) item.classList.add('chat-unread-message');
  } else messages.insertAdjacentElement('afterbegin', item);

  if (!senderSocketId) {
    if (!more) messages.scrollTo(0, messages.scrollHeight);
    return;
  }

  senderDiv.innerText = senderName[0].toUpperCase();
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

function changeTimeFormat(target) {
  const now = new Date();
  const nowYear = now.getFullYear();
  const nowMonth = now.getMonth() + 1;
  const nowDate = now.getDate();

  const messageTime = new Date(target);
  const messageYear = messageTime.getFullYear();
  const messageMonth = messageTime.getMonth() + 1;
  const messageDate = messageTime.getDate();

  let outputMonth = messageMonth;
  let outputDate = messageTime.getDate();
  let outputHours = messageTime.getHours();
  let outputMinutes = messageTime.getMinutes();

  if (outputMonth < 10) outputMonth = `0${outputMonth}`;
  if (outputDate < 10) outputDate = `0${outputDate}`;
  if (outputHours < 10) outputHours = `0${outputHours}`;
  if (outputMinutes < 10) outputMinutes = `0${outputMinutes}`;

  // console.log(toutputMinutes);

  if (nowYear === messageYear && nowMonth === messageMonth && nowDate === messageDate) {
    return `Today ${outputHours}:${outputMinutes}`;
  }

  const dateDifference = nowDate - messageDate;

  if (nowYear === messageYear && nowMonth === messageMonth && dateDifference === 1) {
    return `Yesterday ${outputHours}:${outputMinutes}`;
  }

  return `${messageTime.getFullYear()}-${outputMonth}-${outputDate}`;
}

function isImage(url) {
  return /\.(jpg|jpeg|png|gif|svg)$/.test(url);
}

export { setMsg, addClass, storeToken, storeUserId, getJwtToken, setMessage, fetchGet, isImage };
