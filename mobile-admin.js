import { auth, db, storage } from '../js/firebaseConfig.js';
import {
    collection, addDoc, getDocs, query, orderBy, deleteDoc, doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import {
    ref, uploadBytes, getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

console.log("🚀 Product Controller (Serverless Mode) Loaded");

const productsListEl = document.getElementById('productsList');
const productModal = document.getElementById('productModal');
const authCheckOverlay = document.getElementById('authCheck');
const userEmailEl = document.getElementById('userEmail');
const globalLoading = document.getElementById('globalLoading');

const ADMIN_EMAIL = 'tuyishimeigisubizoparfait@gmail.com';

onAuthStateChanged(auth, (user) => {
    console.log("Auth State Check:", user ? `Email: ${user.email} | 🛡️ UID: ${user.uid}` : "No User");
    if (user && user.email === ADMIN_EMAIL) {
        userEmailEl.textContent = user.email;
        if (authCheckOverlay) authCheckOverlay.style.display = 'none';
        fetchProducts();
        fetchCategories(); // To populate dropdown
    } else {
        console.warn("Unauthorized or no user. Redirecting...");
        window.location.href = 'index.html';
    }
});

async function fetchCategories() {
    const catSelect = document.getElementById('catSelect');
    try {
        const q = query(collection(db, "categories"), orderBy("name", "asc"));
        const snap = await getDocs(q);
        catSelect.innerHTML = '<option value="">Select Category</option>';
        snap.forEach(d => {
            const c = d.data();
            catSelect.innerHTML += `<option value="${c.name}">${c.name}</option>`;
        });
    } catch (e) {
        console.error("SDK Category Fetch Error:", e.code, e.message);
    }
}

async function fetchProducts() {
    productsListEl.innerHTML = '<div style="padding:40px; text-align:center;">Loading products...</div>';
    try {
        const q = query(collection(db, "products"));
        const snap = await getDocs(q);

        // Manual sort to avoid needing immediate Firestore indexes
        const products = [];
        snap.forEach(docSnap => products.push({ id: docSnap.id, ...docSnap.data() }));
        products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        productsListEl.innerHTML = '';
        if (products.length === 0) {
            productsListEl.innerHTML = '<div style="padding:40px; text-align:center; color:#999;">No products yet.</div>';
            return;
        }

        products.forEach(p => {
            const img = p.imageUrl || (p.imageUrls && p.imageUrls[0]) || 'https://via.placeholder.com/80';
            const card = document.createElement('div');
            card.className = 'product-card-mobile';
            card.innerHTML = `
                <img src="${img}">
                <div class="info" style="flex:1; margin-left:10px;">
                    <h3 style="font-size:14px; margin:0;">${p.name}</h3>
                    <div style="display:flex; justify-content:space-between; margin-top:5px;">
                        <span style="font-weight:700;">$${p.price}</span>
                        <span style="font-size:12px; color:#888;">Stock: ${p.stock}</span>
                    </div>
                </div>
                <button onclick="deleteProduct('${p.id}')" style="color:red; background:none; border:none; padding:10px;"><i class="fas fa-trash"></i></button>
            `;
            productsListEl.appendChild(card);
        });
    } catch (e) {
        console.error("SDK Product Fetch Error:", e.code, e.message);
        productsListEl.innerHTML = `<div style="padding:20px; color:red; text-align:center;">
            <strong>Permission Error:</strong><br>${e.code}<br>
            <small>Check Firestore Rules and ID.</small>
        </div>`;
    }
}

window.deleteProduct = async (id) => {
    if (!confirm("Delete product?")) return;
    globalLoading.style.display = 'flex';
    try {
        await deleteDoc(doc(db, "products", id));
        fetchProducts();
    } catch (e) {
        alert("Delete failed: " + e.message);
    } finally {
        globalLoading.style.display = 'none';
    }
};

document.getElementById('logoutBtn').onclick = () => signOut(auth);
document.getElementById('openAddModal').onclick = () => productModal.style.display = 'flex';
document.getElementById('closeModal').onclick = () => productModal.style.display = 'none';

// --- Advanced UI logic forVariations ---
// Size Chips Toggle
document.querySelectorAll('.chip').forEach(chip => {
    chip.onclick = () => chip.classList.toggle('active');
});

// Add Color Variant Row
document.getElementById('addColorBtn').onclick = () => {
    const container = document.getElementById('colorsContainer');
    const div = document.createElement('div');
    div.className = 'color-variant-card';
    div.style.cssText = 'background: #fff; border: 1px solid #eee; border-radius: 12px; padding: 15px; margin-top: 15px; box-shadow: 0 4px 10px rgba(0,0,0,0.06);';

    div.innerHTML = `
        <div style="margin-bottom: 15px;">
            <label style="font-size: 11px; font-weight: 700; color: #888; text-transform: uppercase;">Color Name</label>
            <div style="display: flex; gap: 8px; margin-top: 5px;">
                <select style="padding: 10px; border: 1px solid #ddd; border-radius: 10px; flex: 1; font-size: 14px;" onchange="this.nextElementSibling.value = this.value">
                    <option value="">Manual...</option>
                    <option value="Red">Red</option>
                    <option value="Blue">Blue</option>
                    <option value="Black">Black</option>
                    <option value="White">White</option>
                </select>
                <input type="text" placeholder="Type name" style="flex: 1.5; padding: 10px; border: 1px solid #ddd; border-radius: 10px;">
                <button type="button" style="background:#fff0f0; border:none; color:#ff3b30; padding:10px; border-radius:10px;" onclick="this.parentElement.parentElement.remove()"><i class="fas fa-trash"></i></button>
            </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom:15px; background: #f9f9f9; padding: 12px; border-radius: 10px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 13px;">Use Main Price</span>
                <input type="checkbox" checked onchange="toggleMobileVariantField(this, '.mv-price')">
            </div>
            <input type="number" class="mv-price" placeholder="Variant Price" style="display:none; padding:10px; border: 1px solid #ddd; border-radius:10px;">

            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 13px;">Use Main Description</span>
                <input type="checkbox" checked onchange="toggleMobileVariantField(this, '.mv-desc')">
            </div>
            <textarea class="mv-desc" placeholder="Variant Info..." style="display:none; padding:10px; border: 1px solid #ddd; border-radius:10px; min-height:50px;"></textarea>

            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 13px;">Use Main Sizes</span>
                <input type="checkbox" checked onchange="toggleMobileVariantField(this, '.mv-size')">
            </div>
            <input type="text" class="mv-size" placeholder="Variant Sizes (S,M,L)" style="display:none; padding:10px; border: 1px solid #ddd; border-radius:10px;">
        </div>

        <div style="display:flex; flex-direction:column; gap:8px;">
            <label style="font-size: 11px; font-weight: 700; color: #888;">VARIANT PHOTOS</label>
            <input type="file" multiple accept="image/*" style="font-size:11px;" onchange="handleMobileVariantPreview(this)">
            <div class="v-mobile-previews" style="display:flex; gap:5px; flex-wrap:wrap;"></div>
        </div>
    `;
    container.appendChild(div);
};

window.toggleMobileVariantField = (cb, sel) => {
    const card = cb.closest('.color-variant-card');
    card.querySelector(sel).style.display = cb.checked ? 'none' : 'block';
};

window.handleMobileVariantPreview = (input) => {
    const container = input.nextElementSibling;
    container.innerHTML = '';
    Array.from(input.files).forEach(f => {
        const r = new FileReader();
        r.onload = e => {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.style.cssText = 'width:40px; height:40px; object-fit:cover; border-radius:4px; border:1px solid #eee;';
            container.appendChild(img);
        };
        r.readAsDataURL(f);
    });
};

// Add Specification Row
document.getElementById('addSpecBtn').onclick = () => {
    const container = document.getElementById('specsContainer');
    const div = document.createElement('div');
    div.className = 'dynamic-list-item';
    div.innerHTML = `
        <input type="text" placeholder="Detail (e.g. Material)" style="flex:1; padding:8px; border-radius:8px; border:1px solid #ddd;">
        <input type="text" placeholder="Value (e.g. Leather)" style="flex:1; padding:8px; border-radius:8px; border:1px solid #ddd;">
        <button type="button" class="btn-small" style="background:#ff3b30;" onclick="this.parentElement.remove()">×</button>
    `;
    container.appendChild(div);
};

document.getElementById('productForm').onsubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const mainFiles = document.getElementById('imageInput').files;

    globalLoading.style.display = 'flex';
    document.getElementById('loadingText').textContent = "Processing variations...";

    try {
        // 1. Upload Main Images
        let imageUrls = [];
        for (let f of mainFiles) {
            const sRef = ref(storage, `products/${Date.now()}_${f.name}`);
            await uploadBytes(sRef, f);
            imageUrls.push(await getDownloadURL(sRef));
        }

        // 2. Handle Colors (and their images)
        const colorCards = document.querySelectorAll('.color-variant-card');
        const colorData = [];
        for (let card of colorCards) {
            const name = card.querySelector('input[type="text"]').value;
            const toggles = card.querySelectorAll('input[type="checkbox"]');

            const useMainPrice = toggles[0].checked;
            const useMainDesc = toggles[1].checked;
            const useMainSizes = toggles[2].checked;

            const price = card.querySelector('.mv-price').value;
            const details = card.querySelector('.mv-desc').value;
            const sizesStr = card.querySelector('.mv-size').value;
            const files = card.querySelector('input[type="file"]').files;

            let vImgs = [];
            if (files.length > 0) {
                for (let f of files) {
                    const sRef = ref(storage, `variants/${Date.now()}_${f.name}`);
                    await uploadBytes(sRef, f);
                    vImgs.push(await getDownloadURL(sRef));
                }
            }

            if (name) {
                const vSizes = sizesStr ? sizesStr.split(',').map(s => s.trim()).filter(s => s) : [];
                colorData.push({
                    name,
                    useMainPrice,
                    price: useMainPrice ? null : parseFloat(price),
                    useMainDesc,
                    details: useMainDesc ? null : details,
                    useMainSizes,
                    sizes: useMainSizes ? null : vSizes,
                    imageUrls: vImgs
                });
            }
        }

        // 3. Handle Sizes
        const activeSizes = Array.from(document.querySelectorAll('.chip.active'))
            .map(c => c.dataset.size);
        const customSizesStr = document.getElementById('customSizes').value;
        const customSizes = customSizesStr ? customSizesStr.split(',').map(s => s.trim()).filter(s => s) : [];
        const allSizes = [...activeSizes, ...customSizes];

        // 4. Handle Specs
        const specRows = document.querySelectorAll('#specsContainer .dynamic-list-item');
        const specData = [];
        specRows.forEach(row => {
            const inputs = row.querySelectorAll('input');
            const label = inputs[0].value;
            const value = inputs[1].value;
            if (label && value) specData.push({ label, value });
        });

        const productData = {
            name: form.name.value,
            brand: '',
            category: form.category.value,
            price: Number(form.price.value),
            stock: Number(form.stock.value),
            description: form.description.value,
            imageUrl: imageUrls.length > 0 ? imageUrls[0] : '',
            imageUrls: imageUrls,
            colors: colorData,
            sizes: allSizes,
            specifications: specData,
            createdAt: new Date().toISOString()
        };

        await addDoc(collection(db, "products"), productData);
        productModal.style.display = 'none';
        form.reset();
        document.getElementById('colorsContainer').innerHTML = '';
        document.getElementById('specsContainer').innerHTML = '';
        document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        document.getElementById('imagePreview').innerHTML = '';
        fetchProducts();
        alert("Advanced product added!");
    } catch (err) {
        console.error("SDK Advanced Add Error:", err);
        alert("Error: " + err.message);
    } finally {
        globalLoading.style.display = 'none';
        document.getElementById('loadingText').textContent = "Processing...";
    }
};

// Preview logic
document.getElementById('imageInput').onchange = (e) => {
    const preview = document.getElementById('imagePreview');
    preview.innerHTML = '';
    const files = Array.from(e.target.files);
    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (ev) => {
            const box = document.createElement('div');
            box.className = 'preview-box';
            box.style.backgroundImage = `url(${ev.target.result})`;
            preview.appendChild(box);
        };
        reader.readAsDataURL(file);
    });
};
