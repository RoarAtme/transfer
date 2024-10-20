const dropArea = document.getElementById('drop-area');
const filePreview = document.getElementById('file-preview');
const qrCodeElem = document.getElementById('qr-code');  // QR code element
const directLinkElem = document.getElementById('direct-link');  // Direct link display

// Setup Socket.io connection
const socket = io('https://file-sharing-backend-7089164001c8.herokuapp.com');

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
  dropArea.classList.remove('dragging');  // Remove the highlighting when the file is dropped
  let dt = e.dataTransfer;
  let files = dt.files;
  handleFiles(files);
}, false);

// Handle the file(s) when dropped
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
    defaultIcon.src = 'https://via.placeholder.com/100?text=File'; // Placeholder for non-image files
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

    // Generate QR Code and Direct Link only after upload
    const myPeerId = Math.random().toString(36).substring(7);  // Generate a random Peer ID
    const link = window.location.href + '?peer=' + myPeerId;

    // Generate the QR code for the link after file upload
    const qr = new QRious({
      element: qrCodeElem,  // The canvas element for displaying the QR code
      value: link,
      size: 200  // Size of the QR code
    });

    // Display the direct link for testing in another browser
    directLinkElem.innerHTML = `<a href="${link}" target="_blank">Open in another browser window</a>`;
  };
  reader.readAsDataURL(file);  // Read file as base64
}

// On receiving file via WebSocket
socket.on('file-download', (data) => {
  console.log(`Received file: ${data.fileName}`); // Log file download event
  const downloadLink = document.createElement('a');
  downloadLink.href = data.fileData;  // Base64-encoded file data
  downloadLink.download = data.fileName;
  downloadLink.textContent = `Download ${data.fileName}`;
  document.body.appendChild(downloadLink);  // Display the download link for other clients
});

// Error Handling (optional but useful for debugging)
socket.on('connect_error', (err) => {
  console.error('Connection error:', err);
});
