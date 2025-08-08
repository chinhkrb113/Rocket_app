# 🧪 Test Accounts & Sample Data

Hệ thống Rocket Training đã được tạo sẵn các tài khoản test và dữ liệu mẫu để bạn có thể dễ dàng kiểm tra các chức năng.

## 🔑 Tài Khoản Test

### 👑 Admin (Quản trị viên)
```
Email: admin@rockettraining.com
Password: admin123
Role: admin
Quyền hạn: Toàn quyền quản lý hệ thống
```

```
Email: manager@rockettraining.com
Password: manager123
Role: admin
Quyền hạn: Quản lý cấp cao
```

### 👨‍🏫 Instructor (Giảng viên)
```
Email: instructor1@rockettraining.com
Password: instructor123
Role: instructor
Chuyên môn: Frontend Development (React.js, UI/UX)
```

```
Email: instructor2@rockettraining.com
Password: instructor123
Role: instructor
Chuyên môn: Backend Development (Node.js, DevOps)
```

```
Email: instructor3@rockettraining.com
Password: instructor123
Role: instructor
Chuyên môn: Data Science (Python, Machine Learning)
```

### 🎓 Student (Học viên)
```
Email: student1@gmail.com
Password: student123
Role: student
Trạng thái: Đang học khóa React.js (85% hoàn thành)
```

```
Email: student2@gmail.com
Password: student123
Role: student
Trạng thái: Đã hoàn thành khóa Node.js
```

### 🏢 Enterprise (Doanh nghiệp)
```
Email: hr@techcorp.com
Password: enterprise123
Role: enterprise
Công ty: TechCorp Vietnam
Lĩnh vực: Công nghệ thông tin
Quy mô: 200-500 nhân viên
```

```
Email: training@fptsoft.com
Password: enterprise123
Role: enterprise
Công ty: FPT Software
Lĩnh vực: Phát triển phần mềm
Quy mô: 1000+ nhân viên
```

```
Email: hr@vietcombank.com
Password: enterprise123
Role: enterprise
Công ty: Vietcombank
Lĩnh vực: Ngân hàng - Tài chính
Quy mô: 500-1000 nhân viên
```

```
Email: learning@vingroup.net
Password: enterprise123
Role: enterprise
Công ty: Vingroup
Lĩnh vực: Tập đoàn đa ngành
Quy mô: 5000+ nhân viên
```

```
Email: dev@startup.io
Password: enterprise123
Role: enterprise
Công ty: Tech Startup
Lĩnh vực: Fintech
Quy mô: 50-100 nhân viên
```

## 📊 Dữ Liệu Mẫu

### 📚 Khóa Học
- **React.js Fundamentals** - Beginner (40h) - 1.5M VND
- **Node.js Backend Development** - Intermediate (50h) - 2M VND
- **Python Data Science** - Advanced (60h) - 2.5M VND
- **UI/UX Design Masterclass** - Intermediate (35h) - 1.8M VND
- **DevOps và Cloud Computing** - Advanced (45h) - 2.2M VND
- **Mobile App Development với Flutter** - Intermediate (42h) - 1.9M VND

### 👥 Học Viên
- 8 học viên mẫu với các trạng thái khác nhau
- Tiến độ học tập từ 12% đến 100%
- Các trạng thái: active, completed, suspended, pending

### 🎯 Leads (Khách hàng tiềm năng)
- 5 leads với các trạng thái khác nhau
- Nguồn: website, social, referral, ads, event
- Điểm số từ 45 đến 95

### 📈 Thống Kê Dashboard
- Tổng số học viên: 1,247
- Tổng số khóa học: 24
- Tổng số giảng viên: 8
- Doanh thu: 2.45 tỷ VND
- Tăng trưởng hàng tháng: 12.5% (học viên), 15.7% (doanh thu)

### 🏢 Dữ Liệu Mẫu Doanh Nghiệp

#### Chương Trình Đào Tạo Doanh Nghiệp
- **TechCorp Frontend Bootcamp** - 15 học viên - React.js & UI/UX (8 tuần)
- **FPT Software Backend Training** - 25 học viên - Node.js & DevOps (10 tuần)
- **Vietcombank Digital Transformation** - 30 học viên - Python & Data Analytics (12 tuần)
- **Vingroup Mobile Development** - 20 học viên - Flutter & React Native (6 tuần)
- **Startup Tech Stack** - 8 học viên - Full-stack Development (16 tuần)

#### Dự Án Thực Tế
- **E-commerce Platform** (TechCorp) - 8 developers - 85% hoàn thành
- **Banking Mobile App** (Vietcombank) - 12 developers - 92% hoàn thành
- **IoT Management System** (Vingroup) - 15 developers - 67% hoàn thành
- **Fintech Dashboard** (Tech Startup) - 5 developers - 78% hoàn thành

#### Thống Kê Doanh Nghiệp
- **TechCorp Vietnam**: 45 nhân viên đã đào tạo, 89% hoàn thành
- **FPT Software**: 78 nhân viên đã đào tạo, 94% hoàn thành
- **Vietcombank**: 62 nhân viên đã đào tạo, 87% hoàn thành
- **Vingroup**: 95 nhân viên đã đào tạo, 91% hoàn thành
- **Tech Startup**: 23 nhân viên đã đào tạo, 96% hoàn thành

## 🚀 Cách Sử Dụng

### 1. Chạy Seed Data (Backend)
```bash
# Di chuyển đến thư mục backend
cd backend

# Cài đặt dependencies
npm install

# Chạy seed data (xóa dữ liệu cũ và tạo mới)
node src/scripts/seedDatabase.js --clear --seed

# Hoặc chỉ tạo dữ liệu mới
node src/scripts/seedDatabase.js --seed

# Hoặc chỉ xóa dữ liệu
node src/scripts/seedDatabase.js --clear
```

### 2. Sử Dụng Mock Data (Frontend)
Dữ liệu mock đã được tạo sẵn trong file `frontend/src/data/mockData.ts` và có thể được sử dụng trực tiếp trong các component.

```typescript
import { mockUsers, mockCourses, mockStudents, testCredentials } from '../data/mockData';

// Sử dụng trong component
const LoginPage = () => {
  // Có thể sử dụng testCredentials để test nhanh
  console.log('Test credentials:', testCredentials);
};
```

## 🧪 Kịch Bản Test

### Kịch Bản 1: Admin Dashboard
1. Đăng nhập với tài khoản admin
2. Xem tổng quan dashboard với thống kê
3. Quản lý học viên, khóa học, giảng viên
4. Xem báo cáo và phân tích

### Kịch Bản 2: Giảng Viên
1. Đăng nhập với tài khoản instructor
2. Xem danh sách khóa học được phân công
3. Quản lý học viên trong khóa học
4. Tạo và chỉnh sửa bài học
5. Xem tiến độ học tập của học viên

### Kịch Bản 3: Học Viên
1. Đăng nhập với tài khoản student
2. Xem danh sách khóa học đã đăng ký
3. Học bài và theo dõi tiến độ
4. Làm bài tập và kiểm tra
5. Xem chứng chỉ (nếu hoàn thành)

### Kịch Bản 4: Doanh Nghiệp
1. Đăng nhập với tài khoản enterprise
2. **Bước 1 - Chọn nhân viên/học viên phù hợp:**
   - Xem danh sách tất cả học viên có sẵn
   - Lọc theo kỹ năng (React, Node.js, Python, etc.)
   - Lọc theo trình độ (Beginner, Intermediate, Advanced)
   - Tìm kiếm theo tên hoặc email
   - Chọn nhiều học viên cho chương trình đào tạo
3. **Bước 2 - Giám sát tiến độ đào tạo/dự án:**
   - Tạo chương trình đào tạo mới cho nhóm được chọn
   - Theo dõi tiến độ học tập của từng thành viên
   - Xem thống kê hoàn thành và hiệu suất
   - Quản lý timeline và milestone
4. **Bước 3 - Đánh giá kết quả:**
   - Xem kết quả chi tiết của từng học viên
   - Đánh giá với điểm số và nhận xét
   - Xuất báo cáo đánh giá tổng thể
   - Quyết định về việc tuyển dụng hoặc thăng tiến

## 🔧 Tùy Chỉnh Dữ Liệu

### Thêm Tài Khoản Mới
Chỉnh sửa file `backend/src/data/seedData.js` và thêm user mới vào mảng `users`:

```javascript
{
  id: 'new-user-001',
  email: 'newuser@example.com',
  password: 'password123',
  fullName: 'Tên Người Dùng Mới',
  role: 'student', // admin, instructor, student, enterprise
  // ... các thông tin khác
}
```

### Thêm Khóa Học Mới
Thêm khóa học mới vào mảng `courses` trong cùng file:

```javascript
{
  id: 'course-new',
  title: 'Tên Khóa Học Mới',
  description: 'Mô tả khóa học...',
  category: 'Category Name',
  level: 'Beginner', // Beginner, Intermediate, Advanced
  // ... các thông tin khác
}
```

## 📝 Ghi Chú

- Tất cả mật khẩu đều được hash bằng bcrypt khi seed vào database
- Dữ liệu mock sử dụng ảnh từ Unsplash (cần internet để hiển thị)
- Có thể chạy lại seed data bất cứ lúc nào để reset về trạng thái ban đầu
- Dữ liệu được thiết kế để test đầy đủ các tính năng của hệ thống

## 🆘 Hỗ Trợ

Nếu gặp vấn đề với việc seed data hoặc đăng nhập:

1. Kiểm tra kết nối database
2. Đảm bảo đã cài đặt đầy đủ dependencies
3. Kiểm tra log console để xem lỗi chi tiết
4. Thử chạy lại script seed data

---

**Chúc bạn test thành công! 🎉**