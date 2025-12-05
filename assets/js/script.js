console.log("WebGIS Script Initialized");

var map = L.map('map', {
    fullscreenControl: true,
    zoomControl: true
}).setView([-5.42, 105.27], 12);

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
    onEachFeature: function(feature, layer) {
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
        `, {
            className: 'custom-popup'
        });

        layer.on("mouseover", function() {
            this.setStyle({ 
                fillOpacity: 0.3,
                weight: 3,
                color: "#FFD23F"
            });
        });
        layer.on("mouseout", function() {
            this.setStyle({ 
                fillOpacity: 0.15,
                weight: 2,
                color: "#FF6B35"
            });
        });
    }
});

fetch("api/kecamatan.php")
    .then(res => res.json())
    .then(json => {
        kecamatanLayer.addTo(map);
        kecamatanLayer.addData(json);
        console.log("Kecamatan data loaded successfully");
    })
    .catch(err => console.error("Error loading kecamatan data:", err));

var iconKantor = L.divIcon({
    className: 'custom-marker-icon',
    html: `<div style="
        width: 56px; 
        height: 56px; 
        background: linear-gradient(135deg, #FF6B35, #FF8C61);
        border: 3px solid #FFD23F;
        border-radius: 12px;
        box-shadow: 0 0 25px rgba(255, 107, 53, 0.6), 0 0 50px rgba(255, 210, 63, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        transform: rotate(-5deg);
    ">
        <svg style="width: 32px; height: 32px; transform: rotate(5deg);" fill="white" viewBox="0 0 24 24">
            <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
        </svg>
        <div style="
            position: absolute;
            width: 120%;
            height: 120%;
            border-radius: 12px;
            border: 2px solid #FFD23F;
            animation: pulse 2s infinite;
            opacity: 0.5;
            top: -10%;
            left: -10%;
        "></div>
    </div>`,
    iconSize: [56, 56],
    iconAnchor: [28, 56],
    popupAnchor: [0, -56]
});

var kantorLayer = L.geoJSON(null, {
    pointToLayer: function(feature, latlng) {
        return L.marker(latlng, { icon: iconKantor });
    },
    onEachFeature: function(feature, layer) {
        // Popup design profesional dengan dark theme
        var popupContent = `
            <div style="padding: 24px; min-width: 320px; background: rgba(26, 26, 46, 0.95); color: white; border: 2px solid #FF6B35; border-radius: 16px; box-shadow: 0 0 40px rgba(255, 107, 53, 0.4);">
                <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 2px dashed rgba(255, 107, 53, 0.3);">
                    <div style="width: 56px; height: 56px; background: linear-gradient(135deg, #FF6B35, #FFD23F); border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 30px rgba(255, 107, 53, 0.5);">
                        <svg style="width: 32px; height: 32px;" fill="white" viewBox="0 0 24 24">
                            <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                        </svg>
                    </div>
                    <div style="flex: 1;">
                        <h1 style="font-size: 18px; font-weight: 700; color: #FFD23F; margin-bottom: 4px; font-family: 'JetBrains Mono', monospace;">${feature.properties.nama}</h1>
                        <p style="font-size: 11px; color: #888; font-family: 'JetBrains Mono', monospace;">ID: ${feature.properties.fid || feature.properties.id}</p>
                    </div>
                </div>
                
                <div style="margin-bottom: 20px; padding: 12px; background: rgba(255, 107, 53, 0.1); border-left: 4px solid #FF6B35; border-radius: 8px;">
                    <div style="display: flex; align-items: start; gap: 10px; font-size: 13px; color: #ccc;">
                        <svg style="width: 18px; height: 18px; color: #FF6B35; margin-top: 2px; flex-shrink: 0;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        </svg>
                        <div>
                            <strong style="color: #FFD23F; display: block; margin-bottom: 4px;">Lokasi</strong>
                            <span>${feature.properties.lokasi}</span>
                        </div>
                    </div>
                </div>
                
                <div style="margin-bottom: 16px;">
                    <button onclick="openLocationDetail(${feature.properties.fid || feature.properties.id})" 
                            style="width: 100%; background: linear-gradient(135deg, #FF6B35, #FF8C61); border: 2px solid #FF6B35; color: white; padding: 12px; border-radius: 10px; font-weight: 600; font-size: 13px; cursor: pointer; transition: all 0.3s; font-family: 'Space Grotesk', sans-serif; box-shadow: 0 4px 15px rgba(255, 107, 53, 0.4); display: flex; align-items: center; justify-content: center; gap: 8px;"
                            onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 25px rgba(255, 107, 53, 0.6)'"
                            onmouseout="this.style.transform=''; this.style.boxShadow='0 4px 15px rgba(255, 107, 53, 0.4)'">
                        <svg style="width: 18px; height: 18px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                        </svg>
                        <span>LIHAT DETAIL</span>
                    </button>
                </div>
                
                <div style="display: flex; gap: 10px;">
                    <button onclick="editMarker(${feature.properties.fid || feature.properties.id})" 
                            style="flex: 1; background: linear-gradient(135deg, #004E89, #0066CC); border: 2px solid #004E89; color: white; padding: 12px; border-radius: 10px; font-weight: 600; font-size: 12px; cursor: pointer; transition: all 0.3s; font-family: 'JetBrains Mono', monospace; box-shadow: 0 4px 15px rgba(0, 78, 137, 0.4); display: flex; align-items: center; justify-content: center; gap: 6px;"
                            onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 25px rgba(0, 78, 137, 0.6)'"
                            onmouseout="this.style.transform=''; this.style.boxShadow='0 4px 15px rgba(0, 78, 137, 0.4)'">
                        <svg style="width: 16px; height: 16px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                        <span>EDIT</span>
                    </button>
                    <button onclick="deleteMarker(${feature.properties.fid || feature.properties.id})" 
                            style="flex: 1; background: linear-gradient(135deg, #DC2626, #EF4444); border: 2px solid #DC2626; color: white; padding: 12px; border-radius: 10px; font-weight: 600; font-size: 12px; cursor: pointer; transition: all 0.3s; font-family: 'JetBrains Mono', monospace; box-shadow: 0 4px 15px rgba(220, 38, 38, 0.4); display: flex; align-items: center; justify-content: center; gap: 6px;"
                            onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 25px rgba(220, 38, 38, 0.6)'"
                            onmouseout="this.style.transform=''; this.style.boxShadow='0 4px 15px rgba(220, 38, 38, 0.4)'">
                        <svg style="width: 16px; height: 16px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                        <span>HAPUS</span>
                    </button>
                </div>
            </div>
        `;
        
        layer.bindPopup(popupContent, {
            className: 'custom-popup',
            maxWidth: 350
        });
        
        // Tambahkan ke sidebar
        addToSidebar(feature, layer);
    }
});

// Fungsi untuk menambahkan item ke sidebar dengan design yang unik
function addToSidebar(feature, layer) {
        let li = document.createElement("li");
    li.className = "list-item p-4 rounded-lg cursor-pointer fade-in";
    li.setAttribute('data-fid', feature.properties.fid || feature.properties.id);
    li.setAttribute('data-nama', feature.properties.nama.toLowerCase());
    li.setAttribute('data-lokasi', feature.properties.lokasi.toLowerCase());
    
    li.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
            <div class="list-item-icon">
                <svg style="width: 24px; height: 24px; color: white;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                </svg>
            </div>
            <div style="flex: 1; min-width: 0;">
                <h3 style="font-weight: 600; color: white; font-size: 14px; margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: 'Space Grotesk', sans-serif;">
                    ${feature.properties.nama}
                </h3>
                <p style="font-size: 11px; color: #888; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: 'JetBrains Mono', monospace;">
                    ${feature.properties.lokasi}
                </p>
            </div>
            <svg style="width: 20px; height: 20px; color: #FF6B35; flex-shrink: 0;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
        </div>
    `;

        li.onclick = function() {
            map.setView(layer.getLatLng(), 16);
            layer.openPopup();
        
        // Highlight effect dengan glow
        li.style.boxShadow = '0 0 30px rgba(255, 107, 53, 0.6)';
        setTimeout(() => {
            li.style.boxShadow = '';
        }, 300);
        };

        document.getElementById("sidebarList").appendChild(li);
    }

function refreshSidebar() {
    const sidebarList = document.getElementById("sidebarList");
    sidebarList.innerHTML = "";
    kantorLayer.eachLayer(function(layer) {
        if (layer.feature) {
            addToSidebar(layer.feature, layer);
        }
    });
    updateTotalCount();
}

function updateTotalCount() {
    let count = 0;
    kantorLayer.eachLayer(function() {
        count++;
    });
    document.getElementById("totalKantor").textContent = count;
}

function loadKantorPos() {
    const loadingIndicator = document.getElementById("loadingIndicator");
    loadingIndicator.classList.remove("hidden");
    
    fetch("api/kantorpos.php")
    .then(res => res.json())
    .then(json => {
            kantorLayer.clearLayers();
        kantorLayer.addData(json);
            refreshSidebar();
            loadingIndicator.classList.add("hidden");
            console.log("Kantor Pos data loaded successfully");
        })
        .catch(err => {
            console.error("Error loading kantorpos data:", err);
            loadingIndicator.classList.add("hidden");
        });
}

loadKantorPos();

// Layer control sederhana dengan label yang singkat
L.control.layers(
    {
        "OpenStreetMap": baseOSM,
        "Dark Mode Map": baseDark
    },
    {
        "Kecamatan": kecamatanLayer,
        "Kantor Pos": kantorLayer
    },
    {
        position: 'topright',
        collapsed: false
    }
).addTo(map);

// Geocoder control dengan style yang lebih baik
L.Control.geocoder({
    position: 'topleft',
    placeholder: 'Cari lokasi...',
    errorMessage: 'Lokasi tidak ditemukan',
    geocoder: L.Control.Geocoder.nominatim(),
    defaultMarkGeocode: false
}).on('markgeocode', function(e) {
    map.fitBounds(e.geocode.bbox, { padding: [50, 50] });
}).addTo(map);

const searchInput = document.getElementById("searchInput");
searchInput.addEventListener("input", function(e) {
    const searchTerm = e.target.value.toLowerCase();
    const items = document.querySelectorAll("#sidebarList li");
    
    items.forEach(item => {
        const nama = item.getAttribute("data-nama");
        const lokasi = item.getAttribute("data-lokasi");
        
        if (nama.includes(searchTerm) || lokasi.includes(searchTerm)) {
            item.style.display = "";
        } else {
            item.style.display = "none";
        }
    });
});

var isAddingMarker = false;
var tempMarker = null;
var wasKecamatanVisible = false;

const btnAddMarker = document.getElementById("btnAddMarker");
btnAddMarker.addEventListener("click", function() {
    if (isAddingMarker) {
        hideAddMarkerModal();
        cancelAddMarkerMode();
        showNotification("Mode tambah marker dibatalkan", "info");
    } else {
        isAddingMarker = true;
        this.innerHTML = `
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
            <span class="font-mono uppercase tracking-wider">Batal</span>
        `;
        this.style.background = "linear-gradient(135deg, #DC2626 0%, #EF4444 100%)";
        wasKecamatanVisible = map.hasLayer(kecamatanLayer);
        
        if (map.hasLayer(kecamatanLayer)) {
            map.removeLayer(kecamatanLayer);
            showNotification("Filter kecamatan dinonaktifkan. Klik di peta untuk menambahkan marker baru", "info");
        } else {
            showNotification("Klik di peta untuk menambahkan marker baru", "info");
        }
        map.on('click', handleMapClick);
    }
});

var currentCoordinates = null;

function handleMapClick(e) {
    if (!isAddingMarker) return;
    
    var lat = e.latlng.lat;
    var lng = e.latlng.lng;
    currentCoordinates = [lng, lat];
    
    if (tempMarker) {
        map.removeLayer(tempMarker);
    }
    
    tempMarker = L.marker([lat, lng], { 
        icon: iconKantor,
        opacity: 0.7
    }).addTo(map);
    
    map.setView([lat, lng], 15);
    showAddMarkerModal();
}

function showAddMarkerModal() {
    var modal = document.getElementById("modalAddMarker");
    var form = document.getElementById("formAddMarker");
    var inputNama = document.getElementById("inputNama");
    var inputLokasi = document.getElementById("inputLokasi");
    
    form.reset();
    inputNama.focus();
    modal.classList.add("active");
}

function hideAddMarkerModal() {
    var modal = document.getElementById("modalAddMarker");
    modal.classList.remove("active");
}

function setupModal() {
    var modal = document.getElementById("modalAddMarker");
    var form = document.getElementById("formAddMarker");
    var btnClose = document.getElementById("modalClose");
    var btnCancel = document.getElementById("btnCancel");
    
    if (!modal || !form || !btnClose || !btnCancel) {
        setTimeout(setupModal, 100);
        return;
    }
    
    // Close modal ketika klik overlay
    modal.addEventListener("click", function(e) {
        if (e.target === modal) {
            cancelAddMarker();
        }
    });
    
    btnClose.addEventListener("click", cancelAddMarker);
    btnCancel.addEventListener("click", cancelAddMarker);
    
    document.addEventListener("keydown", function(e) {
        if (e.key === "Escape" && modal.classList.contains("active")) {
            cancelAddMarker();
        }
    });
    
    // Handle form submission
    form.addEventListener("submit", function(e) {
        e.preventDefault();
        
        var nama = document.getElementById("inputNama").value.trim();
        var lokasi = document.getElementById("inputLokasi").value.trim();
        
        if (!nama || !lokasi) {
            showNotification("Nama dan lokasi harus diisi", "error");
            return;
        }
        
        if (!currentCoordinates) {
            showNotification("Koordinat tidak valid", "error");
            return;
        }
        
        createMarker(nama, lokasi, currentCoordinates);
        hideAddMarkerModal();
        cancelAddMarkerMode();
    });
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupModal);
} else {
    setupModal();
}

function showEditMarkerModal() {
    var modal = document.getElementById("modalEditMarker");
    var inputNama = document.getElementById("editNama");
    
    modal.classList.add("active");
    inputNama.focus();
}

function hideEditMarkerModal() {
    var modal = document.getElementById("modalEditMarker");
    modal.classList.remove("active");
}

function setupEditModal() {
    var modal = document.getElementById("modalEditMarker");
    var form = document.getElementById("formEditMarker");
    var btnClose = document.getElementById("modalEditClose");
    var btnCancel = document.getElementById("btnEditCancel");
    
    if (!modal || !form || !btnClose || !btnCancel) {
        setTimeout(setupEditModal, 100);
        return;
    }
    
    // Close modal ketika klik overlay
    modal.addEventListener("click", function(e) {
        if (e.target === modal) {
            hideEditMarkerModal();
        }
    });
    
    // Close modal ketika klik tombol close
    btnClose.addEventListener("click", hideEditMarkerModal);
    btnCancel.addEventListener("click", hideEditMarkerModal);
    
    // Close modal dengan tombol ESC
    document.addEventListener("keydown", function(e) {
        if (e.key === "Escape" && modal.classList.contains("active")) {
            hideEditMarkerModal();
        }
    });
    
    // Handle form submission
    form.addEventListener("submit", function(e) {
        e.preventDefault();
        
        var fid = document.getElementById("editFid").value;
        var nama = document.getElementById("editNama").value.trim();
        var lokasi = document.getElementById("editLokasi").value.trim();
        var lat = document.getElementById("editLat").value.trim();
        var lng = document.getElementById("editLng").value.trim();
        
        if (!nama || !lokasi || !lat || !lng) {
            showNotification("Semua field harus diisi", "error");
            return;
        }
        
        // Validasi koordinat
        var latNum = parseFloat(lat);
        var lngNum = parseFloat(lng);
        
        if (isNaN(latNum) || isNaN(lngNum)) {
            showNotification("Latitude dan Longitude harus berupa angka", "error");
            return;
        }
        
        if (latNum < -90 || latNum > 90) {
            showNotification("Latitude harus antara -90 dan 90", "error");
            return;
        }
        
        if (lngNum < -180 || lngNum > 180) {
            showNotification("Longitude harus antara -180 dan 180", "error");
            return;
        }
        
        // Update data ke server
        updateMarker(fid, nama, lokasi, [lngNum, latNum]);
        
        // Tutup modal
        hideEditMarkerModal();
    });
}

// Setup modal edit saat DOM ready
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupEditModal);
} else {
    setupEditModal();
}

// Fungsi untuk update marker
function updateMarker(fid, nama, lokasi, coordinates) {
    fetch("api/kantorpos.php", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            fid: fid,
            nama: nama,
            lokasi: lokasi,
            coordinates: coordinates
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showNotification("Data berhasil diupdate!", "success");
            loadKantorPos();
        } else {
            showNotification("Error: " + (data.message || "Gagal mengupdate data"), "error");
        }
    })
    .catch(err => {
        console.error("Error:", err);
        showNotification("Error: Gagal mengupdate data", "error");
    });
}

// ========== Modal Delete Marker ==========

// Variabel untuk menyimpan fid yang akan dihapus
window.currentDeleteFid = null;

// Fungsi untuk menampilkan modal konfirmasi hapus
function showDeleteMarkerModal() {
    var modal = document.getElementById("modalDeleteMarker");
    modal.classList.add("active");
}

// Fungsi untuk menyembunyikan modal konfirmasi hapus
function hideDeleteMarkerModal() {
    var modal = document.getElementById("modalDeleteMarker");
    modal.classList.remove("active");
    window.currentDeleteFid = null;
}

// Setup modal delete event listeners
function setupDeleteModal() {
    var modal = document.getElementById("modalDeleteMarker");
    var btnClose = document.getElementById("modalDeleteClose");
    var btnCancel = document.getElementById("btnDeleteCancel");
    var btnConfirm = document.getElementById("btnDeleteConfirm");
    
    if (!modal || !btnClose || !btnCancel || !btnConfirm) {
        setTimeout(setupDeleteModal, 100);
        return;
    }
    
    // Close modal ketika klik overlay
    modal.addEventListener("click", function(e) {
        if (e.target === modal) {
            hideDeleteMarkerModal();
        }
    });
    
    // Close modal ketika klik tombol close
    btnClose.addEventListener("click", hideDeleteMarkerModal);
    btnCancel.addEventListener("click", hideDeleteMarkerModal);
    
    // Close modal dengan tombol ESC
    document.addEventListener("keydown", function(e) {
        if (e.key === "Escape" && modal.classList.contains("active")) {
            hideDeleteMarkerModal();
        }
    });
    
    // Handle konfirmasi hapus
    btnConfirm.addEventListener("click", function() {
        var fid = window.currentDeleteFid;
        if (!fid) {
            showNotification("Error: ID marker tidak valid", "error");
            return;
        }
        
        // Hapus marker dari server
        performDeleteMarker(fid);
        
        // Tutup modal
        hideDeleteMarkerModal();
    });
}

// Setup modal delete saat DOM ready
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupDeleteModal);
} else {
    setupDeleteModal();
}

// Fungsi untuk menghapus marker
function performDeleteMarker(fid) {
    fetch("api/kantorpos.php", {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            fid: fid
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showNotification("Marker berhasil dihapus!", "success");
            loadKantorPos();
        } else {
            showNotification("Error: " + (data.message || "Gagal menghapus marker"), "error");
        }
    })
    .catch(err => {
        console.error("Error:", err);
        showNotification("Error: Gagal menghapus marker", "error");
    });
}

// Fungsi untuk cancel tambah marker
function cancelAddMarker() {
    hideAddMarkerModal();
    
    // Hapus marker sementara
    if (tempMarker) {
        map.removeLayer(tempMarker);
        tempMarker = null;
    }
    
    currentCoordinates = null;
}

// Fungsi untuk cancel mode tambah marker
function cancelAddMarkerMode() {
    isAddingMarker = false;
    btnAddMarker.innerHTML = `
        <span class="text-xl">+</span>
        <span class="font-mono uppercase tracking-wider">Tambah Marker</span>
    `;
    btnAddMarker.style.background = "linear-gradient(135deg, #FF6B35 0%, #FF8C61 100%)";
    map.off('click', handleMapClick);
    
    // Restore kecamatan layer jika sebelumnya visible
    if (wasKecamatanVisible && !map.hasLayer(kecamatanLayer)) {
        kecamatanLayer.addTo(map);
    }
    
    // Hapus marker sementara jika ada
    if (tempMarker) {
        map.removeLayer(tempMarker);
        tempMarker = null;
    }
    
    currentCoordinates = null;
}

// Fungsi untuk create marker
function createMarker(nama, lokasi, coordinates) {
    fetch("api/kantorpos.php", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            nama: nama,
            lokasi: lokasi,
            coordinates: coordinates
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showNotification("Marker berhasil ditambahkan!", "success");
            loadKantorPos();
            if (tempMarker) {
                map.removeLayer(tempMarker);
                tempMarker = null;
            }
        } else {
            showNotification("Error: " + (data.message || "Gagal menambahkan marker"), "error");
        }
    })
    .catch(err => {
        console.error("Error:", err);
        showNotification("Error: Gagal menambahkan marker", "error");
    });
}

// Fungsi untuk edit marker
function editMarker(fid) {
    var feature = null;
    var layer = null;
    
    kantorLayer.eachLayer(function(l) {
        if (l.feature && (l.feature.properties.fid == fid || l.feature.properties.id == fid)) {
            feature = l.feature;
            layer = l;
        }
    });
    
    if (!feature) {
        showNotification("Data tidak ditemukan", "error");
        return;
    }
    
    // Isi form dengan data yang ada
    document.getElementById("editFid").value = fid;
    document.getElementById("editNama").value = feature.properties.nama || "";
    document.getElementById("editLokasi").value = feature.properties.lokasi || "";
    
    var coords = feature.geometry.coordinates;
    document.getElementById("editLat").value = coords[1] || "";
    document.getElementById("editLng").value = coords[0] || "";
    
    // Tampilkan modal edit
    showEditMarkerModal();
}

// Fungsi untuk delete marker
function deleteMarker(fid) {
    var feature = null;
    var layer = null;
    
    kantorLayer.eachLayer(function(l) {
        if (l.feature && (l.feature.properties.fid == fid || l.feature.properties.id == fid)) {
            feature = l.feature;
            layer = l;
        }
    });
    
    if (!feature) {
        showNotification("Data tidak ditemukan", "error");
        return;
    }
    
    // Set data untuk konfirmasi hapus
    window.currentDeleteFid = fid;
    var nama = feature.properties.nama || "kantor pos ini";
    document.getElementById("deleteMessage").textContent = 
        `Apakah Anda yakin ingin menghapus "${nama}"? Tindakan ini tidak dapat dibatalkan.`;
    
    // Tampilkan modal konfirmasi hapus
    showDeleteMarkerModal();
}

// Notification function dengan style unik
function showNotification(message, type = "info") {
    const existing = document.querySelector(".notification-custom");
    if (existing) existing.remove();
    
    const colors = {
        success: { border: "#10B981", icon: `<svg style="width: 20px; height: 20px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>` },
        error: { border: "#EF4444", icon: `<svg style="width: 20px; height: 20px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>` },
        info: { border: "#3B82F6", icon: `<svg style="width: 20px; height: 20px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>` }
    };
    
    const color = colors[type] || colors.info;
    
    const notification = document.createElement("div");
    notification.className = "notification-custom fixed top-24 right-6 text-white px-6 py-4 rounded-lg shadow-lg z-50 fade-in";
    notification.style.cssText = `
        background: rgba(26, 26, 46, 0.95);
        border: 2px solid ${color.border};
        box-shadow: 0 0 30px ${color.border}50;
        backdrop-filter: blur(20px);
        font-family: 'JetBrains Mono', monospace;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 250px;
    `;
    notification.innerHTML = `
        <div style="color: ${color.border};">
            ${color.icon}
        </div>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = "0";
        notification.style.transform = "translateX(150px)";
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// Export functions ke global scope
window.editMarker = editMarker;
window.deleteMarker = deleteMarker;
