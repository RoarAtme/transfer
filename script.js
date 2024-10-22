const socket = io('https://file-sharing-backend-7089164001c8.herokuapp.com', {
  transports: ['websocket']  // Ensure only WebSocket is used
});

// Ensure the peerId is passed correctly when the window loads
window.onload = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const peerId = urlParams.get('peer');
  if (peerId) {
    console.log(`PeerId from URL: ${peerId}`);  // Log peerId
    socket.emit('confirm-connection', peerId);  // Notify server that this window is ready
  } else {
    console.error('No peerId found in URL');
  }
};

// Simplified event listener for receiving a file
socket.on('file-download', (data) => {
  console.log('file-download event received:', data);

  // Remove any previous loading message
  const loadingMessage = document.getElementById('loading-message');
  if (loadingMessage) loadingMessage.remove();

  // Display the file (if it's an image) or create a download link for any other file type
  if (data.fileType && data.fileType.startsWith('image/')) {
    const img = document.createElement('img');
    img.src = data.fileData;  // Base64 encoded image
    document.body.appendChild(img);  // Append the image to the body
  }

  // Create a download link for all file types (including images)
  const downloadLink = document.createElement('a');
  downloadLink.href = data.fileData;  // Base64-encoded file data
  downloadLink.download = data.fileName;  // Set the file name
  downloadLink.textContent = `Download ${data.fileName}`;  // Link text
  document.body.appendChild(downloadLink);  // Append the download link to the body
});

// Basic loading message on window load
const loadingMessage = document.createElement('div');
loadingMessage.id = 'loading-message';
loadingMessage.innerText = 'Waiting for the file...';
document.body.appendChild(loadingMessage);  // Display loading message
