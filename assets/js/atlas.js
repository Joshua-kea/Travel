console.log("ATLAS.JS LOADED");

document.addEventListener("DOMContentLoaded", () => {

    /* =========================
       GUARD
    ========================= */

    if (!window.places || window.places.length === 0) {
        console.error("No places loaded from Jekyll");
        return;
    }

    /* =========================
       MAP SETUP
    ========================= */

    const map = L.map("map", { worldCopyJump: true }).setView([20, 0], 2);

    L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
        { attribution: "© OpenStreetMap & CARTO" }
    ).addTo(map);

    map.createPane("countries");
    map.createPane("territories");

    map.getPane("countries").style.zIndex = 300;
    map.getPane("territories").style.zIndex = 400;

    /* =========================
       LOOKUPS (SINGLE SOURCE OF TRUTH)
    ========================= */

    const byAdminKey = {};

    window.places.forEach(p => {
        if (p.admin_key) {
            byAdminKey[p.admin_key.toUpperCase()] = p;
        }
    });

    /* =========================
       STYLES
    ========================= */

    const BASE_STYLE = {
        fillColor: "#cfd8dc",
        fillOpacity: 1,
        weight: 1,
        color: "#90a4ae"
    };

    const HOVER_STYLE = {
        weight: 2,
        color: "#455a64",
        fillColor: "#b0bec5"
    };

    /* =========================
       SHARED INTERACTION
    ========================= */

    function bindInteractive(layer, place, fallbackLabel) {
        const label = place?.name || fallbackLabel || "Unknown";

        layer.bindTooltip(label, { sticky: true });

        if (place?.url) {
            layer.on("click", () => {
                window.location.href = place.url;
            });
        }

        layer.on("mouseover", () => layer.setStyle(HOVER_STYLE));
        layer.on("mouseout", () => layer.setStyle(BASE_STYLE));
    }

    /* =========================
       WORLD COUNTRIES
    ========================= */

    fetch(window.BASEURL + "/assets/data/countries.geo.json")
        .then(r => r.json())
        .then(data => {
            L.geoJSON(data, {
                pane: "countries",
                style: BASE_STYLE,
                onEachFeature: (feature, layer) => {
                    const p = feature.properties || {};

                    const iso =
                        (p.ISO_A3 && p.ISO_A3 !== "-99" && p.ISO_A3) ||
                        (p.ADM0_A3 && p.ADM0_A3 !== "-99" && p.ADM0_A3) ||
                        (p.SOV_A3 && p.SOV_A3 !== "-99" && p.SOV_A3);

                    if (!iso) return;

                    // Territories handled separately
                    const key = iso.toUpperCase();
                    const place = byAdminKey[key];

                    bindInteractive(layer, place, p.NAME);
                }
            }).addTo(map);
        });

    /* =========================
       TERRITORIES (ARUBA ETC.)
    ========================= */

    fetch(window.BASEURL + "/assets/data/territories.geo.json")
        .then(r => r.json())
        .then(data => {
            L.geoJSON(data, {
                pane: "territories",
                style: BASE_STYLE,
                onEachFeature: (feature, layer) => {
                    const p = feature.properties || {};
                    if (!p.ADMIN_KEY) return;

                    const key = p.ADMIN_KEY.toUpperCase();
                    const place = byAdminKey[key];

                    bindInteractive(layer, place, p.NAME);
                }
            }).addTo(map);
        });

});
