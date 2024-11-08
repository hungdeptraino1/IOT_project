const socket = io();
const videoFeedUrl = document.getElementById('video-feed').dataset.src || document.getElementById('video-feed').src;
let cameraActive = true;

function toggleCamera() {
  const videoFeed = document.getElementById('video-feed');
  const toggleCameraButton = document.getElementById('toggle-camera');

  if (!toggleCameraButton) {
    alert("Nút tắt/bật camera không tìm thấy.");
    return;
  }

  if (cameraActive) {
    videoFeed.src = "";
    toggleCameraButton.textContent = "Bật Camera";
  } else {
    videoFeed.src = videoFeedUrl;
    toggleCameraButton.textContent = "Tắt Camera";
  }
  cameraActive = !cameraActive;
}

document.getElementById('toggle-camera').addEventListener('click', toggleCamera);


socket.on('update_objects', function(data) {
  const objectList = document.getElementById('object-list');
  const objectCount = document.getElementById('object-count');

  objectList.innerHTML = ''; 

  data.objects.forEach(function(object) {
    const li = document.createElement('li');
    li.textContent = `${object.name}: ${object.count}`; 
    objectList.appendChild(li);
  });

  objectCount.textContent = data.total_count; 

  objectList.scrollTop = objectList.scrollHeight;
});