import { setMsg, addClass, getJwtToken } from './helper.js';
import { drawCreateUserForm, drawDeleteUserForm, checkAdmin } from './admin.js';

main();

async function main() {
  setNavbar();
}

async function setNavbar() {
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

  if (response.error) {
    window.location.href = `${window.location.origin}/index.html`;
    return setMsg(response.error, 'error');
  }

  const userinfo = document.querySelector('#userInfo h2');

  userinfo.innerText = response.data.name;

  userinfo.email = response.data.email;
  userinfo.created_at = response.data.created_at;
  userinfo.picture = response.data.picture;

  userinfo.addEventListener('click', drawProfile);

  const navbarOptions = document.querySelector('#options');

  if (response.data.role === -1) {
    const adminButton = document.createElement('a');
    adminButton.innerText = 'Manage';

    adminButton.addEventListener('click', async () => {
      // window.location.href = `${window.location.origin}/admin.html`;
      const isAdmin = await checkAdmin();
      if (!isAdmin) return setMsg(response.error, 'error');

      drawCreateUserForm();
      drawDeleteUserForm();
    });

    navbarOptions.appendChild(adminButton);
  }

  const signOutButton = document.createElement('a');
  signOutButton.innerText = 'Sign Out';
  navbarOptions.appendChild(signOutButton);

  signOutButton.addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = `${window.location.origin}/index.html`;
  });
}

async function drawProfile(e) {
  const pane = document.querySelector('#pane');
  const profileDiv = document.createElement('div');
  const header = document.createElement('h3');
  const profile = document.createElement('div');
  const pictureDiv = document.createElement('div');
  const picture = document.createElement('img');
  const infoDiv = document.createElement('div');
  const editDiv = document.createElement('div');
  const namePTag = document.createElement('p');
  const emailPTag = document.createElement('p');
  const onboardDatePTag = document.createElement('p');
  const changePasswordButton = document.createElement('button');

  pane.innerHTML = '';

  header.innerText = 'Profile';
  namePTag.innerText = e.target.innerText;
  emailPTag.innerText = e.target.email;
  picture.src = e.target.picture;
  onboardDatePTag.innerText = e.target.created_at;

  changePasswordButton.innerText = 'Change Password';

  addClass('profile', profileDiv, header, profile, namePTag, emailPTag, changePasswordButton);

  changePasswordButton.addEventListener('click', drawChangPasswordForm);

  pane.appendChild(profileDiv);

  profileDiv.appendChild(profile);
  profile.appendChild(header);
  profile.appendChild(pictureDiv);
  profile.appendChild(infoDiv);
  profile.appendChild(editDiv);

  pictureDiv.appendChild(picture);

  infoDiv.appendChild(namePTag);
  infoDiv.appendChild(emailPTag);
  infoDiv.appendChild(onboardDatePTag);

  editDiv.appendChild(changePasswordButton);
}

function drawChangPasswordForm(e) {
  const pane = document.querySelector('#pane');
  const changePasswordDiv = document.createElement('form');
  const oldPasswordPtag = document.createElement('p');
  const newPasswordPTag = document.createElement('p');
  const confirmPTag = document.createElement('p');
  const oldPasswordInput = document.createElement('input');
  const newPasswordInput = document.createElement('input');
  const confirmInput = document.createElement('input');
  const optionDiv = document.createElement('div');

  const confirmButton = document.createElement('button');
  const cancelButton = document.createElement('button');

  changePasswordDiv.setAttribute('id', 'changePasswordDiv');
  optionDiv.setAttribute('id', 'optionDiv');

  oldPasswordPtag.innerText = 'Current Password';
  newPasswordPTag.innerText = 'New Password';
  confirmPTag.innerText = 'Confirm';

  confirmButton.innerText = 'O';
  cancelButton.innerText = 'X';

  oldPasswordInput.setAttribute('type', 'password');
  newPasswordInput.setAttribute('type', 'password');
  confirmInput.setAttribute('type', 'password');

  addClass(
    'profile',
    confirmButton,
    cancelButton,
    oldPasswordInput,
    newPasswordInput,
    confirmInput
  );

  changePasswordDiv.appendChild(oldPasswordPtag);
  changePasswordDiv.appendChild(oldPasswordInput);
  changePasswordDiv.appendChild(newPasswordPTag);
  changePasswordDiv.appendChild(newPasswordInput);
  changePasswordDiv.appendChild(confirmPTag);
  changePasswordDiv.appendChild(confirmInput);
  changePasswordDiv.appendChild(optionDiv);
  optionDiv.appendChild(confirmButton);
  optionDiv.appendChild(cancelButton);

  confirmButton.addEventListener('click', async e => {
    e.preventDefault();

    const authorization = getJwtToken();

    const api = `${window.location.origin}/api/1.0/user`;

    const payload = {
      oldPassword: oldPasswordInput.value,
      newPassword: newPasswordInput.value,
      confirm: confirmInput.value,
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

    setMsg(response.data);
  });

  cancelButton.addEventListener('click', e => {
    e.preventDefault();
    changePasswordDiv.remove();
  });

  pane.appendChild(changePasswordDiv);
}
