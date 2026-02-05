// 1. Import các hàm cần thiết từ Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 2. Cấu hình Firebase (Lấy từ thông tin bạn cung cấp)
const firebaseConfig = {
  apiKey: "AIzaSyCCinfbq7GIr72A-5Tn8tbITYbwFkbx7GE",
  authDomain: "quanly-7c364.firebaseapp.com",
  projectId: "quanly-7c364",
  storageBucket: "quanly-7c364.firebasestorage.app",
  messagingSenderId: "492172899195",
  appId: "1:492172899195:web:714906afbbbc023e06c3de"
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- CÁC BIẾN DOM (Giao diện) ---
const loginSection = document.getElementById('login-section');
const dashboardSection = document.getElementById('dashboard-section');
const btnLogin = document.getElementById('btn-login');
const btnLogout = document.getElementById('btn-logout');
const taskListBody = document.getElementById('task-list-body');

// --- 3. XỬ LÝ ĐĂNG NHẬP / ĐĂNG XUẤT ---

// Kiểm tra trạng thái người dùng (Có đăng nhập hay chưa?)
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Đã đăng nhập -> Hiện Dashboard, Ẩn Login
        loginSection.style.display = 'none';
        dashboardSection.style.display = 'block';
        console.log("Đang đăng nhập với:", user.email);
        loadTasks(); // Gọi hàm tải dữ liệu
    } else {
        // Chưa đăng nhập -> Hiện Login, Ẩn Dashboard
        loginSection.style.display = 'flex';
        dashboardSection.style.display = 'none';
    }
});

// Nút Đăng nhập
btnLogin.addEventListener('click', () => {
    const email = document.getElementById('email-input').value;
    const pass = document.getElementById('password-input').value;
    
    signInWithEmailAndPassword(auth, email, pass)
        .catch((error) => {
            document.getElementById('login-error').innerText = "Lỗi: " + error.message;
        });
});

// Nút Đăng xuất
btnLogout.addEventListener('click', () => signOut(auth));


// --- 4. XỬ LÝ DỮ LIỆU (REAL-TIME) ---

// Hàm tải và lắng nghe dữ liệu (Mấu chốt của độ MƯỢT)
function loadTasks() {
    // Tạo câu lệnh truy vấn: Lấy collection 'tasks', sắp xếp theo deadline
    const q = query(collection(db, "tasks"), orderBy("deadline"));

    // onSnapshot: Tự động chạy mỗi khi dữ liệu trên Server thay đổi
    onSnapshot(q, (snapshot) => {
        taskListBody.innerHTML = ""; // Xóa bảng cũ
        let countProgress = 0, countDone = 0;

        snapshot.forEach((docSnap) => {
            const task = docSnap.data();
            const id = docSnap.id;

            // Đếm thống kê
            if (task.status === 'Done') countDone++;
            else countProgress++;

            // Màu sắc trạng thái
            let badgeClass = task.status === 'Done' ? 'bg-success' : 'bg-warning text-dark';
            
            // Tạo dòng HTML
            const row = `
                <tr>
                    <td>${task.content} <br> <small class="text-muted">${task.note || ''}</small></td>
                    <td>${task.assignee}</td>
                    <td>${task.deadline.replace('T', ' ')}</td>
                    <td><span class="badge ${badgeClass}">${task.status}</span></td>
                    <td>
                        <button class="btn btn-sm btn-outline-success" onclick="updateStatus('${id}', 'Done')">✓</button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteTask('${id}')">🗑</button>
                    </td>
                </tr>
            `;
            taskListBody.innerHTML += row;
        });

        // Cập nhật số liệu thống kê trên Dashboard
        document.getElementById('count-progress').innerText = countProgress;
        document.getElementById('count-done').innerText = countDone;
    });
}

// --- 5. THÊM CÔNG VIỆC MỚI ---
document.getElementById('btn-add-task').addEventListener('click', async () => {
    const content = document.getElementById('task-content').value;
    const assignee = document.getElementById('task-assignee').value;
    const deadline = document.getElementById('task-deadline').value;
    const priority = document.getElementById('task-priority').value;

    if (!content || !assignee) {
        alert("Vui lòng nhập nội dung và người làm!");
        return;
    }

    try {
        await addDoc(collection(db, "tasks"), {
            content: content,
            assignee: assignee,
            deadline: deadline,
            priority: priority,
            status: "Todo",
            createdAt: new Date().toISOString()
        });
        // Không cần code để reload bảng, onSnapshot sẽ tự làm việc đó!
        // Chỉ cần reset form
        document.getElementById('task-content').value = "";
    } catch (e) {
        console.error("Lỗi thêm task: ", e);
        alert("Lỗi khi thêm: " + e.message);
    }
});

// --- 6. HÀM CẬP NHẬT & XÓA (Gắn vào window để gọi được từ HTML) ---
window.updateStatus = async (id, newStatus) => {
    const taskRef = doc(db, "tasks", id);
    await updateDoc(taskRef, { status: newStatus });
};

window.deleteTask = async (id) => {
    if(confirm("Bạn chắc chắn muốn xóa?")) {
        await deleteDoc(doc(db, "tasks", id));
    }
};
