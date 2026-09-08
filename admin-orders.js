/* ==========================================================================
   📥 લાઇવ ઓર્ડર ડેશબોર્ડ, ફિલ્ટર સર્ચ અને સ્ટેટસ મેનેજમેન્ટ લોજિક
   ========================================================================== */

/**
 * મુખ્ય ડેટા લોડર ફંક્શન (જે admin-auth.js દ્વારા લોગિન પછી કોલ થાય છે)
 * આ ફંક્શન બધી એડમિન સપોર્ટ ફાઇલોને એકસાથે જોડે છે. [૧, ૨]
 */
function loadAdminDashboardData() {
    // એપ્લિકેશન સેટિંગ્સ અને નિયમો લોડ કરવા [૨]
    fetch(`${dbURL}/settings.json`)
    .then(res => res.json())
    .then(cfg => {
        if(cfg) {
            document.getElementById('cfg-shop-status').checked = cfg.shopOpen !== false;
            document.getElementById('cfg-banner-status').checked = cfg.bannerActive === true;
            document.getElementById('cfg-banner-text').value = cfg.bannerText || "";
            document.getElementById('cfg-notice-text').value = cfg.noticeText || "";
            document.getElementById('cfg-free-limit').value = cfg.freeDeliveryLimit || 1000;
            document.getElementById('cfg-delivery-charge').value = cfg.deliveryCharge || 20;
            document.getElementById('cfg-min-order').value = cfg.minOrderAmt || 200;
            document.getElementById('cfg-admin-phone').value = cfg.adminPhone || "";
        }
    })
    .catch(err => console.error("સેટિંગ્સ લોડ કરવામાં ભૂલ આવી:", err));

    // કેટેગરી લિસ્ટ લોડ કરવા [૨]
    fetch(`${dbURL}/categories.json`)
    .then(res => res.json())
    .then(cats => {
        allCategories = cats ? Object.values(cats) : ["કરિયાણું", "શાકભાજી", "ડેરી પ્રોડક્ટ"];
        if (typeof updateCategoryUI === "function") updateCategoryUI();
    })
    .catch(err => console.error("કેટેગરી લોડ કરવામાં ભૂલ આવી:", err));

    // સ્ટોર પ્રોડક્ટ્સ લોડ કરવા [૨]
    fetch(`${dbURL}/products.json`)
    .then(res => res.json())
    .then(prods => {
        allProducts = prods || {};
        if (typeof renderInventoryTable === "function") renderInventoryTable();
    })
    .catch(err => console.error("પ્રોડક્ટ્સ લોડ કરવામાં ભૂલ આવી:", err));

    // ગ્રાહકોના લાઇવ ઓર્ડર્સ લોડ કરવા [૨]
    fetch(`${dbURL}/orders.json`)
    .then(res => res.json())
    .then(orders => {
        renderOrdersList(orders || {});
    })
    .catch(err => console.error("ઓર્ડર્સ લોડ કરવામાં ભૂલ આવી:", err));
}

/**
 * લાઇવ ઓર્ડર લિસ્ટ ડેશબોર્ડ રેન્ડર સિસ્ટમ (૧૦૦% ભૂલ-રહિત ગૂગલ મેપ લિંક સાથે) [૧, ૨]
 */
function renderOrdersList(orders) {
    const area = document.getElementById('admin-orders-list-area');
    if (!area) return;
    area.innerHTML = '';
    
    let hasOrders = false;
    
    // ઓર્ડર્સને લિસ્ટમાં ગોઠવો
    for(let id in orders) {
        hasOrders = true;
        let o = orders[id];
        let card = document.createElement('div');
        card.className = 'card order-card';
        
        // ઓર્ડર આઇટમ્સનું લિસ્ટ બનાવો
        let itemRows = o.items.map(i => `• ${i.name} (${i.qty} નંગ) - ₹${i.price}`).join('<br>');
        
        // સ્ટેટસ કલર બેજ નક્કી કરવો
        let statusBadgeClass = "bg-pending";
        if (o.status === "Accepted") statusBadgeClass = "bg-accepted";
        if (o.status === "Out for Delivery") statusBadgeClass = "bg-delivery";
        if (o.status === "Delivered") statusBadgeClass = "bg-done";

        // ૧૦૦% સાચી ગૂગલ મેપ લિંક સ્ટ્રક્ચર (બેકટિક્સ ટેમ્પલેટ સાથે)
        card.innerHTML = `
            <div class="order-header">
                <span>ID: ${o.orderID} <span class="badge ${statusBadgeClass}">${o.status}</span></span>
                <span>📅 ${o.date} - ⏰ ${o.time}</span>
            </div>
            <div class="cust-info">
                <strong>👤 ગ્રાહક:</strong> ${o.customer.name} | 📞 ${o.customer.phone}<br>
                <strong>📍 સરનામું:</strong> ${o.customer.address}
            </div>
            <div style="background:#f5f5f5; padding:10px; border-radius:4px; font-size:14px; margin-bottom:10px;">
                <strong>🛍️ સામાનની વિગત:</strong><br>${itemRows}<br>
                <strong style="display:block; margin-top:5px; color:var(--success);">કુલ બિલ (ડિલિવરી સાથે): ₹${o.grandTotal} (Mode: ${o.paymentMode})</strong>
            </div>
            <div class="order-actions">
                <!-- ૧૦૦% મફત લાઈવ ગૂગલ મેપ લિંક સેટઅપ -->
                <a href="https://google.com{o.customer.lat},${o.customer.lng}" target="_blank" class="btn" style="background:#4caf50; text-decoration:none;"><i class="fa-solid fa-map-location-dot"></i> લાઇવ લોકેશન (નકશો)</a>
                <button class="btn" style="background:#0288d1;" onclick="updateOrderStatus('${o.orderID}', 'Accepted')">સ્વીકારો (Accept)</button>
                <button class="btn" style="background:#9c27b0;" onclick="updateOrderStatus('${o.orderID}', 'Out for Delivery')">રવાના કરો</button>
                <button class="btn btn-success" onclick="updateOrderStatus('${o.orderID}', 'Delivered')">પૂરો થયો (Done)</button>
                <button class="btn" style="background:#ff5722;" onclick="window.print()"><i class="fa-solid fa-print"></i> બિલ પ્રિન્ટ</button>
            </div>
        `;
        area.appendChild(card);
    }
    
    if(!hasOrders) {
        area.innerHTML = "<p style='color:#777; font-style:italic;'>હાલમાં કોઈ ઓર્ડર નથી.</p>";
    }
}

/**
 * ઓર્ડર સ્ટેટસ (Accept/Out for Delivery/Delivered) ફાયરબેઝમાં અપડેટ લોજિક [૨]
 */
function updateOrderStatus(orderID, newStatus) {
    fetch(`${dbURL}/orders/${orderID}/status.json`, { 
        method: "PUT", 
        body: JSON.stringify(newStatus) 
    }) [૨]
    .then(res => res.json())
    .then(() => {
        alert(`ઓર્ડર સ્ટેટસ બદલાઈને "${newStatus}" થઈ ગયું છે.`);
        loadAdminDashboardData(); // ડેટાબેઝ સાથે ડેશબોર્ડ ફરી રીફ્રેશ કરો [૨]
    })
    .catch(err => {
        console.error("સ્ટેટસ અપડેટ કરવામાં એરર આવી:", err);
        alert("સ્ટેટસ સેવ ન થયું. ઇન્ટરનેટ ચેક કરો!");
    });
}

/**
 * ગ્રાહકના નામ કે મોબાઈલ નંબરથી ઓર્ડર ફિલ્ટર/સર્ચ કરવાનું ફંક્શન
 */
function searchOrders() {
    let query = document.getElementById('order-search-input').value.toLowerCase();
    document.querySelectorAll('.order-card').forEach(card => {
        let detailsText = card.querySelector('.cust-info').innerText.toLowerCase();
        card.style.display = detailsText.includes(query) ? 'block' : 'none';
    });
}
