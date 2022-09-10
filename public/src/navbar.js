import { setMsg, getJwtToken } from './helper.js';
import { drawCreateUserForm, checkAdmin } from './admin.js';

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

  const navbarOptions = document.querySelector('#options');

  if (response.data.role === -1) {
    const adminButton = document.createElement('a');
    adminButton.innerText = 'Manage';

    adminButton.addEventListener('click', async () => {
      // window.location.href = `${window.location.origin}/admin.html`;
      const isAdmin = await checkAdmin();
      if (!isAdmin) return setMsg(response.error, 'error');

      drawCreateUserForm();
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
