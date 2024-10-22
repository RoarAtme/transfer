const dropArea = document.getElementById('drop-area');
const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.multiple = true;
fileInput.style.display = 'none';
dropArea.appendChild(fileInput);

const filePreview = document.getElementById('file-preview');
const qrCodeElem = document.getElementById('qr-code');
const directLinkElem = document.getElementById('direct-link');
const progressBar = document.getElementById('upload-progress');

// Setup Socket.io connection
const socket = io('https://file-sharing-backend-7089164001c8.herokuapp.com', {
  transports: ['websocket']
});

// Click event to open file selection dialog
dropArea.addEventListener('click', () => {
  fileInput.click();  // Open file selection
});

// Prevent default drag behaviors
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
  dropArea.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

// Highlight drop area when file is being dragged over it
dropArea.addEventListener('dragenter', () => {
  dropArea.classList.add('dragging');
});
dropArea.addEventListener('dragleave', () => {
  dropArea.classList.remove('dragging');
});

dropArea.addEventListener('drop', (e) => {
  dropArea.classList.remove('dragging');
  let dt = e.dataTransfer;
  let files = dt.files;
  handleFiles(files);
});

fileInput.addEventListener('change', (e) => {
  let files = e.target.files;
  handleFiles(files);
});

function handleFiles(files) {
  [...files].forEach(file => {
    previewFile(file);
    uploadFile(file);
  });
}

function previewFile(file) {
  const reader = new FileReader();
  const fileItem = document.createElement('div');
  fileItem.classList.add('file-item');

  const deleteButton = document.createElement('button');
  deleteButton.textContent = 'x';
  deleteButton.classList.add('delete-btn');
  deleteButton.onclick = () => fileItem.remove();

  if (file.type.startsWith('image/')) {
    reader.onloadend = () => {
      const img = document.createElement('img');
      img.src = reader.result;
      fileItem.appendChild(img);
      fileItem.appendChild(deleteButton);
      filePreview.appendChild(fileItem);
    };
    reader.readAsDataURL(file);
  } else {
    const defaultIcon = document.createElement('img');
    defaultIcon.src = 'https://via.placeholder.com/100?text=File'; 
    fileItem.appendChild(defaultIcon);
    fileItem.appendChild(deleteButton);
    filePreview.appendChild(fileItem);
  }
}

function uploadFile(file) {
  const reader = new FileReader();

  reader.onprogress = (event) => {
    if (event.lengthComputable) {
      const progressPercent = (event.loaded / event.total) * 100;
      progressBar.value = progressPercent;
      progressBar.style.display = 'block';
    }
  };

  reader.onload = function (e) {
    const fileData = e.target.result;
    const fileType = file.type;

    const myPeerId = Math.random().toString(36).substring(7);
    console.log(`Generated peerId: ${myPeerId}`);

    // Emit file data to the backend with a unique peerId
    socket.emit('file-upload', { peerId: myPeerId, fileName: file.name, fileData, fileType });

    // Hide the progress bar after upload
    progressBar.value = 0;
    progressBar.style.display = 'none';

    // Generate QR Code and Direct Link only after upload
    const link = window.location.href.split('?')[0] + '?peer=' + myPeerId;

    // Generate the QR code for the link
    const qr = new QRious({
      element: qrCodeElem,
      value: link,
      size: 200
    });

    // Display the direct link for testing in another browser
    directLinkElem.innerHTML = `<a href="${link}" target="_blank">Open in another browser window</a>`;
  };

  reader.readAsDataURL(file);
}

// Handle file-download event and display the image or file link
socket.on('file-download', (data) => {
  console.log('Received file:', data.fileName);

  // If the file is an image, display it
  if (data.fileType && data.fileType.startsWith('image/')) {
    const img = document.createElement('img');
    img.src = data.fileData;
    document.body.appendChild(img);
  }

  // Create and display download link
  const downloadLink = document.createElement('a');
  downloadLink.href = data.fileData;
  downloadLink.download = data.fileName;
  downloadLink.textContent = `Download ${data.fileName}`;
  document.body.appendChild(downloadLink);
});

// Error Handling
socket.on('connect_error', (err) => {
  console.error('Connection error:', err);
});

// Ensure peerId is passed correctly in the URL
window.onload = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const peerId = urlParams.get('peer');
  if (peerId) {
    console.log('PeerId from URL:', peerId);
    socket.emit('confirm-connection', peerId);
  } else {
    console.error('No peerId found in URL');
  }
};
