console.log("ATLAS.JS LOADED");

document.addEventListener("DOMContentLoaded", () => {

    /* =========================
       SAFETY
    ========================= */

    if (!window.places || window.places.length === 0) {
        console.error("No places loaded from Jekyll");
        return;
    }

    /* =========================
       MAP INIT
    ========================= */

    const map = L.map("map", { worldCopyJump: true }).setView([20, 0], 2);

    L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
        { attribution: "© OpenStreetMap & CARTO" }
    ).addTo(map);

    /* =========================
       LOOKUPS
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
       STYLES
    ========================= */

    const COUNTRY_STYLE = {
        fillColor: "#cfd8dc",
        fillOpacity: 1,
        weight: 0.5,
        color: "#ffffff"
    };

    const SUBDIVISION_STYLE = {
        fillColor: "#cfd8dc",
        fillOpacity: 1,
        weight: 2,
        color: "#90a4ae"
    };

    /* =========================
       SHARED BINDING
    ========================= */

    function bindLayer(layer, place, fallbackName) {
        const label = place?.name || fallbackName || "Unknown";

        layer.bindTooltip(label, { sticky: true });

        if (place?.url) {
            layer.on("click", () => {
                window.location.href = place.url;
            });

            layer.on("mouseover", () => {
                layer.setStyle({
                    weight: 3,
                    color: "#455a64",
                    fillColor: "#b0bec5"
                });
            });

            layer.on("mouseout", () => {
                layer.setStyle(SUBDIVISION_STYLE);
            });
        } else {
            layer.setStyle({ fillOpacity: 0.25 });
        }
    }

    /* =========================
       USA – STATES (ADMIN 1)
    ========================= */

    fetch(window.BASEURL + "/assets/data/admin1.geo.json")
        .then(r => r.json())
        .then(data => {

            const usaOnly = {
                type: "FeatureCollection",
                features: data.features.filter(f =>
                    f.properties?.adm0_a3 === "USA"
                )
            };

            const usaLayer = L.geoJSON(usaOnly, {
                style: SUBDIVISION_STYLE,
                onEachFeature: (feature, layer) => {
                    const p = feature.properties;
                    if (!p?.adm0_a3 || !p?.iso_3166_2) return;

                    const adminKey =
                        `${p.adm0_a3}:${p.iso_3166_2}`.toUpperCase();

                    const place = byAdminKey[adminKey];
                    bindLayer(layer, place, p.name);
                }
            }).addTo(map);

            usaLayer.bringToFront();
        })
        .catch(err => console.error("USA admin1 failed:", err));

    /* =========================
       UK – CONSTITUENT COUNTRIES
    ========================= */

    fetch(window.BASEURL + "/assets/data/uk.geo.json")
        .then(r => r.json())
        .then(data => {

            const ukLayer = L.geoJSON(data, {
                style: SUBDIVISION_STYLE,
                onEachFeature: (feature, layer) => {
                    const p = feature.properties;
                    if (!p?.ISO_1) return;

                    const adminKey =
                        `GBR:${p.ISO_1}`.toUpperCase();

                    const place = byAdminKey[adminKey];
                    bindLayer(layer, place, p.NAME_1);
                }
            }).addTo(map);

            ukLayer.bringToFront();
        })
        .catch(err => console.error("UK failed:", err));

    /* =========================
       COUNTRIES (BACKGROUND ONLY)
    ========================= */

    fetch(window.BASEURL + "/assets/data/countries.geo.json")
        .then(r => r.json())
        .then(data => {

            L.geoJSON(data, {
                style: COUNTRY_STYLE,
                interactive: false,   // 🔑 VIGTIG
                onEachFeature: (feature, layer) => {
                    const p = feature.properties || {};

                    const iso =
                        (p.ISO_A3 && p.ISO_A3 !== "-99" && p.ISO_A3) ||
                        (p.ADM0_A3 && p.ADM0_A3 !== "-99" && p.ADM0_A3) ||
                        (p.SOV_A3 && p.SOV_A3 !== "-99" && p.SOV_A3);

                    if (!iso) return;
                    if (iso === "USA" || iso === "GBR") return;

                    const place = byISO[iso.toUpperCase()];
                    layer.bindTooltip(place?.name || p.NAME || "Unknown", {
                        sticky: true
                    });
                }
            }).addTo(map);
        })
        .catch(err => console.error("Countries failed:", err));
});
