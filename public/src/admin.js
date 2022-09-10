import { setMsg, addClass, getJwtToken } from './helper.js';

function drawCreateUserForm() {
  const pane = document.querySelector('#pane');
  const signUpDiv = document.createElement('div');
  const header = document.createElement('h3');
  const form = document.createElement('form');
  const namePTag = document.createElement('p');
  const emailPTag = document.createElement('p');
  const passwordPtag = document.createElement('p');
  const nameInput = document.createElement('input');
  const emailInput = document.createElement('input');
  const passwordInput = document.createElement('input');
  const button = document.createElement('button');

  pane.innerHTML = '';

  header.innerText = 'Create User';
  namePTag.innerText = 'Name';
  emailPTag.innerText = 'Email';
  passwordPtag.innerText = 'Password';
  button.innerText = 'Create';

  passwordInput.setAttribute('type', 'password');

  addClass(
    'auth',
    signUpDiv,
    header,
    form,
    namePTag,
    emailPTag,
    passwordPtag,
    nameInput,
    emailInput,
    passwordInput,
    button
  );

  const signUpApi = `${window.location.origin}/api/1.0/user`;

  button.addEventListener('click', async e => {
    e.preventDefault();

    const payload = {
      name: nameInput.value,
      email: emailInput.value,
      password: passwordInput.value,
    };

    let authorization = getJwtToken();

    const res = await fetch(signUpApi, {
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

  pane.appendChild(signUpDiv);
  signUpDiv.appendChild(form);
  form.appendChild(header);
  form.appendChild(namePTag);
  form.appendChild(nameInput);
  form.appendChild(emailPTag);
  form.appendChild(emailInput);
  form.appendChild(passwordPtag);
  form.appendChild(passwordInput);
  form.appendChild(button);
}

async function checkAdmin() {
  const profileApi = `${window.location.origin}/api/1.0/user`;

  let authorization = getJwtToken();

  const res = await fetch(profileApi, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authorization,
    },
  });

  const response = await res.json();

  if (response.error || response.data.role !== -1) return false;

  return true;
}

function drawDeleteUserForm() {
  const pane = document.querySelector('#pane');
  const manageDive = pane.querySelector('div');
  const header = document.createElement('h3');
  const form = document.createElement('form');
  const emailPTag = document.createElement('p');
  const emailInput = document.createElement('input');
  const button = document.createElement('button');

  header.innerText = 'Delete User';

  emailPTag.innerText = 'Email';

  button.innerText = 'Delete';

  addClass('auth', header, form, emailPTag, emailInput, button);

  const signUpApi = `${window.location.origin}/api/1.0/user`;

  button.addEventListener('click', async e => {
    e.preventDefault();

    const payload = {
      email: emailInput.value,
    };

    let authorization = getJwtToken();

    const res = await fetch(signUpApi, {
      method: 'DELETE',
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

  manageDive.appendChild(form);

  form.appendChild(header);
  form.appendChild(emailPTag);
  form.appendChild(emailInput);
  form.appendChild(button);
}

export { drawCreateUserForm, drawDeleteUserForm, checkAdmin };
