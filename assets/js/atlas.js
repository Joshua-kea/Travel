console.log("ATLAS.JS LOADED");

document.addEventListener("DOMContentLoaded", () => {

    if (!window.places || window.places.length === 0) {
        console.error("No places loaded from Jekyll");
        return;
    }

    // =====================
    // MAP SETUP
    // =====================
    const map = L.map("map", { worldCopyJump: true }).setView([20, 0], 2);

    L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
        { attribution: "© OpenStreetMap & CARTO" }
    ).addTo(map);

    // =====================
    // BUILD LOOKUP: ISO → MD PAGE
    // =====================
    const placeByISO = {};
    window.places.forEach(p => {
        if (!p.iso) return;
        placeByISO[p.iso.trim().toUpperCase()] = p;
    });

    console.log("ISO keys loaded:", Object.keys(placeByISO));

    // =====================
    // USER-DEFINED ISO ALIASES
    // (THIS IS YOUR WORLD VIEW)
    // =====================
    const ISO_ALIASES = {
            // Disputed / personal destinations
            SOL: "SOL", // Somaliland
            SSD: "SSD", // South Sudan
            ABH: "ABH", // Abkhazia
            SOS: "SOS", // South Ossetia
            PSE: "PSE", // Palestine
            TWN: "TWN", // Taiwan

            // Name weirdness / Natural Earth quirks
            FR1: "FRA",
        -99: null,

    // Example future use:
    // GBR: "ENG", // if you later split UK
};

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
        .then(res => res.json())
        .then(data => {

            geojsonLayer = L.geoJSON(data, {
                style: BASE_STYLE,

                onEachFeature: (feature, layer) => {

                    // ---------------------
                    // NORMALISE ISO ONCE
                    // ---------------------
                    const rawISO =
                        feature.properties?.ADM0_A3 ||
                        feature.properties?.ISO_A3_EH ||
                        feature.properties?.ISO_A3 ||
                        feature.properties?.SOV_A3 ||
                        feature.id;

                    let iso = rawISO?.toString().trim().toUpperCase();

                    if (ISO_ALIASES.hasOwnProperty(iso)) {
                        iso = ISO_ALIASES[iso];
                    }

                    // store ISO on layer so filters & clicks use SAME value
                    layer._iso = iso;

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
    // FILTERS
    // =====================
    const tagSelect = document.getElementById("tagFilter");

    function applyFilters() {
        if (!geojsonLayer) return;

        const tag = tagSelect.value;

        geojsonLayer.eachLayer(layer => {
            layer.setStyle(BASE_STYLE);

            const iso = layer._iso;
            const place = iso ? placeByISO[iso] : null;

            if (tag && (!place || !place.tags?.includes(tag))) {
                layer.setStyle({ fillOpacity: 0.2 });
            }
        });
    }

    tagSelect.addEventListener("change", applyFilters);
});
