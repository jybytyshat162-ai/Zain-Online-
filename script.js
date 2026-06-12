// 1. استيراد مكتبات Firebase المطلوبة عبر CDN الرسمي المدعوم لمتصفحات الجوال
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, set, onValue, remove, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getStorage, ref as sRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

// 2. إعدادات ومفاتيح تطبيقك الخاص "زين أون لاين"
const firebaseConfig = {
    apiKey: "AIzaSyAUmiSv1NdOWCZhJCGab6in028MPhNjFgE",
    authDomain: "zain-online-938c5.firebaseapp.com",
    databaseURL: "https://zain-online-938c5-default-rtdb.firebaseio.com",
    projectId: "zain-online-938c5",
    storageBucket: "zain-online-938c5.firebasestorage.app",
    messagingSenderId: "76098093405",
    appId: "1:76098093405:web:672fec6028e89e434b68b4",
    measurementId: "G-EEK45Z2HC8"
};

// 3. تهيئة التطبيق وقواعد البيانات
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const storage = getStorage(app);



// ================= التنقل بين الصفحات =================
document.addEventListener("DOMContentLoaded", function() {
    const buttons = document.querySelectorAll(".nav-btn");
    const pages = document.querySelectorAll(".page");
    
    buttons.forEach(function(btn) {
        btn.addEventListener("click", function() {
            pages.forEach(p => p.classList.remove("active"));
            buttons.forEach(b => b.classList.remove("active"));
            
            btn.classList.add("active");
            const pageId = btn.getAttribute("data-page");
            const target = document.getElementById(pageId);
            if (target) target.classList.add("active");
        });
    });
});

// ================= دالة الرفع الذكي (البيانات + تخطي صور إذا تعطلت) =================
const uploadBtn = document.getElementById("uploadBtn");
if (uploadBtn) {
    uploadBtn.addEventListener("click", uploadProduct);
}

async function uploadProduct() {
    const name = document.getElementById("productName").value.trim();
    const category = document.getElementById("category").value;
    const quantity = document.getElementById("quantity").value;
    const price = document.getElementById("price").value;
    const description = document.getElementById("description").value.trim();
    
    const imgInp1 = document.getElementById("image1").files[0];
    const imgInp2 = document.getElementById("image2").files[0];
    const imgInp3 = document.getElementById("image3").files[0];
    
    if (!name || !price || !quantity || !description || category === "اختر الصنف") {
        alert("يرجى تعبئة كافة الحقول واختيار الصنف بشكل صحيح.");
        return;
    }
    
    uploadBtn.disabled = true;
    uploadBtn.innerText = "جاري الحفظ والرفع للسيرفر...";
    
    let url1 = "https://placehold.co/150?text=No+Image";
    let url2 = "https://placehold.co/150?text=No+Image";
    let url3 = "https://placehold.co/150?text=No+Image";
    
    if (imgInp1) {
        try {
            const storageRef = sRef(storage, 'products/' + Date.now() + '_1.jpg');
            const snapshot = await uploadBytes(storageRef, imgInp1);
            url1 = await getDownloadURL(snapshot.ref);
        } catch (e) { console.log("تم تخطي الصورة الأولى بنجاح"); }
    }
    if (imgInp2) {
        try {
            const storageRef = sRef(storage, 'products/' + Date.now() + '_2.jpg');
            const snapshot = await uploadBytes(storageRef, imgInp2);
            url2 = await getDownloadURL(snapshot.ref);
        } catch (e) { console.log("تم تخطي الصورة الثانية بنجاح"); }
    }
    if (imgInp3) {
        try {
            const storageRef = sRef(storage, 'products/' + Date.now() + '_3.jpg');
            const snapshot = await uploadBytes(storageRef, imgInp3);
            url3 = await getDownloadURL(snapshot.ref);
        } catch (e) { console.log("تم تخطي الصورة الثالثة بنجاح"); }
    }
    
    try {
        const productsRef = ref(db, 'products');
        const newProductRef = push(productsRef);
        
        await set(newProductRef, {
            name: name,
            category: category,
            quantity: Number(quantity),
            price: Number(price),
            description: description,
            image1: url1,
            image2: url2,
            image3: url3,
            createdAt: Date.now()
        });
        
        alert("تم رفع المنتج وحفظ البيانات بنجاح باهر في قاعدة بيانات Firebase! 🎉✅");
        
        document.getElementById("productName").value = "";
        document.getElementById("quantity").value = "";
        document.getElementById("price").value = "";
        document.getElementById("description").value = "";
        document.getElementById("image1").value = "";
        document.getElementById("image2").value = "";
        document.getElementById("image3").value = "";
        
    } catch (error) {
        alert("خطأ أثناء الكتابة في قاعدة البيانات: " + error.message);
    } finally {
        uploadBtn.disabled = false;
        uploadBtn.innerText = "رفع المنتج";
    }
}

// ================= جلب وعرض البيانات من Firebase تلقائياً وفورياً =================
const productsContainer = document.getElementById("productsContainer");
const totalProductsCount = document.getElementById("totalProductsCount");
const searchInp = document.getElementById("searchInp");
let allProducts = [];

const dbProductsRef = ref(db, 'products');
onValue(dbProductsRef, (snapshot) => {
    if (!productsContainer) return;
    productsContainer.innerHTML = "";
    allProducts = [];
    
    if (!snapshot.exists()) {
        productsContainer.innerHTML = '<p style="text-align:center; color:#888;">لا توجد منتجات مرفوعة حالياً.</p>';
        if(totalProductsCount) totalProductsCount.innerText = "0";
        return;
    }
    
    let count = 0;
    snapshot.forEach((childSnapshot) => {
        const childKey = childSnapshot.key;
        const childData = childSnapshot.val();
        childData.id = childKey;
        allProducts.push(childData);
        count++;
    });
    
    if(totalProductsCount) totalProductsCount.innerText = count;
    displayProducts(allProducts);
});

function displayProducts(productsArray) {
    if (!productsContainer) return;
    productsContainer.innerHTML = "";
    if(productsArray.length === 0){
        productsContainer.innerHTML = '<p style="text-align:center; color:#888;">لم يتم العثور على نتائج مطابقة.</p>';
        return;
    }
    
    productsArray.forEach((product) => {
        const card = document.createElement("div");
        card.className = "product-card";
        card.innerHTML = `
            <div class="img" style="background-image: url('${product.image1}'); background-size: cover; background-position: center;"></div>
            <h4>${product.name}</h4>
            <p>الصنف: ${product.category}</p>
            <p style="color: #e67e22; font-weight: bold;">${product.price} ريال يمني</p>
            <p style="font-size:12px; color:#666;">الكمية المتوفرة: ${product.quantity}</p>
            <div class="actions">
                <button class="edit" data-id="${product.id}">تعديل</button>
                <button class="delete" data-id="${product.id}">حذف</button>
            </div>
        `;
        productsContainer.appendChild(card);
    });
    
    const editButtons = document.querySelectorAll(".edit");
    editButtons.forEach(btn => {
        btn.addEventListener("click", function() {
            const prodId = this.getAttribute("data-id");
            openEditModal(prodId);
        });
    });
    
    const deleteButtons = document.querySelectorAll(".delete");
    deleteButtons.forEach(btn => {
        btn.addEventListener("click", function() {
            const prodId = this.getAttribute("data-id");
            if(confirm("هل أنت متأكد تماماً من رغبتك في حذف هذا المنتج من السيرفر؟")) {
                remove(ref(db, 'products/' + prodId))
                .then(() => alert("تم حذف المنتج بنجاح فوري! 🎉"))
                .catch((err) => alert("فشل الحذف: " + err.message));
            }
        });
    });
}

// ================= نظام تعديل المنتج والنافذة المنبثقة =================
const editModal = document.getElementById("editModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const saveEditBtn = document.getElementById("saveEditBtn");
let currentEditingId = null;

function openEditModal(id) {
    const product = allProducts.find(p => p.id === id);
    if (!product) return;
    
    currentEditingId = id;
    
    document.getElementById("editProductName").value = product.name;
    document.getElementById("editCategory").value = product.category;
    document.getElementById("editQuantity").value = product.quantity;
    document.getElementById("editPrice").value = product.price;
    document.getElementById("editDescription").value = product.description || "";
    
    document.getElementById("editImage1").value = "";
    document.getElementById("editImage2").value = "";
    document.getElementById("editImage3").value = "";
    
    if (editModal) editModal.style.display = "block";
}

if (closeModalBtn) {
    closeModalBtn.addEventListener("click", () => {
        editModal.style.display = "none";
    });
}

if (saveEditBtn) {
    saveEditBtn.addEventListener("click", saveProductEdits);
}

async function saveProductEdits() {
    if (!currentEditingId) return;
    
    const name = document.getElementById("editProductName").value.trim();
    const category = document.getElementById("editCategory").value;
    const quantity = document.getElementById("editQuantity").value;
    const price = document.getElementById("editPrice").value;
    const description = document.getElementById("editDescription").value.trim();
    
    const file1 = document.getElementById("editImage1").files[0];
    const file2 = document.getElementById("editImage2").files[0];
    const file3 = document.getElementById("editImage3").files[0];
    
    if (!name || !price || !quantity || !description) {
        alert("يرجى تعبئة كافة الحقول النصية.");
        return;
    }
    
    saveEditBtn.disabled = true;
    saveEditBtn.innerText = "جاري تحديث السيرفر...";
    
    const currentProduct = allProducts.find(p => p.id === currentEditingId);
    
    let url1 = currentProduct.image1;
    let url2 = currentProduct.image2;
    let url3 = currentProduct.image3;
    
    if (file1) {
        try {
            const storageRef = sRef(storage, 'products/' + Date.now() + '_1.jpg');
            const snapshot = await uploadBytes(storageRef, file1);
            url1 = await getDownloadURL(snapshot.ref);
        } catch (e) { console.log("تم تخطي تعديل الصورة 1"); }
    }
    if (file2) {
        try {
            const storageRef = sRef(storage, 'products/' + Date.now() + '_2.jpg');
            const snapshot = await uploadBytes(storageRef, file2);
            url2 = await getDownloadURL(snapshot.ref);
        } catch (e) { console.log("تم تخطي تعديل الصورة 2"); }
    }
    if (file3) {
        try {
            const storageRef = sRef(storage, 'products/' + Date.now() + '_3.jpg');
            const snapshot = await uploadBytes(storageRef, file3);
            url3 = await getDownloadURL(snapshot.ref);
        } catch (e) { console.log("تم تخطي تعديل الصورة 3"); }
    }
    
    try {
        const productUpdateRef = ref(db, 'products/' + currentEditingId);
        await update(productUpdateRef, {
            name: name,
            category: category,
            quantity: Number(quantity),
            price: Number(price),
            description: description,
            image1: url1,
            image2: url2,
            image3: url3
        });
        
        alert("تم تحديث كافة بيانات المنتج وصوره على فايربيز بنجاح! 🎉✅");
        if (editModal) editModal.style.display = "none";
        
    } catch (error) {
        alert("فشل تحديث البيانات: " + error.message);
    } finally {
        saveEditBtn.disabled = false;
        saveEditBtn.innerText = "حفظ التغييرات";
    }
}

// ================= إحصائيات زوار وطرق الدفع الحية =================
const siteVisitorsCount = document.getElementById("siteVisitorsCount");
const dbVisitorsRef = ref(db, 'visitors/count');
onValue(dbVisitorsRef, (snapshot) => {
    if (snapshot.exists()) {
        if(siteVisitorsCount) siteVisitorsCount.innerText = snapshot.val();
    } else {
        if(siteVisitorsCount) siteVisitorsCount.innerText = "0";
    }
});

const savePayBtn = document.getElementById("savePayBtn");
if (savePayBtn) {
    savePayBtn.addEventListener("click", savePaymentMethod);
}

async function savePaymentMethod() {
    const payName = document.getElementById("payName").value.trim();
    const payNumber = document.getElementById("payNumber").value.trim();
    const logoFile = document.getElementById("payLogo").files[0];
    
    if(!payName || !payNumber) {
        alert("يرجى إدخال اسم المحفظة ورقم الحساب لحفظ طريقة الدفع.");
        return;
    }
    
    savePayBtn.disabled = true;
    savePayBtn.innerText = "جاري الحفظ...";
    
    let logoUrl = "https://placehold.co/100?text=Payment";
    
    if (logoFile) {
        try {
            const storageRef = sRef(storage, 'payments/' + Date.now() + '_logo.jpg');
            const snapshot = await uploadBytes(storageRef, logoFile);
            logoUrl = await getDownloadURL(snapshot.ref);
        } catch(e) { console.log("تم تخطي رفع شعار المحفظة"); }
    }
    
    try {
        const paymentsRef = ref(db, 'payments');
        const newPayRef = push(paymentsRef);
        await set(newPayRef, {
            name: payName,
            number: payNumber,
            logo: logoUrl
        });
        
        alert("تم حفظ طريقة الدفع بنجاح وإضافتها للقاعدة! 💳✅");
        document.getElementById("payName").value = "";
        document.getElementById("payNumber").value = "";
        document.getElementById("payLogo").value = "";
        
    } catch(err) {
        alert("خطأ أثناء حفظ طريقة الدفع: " + err.message);
    } finally {
        savePayBtn.disabled = false;
        savePayBtn.innerText = "حفظ طريقة الدفع";
    }
}

const paymentsContainer = document.getElementById("paymentsContainer");
const dbPaymentsRef = ref(db, 'payments');
onValue(dbPaymentsRef, (snapshot) => {
    if (!paymentsContainer) return;
    paymentsContainer.innerHTML = "";
    
    if (!snapshot.exists()) {
        paymentsContainer.innerHTML = '<p style="font-size:13px; color:#888;">لا توجد طرق دفع مضافة حالياً.</p>';
        return;
    }
    
    snapshot.forEach((childSnapshot) => {
        const payId = childSnapshot.key;
        const payData = childSnapshot.val();
        
        const div = document.createElement("div");
        div.className = "payment-item";
        div.innerHTML = `
            <img src="${payData.logo}" alt="logo">
            <div class="info">
                <h5>${payData.name}</h5>
                <p>الحساب: ${payData.number}</p>
            </div>
            <button class="delete-pay" data-id="${payId}">حذف</button>
        `;
        paymentsContainer.appendChild(div);
    });
    
    const deletePayButtons = document.querySelectorAll(".delete-pay");
    deletePayButtons.forEach(btn => {
        btn.addEventListener("click", function() {
            const id = this.getAttribute("data-id");
            if(confirm("هل تريد حذف طريقة الدفع هذه نهائياً من المتجر؟")) {
                remove(ref(db, 'payments/' + id))
                .then(() => alert("تم حذف طريقة الدفع بنجاح! 🗑️"))
                .catch((err) => alert("فشل الحذف: " + err.message));
            }
        });
    });
});

if(searchInp) {
    searchInp.addEventListener("input", function() {
        const txt = searchInp.value.toLowerCase().trim();
        const filtered = allProducts.filter(p => {
            return p.name.toLowerCase().includes(txt) || p.category.toLowerCase().includes(txt);
        });
        displayProducts(filtered);
    });
}

// ================= نظام قائمة المحادثات (الواتساب) الحية والمصلحة بالكامل =================
const chatListContainer = document.getElementById("chatListContainer");

const chatDbRef = ref(db, 'chats');
onValue(chatDbRef, (snapshot) => {
    if (!chatListContainer) return;
    chatListContainer.innerHTML = "";
    
    if (!snapshot.exists()) {
        chatListContainer.innerHTML = '<p style="text-align:center; color:#888; margin:30px auto;">لا توجد محادثات أو طلبات شراء حتى الآن في الفايربيز.</p>';
        return;
    }
    
    // قراءة كل غرف الدردشة الخاصة بالمستخدمين من القاعدة مباشرة
    snapshot.forEach((userSnapshot) => {
        const clientId = userSnapshot.key;
        const messages = userSnapshot.val();
        
        let lastMessageText = "لا توجد رسائل نصية";
        let unreadCount = 0;
        
        // حساب الرسائل غير المقروءة والبحث عن آخر رسالة في المحادثة
        if (messages && typeof messages === 'object') {
            Object.values(messages).forEach((msg) => {
                if (msg && msg.message) {
                    lastMessageText = msg.message;
                    if (msg.sender === "client" && msg.status !== "read") {
                        unreadCount++;
                    }
                }
            });
        }
        
        // إنشاء كرت العميل وعرضه في القائمة بشكل أنيق وجذاب مثل الواتساب
        const userDiv = document.createElement("div");
        userDiv.className = "user-chat-item";
        
        userDiv.innerHTML = `
            <div class="user-info-side">
                <div class="user-avatar">
                    <span class="material-symbols-rounded">person</span>
                </div>
                <div class="user-details">
                    <h4>زبون المتجر (${clientId.substring(0, 6)})</h4>
                    <p>${lastMessageText.substring(0, 30)}...</p>
                </div>
            </div>
            ${unreadCount > 0 ? `<div class="badge-counter">${unreadCount}</div>` : ''}
        `;
        
        // عند الضغط على الكرت يتم نقله لصفحة index2.html لمحادثته فردياً
        userDiv.addEventListener("click", () => {
            window.location.href = `index2.html?userId=${clientId}`;
        });
        
        chatListContainer.appendChild(userDiv);
    });
});
