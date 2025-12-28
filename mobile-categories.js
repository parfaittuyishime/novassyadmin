import { auth, db, storage } from '../js/firebaseConfig.js';
import {
    collection, addDoc, getDocs, query, orderBy, deleteDoc, doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import {
    ref, uploadBytes, getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

console.log("🚀 Categories Controller (Serverless Mode) Loaded");

const categoriesListEl = document.getElementById('categoriesList');
const categoryModal = document.getElementById('categoryModal');
const authCheckOverlay = document.getElementById('authCheck');
const userEmailEl = document.getElementById('userEmail');
const globalLoading = document.getElementById('globalLoading');

const ADMIN_EMAIL = 'tuyishimeigisubizoparfait@gmail.com';

onAuthStateChanged(auth, (user) => {
    console.log("Auth State Check:", user ? `Email: ${user.email} | 🛡️ UID: ${user.uid}` : "No User");
    if (user && user.email === ADMIN_EMAIL) {
        userEmailEl.textContent = user.email;
        if (authCheckOverlay) authCheckOverlay.style.display = 'none';
        fetchCategories();
    } else {
        window.location.href = 'index.html';
    }
});

async function fetchCategories() {
    categoriesListEl.innerHTML = '<div style="padding:40px; text-align:center;">Loading...</div>';
    try {
        const q = query(collection(db, "categories"), orderBy("name", "asc"));
        const snap = await getDocs(q);
        categoriesListEl.innerHTML = '';
        if (snap.empty) {
            categoriesListEl.innerHTML = '<div style="padding:40px; text-align:center; color:#999;">No categories found.</div>';
            return;
        }
        snap.forEach(d => {
            const c = d.data();
            const id = d.id;
            const card = document.createElement('div');
            card.className = 'cat-card';
            card.innerHTML = `
                <div style="display:flex; align-items:center; gap:15px;">
                    <img src="${c.imageUrl}" style="width:50px; height:50px; border-radius:10px; object-fit:cover;">
                    <div style="font-weight:600;">${c.name}</div>
                </div>
                <button onclick="deleteCat('${id}')" style="color:red; background:none; border:none; padding:10px;"><i class="fas fa-trash"></i></button>
            `;
            categoriesListEl.appendChild(card);
        });
    } catch (e) {
        console.error("SDK Category Fetch Error:", e.code, e.message);
        categoriesListEl.innerHTML = `<div style="padding:20px; color:red; text-align:center;">
            <strong>Permission Error:</strong><br>${e.code}<br>
            <small>Check Firestore Rules in Console.</small>
        </div>`;
    }
}

window.deleteCat = async (id) => {
    if (!confirm("Delete category?")) return;
    globalLoading.style.display = 'flex';
    try {
        await deleteDoc(doc(db, "categories", id));
        fetchCategories();
    } catch (e) {
        alert("Delete failed: " + e.message);
    } finally {
        globalLoading.style.display = 'none';
    }
};

document.getElementById('logoutBtn').onclick = () => signOut(auth);
document.getElementById('openAddModal').onclick = () => categoryModal.style.display = 'flex';
document.getElementById('closeModal').onclick = () => categoryModal.style.display = 'none';

document.getElementById('categoryForm').onsubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const file = document.getElementById('catImageInput').files[0];
    if (!file) return alert("Select icon");

    globalLoading.style.display = 'flex';
    try {
        const sRef = ref(storage, `categories/${Date.now()}_${file.name}`);
        await uploadBytes(sRef, file);
        const url = await getDownloadURL(sRef);

        const categoryData = {
            name: form.name.value,
            imageUrl: url,
            itemCount: 0,
            status: 'active',
            createdAt: new Date().toISOString()
        };

        await addDoc(collection(db, "categories"), categoryData);
        categoryModal.style.display = 'none';
        form.reset();
        document.getElementById('catPreview').style.display = 'none';
        fetchCategories();
        alert("Category added successfully!");
    } catch (err) {
        console.error("Add Category SDK Error:", err);
        alert("Error: " + err.message);
    } finally {
        document.getElementById('globalLoading').style.display = 'none';
    }
};

// Preview logic
document.getElementById('catImageInput').onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
            document.getElementById('previewImg').src = ev.target.result;
            document.getElementById('catPreview').style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
};
