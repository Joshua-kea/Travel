console.log("ATLAS.JS LOADED");
console.log("PLACES FROM JEKYLL:", window.places);

document.addEventListener("DOMContentLoaded", () => {

    if (!window.places || window.places.length === 0) {
        console.error("No places found – aborting");
        return;
    }

    // =====================
    // MAP SETUP
    // =====================
    const map = L.map("map", {
        worldCopyJump: true
    }).setView([20, 0], 2);

    L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
        { attribution: "© OpenStreetMap & CARTO" }
    ).addTo(map);

    // =====================
    // BUILD ISO LOOKUP
    // =====================
    const placeByISO = {};

    window.places.forEach(p => {
        if (!p.iso) return;

        const normalizedISO = p.iso
            .replace(/\s+/g, "")
            .toUpperCase();

        placeByISO[normalizedISO] = p;
    });

    console.log("ISO keys loaded:", Object.keys(placeByISO));

    // =====================
    // STYLES
    // =====================
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
        .then(res => {
            if (!res.ok) {
                throw new Error("Failed to load countries.geo.json");
            }
            return res.json();
        })
        .then(data => {

            geojsonLayer = L.geoJSON(data, {
                style: BASE_STYLE,

                onEachFeature: (feature, layer) => {

                    // ---- ROBUST ISO EXTRACTION ----
                    const rawISO =
                        feature.properties?.ISO_A3 ||
                        feature.properties?.ADM0_A3 ||
                        feature.id;

                    const normalizedISO = rawISO
                        ?.replace(/\s+/g, "")
                        .toUpperCase();

                    // Skip invalid features
                    if (!normalizedISO || normalizedISO === "-99") {
                        layer.setStyle({ fillOpacity: 0 });
                        return;
                    }

                    const place = placeByISO[normalizedISO];

                    const displayName =
                        place?.title ||
                        feature.properties?.NAME ||
                        "Unknown";

                    layer.bindTooltip(displayName, { sticky: true });

                    // No matching MD → grey, not clickable
                    if (!place) {
                        layer.setStyle({ fillOpacity: 0.25 });
                        return;
                    }

                    // Click → country page
                    layer.on("click", () => {
                        window.location.href = place.url;
                    });

                    // Hover feedback
                    layer.on("mouseover", () => {
                        layer.setStyle({ weight: 2 });
                    });

                    layer.on("mouseout", () => {
                        layer.setStyle({ weight: 1 });
                    });
                }
            }).addTo(map);
        })
        .catch(err => {
            console.error("GeoJSON load error:", err);
        });

    // =====================
    // TAG FILTER
    // =====================
    const tagSelect = document.getElementById("tagFilter");

    function applyFilters() {
        if (!geojsonLayer) return;

        const tag = tagSelect.value;

        geojsonLayer.eachLayer(layer => {
            layer.setStyle(BASE_STYLE);

            const rawISO =
                layer.feature?.properties?.ISO_A3 ||
                layer.feature?.properties?.ADM0_A3 ||
                layer.feature?.id;

            const normalizedISO = rawISO
                ?.replace(/\s+/g, "")
                .toUpperCase();

            const place = placeByISO[normalizedISO];

            if (tag && (!place || !place.tags?.includes(tag))) {
                layer.setStyle({ fillOpacity: 0.2 });
            }
        });
    }

    tagSelect.addEventListener("change", applyFilters);
});
