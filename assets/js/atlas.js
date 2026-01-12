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
       PANES (VIGTIGT)
    ========================= */

    map.createPane("countriesPane");
    map.createPane("adminPane");

    map.getPane("countriesPane").style.zIndex = 400;
    map.getPane("adminPane").style.zIndex = 450;

    /* =========================
       LOOKUPS
    ========================= */

    const countryByISO = {};
    const countryByName = {};
    const adminByKey = {};

    window.places.forEach(p => {
        if (p.iso) {
            countryByISO[p.iso.trim().toUpperCase()] = p;
        }
        if (p.name) {
            countryByName[p.name.trim().toUpperCase()] = p;
        }
        if (p.admin_key) {
            adminByKey[p.admin_key.trim().toUpperCase()] = p;
        }
    });

    const BASE_STYLE = {
        fillColor: "#cfd8dc",
        fillOpacity: 1,
        weight: 1,
        color: "#ffffff"
    };

    function bind(layer, place, fallbackName) {
        const label = place?.name || fallbackName || "Unknown";

        layer.bindTooltip(label, { sticky: true });

        if (place?.url) {
            layer.on("click", () => (window.location.href = place.url));
            layer.on("mouseover", () => layer.setStyle({ weight: 2 }));
            layer.on("mouseout", () => layer.setStyle({ weight: 1 }));
        } else {
            layer.setStyle({ fillOpacity: 0.2 });
        }
    }

    /* =========================
       COUNTRIES / TERRITORIES
    ========================= */

    fetch(window.BASEURL + "/assets/data/countries.geo.json")
        .then(r => r.json())
        .then(data => {
            L.geoJSON(data, {
                pane: "countriesPane",
                style: BASE_STYLE,
                onEachFeature: (feature, layer) => {
                    const p = feature.properties || {};

                    const iso =
                        p.ISO_A3 && p.ISO_A3 !== "-99"
                            ? p.ISO_A3
                            : p.ADM0_A3 && p.ADM0_A3 !== "-99"
                                ? p.ADM0_A3
                                : p.SOV_A3 && p.SOV_A3 !== "-99"
                                    ? p.SOV_A3
                                    : null;

                    const place =
                        (iso && countryByISO[iso.toUpperCase()]) ||
                        countryByName[p.NAME?.toUpperCase()];

                    bind(layer, place, p.NAME);
                }
            }).addTo(map);
        });

    /* =========================
       ADMIN-1 (USA + UK)
       → ALTID ØVERST
    ========================= */

    fetch(window.BASEURL + "/assets/data/admin1.geo.json")
        .then(r => r.json())
        .then(data => {
            L.geoJSON(data, {
                pane: "adminPane",
                style: BASE_STYLE,
                onEachFeature: (feature, layer) => {
                    const p = feature.properties;
                    if (!p?.iso_3166_2 || !p?.adm0_a3) {
                        layer.setStyle({ fillOpacity: 0 });
                        return;
                    }

                    const key = `${p.adm0_a3}:${p.iso_3166_2}`.toUpperCase();
                    const place = adminByKey[key];

                    bind(layer, place, p.name);
                }
            }).addTo(map);
        });
});
