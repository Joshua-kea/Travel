console.log("ATLAS.JS LOADED");

document.addEventListener("DOMContentLoaded", () => {

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

    /* =========================
       LOOKUPS (SINGLE SOURCE OF TRUTH)
    ========================= */

    const byISO = {};
    const byAdminKey = {};

    window.places.forEach(p => {
        if (p.iso) {
            byISO[p.iso.trim().toUpperCase()] = p;
        }
        if (p.admin_key) {
            byAdminKey[p.admin_key.trim().toUpperCase()] = p;
        }
    });

    /* =========================
       STYLES + HELPERS
    ========================= */

    const BASE_STYLE = {
        fillColor: "#cfd8dc",
        fillOpacity: 1,
        weight: 1,
        color: "#ffffff"
    };

    function bindLayer(layer, place, fallbackName) {
        const label = place?.name || fallbackName || "Unknown";

        layer.bindTooltip(label, { sticky: true });

        if (place?.url) {
            layer.on("click", () => {
                window.location.href = place.url;
            });
            layer.on("mouseover", () => layer.setStyle({ weight: 2 }));
            layer.on("mouseout", () => layer.setStyle({ weight: 1 }));
        } else {
            layer.setStyle({ fillOpacity: 0.25 });
        }
    }

    /* =========================
       ADMIN-1 (USA + UK ONLY)
    ========================= */

    console.log("Fetching admin1…");

    fetch(window.BASEURL + "/assets/data/admin1.geo.json")
        .then(response => {
            console.log("admin1 fetched");
            return response.json();
        })
        .then(data => {
            console.log("admin1 parsed, total features:", data.features.length);

            const filtered = {
                type: "FeatureCollection",
                features: data.features.filter(f => {
                    const p = f.properties;
                    return p && (p.adm0_a3 === "USA" || p.adm0_a3 === "GBR");
                })
            };

            console.log("admin1 filtered features:", filtered.features.length);

            const adminLayer = L.geoJSON(filtered, {
                style: BASE_STYLE,
                onEachFeature: (feature, layer) => {
                    const p = feature.properties;
                    if (!p?.adm0_a3 || !p?.iso_3166_2) return;

                    const adminKey =
                        `${p.adm0_a3}:${p.iso_3166_2}`.toUpperCase();

                    const place = byAdminKey[adminKey];
                    bindLayer(layer, place, p.name);
                    console.log("ADMIN KEY:", adminKey, place);
                }
            }).addTo(map);

            adminLayer.bringToFront();
        })
        .catch(err => {
            console.error("Admin-1 failed to load:", err);
        });

    /* =========================
       COUNTRIES / TERRITORIES
    ========================= */

    console.log("Fetching countries…");

    fetch(window.BASEURL + "/assets/data/countries.geo.json")
        .then(response => {
            console.log("countries fetched");
            return response.json();
        })
        .then(data => {
            console.log("countries parsed, features:", data.features.length);

            L.geoJSON(data, {
                style: BASE_STYLE,
                onEachFeature: (feature, layer) => {
                    const p = feature.properties || {};

                    const iso =
                        (p.ISO_A3 && p.ISO_A3 !== "-99" && p.ISO_A3) ||
                        (p.ADM0_A3 && p.ADM0_A3 !== "-99" && p.ADM0_A3) ||
                        (p.SOV_A3 && p.SOV_A3 !== "-99" && p.SOV_A3);

                    const place = iso ? byISO[iso.toUpperCase()] : null;
                    bindLayer(layer, place, p.NAME);
                }
            }).addTo(map);
        })
        .catch(err => {
            console.error("Countries failed to load:", err);
        });

});