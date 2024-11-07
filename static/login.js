document.getElementById('login').addEventListener('submit', function(event) // tạo submit thành 1 event
        {
            event.preventDefault(); // ngăn chặn form submit mặc định
            if(username ===''|| password ===''){ // kiểm tra điều kiện đầu vào rỗng
                document.getElementById('errorMessage').textContent = 'vui lòng không bỏ trống tài khoản hoặc mật khẩu'; // thông báo lỗi
                return;
            }
            /*lấy giá trị từ input ( dùng id ở thẻ input nhé! )*/
            var username = document.getElementById('username').value;
            var password = document.getElementById('password').value;

            // đăng nhập thẳng thì check bằng if-else
            if(username === 'root' && password === 'root' || username === 'admin@gmail.com' && password === 'admin'){ // kiểm tra đúng thì chuyển file
                window.location.href = 'index.html';
            }
            else{
                document.getElementById('errorMessage').textContent = 'sai tài khoản mật khẩu'; // thông báo lỗi
            }

        });