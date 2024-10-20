const dropArea = document.getElementById('drop-area');
const filePreview = document.getElementById('file-preview');
const qrCodeElem = document.getElementById('qr-code');  // For the QR code

// Setup Socket.io connection
const socket = io('https://file-sharing-backend-7089164001c8.herokuapp.com', { transports: ['websocket'] });

// Drag-and-drop event listeners
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
  dropArea.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

dropArea.addEventListener('drop', (e) => {
  let dt = e.dataTransfer;
  let files = dt.files;
  handleFiles(files);
}, false);

// Handle the file(s)
function handleFiles(files) {
  [...files].forEach(file => {
    previewFile(file);  // Display the file preview
    uploadFile(file);   // Upload the file via Socket.io
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

// Upload file via Socket.io
function uploadFile(file) {
  const reader = new FileReader();
  reader.onload = function(e) {
    const fileData = e.target.result;  // Base64 encoded string
    socket.emit('file-upload', { fileName: file.name, fileData });
  };
  reader.readAsDataURL(file);  // Read file as base64
}

// On receiving the file via Socket.io
socket.on('file-download', (data) => {
  const downloadLink = document.createElement('a');
  downloadLink.href = data.fileData;
  downloadLink.download = data.fileName;
  downloadLink.textContent = `Download ${data.fileName}`;
  document.body.appendChild(downloadLink);  // Display the download link on mobile
});

// QR Code Generation
const myPeerId = Math.random().toString(36).substring(7);
const link = window.location.href + '?peer=' + myPeerId;

// Generate the QR code for the link
const qr = new QRious({
  element: qrCodeElem,  // The canvas element for displaying the QR code
  value: link,
  size: 200  // Size of the QR code
});
