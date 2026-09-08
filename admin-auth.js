/* ==========================================================================
   🔒 એડમિન સિક્યોરિટી અને મફત પાસવર્ડ વેરીફિકેશન લોજિક
   ========================================================================== */

// શરૂઆતમાં કંટ્રોલ રૂમ છુપાયેલો રાખવો
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById('admin-panel-content').style.display = 'none';
    document.getElementById('login-screen').style.display = 'block';
    
    // પાસવર્ડ ઇનપુટમાં 'Enter' કી દબાવવાથી પણ લોગિન થાય તેવું કંટ્રોલ
    const passwordField = document.getElementById('admin-password-field');
    if (passwordField) {
        passwordField.addEventListener("keypress", (event) => {
            if (event.key === "Enter") {
                verifyAdminLogin();
            }
        });
    }
});

/**
 * પાસવર્ડ ચેક કરવાનું મુખ્ય ફંક્શન
 */
function verifyAdminLogin() {
    const passwordInput = document.getElementById('admin-password-field');
    if (!passwordInput) return;
    
    let enteredPassword = passwordInput.value;

    // ૧૦૦% મફત બ્રાઉઝર-લેવલ સિક્રેટ પાસવર્ડ
    if (enteredPassword === "krishna@123") {
        // લોગિન સ્ક્રીન છુપાવો અને મુખ્ય કંટ્રોલ પેનલ બતાવો
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('admin-panel-content').style.display = 'block';
        
        // સેન્ડર એલર્ટ
        console.log("Admin Authentication Successful! Access Granted.");
        
        // પ્રોડક્ટ્સ, નિયમો અને લાઈવ ઓર્ડર્સનો ડેટા લોડ કરો (બીજી ફાઇલોમાંથી)
        if (typeof loadAdminDashboardData === "function") {
            loadAdminDashboardData();
        }
    } else {
        alert("❌ ખોટો પાસવર્ડ! કૃપા કરીને સાચો પાસવર્ડ નાખો.");
        passwordInput.value = ""; // બોક્સ ખાલી કરો
        passwordInput.focus();
    }
}

/**
 * એડમિન લોગઆઉટ ફંક્શન
 */
function logoutAdmin() {
    if (confirm("શું તમે એડમિન પેનલમાંથી લોગઆઉટ કરવા માંગો છો?")) {
        // આખું પેજ રીલોડ કરીને લોગિન સ્ક્રીન પર પાછા મોકલો
        location.reload();
    }
}
