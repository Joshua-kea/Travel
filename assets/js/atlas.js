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
    map.createPane("subdivisions");
    map.createPane("territories");

    map.getPane("countries").style.zIndex = 300;
    map.getPane("territories").style.zIndex = 350;
    map.getPane("subdivisions").style.zIndex = 400;

    /* =========================
       LOOKUPS (SINGLE SOURCE OF TRUTH)
    ========================= */

    const byISO = {};
    const byAdminKey = {};

    window.places.forEach(p => {
        if (p.iso) {
            byISO[p.iso.toUpperCase()] = p;
        }
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
       WORLD COUNTRIES (NO USA / UK)
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

                    // USA + UK drawn as subdivisions instead
                    if (iso === "USA" || iso === "GBR") return;

                    const place = byISO[iso.toUpperCase()];
                    bindInteractive(layer, place, p.NAME);
                }
            }).addTo(map);
        });

    /* =========================
       USA STATES (ADMIN-1)
    ========================= */

    fetch(window.BASEURL + "/assets/data/admin1.geo.json")
        .then(r => r.json())
        .then(data => {

            const usa = {
                type: "FeatureCollection",
                features: data.features.filter(
                    f => f.properties?.adm0_a3 === "USA"
                )
            };

            L.geoJSON(usa, {
                pane: "subdivisions",
                style: BASE_STYLE,
                onEachFeature: (feature, layer) => {
                    const p = feature.properties;
                    if (!p?.iso_3166_2) return;

                    const key = `USA:${p.iso_3166_2}`.toUpperCase();
                    const place = byAdminKey[key];

                    bindInteractive(layer, place, p.name);
                }
            }).addTo(map);
        });

    /* =========================
       UK COUNTRIES
    ========================= */

    fetch(window.BASEURL + "/assets/data/uk.geo.json")
        .then(r => r.json())
        .then(data => {
            L.geoJSON(data, {
                pane: "subdivisions",
                style: BASE_STYLE,
                onEachFeature: (feature, layer) => {
                    const p = feature.properties || {};

                    let iso1 = p.ISO_1;
                    if (!iso1 || iso1 === "NA") iso1 = "GB-ENG";

                    const key = `GBR:${iso1}`.toUpperCase();
                    const place = byAdminKey[key];

                    let label;
                    switch (iso1) {
                        case "GB-ENG": label = "England"; break;
                        case "GB-SCT": label = "Scotland"; break;
                        case "GB-WLS": label = "Wales"; break;
                        case "GB-NIR": label = "Northern Ireland"; break;
                        default: label = "United Kingdom";
                    }

                    bindInteractive(layer, place, label);
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
