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
    let totalCount = 0;

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

        // Cộng dồn số lượng cho từng loại
        if (counts.hasOwnProperty(object.name)) {
            counts[object.name] += object.count;
        }
        totalCount += object.count;
    });

    // Cập nhật tổng số đối tượng
    objectCount.textContent = totalCount;

    // Cập nhật số lượng vào các ô tương ứng
    document.querySelector('.square:nth-child(1) .count').textContent = counts['Inorganic'];
    document.querySelector('.square:nth-child(2) .count').textContent = counts['Organic'];
    document.querySelector('.square:nth-child(3) .count').textContent = counts['Animal'];

    objectList.scrollTop = objectList.scrollHeight;
});

// Hàm để lấy và hiển thị tổng số loại vật phẩm theo type
function fetchDetectedObjects() {
    fetch('/index/data')  // Gọi đến endpoint mới để lấy dữ liệu
        .then(response => response.json())
        .then(data => {
            const typeList = document.getElementById('type-list');
            typeList.innerHTML = '';

            // Hiển thị tổng số theo từng loại
            for (const type in data) {
                const li = document.createElement('li');
                li.textContent = `${type}: ${data[type]}`;
                typeList.appendChild(li);
            }
        })
        .catch(error => console.error('Error fetching detected objects:', error));
}

// Gọi hàm để lấy dữ liệu khi trang được tải
window.onload = fetchDetectedObjects;