import { setMsg, addClass, getJwtToken, setMessage, fetchGet } from './helper.js';
import { socket } from './socket.js';

function addChatListenerToContactDivs(contactsDiv) {
  /*
    Click Specific Contact then draw Chat Window
    */
  contactsDiv.addEventListener('click', async e => {
    // click on add star button, then return
    if (e.target.classList.contains('contact-add-star-button') && e.target.innerText !== '') return;
    if (e.target.classList.contains('contact-delete-star-button')) return;

    //look for the clicked element's user id
    let targetContact = e.target;
    while (!targetContact.hasAttribute('data-socket-id')) {
      targetContact = targetContact.parentElement;
    }

    drawChatWindow(targetContact.dataset.id, targetContact.dataset.socketId);

    //append history message to chat window
    const { data: history } = await getMessages(targetContact.dataset.id);

    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].sender_id !== targetContact.dataset.id) {
        setMessage(history[i].message, history[i].created_at);
      } else {
        setMessage(history[i].message, history[i].created_at, targetContact.dataset.socketId);
      }
    }

    //get more messages when scroll to top
    const messages = document.getElementById('messages');

    messages.addEventListener('scroll', async e => {
      // console.log(e.target.scrollTop);

      if (e.target.scrollTop === 0) {
        // console.log('Pull New data');

        let oldestMessageTimeDiv = messages.querySelector('li:first-child div:last-child');
        let baselineTime = oldestMessageTimeDiv.innerText;

        const { data: moreMessages } = await getMessages(targetContact.dataset.id, baselineTime);

        if (moreMessages.length === 0) return setMsg('No More Messages');

        for (let msg of moreMessages) {
          if (msg.sender_id !== targetContact.dataset.id) {
            setMessage(msg.message, msg.created_at, null, 'more');
          } else {
            setMessage(msg.message, msg.created_at, targetContact.dataset.socketId, 'more');
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
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      const messages = document.getElementById('messages');
      const contactUserSocketId = messages.dataset.socketId;
      const contactUserId = messages.dataset.id;
      const contactDiv = document.querySelector(`[data-id="${contactUserId}"]`);

      const contactNameDiv = contactDiv.querySelector('.contact-info div:first-child');
      const contactName = contactNameDiv.innerText;

      if (input.value) {
        socket.emit('msg', input.value, contactUserSocketId, contactUserId, contactName);

        setMessage(input.value, Date.now());

        //clear input field
        input.value = '';
      }
    });
  });
}

function drawChatWindow(targetContactUserId, targetContactSocketId) {
  const pane = document.getElementById('pane');
  const messages = document.createElement('ul');
  const suggestions = document.createElement('ul');
  const input = document.createElement('input');
  const form = document.createElement('form');
  const button = document.createElement('button');

  pane.innerHTML = '';

  messages.setAttribute('id', 'messages');
  messages.setAttribute('data-id', targetContactUserId);
  messages.setAttribute('data-socket-id', targetContactSocketId);
  suggestions.setAttribute('id', 'suggestions');
  form.setAttribute('id', 'form');
  input.setAttribute('id', 'input');
  input.setAttribute('autocomplete', 'off');
  button.innerText = 'Send';

  form.appendChild(input);
  form.appendChild(button);

  pane.appendChild(messages);
  pane.appendChild(suggestions);
  pane.appendChild(form);
}

async function getMessages(targetContactUserId, baselineTime) {
  let messageApiPath = `/message`;

  if (!baselineTime) messageApiPath += `?contactUserId=${targetContactUserId}`;
  else messageApiPath += `/more?contactUserId=${targetContactUserId}&baselineTime=${baselineTime}`;

  const response = await fetchGet(messageApiPath);

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
    const res = await fetch(
      `/api/1.0/message/suggest?input=${currentInput.slice(wordSuggestion + 1)}`
    );
    const sugesstions = await res.json();

    suggestionsList.innerHTML = '';

    // no suggestion, then no need to do anything at this point
    if (sugesstions.length === 0) return;

    for (let suggestion of sugesstions) {
      const li = document.createElement('li');

      if (suggestion) li.innerText = suggestion;
      else li.innerText = suggestion;

      suggestionsList.appendChild(li);
    }

    //tab listener
    input.addEventListener(
      'keydown',
      e => {
        if (e.key === 'Tab') {
          //to stay in the input field
          e.preventDefault();
          if (sugesstions[0] !== 'undefined') {
            e.target.value = currentInput.slice(0, wordSuggestion) + sugesstions[0];
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
    const res = await fetch(
      `/api/1.0/message/suggest?input=${currentInput.slice(clauseSuggestion + 2)}&index=clauses`
    );
    const sugesstions = await res.json();

    suggestionsList.innerHTML = '';

    // console.log(sugesstions);

    // no suggestion, then no need to do anything at this point
    if (sugesstions.length === 0) return;

    for (let suggestion of sugesstions) {
      const li = document.createElement('li');

      if (suggestion) {
        const clauseTitle = suggestion.title;
        const clauseBody = suggestion.body;

        if (clauseBody.length > 15) {
          li.innerText = `${clauseTitle} ${clauseBody.slice(0, 15)}...`;
        } else {
          li.innerText = `${clauseTitle} ${clauseBody}`;
        }
      } else li.innerText = suggestion;

      suggestionsList.appendChild(li);
    }

    //tab listener
    input.addEventListener(
      'keydown',
      e => {
        if (e.key === 'Tab') {
          //to stay in the input field
          e.preventDefault();
          if (sugesstions[0] !== 'undefined') {
            e.target.value = currentInput.slice(0, clauseSuggestion) + sugesstions[0].body;
            suggestionsList.innerHTML = '';
          }
        }
      },
      //once the eventlistener has been fired once, remove itself
      { once: true }
    );
    return;
  }

  if (matchclausesContent > -1) {
    const res = await fetch(
      `/api/1.0/message/match?input=${currentInput.slice(matchclausesContent + 1)}`
    );
    const suggestions = await res.json();

    suggestionsList.innerHTML = '';

    // no suggestion, then no need to do anything at this point
    if (suggestions.length === 0) return;

    for (let suggestion of suggestions) {
      const li = document.createElement('li');

      if (suggestion) {
        const clauseTitle = suggestion.title;
        const clauseBody = suggestion.body;

        if (clauseBody.length > 15) {
          li.innerText = `${clauseBody.slice(0, 15)}...`;
        } else {
          li.innerText = `${clauseBody}`;
        }
      } else li.innerText = suggestion;

      suggestionsList.appendChild(li);
    }

    //tab listener
    input.addEventListener(
      'keydown',
      e => {
        if (e.key === 'Tab') {
          //to stay in the input field
          e.preventDefault();

          e.target.value = currentInput.slice(0, matchclausesContent) + suggestions[0].body;
          suggestionsList.innerHTML = '';
        }
      },
      //once the eventlistener has been fired once, remove itself
      { once: true }
    );

    return;
  }
}

export { addChatListenerToContactDivs };
