console.log("ATLAS.JS LOADED");

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
       HELPERS
    ========================= */

    function getISOFromProps(p = {}) {
        return (
            (p.ISO_A3 && p.ISO_A3 !== "-99" && p.ISO_A3) ||
            (p.ADM0_A3 && p.ADM0_A3 !== "-99" && p.ADM0_A3) ||
            (p.SOV_A3 && p.SOV_A3 !== "-99" && p.SOV_A3) ||
            null
        );
    }

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

    const renderer = L.canvas();
    const featureLayers = [];

    function applyStyle(layer) {
        layer.setStyle({
            ...BASE_STYLE,
            fillOpacity: layer._filteredOut ? 0.15 : 1
        });
    }

    function bindInteractive(layer, place, fallbackLabel) {
        const label = place?.name || fallbackLabel || "Unknown";

        layer.bindTooltip(label, {
            sticky: true,
            direction: "center",
            opacity: 0.95
        });

        if (place?.url) {
            layer.on("click", () => window.location.href = place.url);
        }

        layer.on("mouseover", () => {
            if (!layer._filteredOut) {
                layer.setStyle(HOVER_STYLE);
            }
        });

        layer.on("mouseout", () => applyStyle(layer));

        featureLayers.push({ layer, place });
    }

    /* =========================
       COUNTRIES (ADMIN-0)
       EXCEPT USA + UK
    ========================= */

    fetch(`${window.BASEURL}/assets/data/countries.geo.json`)
        .then(r => r.json())
        .then(data => {
            L.geoJSON(data, {
                pane: "countries",
                renderer,
                style: BASE_STYLE,
                filter: f => {
                    const iso = getISOFromProps(f.properties);
                    return iso !== "USA" && iso !== "GBR";
                },
                onEachFeature: (f, l) => {
                    const iso = getISOFromProps(f.properties);
                    bindInteractive(l, byISO[iso], f.properties.NAME);
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
                pane: "subdivisions",
                renderer,
                style: BASE_STYLE,
                onEachFeature: (f, l) => {
                    const key = `USA:${f.properties.iso_3166_2}`.toUpperCase();
                    bindInteractive(l, byAdminKey[key], f.properties.name);
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
                onEachFeature: (f, l) => {
                    const iso1 =
                        (f.properties?.ISO_1 && f.properties.ISO_1 !== "NA")
                            ? f.properties.ISO_1
                            : "GB-ENG";

                    const key = `GBR:${iso1}`.toUpperCase();

                    const labels = {
                        "GB-ENG": "England",
                        "GB-SCT": "Scotland",
                        "GB-WLS": "Wales",
                        "GB-NIR": "Northern Ireland"
                    };

                    bindInteractive(l, byAdminKey[key], labels[iso1]);
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
                onEachFeature: (f, l) => {
                    const key = f.properties?.ADMIN_KEY?.toUpperCase();
                    if (key) {
                        bindInteractive(l, byAdminKey[key], f.properties.NAME);
                    }
                }
            }).addTo(map);
        });

    /* =========================
       FILTER STATE
    ========================= */

    const panel = document.getElementById("filterPanel");
    const toggleBtn = document.getElementById("toggleFilterPanel");
    const applyBtn = document.getElementById("applyFilterBtn");
    const clearBtn = document.getElementById("clearFilterBtn");
    const chipsEl = document.getElementById("activeFilters");

    const activeTags = new Set();
    const activeMonths = new Set();

    toggleBtn.addEventListener("click", () => {
        panel.style.display = panel.style.display === "none" ? "block" : "none";
    });

    function applyFilters() {
        featureLayers.forEach(({ layer, place }) => {
            const tags = place?.tags || [];
            const months = (place?.best_months || []).map(String);

            const tagsOK =
                activeTags.size === 0 ||
                [...activeTags].every(t => tags.includes(t));

            const monthsOK =
                activeMonths.size === 0 ||
                months.some(m => activeMonths.has(m));

            layer._filteredOut = !(tagsOK && monthsOK);
            applyStyle(layer);
        });
    }

    function renderChips() {
        chipsEl.innerHTML = "";

        activeTags.forEach(tag => {
            const chip = document.createElement("span");
            chip.innerHTML = `${tag} <strong>✕</strong>`;
            chip.style.cssText = `
              background:#eceff1;
              border-radius:14px;
              padding:0.25rem 0.6rem;
              font-size:0.85rem;
              cursor:pointer;
            `;
            chip.querySelector("strong").onclick = () => {
                activeTags.delete(tag);
                renderChips();
                applyFilters();
            };
            chipsEl.appendChild(chip);
        });

        activeMonths.forEach(m => {
            const chip = document.createElement("span");
            chip.innerHTML = `Month ${m} <strong>✕</strong>`;
            chip.style.cssText = `
              background:#eceff1;
              border-radius:14px;
              padding:0.25rem 0.6rem;
              font-size:0.85rem;
              cursor:pointer;
            `;
            chip.querySelector("strong").onclick = () => {
                activeMonths.delete(m);
                renderChips();
                applyFilters();
            };
            chipsEl.appendChild(chip);
        });
    }

    applyBtn.addEventListener("click", () => {
        activeTags.clear();
        activeMonths.clear();

        panel
            .querySelectorAll('input[type="checkbox"]:checked')
            .forEach(cb => {
                if (isNaN(cb.value)) activeTags.add(cb.value);
                else activeMonths.add(cb.value);
            });

        panel.style.display = "none";
        renderChips();
        applyFilters();
    });

    clearBtn.addEventListener("click", () => {
        activeTags.clear();
        activeMonths.clear();
        renderChips();
        applyFilters();
        panel.style.display = "none";
    });

});
