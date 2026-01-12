console.log("ATLAS.JS LOADED");

document.addEventListener("DOMContentLoaded", () => {
    if (!window.places || window.places.length === 0) {
        console.error("No places loaded from Jekyll");
        return;
    }

    const map = L.map("map", { worldCopyJump: true }).setView([20, 0], 2);

    L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
        { attribution: "© OpenStreetMap & CARTO" }
    ).addTo(map);

    /* =========================
       LOOKUPS (EN KILDE TIL SANDHED)
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
       ADMIN-1 (USA + UK)
       → ALTID ØVERST
    ========================= */

    fetch(window.BASEURL + "/assets/data/admin1.geo.json")
        .then(r => r.json())
        .then(data => {
            const adminLayer = L.geoJSON(data, {
                style: BASE_STYLE,
                onEachFeature: (feature, layer) => {
                    const p = feature.properties;
                    if (!p?.adm0_a3 || !p?.iso_3166_2) return;

                    // EKSEMPEL:
                    // USA + US-AL → USA:US-AL
                    // GBR + GB-ENG → GBR:GB-ENG
                    const adminKey = `${p.adm0_a3}:${p.iso_3166_2}`.toUpperCase();

                    const place = byAdminKey[adminKey];
                    bindLayer(layer, place, p.name);
                }
            }).addTo(map);

            adminLayer.bringToFront();
        });

    /* =========================
       COUNTRIES / TERRITORIES
    ========================= */

    fetch(window.BASEURL + "/assets/data/countries.geo.json")
        .then(r => r.json())
        .then(data => {
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
        });
});
