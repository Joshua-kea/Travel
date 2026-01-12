console.log("ATLAS.JS LOADED");
console.log("PLACES FRA JEKYLL:", window.places);

document.addEventListener("DOMContentLoaded", () => {

    if (!window.places || window.places.length === 0) return;

    const map = L.map("map", { worldCopyJump: true }).setView([20, 0], 2);

    L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
        { attribution: "© OpenStreetMap & CARTO" }
    ).addTo(map);

    // ⭐ BYG OPSLAG KORREKT
    const placeByISO = {};
    window.places.forEach(p => {
        if (!p.iso) return;
        placeByISO[p.iso.trim().toUpperCase()] = p;
    });

    const BASE_STYLE = {
        fillColor: "#cfd8dc",
        fillOpacity: 1,
        weight: 1,
        color: "#ffffff"
    };

    let geojsonLayer = null;

    fetch(window.BASEURL + "/assets/data/countries.geo.json")
        .then(r => r.json())
        .then(data => {
            geojsonLayer = L.geoJSON(data, {
                style: BASE_STYLE,
                onEachFeature: (feature, layer) => {

                    const iso = feature.properties.ISO_A3?.trim().toUpperCase();

                    if (!iso || iso === "-99") {
                        layer.setStyle({ fillOpacity: 0 });
                        return;
                    }

                    const place = placeByISO[iso];

                    const displayName =
                        place?.title ||
                        feature.properties.NAME ||
                        "Unknown";

                    layer.bindTooltip(displayName, { sticky: true });

                    if (!place) {
                        layer.setStyle({ fillOpacity: 0.25 });
                        return;
                    }

                    layer.on("click", () => {
                        window.location.href = place.url;
                    });

                    layer.on("mouseover", () => layer.setStyle({ weight: 2 }));
                    layer.on("mouseout", () => layer.setStyle({ weight: 1 }));
                }
            }).addTo(map);
        });

    const tagSelect = document.getElementById("tagFilter");

    function applyFilters() {
        if (!geojsonLayer) return;

        const tag = tagSelect.value;

        geojsonLayer.eachLayer(layer => {
            layer.setStyle(BASE_STYLE);

            const iso = layer.feature.properties.ISO_A3?.trim().toUpperCase();
            const place = placeByISO[iso];

            if (tag && (!place || !place.tags?.includes(tag))) {
                layer.setStyle({ fillOpacity: 0.2 });
            }
        });
    }

    tagSelect.addEventListener("change", applyFilters);
});