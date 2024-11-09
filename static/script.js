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
    const objectInorganic = document.getElementById('inorganic-object');
    const objectOrganic = document.getElementById('organic-object');
    const objectAnimal = document.getElementById('animal-object');

    objectList.innerHTML = '';
    let totalCount = 0;
    let totalInorganic = 0;
    let totalOrganic = 0;
    let totalAnimal = 0;
    // Đặt số lượng cho từng loại
    const counts = {
        'Inorganic': 0,
        'Organic': 0,
        'Animal': 0
    };

    data.objects.forEach(function(object) {
        const li = document.createElement('li');
        li.textContent = `${object.name}: ${object.count}`;
        objectList.appendChild(li);

        if (object.type === 'Inorganic') {
            counts['Inorganic'] += object.count;
        } else if (object.type === 'Organic') {
            counts['Organic'] += object.count;
        } else if (object.type === 'Animal') {
            counts['Animal'] += object.count;
        }

        // Cộng dồn số lượng cho từng loại
        if (counts.hasOwnProperty(object.name)) {
            counts[object.name] += object.count;
        }
        totalCount += object.count;
    });

    // Cập nhật tổng số đối tượng
    objectCount.textContent = totalCount;
    objectInorganic.textContent = totalInorganic;
    objectOrganic.textContent = totalOrganic;
    objectAnimal.textContent = totalAnimal;

    // Cập nhật số lượng vào các ô tương ứng
    document.querySelector('.square:nth-child(1) .count').textContent = counts['Inorganic'];
    document.querySelector('.square:nth-child(2) .count').textContent = counts['Organic'];
    document.querySelector('.square:nth-child(3) .count').textContent = counts['Animal'];

    objectList.scrollTop = objectList.scrollHeight;
});

