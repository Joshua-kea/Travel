console.log("ATLAS – FILTERS ACTUALLY WORK");

document.addEventListener("DOMContentLoaded", () => {

    if (!window.places || window.places.length === 0) return;

    /* =========================
       MAP
    ========================= */

    const map = L.map("map", {
        worldCopyJump: true,
        zoomControl: true,
        preferCanvas: false
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

    const STYLE_BASE = {
        fillColor: "#e6ecef",
        fillOpacity: 1,
        weight: 1,
        color: "#9fb0bb"   // 👈 lysere outline
    };

    const STYLE_HOVER = {
        fillColor: "#cfd9df",
        fillOpacity: 1,
        weight: 2,
        color: "#6f8896"
    };

    const STYLE_DIM = {
        fillColor: "#dde3e6",
        fillOpacity: 0.15,
        weight: 0.4,
        color: "#c7d1d8"
    };

    const STYLE_MATCH = {
        fillColor: "#ff5a1f",   // 🔥 MEGET TYDELIG
        fillOpacity: 1,
        weight: 2,
        color: "#b93a0a"
    };

    const STYLE_MATCH_HOVER = {
        fillColor: "#e64a14",
        fillOpacity: 1,
        weight: 3,
        color: "#8c2a07"
    };

    /* =========================
       REGISTRY
    ========================= */

    const layers = [];

    function applyStyle(layer) {
        if (!layer._hasFilters) {
            layer.setStyle(STYLE_BASE);
        } else if (layer._isMatch) {
            layer.setStyle(STYLE_MATCH);
        } else {
            layer.setStyle(STYLE_DIM);
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

        layer.on("mouseover", () => {
            if (!layer._hasFilters) {
                layer.setStyle(STYLE_HOVER);
            } else if (layer._isMatch) {
                layer.setStyle(STYLE_MATCH_HOVER);
            }
        });

        layer.on("mouseout", () => applyStyle(layer));

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
                style: STYLE_BASE,
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
                style: STYLE_BASE,
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
                style: STYLE_BASE,
                onEachFeature: (f, l) => {
                    const iso1 =
                        f.properties?.ISO_1 && f.properties.ISO_1 !== "NA"
                            ? f.properties.ISO_1
                            : "GB-ENG";

                    const labels = {
                        "GB-ENG": "England",
                        "GB-SCT": "Scotland",
                        "GB-WLS": "Wales",
                        "GB-NIR": "Northern Ireland"
                    };

                    bindLayer(l, byAdminKey[`GBR:${iso1}`], labels[iso1]);
                }
            }).addTo(map);
        });

    /* =========================
       FILTERS + CHIPS
    ========================= */

    const panel = document.getElementById("filterPanel");
    const toggleBtn = document.getElementById("toggleFilterPanel");
    const applyBtn = document.getElementById("applyFilterBtn");
    const clearBtn = document.getElementById("clearFilterBtn");
    const chipsEl = document.getElementById("activeFilters");

    const activeTags = new Set();
    const activeMonths = new Set();

    toggleBtn.onclick = () => {
        panel.style.display = panel.style.display === "none" ? "block" : "none";
    };

    function renderChips() {
        chipsEl.innerHTML = "";

        [...activeTags].forEach(tag => {
            const chip = document.createElement("span");
            chip.textContent = `${tag} ×`;
            chip.style.cssText =
                "background:#eef1f3;padding:0.25rem 0.6rem;border-radius:999px;font-size:0.85rem;cursor:pointer;";
            chip.onclick = () => {
                activeTags.delete(tag);
                renderChips();
                applyFilters();
            };
            chipsEl.appendChild(chip);
        });
    }

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

        panel.querySelectorAll("input[type='checkbox']:checked").forEach(cb => {
            isNaN(cb.value) ? activeTags.add(cb.value) : activeMonths.add(cb.value);
        });

        panel.style.display = "none";
        renderChips();
        applyFilters();
    };

    clearBtn.onclick = () => {
        activeTags.clear();
        activeMonths.clear();
        renderChips();
        applyFilters();
        panel.style.display = "none";
    };

});
