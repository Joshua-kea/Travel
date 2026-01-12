console.log("ATLAS.JS LOADED");
console.log("PLACES FRA JEKYLL:", window.places);

document.addEventListener("DOMContentLoaded", () => {

    if (!window.places || window.places.length === 0) {
        console.error("No places found – aborting");
        return;
    }

    // =====================
    // MAP
    // =====================
    const map = L.map("map", {
        worldCopyJump: true
    }).setView([20, 0], 2);

    L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
        { attribution: "© OpenStreetMap & CARTO" }
    ).addTo(map);

    // =====================
    // LOOKUP BY ISO
    // =====================
    const placeByISO = {};
    window.places.forEach(p => {
        placeByISO[p.kode] = p;
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
    // GEOJSON
    // =====================
    let geojsonLayer = null;

    fetch(window.BASEURL + "/assets/data/countries.geo.json")
        .then(res => res.json())
        .then(data => {

            geojsonLayer = L.geoJSON(data, {
                style: BASE_STYLE,

                onEachFeature: (feature, layer) => {
                    const iso = feature.properties.ISO_A3;
                    const place = placeByISO[iso];

                    if (!place) {
                        layer.setStyle({ fillOpacity: 0.25 });
                        return;
                    }

                    layer.on("click", () => {
                        window.location.href = place.url;
                    });

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
    // FILTERS
    // =====================
    const monthSelect = document.getElementById("monthFilter");
    const tagSelect = document.getElementById("tagFilter");

    function applyFilters() {
        if (!geojsonLayer) return;

        const month = Number(monthSelect.value);
        const tag = tagSelect.value;

        geojsonLayer.eachLayer(layer => {
            resetStyle(layer);
        });

        geojsonLayer.eachLayer(layer => {
            const iso = layer.feature.id;
            const place = placeByISO[iso];

            if (!place) {
                layer.setStyle({ fillOpacity: 0.2 });
                return;
            }

            let match = true;

            if (tag && !place.tags?.includes(tag)) {
                match = false;
            }

            if (!match) {
                layer.setStyle({ fillOpacity: 0.2 });
            }
        });
    }

    monthSelect.addEventListener("change", applyFilters);
    tagSelect.addEventListener("change", applyFilters);
});
