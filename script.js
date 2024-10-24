const dropArea = document.getElementById('drop-area');
const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.multiple = true;  // Allow selecting multiple files
fileInput.style.display = 'none';  // Hide the file input
dropArea.appendChild(fileInput);  // Add the file input to the drop area

const filePreview = document.getElementById('file-preview');
const qrCodeElem = document.getElementById('qr-code');  // QR code element
const directLinkElem = document.getElementById('direct-link');  // Direct link display
const progressBar = document.getElementById('upload-progress');  // Progress bar element

// Setup Socket.io connection
const socket = io('https://file-sharing-backend-7089164001c8.herokuapp.com', {
  transports: ['websocket']  // Ensure only WebSocket is used
});

// Click event to open file selection dialog
dropArea.addEventListener('click', () => {
  fileInput.click();  // Open the file selection dialog
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

// Handle drop event
dropArea.addEventListener('drop', (e) => {
  dropArea.classList.remove('dragging');  // Remove the highlighting when the file is dropped
  let dt = e.dataTransfer;
  let files = dt.files;
  handleFiles(files);
}, false);

// Handle file input change (when files are selected through the dialog)
fileInput.addEventListener('change', (e) => {
  let files = e.target.files;
  handleFiles(files);  // Process the files
});

// Handle the file(s) when dropped or selected via the dialog
function handleFiles(files) {
  console.log(`Files dropped: ${files.length}`);
  [...files].forEach(file => {
    console.log('Handling file:', file.name);
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

// Upload file via Socket.io and display progress
function uploadFile(file) {
  const reader = new FileReader();

  reader.onprogress = (event) => {
    if (event.lengthComputable) {
      const progressPercent = (event.loaded / event.total) * 100;
      progressBar.value = progressPercent;
      progressBar.style.display = 'block';  // Show the progress bar when upload starts
    }
  };

  reader.onload = function(e) {
    const fileData = e.target.result;  // Base64 encoded string
    const fileType = file.type;  // File type

    const myPeerId = Math.random().toString(36).substring(7);  // Generate a random Peer ID
    console.log(`Generated peerId: ${myPeerId}`);

    // Emit file data to the backend with a unique peerId
    socket.emit('file-upload', { peerId: myPeerId, fileName: file.name, fileData, fileType });

    // Hide the progress bar after upload
    progressBar.value = 0;
    progressBar.style.display = 'none';

    // Generate QR Code and Direct Link only after upload
    const link = window.location.href.split('?')[0] + '?peer=' + myPeerId;
    console.log('Generated link:', link);

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

// Handle file-download event and display the image or file link
socket.on('file-download', (data) => {
  const loadingMessage = document.getElementById('loading-message');
  if (loadingMessage) {
    loadingMessage.remove();
  }

  console.log('Received file:', data.fileName);

  // If the file is an image, display it
  if (data.fileType && data.fileType.startsWith('image/')) {
    const img = document.createElement('img');
    img.src = data.fileData;
    document.body.appendChild(img);
    console.log('Image displayed successfully');
  } else {
    console.log('File is not an image');
  }

  // Create and display download link
  const downloadLink = document.createElement('a');
  downloadLink.href = data.fileData;  // Base64-encoded file data
  downloadLink.download = data.fileName;
  downloadLink.textContent = `Download ${data.fileName}`;
  document.body.appendChild(downloadLink);  // Display the download link for the user
  console.log('Download link displayed');
});

// Error Handling (optional but useful for debugging)
socket.on('connect_error', (err) => {
  console.error('Connection error:', err);
});

// Ensure peerId is passed correctly in the URL
window.onload = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const peerId = urlParams.get('peer');
  if (peerId) {
    console.log('PeerId from URL:', peerId);  // Log the peerId
    socket.emit('confirm-connection', peerId);  // Notify the server that this window is ready
  } else {
    console.error('No peerId found in URL');
  }

  const loadingMessage = document.createElement('div');
  loadingMessage.id = 'loading-message';
  loadingMessage.innerText = 'Preparing your file for download...';
  document.body.appendChild(loadingMessage);  // Show loading message while waiting for the file
};
