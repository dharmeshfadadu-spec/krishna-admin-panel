/* ==========================================================================
   📦 પ્રોડક્ટ મેનેજમેન્ટ, બેકગ્રાઉન્ડ રીમુવલ અને ઇનલાઇન એડિટિંગ લોજિક
   ========================================================================== */

// એપ્લિકેશનના મુખ્ય નિયમો અપડેટ કરવાનું ફંક્શન [૨]
function updateSettings() {
    let data = {
        shopOpen: document.getElementById('cfg-shop-status').checked,
        bannerActive: document.getElementById('cfg-banner-status').checked,
        bannerText: document.getElementById('cfg-banner-text').value,
        noticeText: document.getElementById('cfg-notice-text').value,
        freeDeliveryLimit: parseInt(document.getElementById('cfg-free-limit').value) || 1000,
        deliveryCharge: parseInt(document.getElementById('cfg-delivery-charge').value) || 20,
        minOrderAmt: parseInt(document.getElementById('cfg-min-order').value) || 200,
        adminPhone: document.getElementById('cfg-admin-phone').value
    };
    fetch(`${dbURL}/settings.json`, { method: "PUT", body: JSON.stringify(data) }) [૨]
    .then(() => alert("બધા જ નિયમો અને કંટ્રોલ સેટિંગ્સ સફળતાપૂર્વક અપડેટ થયા!"));
}

// કેટેગરી કંટ્રોલ લોજિક [૨]
function updateCategoryUI() {
    const select = document.getElementById('prod-category-select');
    const divList = document.getElementById('admin-cat-list');
    if (!select || !divList) return;
    
    select.innerHTML = '';
    divList.innerHTML = '';
    
    allCategories.forEach((cat, index) => {
        let opt = document.createElement('option');
        opt.value = cat; opt.innerText = cat;
        select.appendChild(opt);

        let bubble = document.createElement('div');
        bubble.style = "background:#eee; padding:5px 10px; border-radius:4px; display:flex; align-items:center; gap:8px; font-size:14px;";
        bubble.innerHTML = `${cat} <i class="fa-solid fa-circle-xmark" style="color:var(--danger); cursor:pointer;" onclick="deleteCategory(${index})"></i>`;
        divList.appendChild(bubble);
    });
}

function addNewCategory() {
    let val = document.getElementById('new-cat-input').value.trim();
    if(!val) return;
    allCategories.push(val);
    fetch(`${dbURL}/categories.json`, { method: "PUT", body: JSON.stringify(allCategories) }) [૨]
    .then(() => { document.getElementById('new-cat-input').value = ''; loadAdminDashboardData(); });
}

function deleteCategory(index) {
    if(confirm("શું તમે આ કેટેગરી ડીલીટ કરવા માંગો છો?")) {
        allCategories.splice(index, 1);
        fetch(`${dbURL}/categories.json`, { method: "PUT", body: JSON.stringify(allCategories) }) [૨]
        .then(() => loadAdminDashboardData());
    }
}

// ૧૦૦% મફત @imgly/background-removal ક્લાયન્ટ-સાઇડ લોજિક સેટઅપ
async function processImageWithRemoval() {
    const fileInput = document.getElementById('prod-image-file');
    const statusDiv = document.getElementById('img-remove-status');
    if (!fileInput || fileInput.files.length === 0) return;
    
    const file = fileInput.files[0];
    statusDiv.innerText = "⏳ જાદુઈ ટૂલ ચાલુ છે... ફોટોનું બેકગ્રાઉન્ડ મફતમાં સાફ થઈ રહ્યું છે...";
    
    try {
        // @imgly બ્રાઉઝર પાવર દ્વારા ઓટો બેકગ્રાઉન્ડ કટિંગ કરે છે
        const blob = await imglyBackgroundRemoval(file);
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = function () {
            base64ImageStr = reader.result;
            statusDiv.innerHTML = "<span style='color:green; font-weight:bold;'>✅ પ્રોફેસનલ બેકગ્રાઉન્ડ રીમુવલ સફળ! ફોટો રેડી છે.</span>";
        };
    } catch (error) {
        // સેફ્ટી બાયપાસ: જો બ્રાઉઝર સપોર્ટ ઓછો હોય તો ઓરિજિનલ ફોટો રાખશે
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = function () {
            base64ImageStr = reader.result;
            statusDiv.innerHTML = "<span style='color:orange;'>✅ ઓરિજિનલ ફોટો સેવ થયો (બેકગ્રાઉન્ડ રીમુવલ બાયપાસ).</span>";
        };
    }
}

// નવી પ્રોડક્ટ સેવ કરવા માટે [૨]
function saveProductData() {
    let nameGu = document.getElementById('prod-name-gu').value.trim();
    let nameEn = document.getElementById('prod-name-en').value.trim();
    let category = document.getElementById('prod-category-select').value;
    let weight = document.getElementById('prod-weight').value.trim();
    let mrp = document.getElementById('prod-mrp').value;
    let sprice = document.getElementById('prod-sprice').value;
    let stock = document.getElementById('prod-stock').value;

    if(!nameGu || !nameEn || !weight || !mrp || !sprice || !stock) {
        alert("સ્ટાર * વાળી બધી જ વિગતો ભરવી ફરજિયાત છે!");
        return;
    }

    let prodID = "PRD" + Date.now();
    let productData = {
        id: prodID, nameGu, nameEn, category, weight,
        mrp: parseFloat(mrp), sprice: parseFloat(sprice), stock: parseInt(stock),
        image: base64ImageStr || "https://placeholder.com", active: true
    };

    fetch(`${dbURL}/products/${prodID}.json`, { method: "PUT", body: JSON.stringify(productData) }) [૨]
    .then(() => {
        alert("નવી વસ્તુ સફળતાપૂર્વક સ્ટોરમાં ઉમેરાઈ ગઈ છે!");
        base64ImageStr = "";
        document.getElementById('prod-name-gu').value = '';
        document.getElementById('prod-name-en').value = '';
        document.getElementById('prod-weight').value = '';
        document.getElementById('prod-mrp').value = '';
        document.getElementById('prod-sprice').value = '';
        document.getElementById('prod-stock').value = '';
        document.getElementById('prod-image-file').value = '';
        document.getElementById('img-remove-status').innerText = '';
        loadAdminDashboardData();
    });
}

// ઇનલાઇન એડિટિંગ ઇન્વેન્ટરી ટેબલ રેન્ડર સિસ્ટમ
function renderInventoryTable() {
    const tbody = document.getElementById('inventory-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    for(let id in allProducts) {
        let p = allProducts[id];
        let tr = document.createElement('tr');
        tr.innerHTML = `
            <td><img src="${p.image}" style="width:40px; height:40px; object-fit:contain;"></td>
            <td>${p.nameGu}</td>
            <td class="editable" onclick="inlineEditValue('${id}', 'weight', '${p.weight}')">${p.weight}</td>
            <td class="editable" onclick="inlineEditValue('${id}', 'mrp', ${p.mrp})">₹${p.mrp}</td>
            <td class="editable" onclick="inlineEditValue('${id}', 'sprice', ${p.sprice})">₹${p.sprice}</td>
            <td class="editable" onclick="inlineEditValue('${id}', 'stock', ${p.stock})">${p.stock}</td>
            <td>
                <label class="switch"><input type="checkbox" ${p.active !== false ? 'checked' : ''} onchange="toggleProductActive('${id}', this.checked)"><span class="slider"></span></label>
            </td>
            <td><button class="btn btn-danger" style="padding:5px 10px;" onclick="deleteProductData('${id}')"><i class="fa-solid fa-trash"></i></button></td>
        `;
        tbody.appendChild(tr);
    }
}

// ડાયરેક્ટ ઇનલાઇન ટેબલ માસ્ટર અપડેટ લોજિક (પીળા બોક્સ પર ક્લિકથી સેવ થશે) [૨]
function inlineEditValue(id, field, currentVal) {
    let newVal = prompt(`નવી કિંમત/વિગત લખો:`, currentVal);
    if(newVal === null || newVal.trim() === "") return;
    let parsedVal = (field === 'mrp' || field === 'sprice' || field === 'stock') ? parseFloat(newVal) : newVal;
    
    fetch(`${dbURL}/products/${id}/${field}.json`, { method: "PUT", body: JSON.stringify(parsedVal) }) [૨]
    .then(() => loadAdminDashboardData());
}

function toggleProductActive(id, status) {
    fetch(`${dbURL}/products/${id}/active.json`, { method: "PUT", body: status }); [૨]
}

function deleteProductData(id) {
    if(confirm("શું તમે આ પ્રોડક્ટ કાયમ માટે કાઢી નાખવા માંગો છો?")) {
        fetch(`${dbURL}/products/${id}.json`, { method: "DELETE" }) [૨]
        .then(() => loadAdminDashboardData());
    }
}
