const imagesContainer = document.querySelector('#imagesContainer');
const mainImageInput = document.querySelector('#mainImageInput');
const unloadImageButton = document.querySelector('#unloadImage');
const moreImageInputFieldButton = document.querySelector('#moreImageInputFieldButton');
const previewImage = document.querySelector('#previewImage');

//Authorization
const upload = document.getElementById('upload');
upload.addEventListener('click', () => {
  let token = localStorage.getItem('token');

  //If user haven't signed in, redirect user to sign in page.
  if (!token) {
    alert('Please Sign in First');
    window.location.href = `${window.location.origin}/login.html`;
  } else {
    sendFormData(token);
  }
});

async function sendFormData(token) {
  const imagesInputs = document.querySelectorAll('input[type="file"]');

  const authorization = 'Bearer ' + token;

  const api = `${window.location.origin}/api/1.0/message/upload`;

  const formData = new FormData();

  for (let imagesInput of imagesInputs) {
    formData.append('images', imagesInput.files[0]);
  }

  const res = await fetch(api, {
    method: 'POST',
    headers: {
      'Authorization': authorization,
    },
    body: formData,
  });

  const response = await res.json();

  if (response.error) return alert(response.error);

  console.log(response);
}

//Add image upload field
moreImageInputFieldButton.addEventListener('click', e => {
  e.preventDefault();

  const newImageInputDiv = document.createElement('div');
  const newImageInput = document.createElement('input');
  const newUnloadImageButton = document.createElement('button');
  const newPreviewImage = document.createElement('img');

  newImageInputDiv.setAttribute('class', 'imageInput');

  newImageInput.setAttribute('type', 'file');
  newImageInput.setAttribute('name', 'image');

  //prevent non-image file from being selected
  newImageInput.setAttribute('accept', 'image/*');

  //when image is being selected, preview
  newImageInput.addEventListener('change', e => {
    previewFile(newPreviewImage, e.target);
  });

  //Undo the selection and clear preview
  newUnloadImageButton.innerText = 'X';
  newUnloadImageButton.setAttribute('title', 'Undo');
  newUnloadImageButton.addEventListener('click', e => {
    e.preventDefault();

    const previousImageInput = e.target.previousElementSibling;
    previousImageInput.value = '';

    const nextImagePreview = e.target.nextElementSibling;
    nextImagePreview.src = '';
  });

  newPreviewImage.setAttribute('alt', ' ');

  imagesContainer.appendChild(newImageInputDiv);
  newImageInputDiv.appendChild(newImageInput);
  newImageInputDiv.appendChild(newUnloadImageButton);
  newImageInputDiv.appendChild(newPreviewImage);
});

unloadImageButton.addEventListener('click', e => {
  e.preventDefault();

  const previousImageInput = e.target.previousElementSibling;
  previousImageInput.value = '';

  const nextImagePreview = e.target.nextElementSibling;
  nextImagePreview.src = '';
});

mainImageInput.addEventListener('change', e => {
  previewFile(previewImage, e.target);
});

function previewFile(previewImage, imageInput) {
  const file = imageInput.files[0];
  const reader = new FileReader();

  reader.addEventListener(
    'load',
    () => {
      previewImage.src = reader.result;
    },
    false
  );

  if (file) {
    reader.readAsDataURL(file);
  }
}
