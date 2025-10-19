# 🗄️ Hướng Dẫn Cài Đặt MySQL

## 📥 Tải và Cài Đặt MySQL

### Windows

1. **Tải MySQL Installer**
   - Truy cập: https://dev.mysql.com/downloads/installer/
   - Chọn `mysql-installer-community-x.x.x.msi`
   - Download và chạy installer

2. **Cài Đặt**
   - Chọn "Developer Default" hoặc "Server only"
   - MySQL Server 8.0+
   - MySQL Workbench (tool quản lý GUI)
   - MySQL Shell (command line)

3. **Cấu Hình**
   - Config Type: `Development Computer`
   - Port: `3306` (mặc định)
   - Root Password: Đặt mật khẩu mạnh và nhớ nó!
   - Windows Service: Chọn "Start MySQL at System Startup"

4. **Kiểm Tra Cài Đặt**
   ```bash
   # Mở PowerShell
   mysql --version
   ```

### MacOS

```bash
# Sử dụng Homebrew
brew install mysql

# Khởi động MySQL
brew services start mysql

# Secure installation
mysql_secure_installation
```

### Linux (Ubuntu/Debian)

```bash
# Update package index
sudo apt update

# Cài đặt MySQL Server
sudo apt install mysql-server

# Kiểm tra status
sudo systemctl status mysql

# Secure installation
sudo mysql_secure_installation
```

## 🔧 Cấu Hình MySQL

### 1. Đăng Nhập MySQL

```bash
# Windows
mysql -u root -p

# Linux/Mac
sudo mysql -u root -p
```

### 2. Tạo Database

```sql
-- Tạo database
CREATE DATABASE room_rental_db 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- Kiểm tra
SHOW DATABASES;

-- Chọn database
USE room_rental_db;
```

### 3. Tạo User Mới (Khuyến Nghị)

```sql
-- Tạo user mới (thay 'your_password' bằng mật khẩu thật)
CREATE USER 'rental_app'@'localhost' IDENTIFIED BY 'your_password';

-- Grant quyền cho user
GRANT ALL PRIVILEGES ON room_rental_db.* TO 'rental_app'@'localhost';

-- Refresh privileges
FLUSH PRIVILEGES;

-- Kiểm tra
SELECT user, host FROM mysql.user;
```

### 4. Cấu Hình File .env

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=room_rental_db
DB_USER=rental_app
DB_PASSWORD=your_password
```

## 🛠️ Công Cụ Quản Lý

### 1. MySQL Workbench (GUI)
- Download: https://dev.mysql.com/downloads/workbench/
- Giao diện đồ họa để quản lý database
- Tạo, sửa, xóa tables, chạy queries
- Visualize relationships

### 2. phpMyAdmin (Web-based)
```bash
# Cài với XAMPP (Windows)
# Hoặc với PHP và Apache
```

### 3. DBeaver (Cross-platform)
- Download: https://dbeaver.io/
- Free, open-source
- Hỗ trợ nhiều loại database

### 4. VS Code Extensions
- **MySQL** by Jun Han
- **SQLTools** - Database management

## 📋 Các Lệnh MySQL Thường Dùng

```sql
-- Hiển thị tất cả databases
SHOW DATABASES;

-- Chọn database
USE room_rental_db;

-- Hiển thị tất cả tables
SHOW TABLES;

-- Xem cấu trúc table
DESCRIBE users;
-- hoặc
SHOW CREATE TABLE users;

-- Xem dữ liệu
SELECT * FROM users;
SELECT * FROM properties LIMIT 10;

-- Backup database
mysqldump -u root -p room_rental_db > backup.sql

-- Restore database
mysql -u root -p room_rental_db < backup.sql

-- Xóa database (CẨNTHẬN!)
DROP DATABASE room_rental_db;
```

## 🔒 Bảo Mật

### 1. Đặt Mật Khẩu Mạnh
```sql
-- Đổi password root
ALTER USER 'root'@'localhost' IDENTIFIED BY 'new_strong_password';
```

### 2. Xóa User Anonymous
```sql
DELETE FROM mysql.user WHERE User='';
FLUSH PRIVILEGES;
```

### 3. Disable Remote Root Login
```sql
-- Chỉ cho phép root login từ localhost
DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');
FLUSH PRIVILEGES;
```

### 4. Firewall Configuration
```bash
# Linux - Chỉ cho phép local connections
sudo ufw allow from 127.0.0.1 to any port 3306
```

## ⚠️ Xử Lý Lỗi Thường Gặp

### 1. "Access denied for user 'root'@'localhost'"
```bash
# Windows
mysqld --skip-grant-tables

# Sau đó reset password
ALTER USER 'root'@'localhost' IDENTIFIED BY 'new_password';
```

### 2. "Can't connect to MySQL server"
```bash
# Kiểm tra MySQL đang chạy
# Windows
services.msc # Tìm MySQL

# Linux
sudo systemctl status mysql
sudo systemctl start mysql
```

### 3. "Table doesn't exist"
```sql
-- Kiểm tra database hiện tại
SELECT DATABASE();

-- Chọn đúng database
USE room_rental_db;
```

### 4. Port 3306 đã được sử dụng
```bash
# Windows - Tìm process đang dùng port
netstat -ano | findstr :3306

# Kill process
taskkill /PID <process_id> /F

# Hoặc thay đổi port trong my.ini
```

## 🚀 Chạy Dự Án

1. **Đảm bảo MySQL đang chạy**
   ```bash
   # Windows
   net start MySQL80
   
   # Linux/Mac
   sudo systemctl start mysql
   ```

2. **Cập nhật file .env**
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=room_rental_db
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   ```

3. **Cài đặt dependencies**
   ```bash
   npm install
   ```

4. **Chạy server**
   ```bash
   npm run dev
   ```

5. **Kiểm tra kết nối**
   - Xem console log: "✓ MySQL Connected: localhost"
   - Xem database đã có tables chưa:
   ```sql
   USE room_rental_db;
   SHOW TABLES;
   ```

## 📚 Tài Liệu Thêm

- MySQL Official Docs: https://dev.mysql.com/doc/
- MySQL Tutorial: https://www.mysqltutorial.org/
- Sequelize with MySQL: https://sequelize.org/docs/v6/other-topics/dialect-specific-things/#mysql

---

**Lưu Ý**: Luôn backup database trước khi thực hiện thay đổi quan trọng!
