const socket = io();
let videoFeedUrl;


socket.on('update_objects', function(data) {
    const objectList = document.getElementById('object-list');
    const objectCount = document.getElementById('object-count');

    objectList.innerHTML = '';

    data.objects.forEach(function(object) {
        const li = document.createElement('li');
        li.textContent = object;
        objectList.appendChild(li);
    });

 
    objectCount.textContent = data.count_object;

    objectList.scrollTop = objectList.scrollHeight;
});


document.addEventListener("DOMContentLoaded", function() {
    const videoFeed = document.getElementById('video-feed');
    const toggleCameraButton = document.getElementById('toggle-camera');
    let cameraActive = true;
    videoFeedUrl = videoFeed.dataset.src;

    toggleCameraButton.addEventListener('click', function() {
        if (cameraActive) {
            videoFeed.src = "";
            toggleCameraButton.textContent = "Bật Camera";
        } else {
            setTimeout(() => {
                videoFeed.src = videoFeedUrl;
            }, 200);
            toggleCameraButton.textContent = "Tắt Camera";
        }
        cameraActive = !cameraActive;
    });
});