console.log("WebGIS Script Initialized - Unified Version");

// =========================================
// 1. INISIALISASI PETA & BASE LAYERS
// =========================================

// Default View (Bandar Lampung)
const defaultView = {
    lat: -5.42,
    lng: 105.27,
    zoom: 12
};

var map = L.map('map', {
    fullscreenControl: true,
    zoomControl: true
}).setView([defaultView.lat, defaultView.lng], defaultView.zoom);

var baseOSM = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

var baseDark = L.tileLayer(
    'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        subdomains: 'abcd',
        errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    }
);

// =========================================
// 2. VARIABEL GLOBAL & STATE
// =========================================

// State untuk fitur "Near Me"
let isNearestFilterActive = false;
var userLocationMarker = null;
var userLocationAccuracy = null;
var nearestOfficeLine = null;

// SVG Icons untuk UI Tombol
const resetIconSVG = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>`;
const nearMeIconSVG = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 11c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 2v2m0 16v2m10-10h-2M4 12H2m15.364-7.364l-1.414 1.414M7.05 16.95l-1.414 1.414m0-11.314L7.05 7.05m8.486 8.486l1.414 1.414"></path></svg>`;

// =========================================
// 3. LAYER KECAMATAN
// =========================================

var kecamatanLayer = L.geoJSON(null, {
    style: function () {
        return {
            color: "#FF6B35",
            weight: 2,
            fillColor: "#FFD23F",
            fillOpacity: 0.15,
            dashArray: '8, 4'
        };
    },
    onEachFeature: function (feature, layer) {
        layer.bindPopup(`
            <div style="padding: 20px; min-width: 250px; background: rgba(26, 26, 46, 0.95); color: white; border: 2px solid #FF6B35; border-radius: 16px;">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                    <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #FF6B35, #FFD23F); border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 20px rgba(255, 107, 53, 0.5);">
                        <svg style="width: 24px; height: 24px; color: white;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                        </svg>
                    </div>
                    <div>
                        <h1 style="font-size: 18px; font-weight: 700; color: #FFD23F; font-family: 'JetBrains Mono', monospace;">${feature.properties.NAMOBJ}</h1>
                        <p style="font-size: 11px; color: #888; font-family: 'JetBrains Mono', monospace; text-transform: uppercase;">KECAMATAN</p>
                    </div>
                </div>
                <div style="padding-top: 12px; border-top: 1px dashed rgba(255, 107, 53, 0.3);">
                    <p style="font-size: 12px; color: #aaa;">Wilayah Administrasi Bandar Lampung</p>
                </div>
            </div>
        `, { className: 'custom-popup' });

        layer.on("mouseover", function () {
            this.setStyle({ fillOpacity: 0.3, weight: 3, color: "#FFD23F" });
        });
        layer.on("mouseout", function () {
            this.setStyle({ fillOpacity: 0.15, weight: 2, color: "#FF6B35" });
        });
    }
});

fetch("api/kecamatan.php")
    .then(res => res.json())
    .then(json => {
        kecamatanLayer.addTo(map);
        kecamatanLayer.addData(json);
        console.log("Kecamatan data loaded");
    })
    .catch(err => console.error("Error loading kecamatan data:", err));

// =========================================
// 4. LAYER KANTOR POS
// =========================================

var iconKantor = L.divIcon({
    className: 'custom-marker-icon',
    html: `<div style="width: 56px; height: 56px; background: linear-gradient(135deg, #FF6B35, #FF8C61); border: 3px solid #FFD23F; border-radius: 12px; box-shadow: 0 0 25px rgba(255, 107, 53, 0.6), 0 0 50px rgba(255, 210, 63, 0.3); display: flex; align-items: center; justify-content: center; position: relative; transform: rotate(-5deg);">
        <svg style="width: 32px; height: 32px; transform: rotate(5deg);" fill="white" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
        <div style="position: absolute; width: 120%; height: 120%; border-radius: 12px; border: 2px solid #FFD23F; animation: pulse 2s infinite; opacity: 0.5; top: -10%; left: -10%;"></div>
    </div>`,
    iconSize: [56, 56],
    iconAnchor: [28, 56],
    popupAnchor: [0, -56]
});

var kantorLayer = L.geoJSON(null, {
    pointToLayer: function (feature, latlng) {
        return L.marker(latlng, { icon: iconKantor });
    },
    onEachFeature: function (feature, layer) {
        // Popup Content (Singkat untuk keterbacaan kode, isinya sama seperti sebelumnya)
        var popupContent = `
            <div style="padding: 24px; min-width: 320px; background: rgba(26, 26, 46, 0.95); color: white; border: 2px solid #FF6B35; border-radius: 16px; box-shadow: 0 0 40px rgba(255, 107, 53, 0.4);">
                <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 2px dashed rgba(255, 107, 53, 0.3);">
                    <div style="width: 56px; height: 56px; background: linear-gradient(135deg, #FF6B35, #FFD23F); border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                        <svg style="width: 32px; height: 32px;" fill="white" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                    </div>
                    <div style="flex: 1;">
                        <h1 style="font-size: 18px; font-weight: 700; color: #FFD23F; margin-bottom: 4px; font-family: 'JetBrains Mono', monospace;">${feature.properties.nama}</h1>
                        <p style="font-size: 11px; color: #888; font-family: 'JetBrains Mono', monospace;">ID: ${feature.properties.fid || feature.properties.id}</p>
                    </div>
                </div>
                <div style="margin-bottom: 20px; padding: 12px; background: rgba(255, 107, 53, 0.1); border-left: 4px solid #FF6B35; border-radius: 8px;">
                     <strong style="color: #FFD23F; display: block; margin-bottom: 4px;">Lokasi</strong>
                     <span style="font-size: 13px; color: #ccc;">${feature.properties.lokasi}</span>
                </div>
                <div style="display: flex; gap: 10px; margin-top: 15px;">
                    <button onclick="editMarker(${feature.properties.fid || feature.properties.id})" style="flex: 1; background: #004E89; color: white; padding: 10px; border-radius: 8px; border:none; cursor:pointer;">EDIT</button>
                    <button onclick="deleteMarker(${feature.properties.fid || feature.properties.id})" style="flex: 1; background: #DC2626; color: white; padding: 10px; border-radius: 8px; border:none; cursor:pointer;">HAPUS</button>
                </div>
            </div>`;

        layer.bindPopup(popupContent, { className: 'custom-popup', maxWidth: 350 });
        addToSidebar(feature, layer);
    }
});

function addToSidebar(feature, layer) {
    let li = document.createElement("li");
    li.className = "list-item p-4 rounded-lg cursor-pointer fade-in";
    li.setAttribute('data-nama', feature.properties.nama.toLowerCase());
    li.setAttribute('data-lokasi', feature.properties.lokasi.toLowerCase());

    li.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
            <div class="list-item-icon">
                <svg style="width: 24px; height: 24px; color: white;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
            </div>
            <div style="flex: 1; min-width: 0;">
                <h3 style="font-weight: 600; color: white; font-size: 14px; margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: 'Space Grotesk', sans-serif;">${feature.properties.nama}</h3>
                <p style="font-size: 11px; color: #888; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: 'JetBrains Mono', monospace;">${feature.properties.lokasi}</p>
            </div>
        </div>
    `;

    li.onclick = function () {
        map.setView(layer.getLatLng(), 16);
        layer.openPopup();
        li.style.boxShadow = '0 0 30px rgba(255, 107, 53, 0.6)';
        setTimeout(() => { li.style.boxShadow = ''; }, 300);
    };

    document.getElementById("sidebarList").appendChild(li);
}

function loadKantorPos() {
    const loadingIndicator = document.getElementById("loadingIndicator");
    if (loadingIndicator) loadingIndicator.classList.remove("hidden");

    fetch("api/kantorpos.php")
        .then(res => res.json())
        .then(json => {
            kantorLayer.clearLayers();
            document.getElementById("sidebarList").innerHTML = ""; // Clear sidebar
            kantorLayer.addData(json);

            // Update Count
            let count = 0;
            kantorLayer.eachLayer(() => count++);
            document.getElementById("totalKantor").textContent = count;

            if (loadingIndicator) loadingIndicator.classList.add("hidden");
            console.log("Kantor Pos data loaded");
        })
        .catch(err => {
            console.error("Error loading kantorpos:", err);
            if (loadingIndicator) loadingIndicator.classList.add("hidden");
        });
}

loadKantorPos();

// =========================================
// 5. CONTROLS (Layer, Search)
// =========================================

L.control.layers(
    { "OpenStreetMap": baseOSM, "Dark Mode": baseDark },
    { "Kecamatan": kecamatanLayer, "Kantor Pos": kantorLayer },
    {
        position: 'topright',
        collapsed: false
    },
).addTo(map);

L.Control.geocoder({
    position: 'topleft',
    placeholder: 'Cari lokasi...',
    defaultMarkGeocode: false
}).on('markgeocode', function (e) {
    map.fitBounds(e.geocode.bbox);
}).addTo(map);

const searchInput = document.getElementById("searchInput");
if (searchInput) {
    searchInput.addEventListener("input", function (e) {
        const searchTerm = e.target.value.toLowerCase();
        const items = document.querySelectorAll("#sidebarList li");
        items.forEach(item => {
            const nama = item.getAttribute("data-nama");
            const lokasi = item.getAttribute("data-lokasi");
            item.style.display = (nama.includes(searchTerm) || lokasi.includes(searchTerm)) ? "" : "none";
        });
    });
}

// =========================================
// 6. FITUR "NEAR ME" (GABUNGAN)
// =========================================

// Fungsi Pembersih Super Agresif (Dari index.php)
function clearNearMeLayers() {
    // 1. Hapus Layer Variabel Global
    if (userLocationMarker) {
        map.removeLayer(userLocationMarker);
        userLocationMarker = null;
    }
    if (userLocationAccuracy) {
        map.removeLayer(userLocationAccuracy);
        userLocationAccuracy = null;
    }
    if (nearestOfficeLine) {
        map.removeLayer(nearestOfficeLine);
        nearestOfficeLine = null;
    }

    // 2. Hapus Circle/Path "Bandel" (Menggunakan loop & DOM)
    map.eachLayer(function (layer) {
        if (layer instanceof L.Circle || layer instanceof L.CircleMarker) {
            map.removeLayer(layer);
        }
    });

    // 3. Hapus Paksa elemen SVG jika masih ada (Brute force)
    const paths = document.querySelectorAll('path.leaflet-interactive');
    paths.forEach(path => {
        const stroke = path.getAttribute('stroke');
        const fill = path.getAttribute('fill');
        if (stroke === '#0EA5E9' || fill === '#0EA5E9') { // Warna biru default
            path.remove();
        }
    });
}

function findNearestOffice(userLatLng) {
    var nearestLayer = null;
    var minDistance = Infinity;

    kantorLayer.eachLayer(function (layer) {
        if (typeof layer.getLatLng !== "function") return;
        var distance = userLatLng.distanceTo(layer.getLatLng());
        if (distance < minDistance) {
            minDistance = distance;
            nearestLayer = layer;
        }
    });

    return (nearestLayer && isFinite(minDistance)) ? { layer: nearestLayer, distance: minDistance } : null;
}

function formatDistance(meters) {
    return (meters >= 1000) ? (meters / 1000).toFixed(2) + " km" : Math.round(meters) + " m";
}

// Fungsi utama mencari lokasi
function locateNearestOffice() {
    if (!navigator.geolocation) {
        showNotification("Browser tidak mendukung geolokasi.", "error");
        return;
    }

    const loading = document.getElementById('loadingIndicator');
    if (loading) loading.classList.remove('hidden');

    // UI Update: Tombol jadi "Loading" atau disable sementara
    showNotification("Mencari lokasi Anda...", "info");

    navigator.geolocation.getCurrentPosition(
        function (position) {
            // BERSIHKAN DULU
            clearNearMeLayers();

            if (loading) loading.classList.add('hidden');

            var userLatLng = L.latLng(position.coords.latitude, position.coords.longitude);
            var accuracy = position.coords.accuracy || 0;

            // 1. Marker User Custom (Pulse Animation dari index.php)
            var userIcon = L.divIcon({
                className: 'custom-user-marker',
                html: `<div style="
                    width: 20px; height: 20px; background: #3B82F6; 
                    border: 3px solid white; border-radius: 50%; 
                    box-shadow: 0 0 10px rgba(0,0,0,0.5); animation: pulse 2s infinite;">
                   </div>`,
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            });

            userLocationMarker = L.marker(userLatLng, { icon: userIcon }).addTo(map);
            userLocationMarker.bindPopup("<b>Posisi Anda</b>").openPopup();

            // 2. Lingkaran Akurasi
            if (accuracy > 0) {
                userLocationAccuracy = L.circle(userLatLng, {
                    radius: accuracy,
                    color: "#0EA5E9",
                    weight: 1,
                    fillColor: "#0EA5E9",
                    fillOpacity: 0.15
                }).addTo(map);
            }

            // 3. Cari Kantor Terdekat
            var result = findNearestOffice(userLatLng);
            if (!result) {
                showNotification("Tidak dapat menemukan kantor pos terdekat.", "error");
                return;
            }

            // 4. Gambar Garis
            nearestOfficeLine = L.polyline([userLatLng, result.layer.getLatLng()], {
                color: "#0EA5E9",
                weight: 3,
                dashArray: "6,4",
                opacity: 0.8
            }).addTo(map);

            // 5. Zoom Fit
            map.fitBounds(L.latLngBounds([userLatLng, result.layer.getLatLng()]).pad(0.5));
            result.layer.openPopup();

            // 6. Notifikasi & UI Update
            var officeName = result.layer.feature.properties.nama;
            showNotification(`Terdekat: ${officeName} (${formatDistance(result.distance)})`, "success");

            // UPDATE TOMBOL MENJADI "LEPAS FILTER" (MERAH)
            const btnNearMe = document.getElementById("btnNearMe");
            const btnText = document.getElementById("btnNearMeText");
            const btnIcon = document.getElementById("btnNearMeIcon");

            if (btnNearMe) {
                btnNearMe.classList.add('active');
                if (btnText) btnText.innerText = "Lepas Filter";
                if (btnIcon) btnIcon.innerHTML = resetIconSVG;
            }
            isNearestFilterActive = true;
        },
        function (error) {
            if (loading) loading.classList.add('hidden');
            showNotification("Gagal mendapatkan lokasi. Pastikan GPS aktif.", "error");
            resetNearMeMode(); // Reset tombol jika gagal
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
}

// Fungsi Reset (Kembali ke awal)
function resetNearMeMode() {
    clearNearMeLayers();
    map.flyTo([defaultView.lat, defaultView.lng], defaultView.zoom);

    // Reset UI Tombol
    const btnNearMe = document.getElementById("btnNearMe");
    const btnText = document.getElementById("btnNearMeText");
    const btnIcon = document.getElementById("btnNearMeIcon");

    if (btnNearMe) {
        btnNearMe.classList.remove('active');
        if (btnText) btnText.innerText = "Kantor Pos Terdekat";
        if (btnIcon) btnIcon.innerHTML = nearMeIconSVG;
    }

    // Reset Search
    if (searchInput) {
        searchInput.value = '';
        searchInput.dispatchEvent(new Event('input'));
    }

    isNearestFilterActive = false;
}

// EVENT LISTENER TOMBOL UTAMA
const btnNearMe = document.getElementById("btnNearMe");
if (btnNearMe) {
    btnNearMe.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();

        if (isNearestFilterActive) {
            resetNearMeMode();
        } else {
            locateNearestOffice();
        }
    });
}

// =========================================
// 7. CRUD MARKER (ADD, EDIT, DELETE)
// =========================================

// --- A. TAMBAH MARKER ---
var isAddingMarker = false;
var tempMarker = null;
var wasKecamatanVisible = false;

const btnAddMarker = document.getElementById("btnAddMarker");
if (btnAddMarker) {
    btnAddMarker.addEventListener("click", function () {
        if (isAddingMarker) {
            cancelAddMarkerMode();
            showNotification("Mode tambah marker dibatalkan", "info");
        } else {
            isAddingMarker = true;
            this.innerHTML = `<span class="text-xl">×</span><span class="font-mono uppercase tracking-wider">Batal</span>`;
            this.style.background = "linear-gradient(135deg, #DC2626 0%, #EF4444 100%)";

            // Sembunyikan kecamatan biar gampang klik
            wasKecamatanVisible = map.hasLayer(kecamatanLayer);
            if (wasKecamatanVisible) map.removeLayer(kecamatanLayer);

            showNotification("Klik di peta untuk menambahkan lokasi", "info");
            map.on('click', handleMapClick);
        }
    });
}

var currentCoordinates = null;
function handleMapClick(e) {
    if (!isAddingMarker) return;

    var lat = e.latlng.lat;
    var lng = e.latlng.lng;
    currentCoordinates = [lng, lat];

    if (tempMarker) map.removeLayer(tempMarker);
    tempMarker = L.marker([lat, lng], { icon: iconKantor, opacity: 0.7 }).addTo(map);

    map.setView([lat, lng], 15);

    // Tampilkan Modal Tambah
    document.getElementById("formAddMarker").reset();
    document.getElementById("inputPassword").value = "";
    document.getElementById("modalAddMarker").classList.add("active");
}

function cancelAddMarkerMode() {
    isAddingMarker = false;
    const btn = document.getElementById("btnAddMarker");
    if (btn) {
        btn.innerHTML = `<span class="text-xl">+</span><span class="font-mono uppercase tracking-wider">Tambah Marker</span>`;
        btn.style.background = "linear-gradient(135deg, #FF6B35 0%, #FF8C61 100%)";
    }
    map.off('click', handleMapClick);

    if (wasKecamatanVisible && !map.hasLayer(kecamatanLayer)) {
        kecamatanLayer.addTo(map);
    }
    if (tempMarker) {
        map.removeLayer(tempMarker);
        tempMarker = null;
    }
}

// Handle Submit Tambah Marker
const formAdd = document.getElementById("formAddMarker");
if (formAdd) {
    formAdd.addEventListener("submit", function (e) {
        e.preventDefault();
        var nama = document.getElementById("inputNama").value.trim();
        var lokasi = document.getElementById("inputLokasi").value.trim();
        var password = document.getElementById("inputPassword").value.trim();

        createMarker(nama, lokasi, currentCoordinates, password);
        document.getElementById("modalAddMarker").classList.remove("active");
        cancelAddMarkerMode();
    });
}

// Handle Cancel/Close Modal Tambah
document.querySelectorAll('#modalClose, #btnCancel').forEach(el => {
    el.addEventListener('click', () => {
        document.getElementById("modalAddMarker").classList.remove("active");
        if (tempMarker) map.removeLayer(tempMarker);
    });
});

// --- B. EDIT MARKER ---
function editMarker(fid) {
    var feature = null;
    kantorLayer.eachLayer(l => {
        if (l.feature && (l.feature.properties.fid == fid || l.feature.properties.id == fid)) feature = l.feature;
    });

    if (!feature) return showNotification("Data tidak ditemukan", "error");

    document.getElementById("editFid").value = fid;
    document.getElementById("editNama").value = feature.properties.nama || "";
    document.getElementById("editLokasi").value = feature.properties.lokasi || "";
    document.getElementById("editLat").value = feature.geometry.coordinates[1];
    document.getElementById("editLng").value = feature.geometry.coordinates[0];
    document.getElementById("editPassword").value = "";

    document.getElementById("modalEditMarker").classList.add("active");
}

const formEdit = document.getElementById("formEditMarker");
if (formEdit) {
    formEdit.addEventListener("submit", function (e) {
        e.preventDefault();
        var fid = document.getElementById("editFid").value;
        var nama = document.getElementById("editNama").value;
        var lokasi = document.getElementById("editLokasi").value;
        var lat = parseFloat(document.getElementById("editLat").value);
        var lng = parseFloat(document.getElementById("editLng").value);
        var password = document.getElementById("editPassword").value;

        updateMarker(fid, nama, lokasi, [lng, lat], password);
        document.getElementById("modalEditMarker").classList.remove("active");
    });
}

document.querySelectorAll('#modalEditClose, #btnEditCancel').forEach(el => {
    el.addEventListener('click', () => document.getElementById("modalEditMarker").classList.remove("active"));
});


// --- C. DELETE MARKER ---
window.currentDeleteFid = null;
function deleteMarker(fid) {
    window.currentDeleteFid = fid;
    document.getElementById("deletePassword").value = "";
    document.getElementById("modalDeleteMarker").classList.add("active");
}

document.getElementById("btnDeleteConfirm").addEventListener("click", function () {
    var password = document.getElementById("deletePassword").value;
    performDeleteMarker(window.currentDeleteFid, password);
    document.getElementById("modalDeleteMarker").classList.remove("active");
});

document.querySelectorAll('#modalDeleteClose, #btnDeleteCancel').forEach(el => {
    el.addEventListener('click', () => document.getElementById("modalDeleteMarker").classList.remove("active"));
});


// =========================================
// 8. API REQUESTS (AJAX)
// =========================================

function createMarker(nama, lokasi, coordinates, password) {
    fetch("api/kantorpos.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama, lokasi, coordinates, password })
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                showNotification("Berhasil menambah data!", "success");
                loadKantorPos();
            } else {
                showNotification(data.message || "Gagal", "error");
            }
        });
}

function updateMarker(fid, nama, lokasi, coordinates, password) {
    fetch("api/kantorpos.php", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fid, nama, lokasi, coordinates, password })
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                showNotification("Data berhasil diupdate!", "success");
                loadKantorPos();
            } else {
                showNotification(data.message || "Gagal", "error");
            }
        });
}

function performDeleteMarker(fid, password) {
    fetch("api/kantorpos.php", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fid, password })
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                showNotification("Data berhasil dihapus!", "success");
                loadKantorPos();
            } else {
                showNotification(data.message || "Gagal", "error");
            }
        });
}

// =========================================
// 9. HELPER UI
// =========================================

function showNotification(message, type = "info") {
    const existing = document.querySelector(".notification-custom");
    if (existing) existing.remove();

    const colors = {
        success: { border: "#10B981", icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>` },
        error: { border: "#EF4444", icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>` },
        info: { border: "#3B82F6", icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>` }
    };

    const color = colors[type] || colors.info;
    const notification = document.createElement("div");
    notification.className = "notification-custom fixed top-24 right-6 text-white px-6 py-4 rounded-lg shadow-lg z-50 fade-in";
    notification.style.cssText = `background: rgba(26, 26, 46, 0.95); border: 2px solid ${color.border}; backdrop-filter: blur(20px); display: flex; align-items: center; gap: 12px;`;
    notification.innerHTML = `<div style="color: ${color.border};">${color.icon}</div><span>${message}</span>`;

    document.body.appendChild(notification);
    setTimeout(() => { notification.remove(); }, 4000);
}

// Global functions untuk onclick di HTML string popup
window.editMarker = editMarker;
window.deleteMarker = deleteMarker;