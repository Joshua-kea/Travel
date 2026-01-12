console.log("ATLAS.JS LOADED");
console.log("PLACES FRA JEKYLL:", window.places);

document.addEventListener("DOMContentLoaded", () => {

    if (!window.places || window.places.length === 0) {
        console.error("Ingen places fundet – stopper");
        return;
    }

    // =====================
    // MAP
    // =====================
    const map = L.map("map", {
        worldCopyJump: true
    }).setView([20, 0], 2);

    // VIGTIGT: uden labels (ingen kontinenter/byer)
    L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
        { attribution: "© OpenStreetMap & CARTO" }
    ).addTo(map);

    // =====================
    // DATA OPSLAG
    // =====================
    const placeByISO = {};
    window.places.forEach(p => {
        placeByISO[p.kode] = p; // kode = ISO-3 (FRA, JPN)
    });

    // =====================
    // STYLES
    // =====================
    const BASE_STYLE = {
        fillColor: "#cfd8dc",
        fillOpacity: 1,
        weight: 1,
        color: "#ffffff"
    };

    function resetStyle(layer) {
        layer.setStyle(BASE_STYLE);
    }

    // =====================
    // GEOJSON LAYER
    // =====================
    let geojsonLayer = null;

    fetch("/Test/assets/data/countries.geo.json")
        .then(res => res.json())
        .then(data => {

            geojsonLayer = L.geoJSON(data, {
                style: BASE_STYLE,

                onEachFeature: (feature, layer) => {
                    const iso = feature.id; // ISO-3 (FRA, JPN)
                    const place = placeByISO[iso];

                    if (!place) {
                        layer.setStyle({ fillOpacity: 0.25 });
                        return;
                    }

                    // klik → landeside
                    layer.on("click", () => {
                        window.location.href = place.url;
                    });

                    // hover feedback
                    layer.on("mouseover", () => {
                        layer.setStyle({ weight: 2 });
                    });

                    layer.on("mouseout", () => {
                        layer.setStyle({ weight: 1 });
                    });

                    layer.bindTooltip(place.title, { sticky: true });
                }
            }).addTo(map);
        });

    // =====================
    // FILTERE
    // =====================
    const monthSelect = document.getElementById("monthFilter");
    const tagSelect = document.getElementById("tagFilter");

    function applyFilters() {
        if (!geojsonLayer) return;

        const month = Number(monthSelect.value);
        const tag = tagSelect.value;

        // 1️⃣ RESET ALT (DET DU MANGLER)
        geojsonLayer.eachLayer(layer => {
            resetStyle(layer);
        });

        // 2️⃣ ANVEND FILTRE
        geojsonLayer.eachLayer(layer => {
            const iso = layer.feature.id;
            const place = placeByISO[iso];

            if (!place) {
                layer.setStyle({ fillOpacity: 0.2 });
                return;
            }

            let match = true;

            // måned-filter
            if (month) {
                if (place.best_months?.includes(month)) {
                    layer.setStyle({ fillColor: "#2ecc71" });
                } else if (place.ok_months?.includes(month)) {
                    layer.setStyle({ fillColor: "#f1c40f" });
                } else {
                    match = false;
                }
            }

            // tag-filter
            if (tag && !place.tags?.includes(tag)) {
                match = false;
            }

            // dæmp ikke-match
            if (!match) {
                layer.setStyle({ fillOpacity: 0.2 });
            }
        });
    }

    monthSelect.addEventListener("change", applyFilters);
    tagSelect.addEventListener("change", applyFilters);
});
