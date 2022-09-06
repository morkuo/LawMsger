import { setMsg, getJwtToken } from './helper.js';

main();

async function main() {
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

  if (response.error) return setMsg(response.error, 'error');

  const userinfo = document.querySelector('#userInfo h2');

  userinfo.innerText = response.data.name;
}
