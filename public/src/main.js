import { setMsg, addClass, storeToken } from './helper.js';
import { socketConnect } from './socket.js';
import { drawNavbar } from './navbar.js';

setSignInField();

function drawStructure() {
  const container = document.querySelector('#container');
  const sidebar = document.createElement('div');
  const navbar = document.createElement('div');
  const userInfo = document.createElement('div');
  const username = document.createElement('h2');
  const options = document.createElement('div');

  const allContactsDiv = document.createElement('div');
  const allContactsHeaderDiv = document.createElement('div');
  const allContactsHeader = document.createElement('h3');
  const allContacts = document.createElement('div');

  const starredContactsDiv = document.createElement('div');
  const starredContactsHeaderDiv = document.createElement('div');
  const starredContactsHeader = document.createElement('h3');
  const starredContacts = document.createElement('div');

  const main = document.createElement('div');
  const pane = document.createElement('div');
  const welcome = document.createElement('h1');

  allContactsHeader.innerText = 'All';
  starredContactsHeader.innerText = 'Starred';
  welcome.innerText = 'Welcome Aboard';

  sidebar.setAttribute('id', 'sidebar');
  navbar.setAttribute('id', 'navbar');
  userInfo.setAttribute('id', 'userInfo');
  options.setAttribute('id', 'options');

  allContactsDiv.setAttribute('id', 'all');
  allContactsHeaderDiv.setAttribute('class', 'header');
  allContacts.setAttribute('class', 'contacts');

  starredContactsDiv.setAttribute('id', 'star');
  starredContactsHeaderDiv.setAttribute('class', 'header');
  starredContacts.setAttribute('class', 'contacts');

  main.setAttribute('id', 'main');
  pane.setAttribute('class', 'pane');

  sidebar.appendChild(navbar);
  sidebar.appendChild(allContactsDiv);
  sidebar.appendChild(starredContactsDiv);

  navbar.appendChild(userInfo);
  userInfo.appendChild(username);
  navbar.appendChild(options);

  allContactsDiv.appendChild(allContactsHeaderDiv);
  allContactsHeaderDiv.appendChild(allContactsHeader);
  allContactsDiv.appendChild(allContacts);

  starredContactsDiv.appendChild(starredContactsHeaderDiv);
  starredContactsHeaderDiv.appendChild(starredContactsHeader);
  starredContactsDiv.appendChild(starredContacts);

  main.appendChild(pane);
  pane.appendChild(welcome);

  container.innerHTML = '';

  container.appendChild(sidebar);
  container.appendChild(main);
}

function setSignInField() {
  const container = document.querySelector('#container');
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

    if (response.error) return setMsg(response.error, 'error');

    storeToken(response.data.access_token);
    drawStructure();
    socketConnect();
    drawNavbar();
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
