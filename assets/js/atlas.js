console.log("ATLAS.JS LOADED");

document.addEventListener("DOMContentLoaded", () => {
    if (!window.places || window.places.length === 0) {
        console.error("No places loaded from Jekyll");
        return;
    }

    // =====================
    // MAP
    // =====================
    const map = L.map("map", { worldCopyJump: true }).setView([20, 0], 2);

    L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
        { attribution: "© OpenStreetMap & CARTO" }
    ).addTo(map);

    // =====================
    // BUILD LOOKUP (ISO → country)
    // =====================
    const placeByISO = {};
    window.places.forEach(p => {
        if (!p.iso) return;
        placeByISO[p.iso.trim().toUpperCase()] = p;
    });

    console.log("ISO keys loaded:", Object.keys(placeByISO).slice(0, 20));

    const BASE_STYLE = {
        fillColor: "#cfd8dc",
        fillOpacity: 1,
        weight: 1,
        color: "#ffffff"
    };

    let geojsonLayer = null;

    // =====================
    // LOAD GEOJSON
    // =====================
    fetch(window.BASEURL + "/assets/data/countries.geo.json")
        .then(r => r.json())
        .then(data => {
            geojsonLayer = L.geoJSON(data, {
                style: BASE_STYLE,
                onEachFeature: (feature, layer) => {

                    // ⭐️ NORMALISER ISO ÉN GANG
                    const rawISO =
                        feature.properties?.ADM0_A3 ||
                        feature.properties?.ISO_A3_EH ||
                        feature.properties?.ISO_A3 ||
                        feature.id;

                    const iso = rawISO?.trim().toUpperCase();

                    // gem ISO på layeret → bruges senere
                    layer._iso = iso;

                    const place = placeByISO[iso];

                    const displayName =
                        place?.title ||
                        feature.properties?.NAME ||
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

    // =====================
    // FILTERS
    // =====================
    const tagSelect = document.getElementById("tagFilter");

    function applyFilters() {
        if (!geojsonLayer) return;

        const tag = tagSelect.value;

        geojsonLayer.eachLayer(layer => {
            layer.setStyle(BASE_STYLE);

            const iso = layer._iso;
            const place = placeByISO[iso];

            if (tag && (!place || !place.tags?.includes(tag))) {
                layer.setStyle({ fillOpacity: 0.2 });
            }
        });
    }

    tagSelect.addEventListener("change", applyFilters);
});
