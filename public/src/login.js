import { addClass, storeToken, storeUserId } from './helper.js';

setSignInField();

function setSignInField() {
  const container = document.querySelector('.container');
  const signInDiv = container.querySelector('div');
  const header = document.createElement('h3');
  const form = document.createElement('form');
  const emailPTag = document.createElement('p');
  const passwordPtag = document.createElement('p');
  const emailInput = document.createElement('input');
  const passwordInput = document.createElement('input');
  const button = document.createElement('button');

  header.innerText = 'Sign In';
  emailPTag.innerText = 'Email';
  passwordPtag.innerText = 'Password';
  button.innerText = 'Submit';

  form.setAttribute('id', 'signIn');

  passwordInput.setAttribute('type', 'password');

  addClass(
    'auth',
    signInDiv,
    header,
    form,
    emailPTag,
    passwordPtag,
    emailInput,
    passwordInput,
    button
  );

  const signInApi = `${window.location.origin}/api/1.0/user/signin`;

  button.addEventListener('click', async e => {
    e.preventDefault();

    const payload = {
      email: emailInput.value,
      password: passwordInput.value,
    };

    const res = await fetch(signInApi, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const response = await res.json();

    if (response.error) return setSystemMessage(response.error, 'error');

    storeToken(response.data.access_token);
    storeUserId(response.data.user.id);

    window.location.href = `${window.location.origin}/main.html`;
  });

  container.appendChild(signInDiv);
  signInDiv.appendChild(form);
  form.appendChild(header);
  form.appendChild(emailPTag);
  form.appendChild(emailInput);
  form.appendChild(passwordPtag);
  form.appendChild(passwordInput);
  form.appendChild(button);
}

function setSystemMessage(messages, type, autoRemove = true) {
  const container = document.querySelector('#signIn');

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

  if (type === 'error') {
    addClass('error', msgDiv);
  }

  container.insertAdjacentElement('afterbegin', msgDiv);

  if (autoRemove) {
    setTimeout(() => {
      msgDiv.remove();
    }, 4000);
  }
}
