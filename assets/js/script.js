console.log("SCRIPT LOADED ✓");

var map = L.map('map', {
    fullscreenControl: true
}).setView([-5.42, 105.27], 12);

var baseOSM = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19
}).addTo(map);

var baseDark = L.tileLayer(
    'https://tiles.stadiamaps.com/tiles/alidade_dark/{z}/{x}/{y}{r}.png',
    { maxZoom: 19 }
);

var kecamatanLayer = L.geoJSON(null, {
    style: function () {
        return {
            color: "#1b4332",
            weight: 1,
            fillColor: "#74c69d",
            fillOpacity: 0.5
        };
    },
    onEachFeature: function(feature, layer) {

        layer.bindPopup(`
            <div class="p-2">
                <h1 class="text-lg font-bold text-green-700">${feature.properties.NAMOBJ}</h1>
            </div>
        `);

        layer.on("mouseover", function() {
            this.setStyle({ fillOpacity: 0.8 });
        });
        layer.on("mouseout", function() {
            this.setStyle({ fillOpacity: 0.5 });
        });
    }
});

fetch("data/kecamatanbalam.geojson")
    .then(res => res.json())
    .then(json => {
        kecamatanLayer.addTo(map);
        kecamatanLayer.addData(json);
        console.log("Kecamatan loaded ✓");
    })
    .catch(err => console.error("ERROR kecamatan:", err));


var iconKantor = L.icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/535/535239.png",
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -30]
});

var kantorLayer = L.geoJSON(null, {
    pointToLayer: function(feature, latlng) {
        return L.marker(latlng, { icon: iconKantor });
    },
    onEachFeature: function(feature, layer) {

        layer.bindPopup(`
            <div class="p-2">
                <h1 class="text-orange-700 font-bold text-lg">${feature.properties.nama}</h1>
                <p><b>Lokasi:</b> ${feature.properties.lokasi}</p>
                <p><b>ID:</b> ${feature.properties.id}</p>
            </div>
        `);

        let li = document.createElement("li");
        li.className = "p-2 bg-gray-100 hover:bg-orange-200 rounded cursor-pointer";
        li.innerHTML = feature.properties.nama;

        li.onclick = function() {
            map.setView(layer.getLatLng(), 16);
            layer.openPopup();
        };

        document.getElementById("sidebarList").appendChild(li);
    }
});

fetch("data/poinkantorpos.geojson")
    .then(res => res.json())
    .then(json => {
        kantorLayer.addTo(map);
        kantorLayer.addData(json);
        console.log("Kantor Pos loaded ✓");
    })
    .catch(err => console.error("ERROR kantorpos:", err));


L.control.layers(
    {
        "OpenStreetMap": baseOSM,
        "Dark Mode": baseDark
    },
    {
        "Kecamatan": kecamatanLayer,
        "Kantor Pos": kantorLayer
    }
).addTo(map);


L.Control.geocoder().addTo(map);
