const socket = io();
let videoFeedUrl;

// Hàm cập nhật danh sách vật thể
socket.on('update_objects', function(data) {
    const objectList = document.getElementById('object-list');
    const objectCount = document.getElementById('object-count');

    objectList.innerHTML = ''; // Xóa danh sách hiện tại

    data.objects.forEach(function(object) {
        const li = document.createElement('li');
        li.textContent = object;
        objectList.appendChild(li);
    });

    // Cập nhật số lượng vật thể
    objectCount.textContent = data.count_object;

    // Tự động cuộn xuống dưới
    objectList.scrollTop = objectList.scrollHeight;
});

// Đảm bảo rằng mã JavaScript sau sẽ chạy sau khi DOM được tải đầy đủ
document.addEventListener("DOMContentLoaded", function() {
    const videoFeed = document.getElementById('video-feed');
    const toggleCameraButton = document.getElementById('toggle-camera');
    let cameraActive = true; // Biến theo dõi trạng thái camera

    // Lấy URL video feed từ thuộc tính data của phần tử video-feed
    videoFeedUrl = videoFeed.dataset.src;

    // Xử lý sự kiện nút "Tắt Camera" và "Bật Camera"
    toggleCameraButton.addEventListener('click', function() {
        if (cameraActive) {
            videoFeed.src = ""; // Dừng video
            toggleCameraButton.textContent = "Bật Camera"; // Thay đổi văn bản nút
        } else {
            videoFeed.src = videoFeedUrl; // Bật lại video
            toggleCameraButton.textContent = "Tắt Camera"; // Thay đổi văn bản nút
        }
        cameraActive = !cameraActive; // Đảo trạng thái
    });
});

// Hàm lấy dữ liệu từ API Flask
function fetchObjectCount() {
    fetch('/get_object_count')  // Gửi yêu cầu tới Flask API
        .then(response => response.json())  // Chuyển đổi dữ liệu từ JSON
        .then(data => {
            // Cập nhật giá trị của các thẻ <output>
            document.getElementById('inorganic-output').textContent = data.inorganic;
            document.getElementById('organic-output').textContent = data.organic;
            document.getElementById('animal-output').textContent = data.animal;

            // Cập nhật tổng số vật thể đã nhận diện
            const totalObjects = data.inorganic + data.organic + data.animal;
            document.getElementById('object-count').textContent = totalObjects;
        })
        .catch(error => console.error('Error fetching data:', error));
}

// Cập nhật mỗi giây (thay vì thay đổi dữ liệu ngẫu nhiên, chúng ta gọi API)
setInterval(fetchObjectCount, 1000);  // Gọi API mỗi giây

$(document).ready(function() {
            $.getJSON('/get_data', function(data) {
                const tableBody = $('#data-table tbody');
                tableBody.empty(); // Xóa dữ liệu cũ

                data.forEach(function(item) {
                    const row = `<tr>
                        <td>${item.id} </td>
                        <td>${item.name} </td>
                        <td>${item.count} </td>
                    </tr>`;
                    tableBody.append(row);
                });
            });
        });