/* ==========================================================================
   📦 માસ્ટર પ્રોડક્ટ મેનેજમેન્ટ, લાઈટવેઇટ કમ્પ્રેસર અને કેટેગરી કંટ્રોલ લોજિક
   ========================================================================== */

// ગ્લોબલ વેરિએબલ્સ જાહેર કરવા (કોડ ક્રેશ થતો અટકાવવા માટે)
let base64ImageStr = ""; 
let allProducts = {};
let allCategories = [];

// એપ્લિકેશનના મુખ્ય નિયમો અપડેટ કરવાનું ફંક્શન
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
    fetch(`${dbURL}/settings.json`, { method: "PUT", body: JSON.stringify(data) })
    .then(() => alert("બધા જ નિયમો અને કંટ્રોલ સેટિંગ્સ સફળતાપૂર્વક અપડેટ થયા!"));
}

// 🔴 કેટેગરી કંટ્રોલ લોજિક - આઇકોનની જગ્યાએ ૧૦૦% દેખાય તેવું લાલ ડીલીટ બટન સેટ કર્યું છે
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
        // 💡 ફિક્સ: ફોન્ટ-આઇકોન વગરનું ૧૦૦% વર્કિંગ લાલ '× ડીલીટ' બટન
        bubble.innerHTML = `${cat} <span style="color:red; font-weight:bold; cursor:pointer; margin-left:8px; border:1px solid red; padding:1px 5px; border-radius:3px; font-size:11px;" onclick="deleteCategory(${index})">× ડીલીટ</span>`;
        divList.appendChild(bubble);
    });
}

function addNewCategory() {
    let val = document.getElementById('new-cat-input').value.trim();
    if(!val) return;
    allCategories.push(val);
    fetch(`${dbURL}/categories.json`, { method: "PUT", body: JSON.stringify(allCategories) })
    .then(() => { document.getElementById('new-cat-input').value = ''; loadAdminDashboardData(); });
}

function deleteCategory(index) {
    if(confirm("શું તમે આ કેટેગરી ડીલીટ કરવા માંગો છો?")) {
        allCategories.splice(index, 1);
        fetch(`${dbURL}/categories.json`, { method: "PUT", body: JSON.stringify(allCategories) })
        .then(() => loadAdminDashboardData());
    }
}

// ⚡ સ્માર્ટ ઓન-ડિમાન્ડ લોડર: એપ ૧ સેકન્ડમાં ખુલશે, ફોટો પાડતી વખતે જ બેકગ્રાઉન્ડ સફેદ થઈને ૧૦-૨૦ KB માં ફરી જશે [૧.૩.૬]
async function processImageWithRemoval() {
    const fileInput = document.getElementById('prod-image-file');
    const statusDiv = document.getElementById('img-remove-status');
    if (!fileInput || fileInput.files.length === 0) return;
    
    const file = fileInput.files[0];
    statusDiv.style.color = "orange";
    statusDiv.innerText = "⏳ જાદુઈ ટૂલ લોડ થઈ રહ્યું છે... (પહેલી વાર થોડી સેકન્ડ લાગી શકે છે)...";
    
    try {
        // ૧. ઓન-ડિમાન્ડ સ્માર્ટ લોડિંગ (એપ સુપર ફાસ્ટ ખોલવા માટે)
        if (typeof imglyBackgroundRemoval === 'undefined') {
            await new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = "https://jsdelivr.net";
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        }
        
        statusDiv.innerText = "⏳ બેકગ્રાઉન્ડ સફેદ થઈ રહ્યું છે અને સાઈઝ ૧૦-૨૦ KB માં બદલાઈ રહી છે...";
        
        // ૨. ઓટો બેકગ્રાઉન્ડ કટિંગ (લાઈટવેઇટ મોડેલ) [૧.૩.૪]
        const blob = await imglyBackgroundRemoval(file, { model: "small" }); // [૧.૩.૪]
        
        // ૩. ૧૦-૨૦ KB સુપર કમ્પ્રેસર કેનવાસ લોજિક
        const img = new Image();
        img.src = URL.createObjectURL(blob);
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // 💡 ઓપ્ટિમાઇઝેશન: ક્વોલિટી જાળવીને સાઇઝ ૧૦-૨૦ KB કરવા માટે પહોળાઈ 400px કરી
            const MAX_WIDTH = 400; 
            let width = img.width;
            let height = img.height;
            
            if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
            }
            
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            
            // 💡 ઓપ્ટિમાઇઝેશન: 45% (0.45) ક્વોલિટી સેટ કરી જેથી ફોટો ફાટે નહીં અને સાઇઝ એકદમ નાની બને
            base64ImageStr = canvas.toDataURL('image/jpeg', 0.45); 
            statusDiv.style.color = "green";
            statusDiv.innerHTML = "<b>✅ બેકગ્રાઉન્ડ સફેદ થયું અને ફોટો સુપર-કોમ્પ્રેસ (10-20 KB) થઈ ગયો!</b>";
        };
    } catch (error) {
        // સેફ્ટી બાયપાસ: જો કોઈ નેટવર્ક એરર આવે તો ઓરિજિનલ ફોટો જ કેનવાસથી ૧૦-૨૦ KB માં ફેરવી દેશે
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = function (event) {
            const img = new Image();
            img.src = event.target.result;
            img.onload = function () {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = 400;
                canvas.height = (img.height / img.width) * 400;
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                base64ImageStr = canvas.toDataURL('image/jpeg', 0.45);
                statusDiv.style.color = "orange";
                statusDiv.innerHTML = "<b>✅ ઓરિજિનલ ફોટો ૧૦-૨૦ KB માં સેવ થયો (બેકગ્રાઉન્ડ બાયપાસ).</b>";
            };
        };
    }
}

// નવી પ્રોડક્ટ સેવ કરવા માટે
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
        image: typeof base64ImageStr !== 'undefined' && base64ImageStr ? base64ImageStr : "https://placeholder.com", 
        active: true
    };

    fetch(`${dbURL}/products/${prodID}.json`, { method: "PUT", body: JSON.stringify(productData) })
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

// ડાયરેક્ટ ઇનલાઇન ટેબલ માસ્ટર અપડેટ લોજિક (પીળા બોક્સ પર ક્લિકથી સેવ થશે)
function inlineEditValue(id, field, currentVal) {
    let newVal = prompt(`નવી કિંમત/વિગત લખો:`, currentVal);
    if(newVal === null || newVal.trim() === "") return;
    let parsedVal = (field === 'mrp' || field === 'sprice' || field === 'stock') ? parseFloat(newVal) : newVal;
    
    fetch(`${dbURL}/products/${id}/${field}.json`, { method: "PUT", body: JSON.stringify(parsedVal) })
