        document.getElementById('login').addEventListener('submit', function(event)
        {
            event.preventDefault();
            if(username ===''|| password ===''){
                document.getElementById('errorMessage').textContent = 'vui lòng không bỏ trống tài khoản hoặc mật khẩu';
                return;
            }

            var username = document.getElementById('username').value;
            var password = document.getElementById('password').value;


            if(username === 'root' && password === 'root' || username === 'admin@gmail.com' && password === 'admin'){ // kiểm tra đúng thì chuyển file
                // window.location.href = "{{ url_for('templates', filename='index.html') }}";
                window.location.href = "/index";
            }
            else{
                document.getElementById('errorMessage').textContent = 'Wrong accout or password';
            }
        });