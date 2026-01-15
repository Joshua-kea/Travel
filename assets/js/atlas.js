console.log("ATLAS.JS LOADED");

document.addEventListener("DOMContentLoaded", () => {

    if (!window.places || window.places.length === 0) {
        console.error("No places loaded");
        return;
    }

    /* =========================
       MAP SETUP
    ========================= */

    const map = L.map("map", {
        worldCopyJump: true,
        zoomControl: true,
        zoomAnimation: false,
        fadeAnimation: false,
        preferCanvas: true
    }).setView([20, 0], 2);

    L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
        { attribution: "© OpenStreetMap & CARTO" }
    ).addTo(map);

    map.zoomControl.setPosition("bottomright");

    map.createPane("countries");
    map.createPane("subdivisions");

    map.getPane("countries").style.zIndex = 300;
    map.getPane("subdivisions").style.zIndex = 400;

    /* =========================
       LOOKUPS
    ========================= */

    const byISO = {};
    const byAdminKey = {};

    window.places.forEach(p => {
        if (p.iso) byISO[p.iso.toUpperCase()] = p;
        if (p.admin_key) byAdminKey[p.admin_key.toUpperCase()] = p;
    });

    function getISO(p = {}) {
        return p.ISO_A3 || p.ADM0_A3 || p.SOV_A3 || null;
    }

    /* =========================
       STYLES
    ========================= */

    const BASE_FILL = "#e6ecef";
    const MATCH_FILL = "#2b7cff";

    const BASE_OUTLINE = {
        weight: 1,
        color: "#8fa1ad"
    };

    const HOVER_OUTLINE = {
        weight: 3,
        color: "#083d77"
    };

    const renderer = L.canvas();
    const layers = [];

    function applyFillStyle(layer) {
        if (!layer._hasFilters) {
            layer.setStyle({
                fillColor: BASE_FILL,
                fillOpacity: 1
            });
        } else if (layer._isMatch) {
            layer.setStyle({
                fillColor: MATCH_FILL,
                fillOpacity: 1
            });
        } else {
            layer.setStyle({
                fillColor: BASE_FILL,
                fillOpacity: 0.08
            });
        }
    }

    function bindLayer(layer, place, label) {
        layer._place = place || null;
        layer._hasFilters = false;
        layer._isMatch = true;

        layer.bindTooltip(label, { sticky: true });

        if (place?.url) {
            layer.on("click", () => window.location.href = place.url);
        }

        // ✅ PÆN HOVER – KUN OUTLINE
        layer.on("mouseover", () => {
            layer.setStyle(HOVER_OUTLINE);
        });

        layer.on("mouseout", () => {
            layer.setStyle(BASE_OUTLINE);
        });

        layers.push(layer);
    }

    /* =========================
       LOAD DATA
    ========================= */

    fetch(`${window.BASEURL}/assets/data/countries.geo.json`)
        .then(r => r.json())
        .then(data => {
            L.geoJSON(data, {
                pane: "countries",
                renderer,
                style: {
                    ...BASE_OUTLINE,
                    fillColor: BASE_FILL,
                    fillOpacity: 1
                },
                filter: f => {
                    const iso = getISO(f.properties);
                    return iso && iso !== "USA" && iso !== "GBR";
                },
                onEachFeature: (f, l) => {
                    bindLayer(l, byISO[getISO(f.properties)], f.properties.NAME);
                }
            }).addTo(map);
        });

    fetch(`${window.BASEURL}/assets/data/admin1.geo.json`)
        .then(r => r.json())
        .then(data => {
            const usa = data.features.filter(f => f.properties?.adm0_a3 === "USA");
            L.geoJSON(usa, {
                pane: "subdivisions",
                renderer,
                style: {
                    ...BASE_OUTLINE,
                    fillColor: BASE_FILL,
                    fillOpacity: 1
                },
                onEachFeature: (f, l) => {
                    const key = `USA:${f.properties.iso_3166_2}`.toUpperCase();
                    bindLayer(l, byAdminKey[key], f.properties.name);
                }
            }).addTo(map);
        });

    fetch(`${window.BASEURL}/assets/data/uk.geo.json`)
        .then(r => r.json())
        .then(data => {
            L.geoJSON(data, {
                pane: "subdivisions",
                renderer,
                style: {
                    ...BASE_OUTLINE,
                    fillColor: BASE_FILL,
                    fillOpacity: 1
                },
                onEachFeature: (f, l) => {
                    const iso1 =
                        f.properties?.ISO_1 && f.properties.ISO_1 !== "NA"
                            ? f.properties.ISO_1
                            : "GB-ENG";

                    const key = `GBR:${iso1}`.toUpperCase();
                    const labels = {
                        "GB-ENG": "England",
                        "GB-SCT": "Scotland",
                        "GB-WLS": "Wales",
                        "GB-NIR": "Northern Ireland"
                    };

                    bindLayer(l, byAdminKey[key], labels[iso1]);
                }
            }).addTo(map);
        });

    /* =========================
       FILTERS (VIRKER NU)
    ========================= */

    const panel = document.getElementById("filterPanel");
    const toggleBtn = document.getElementById("toggleFilterPanel");
    const applyBtn = document.getElementById("applyFilterBtn");
    const clearBtn = document.getElementById("clearFilterBtn");

    const activeTags = new Set();
    const activeMonths = new Set();

    toggleBtn.onclick = () => {
        panel.style.display = panel.style.display === "none" ? "block" : "none";
    };

    function applyFilters() {
        const hasFilters = activeTags.size > 0 || activeMonths.size > 0;

        layers.forEach(layer => {
            const place = layer._place;
            const tags = place?.tags || [];
            const months = (place?.best_months || []).map(String);

            let match = true;

            if (activeTags.size) {
                match = [...activeTags].every(t => tags.includes(t));
            }

            if (match && activeMonths.size) {
                match = months.some(m => activeMonths.has(m));
            }

            layer._hasFilters = hasFilters;
            layer._isMatch = match;

            applyFillStyle(layer);
        });
    }

    applyBtn.onclick = () => {
        activeTags.clear();
        activeMonths.clear();

        panel.querySelectorAll("input[type='checkbox']:checked")
            .forEach(cb => {
                if (isNaN(cb.value)) activeTags.add(cb.value);
                else activeMonths.add(cb.value);
            });

        panel.style.display = "none";
        applyFilters();
    };

    clearBtn.onclick = () => {
        activeTags.clear();
        activeMonths.clear();
        applyFilters();
        panel.style.display = "none";
    };

});
