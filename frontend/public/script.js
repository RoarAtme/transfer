// Set up drag-and-drop file area
const dropArea = document.getElementById('drop-area');
const filePreview = document.getElementById('file-preview');

// Prevent default behavior for drag events
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
  dropArea.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

// Highlight the drop area when dragging over it
['dragenter', 'dragover'].forEach(eventName => {
  dropArea.classList.add('dragging');
});

['dragleave', 'drop'].forEach(eventName => {
  dropArea.classList.remove('dragging');
});

// Handle the file drop
dropArea.addEventListener('drop', (e) => {
  let dt = e.dataTransfer;
  let files = dt.files;
  handleFiles(files);
}, false);

function handleFiles(files) {
  [...files].forEach(file => {
    previewFile(file);
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

// Generate QR code
const qrCodeElem = document.getElementById('qr-code');
const myPeerId = Math.random().toString(36).substring(7);
const link = window.location.href + '?peer=' + myPeerId;
const qr = new QRious({
  element: qrCodeElem,
  value: link,
  size: 200
});

// Placeholder for connecting to backend (WebRTC, socket.io, etc.)
// Example: communicating with backend
const backendUrl = "https://file-sharing-backend.herokuapp.com"; // Replace with your backend URL
