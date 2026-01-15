console.log("ATLAS.JS LOADED");

document.addEventListener("DOMContentLoaded", () => {

    if (!window.places || window.places.length === 0) return;

    /* =========================
       MAP
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
    map.createPane("territories");

    map.getPane("countries").style.zIndex = 300;
    map.getPane("territories").style.zIndex = 350;
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

    const featureLayers = [];
    const renderer = L.canvas();

    function applyStyle(layer) {
        layer.setStyle({
            ...BASE_STYLE,
            fillOpacity: layer._filteredOut ? 0.15 : 1
        });
    }

    function bindInteractive(layer, place, fallbackLabel) {
        const label = place?.name || fallbackLabel || "Unknown";
        layer.bindTooltip(label, { sticky: true });

        if (place?.url) {
            layer.on("click", () => window.location.href = place.url);
        }

        layer.on("mouseover", () => {
            if (!layer._filteredOut) layer.setStyle(HOVER_STYLE);
        });

        layer.on("mouseout", () => applyStyle(layer));

        featureLayers.push({ layer, place });
    }

    /* =========================
       COUNTRIES (EXCEPT USA + UK)
    ========================= */

    fetch(`${window.BASEURL}/assets/data/countries.geo.json`)
        .then(r => r.json())
        .then(data => {
            L.geoJSON(data, {
                pane: "countries",
                renderer,
                style: BASE_STYLE,
                filter: f => {
                    const p = f.properties || {};
                    const iso = p.ISO_A3 || p.ADM0_A3 || p.SOV_A3;
                    return iso !== "USA" && iso !== "GBR";
                },
                onEachFeature: (f, layer) => {
                    const p = f.properties || {};
                    const iso =
                        (p.ISO_A3 && p.ISO_A3 !== "-99" && p.ISO_A3) ||
                        (p.ADM0_A3 && p.ADM0_A3 !== "-99" && p.ADM0_A3) ||
                        (p.SOV_A3 && p.SOV_A3 !== "-99" && p.SOV_A3);

                    if (!iso) return;
                    bindInteractive(layer, byISO[iso], p.NAME);
                }
            }).addTo(map);
        });

    /* =========================
       USA STATES
    ========================= */

    fetch(`${window.BASEURL}/assets/data/admin1.geo.json`)
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
                renderer,
                style: BASE_STYLE,
                onEachFeature: (f, layer) => {
                    const p = f.properties;
                    const key = `USA:${p.iso_3166_2}`.toUpperCase();
                    bindInteractive(layer, byAdminKey[key], p.name);
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
                pane: "subdivisions",
                renderer,
                style: BASE_STYLE,
                onEachFeature: (f, layer) => {
                    const p = f.properties || {};
                    const iso1 =
                        (p.ISO_1 && p.ISO_1 !== "NA") ? p.ISO_1 : "GB-ENG";

                    const key = `GBR:${iso1}`.toUpperCase();

                    const labels = {
                        "GB-ENG": "England",
                        "GB-SCT": "Scotland",
                        "GB-WLS": "Wales",
                        "GB-NIR": "Northern Ireland"
                    };

                    bindInteractive(layer, byAdminKey[key], labels[iso1]);
                }
            }).addTo(map);
        });

    /* =========================
       TERRITORIES
    ========================= */

    fetch(`${window.BASEURL}/assets/data/territories.geo.json`)
        .then(r => r.json())
        .then(data => {
            L.geoJSON(data, {
                pane: "territories",
                renderer,
                style: BASE_STYLE,
                onEachFeature: (f, layer) => {
                    const key = f.properties?.ADMIN_KEY?.toUpperCase();
                    if (!key) return;
                    bindInteractive(layer, byAdminKey[key], f.properties.NAME);
                }
            }).addTo(map);
        });

    /* =========================
       FILTER LOGIC
       TAGS = AND
       MONTHS = OR
    ========================= */

    const applyBtn = document.getElementById("applyFilterBtn");
    const clearBtn = document.getElementById("clearFilterBtn");
    const chips = document.getElementById("activeFilters");

    let activeTags = new Set();
    let activeMonths = new Set();

    function applyFilters() {
        featureLayers.forEach(({ layer, place }) => {
            const tags = place?.tags || [];
            const months = place?.best_months || [];

            const tagMatch =
                activeTags.size === 0 ||
                [...activeTags].every(t => tags.includes(t));

            const monthMatch =
                activeMonths.size === 0 ||
                months.some(m => activeMonths.has(String(m)));

            layer._filteredOut = !(tagMatch && monthMatch);
            applyStyle(layer);
        });
    }

    function renderChips() {
        chips.innerHTML = "";

        [...activeTags, ...activeMonths].forEach(val => {
            const chip = document.createElement("span");
            chip.textContent = val;
            chip.style.cssText = `
              background:#eceff1;
              border-radius:14px;
              padding:0.25rem 0.6rem;
              font-size:0.85rem;
            `;
            chips.appendChild(chip);
        });
    }

    applyBtn.addEventListener("click", () => {
        activeTags.clear();
        activeMonths.clear();

        document
            .querySelectorAll('#filterPanel input[type="checkbox"]:checked')
            .forEach(cb => {
                if (isNaN(cb.value)) activeTags.add(cb.value);
                else activeMonths.add(cb.value);
            });

        renderChips();
        applyFilters();
    });

    clearBtn.addEventListener("click", () => {
        activeTags.clear();
        activeMonths.clear();
        document
            .querySelectorAll('#filterPanel input[type="checkbox"]')
            .forEach(cb => cb.checked = false);

        renderChips();
        applyFilters();
    });

});
