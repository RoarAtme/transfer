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
const errorMessage = document.getElementById('error-message');
const loadingMessage = document.getElementById('loading-message');

// Setup Socket.io connection
const socket = io('https://file-sharing-backend-7089164001c8.herokuapp.com', {
  transports: ['websocket']  // Force WebSocket-only
});

// Click to open file dialog
dropArea.addEventListener('click', () => fileInput.click());

// Drag & drop and prevent default behaviors
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
  dropArea.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

// Handle drag-and-drop file highlighting
dropArea.addEventListener('dragenter', () => dropArea.classList.add('dragging'));
dropArea.addEventListener('dragleave', () => dropArea.classList.remove('dragging'));

// Handle file drop
dropArea.addEventListener('drop', (e) => {
  dropArea.classList.remove('dragging');
  const files = e.dataTransfer.files;
  handleFiles(files);
});

// Handle file input dialog
fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

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

  reader.onload = function(e) {
    const fileData = e.target.result;
    const fileType = file.type;
    const myPeerId = Math.random().toString(36).substring(7);

    socket.emit('file-upload', { peerId: myPeerId, fileName: file.name, fileData, fileType });

    progressBar.value = 0;
    progressBar.style.display = 'none';

    const link = window.location.href.split('?')[0] + '?peer=' + myPeerId;

    const qr = new QRious({
      element: qrCodeElem,
      value: link,
      size: 200
    });

    directLinkElem.innerHTML = `<a href="${link}" target="_blank">Open in another browser window</a>`;
    loadingMessage.style.display = 'block';
  };

  reader.readAsDataURL(file);
}

// Handle file-download event and display the image or file link
socket.on('file-download', (data) => {
  loadingMessage.style.display = 'none';
  errorMessage.style.display = 'none';

  if (data.fileType && data.fileType.startsWith('image/')) {
    const img = document.createElement('img');
    img.src = data.fileData;
    document.body.appendChild(img);
  }

  const downloadLink = document.createElement('a');
  downloadLink.href = data.fileData;
  downloadLink.download = data.fileName;
  downloadLink.textContent = `Download ${data.fileName}`;
  document.body.appendChild(downloadLink);
});

// Error Handling
socket.on('connect_error', (err) => {
  console.error('Connection error:', err);
  loadingMessage.style.display = 'none';
  errorMessage.style.display = 'block';
});

// Check for peerId in URL
window.onload = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const peerId = urlParams.get('peer');
  if (peerId) {
    socket.emit('confirm-connection', peerId);
  } else {
    errorMessage.style.display = 'block';
  }
};
