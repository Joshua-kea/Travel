console.log("ATLAS.JS LOADED");

document.addEventListener("DOMContentLoaded", () => {
    if (!window.places || window.places.length === 0) {
        console.error("No places from Jekyll");
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
    // BUILD LOOKUP (ISO → PLACE)
    // =====================
    const placeByISO = {};
    window.places.forEach(p => {
        if (!p.iso) return;
        placeByISO[p.iso.trim().toUpperCase()] = p;
    });

    console.log("ISO keys loaded:", Object.keys(placeByISO));

    const BASE_STYLE = {
        fillColor: "#cfd8dc",
        fillOpacity: 1,
        weight: 1,
        color: "#ffffff"
    };

    // =====================
    // GEOJSON
    // =====================
    fetch(window.BASEURL + "/assets/data/countries.geo.json")
        .then(r => r.json())
        .then(data => {
            L.geoJSON(data, {
                style: BASE_STYLE,

                onEachFeature: (feature, layer) => {
                    // 🔑 KORREKT ISO-UDLEDNING
                    const rawISO =
                        feature.properties?.ISO_A3 ||
                        feature.properties?.ADM0_A3 ||
                        feature.properties?.ADM0_A3_EH ||
                        feature.properties?.ISO_A3_EH ||
                        feature.id;

                    const iso = rawISO?.toString().trim().toUpperCase();

                    const place = iso ? placeByISO[iso] : null;

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
    // TAG FILTER
    // =====================
    const tagSelect = document.getElementById("tagFilter");

    function applyFilters() {
        const tag = tagSelect.value;

        map.eachLayer(layer => {
            if (!layer.feature) return;

            const rawISO =
                layer.feature.properties?.ISO_A3 ||
                layer.feature.properties?.ADM0_A3 ||
                layer.feature.properties?.ADM0_A3_EH ||
                layer.feature.properties?.ISO_A3_EH ||
                layer.feature.id;

            const iso = rawISO?.toString().trim().toUpperCase();
            const place = iso ? placeByISO[iso] : null;

            layer.setStyle(BASE_STYLE);

            if (tag && (!place || !place.tags?.includes(tag))) {
                layer.setStyle({ fillOpacity: 0.2 });
            }
        });
    }

    tagSelect.addEventListener("change", applyFilters);
});
