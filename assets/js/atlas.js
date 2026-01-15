console.log("ATLAS VERSION 10000 – SVG + WORKING FILTERS");

document.addEventListener("DOMContentLoaded", () => {

    if (!window.places || window.places.length === 0) {
        console.error("No places loaded");
        return;
    }

    /* =========================
       MAP
    ========================= */

    const map = L.map("map", {
        worldCopyJump: true,
        zoomControl: true
    }).setView([20, 0], 2);

    L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
        { attribution: "© OpenStreetMap & CARTO" }
    ).addTo(map);

    map.zoomControl.setPosition("bottomright");

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
       STYLES (SVG – IMPORTANT)
    ========================= */

    const BASE_STYLE = {
        fillColor: "#e6ecef",
        fillOpacity: 1,
        weight: 1,
        color: "#8fa1ad"
    };

    const HOVER_STYLE = {
        weight: 3,
        color: "#455a64"
    };

    const MATCH_STYLE = {
        fillColor: "#2b7cff",
        fillOpacity: 1,
        weight: 2,
        color: "#083d77"
    };

    const FADED_STYLE = {
        fillColor: "#e6ecef",
        fillOpacity: 0.12,
        weight: 0.5,
        color: "#c0ccd3"
    };

    /* =========================
       FEATURE REGISTRY
    ========================= */

    const layers = [];

    function applyStyle(layer) {
        if (!layer._hasFilters) {
            layer.setStyle(BASE_STYLE);
        } else if (layer._isMatch) {
            layer.setStyle(MATCH_STYLE);
        } else {
            layer.setStyle(FADED_STYLE);
        }
    }

    function bindLayer(layer, place, label) {
        layer._place = place || null;
        layer._isMatch = true;
        layer._hasFilters = false;

        layer.bindTooltip(label, { sticky: true });

        if (place?.url) {
            layer.on("click", () => window.location.href = place.url);
        }

        layer.on("mouseover", () => {
            layer.setStyle(HOVER_STYLE);
        });

        layer.on("mouseout", () => {
            applyStyle(layer);
        });

        layers.push(layer);
    }

    /* =========================
       LOAD COUNTRIES
    ========================= */

    fetch(`${window.BASEURL}/assets/data/countries.geo.json`)
        .then(r => r.json())
        .then(data => {
            L.geoJSON(data, {
                style: BASE_STYLE,
                filter: f => {
                    const iso = getISO(f.properties);
                    return iso && iso !== "USA" && iso !== "GBR";
                },
                onEachFeature: (f, l) => {
                    bindLayer(l, byISO[getISO(f.properties)], f.properties.NAME);
                }
            }).addTo(map);
        });

    /* =========================
       USA STATES
    ========================= */

    fetch(`${window.BASEURL}/assets/data/admin1.geo.json`)
        .then(r => r.json())
        .then(data => {
            const usa = data.features.filter(f => f.properties?.adm0_a3 === "USA");
            L.geoJSON(usa, {
                style: BASE_STYLE,
                onEachFeature: (f, l) => {
                    const key = `USA:${f.properties.iso_3166_2}`.toUpperCase();
                    bindLayer(l, byAdminKey[key], f.properties.name);
                }
            }).addTo(map);
        });

    /* =========================
       UK COUNTRIES
    ========================= */

    fetch(`${window.BASEURL}/assets/data/uk.geo.json`)
        .then(r => r.json())
        .then(data => {
            L.geoJSON(data, {
                style: BASE_STYLE,
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
       FILTERS (THIS NOW WORKS)
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

            applyStyle(layer);
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
