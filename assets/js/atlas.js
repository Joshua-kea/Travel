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

    const BASE_STYLE = { fillColor: "#cfd8dc", fillOpacity: 1, weight: 1, color: "#90a4ae" };
    const HOVER_STYLE = { weight: 2, color: "#455a64", fillColor: "#b0bec5" };

    const featureLayers = [];
    const renderer = L.canvas();

    function applyStyle(layer) {
        layer.setStyle({
            ...BASE_STYLE,
            fillOpacity: layer._filteredOut ? 0.15 : 1
        });
    }

    function bindInteractive(layer, place, fallback) {
        const label = place?.name || fallback || "Unknown";
        layer.bindTooltip(label, { sticky: true });

        if (place?.url) layer.on("click", () => window.location.href = place.url);

        layer.on("mouseover", () => {
            if (!layer._filteredOut) layer.setStyle(HOVER_STYLE);
        });

        layer.on("mouseout", () => applyStyle(layer));

        featureLayers.push({ layer, place });
    }

    /* =========================
       LOAD DATA (COUNTRIES / USA / UK / TERRITORIES)
    ========================= */

    fetch(`${window.BASEURL}/assets/data/countries.geo.json`)
        .then(r => r.json())
        .then(d => {
            L.geoJSON(d, {
                pane: "countries",
                renderer,
                style: BASE_STYLE,
                filter: f => !["USA","GBR"].includes(
                    f.properties?.ISO_A3 ||
                    f.properties?.ADM0_A3 ||
                    f.properties?.SOV_A3
                ),
                onEachFeature: (f,l) => {
                    const iso = f.properties?.ISO_A3;
                    bindInteractive(l, byISO[iso], f.properties.NAME);
                }
            }).addTo(map);
        });

    fetch(`${window.BASEURL}/assets/data/admin1.geo.json`)
        .then(r => r.json())
        .then(d => {
            const usa = d.features.filter(f => f.properties?.adm0_a3 === "USA");
            L.geoJSON(usa, {
                pane: "subdivisions",
                renderer,
                style: BASE_STYLE,
                onEachFeature: (f,l) => {
                    const key = `USA:${f.properties.iso_3166_2}`.toUpperCase();
                    bindInteractive(l, byAdminKey[key], f.properties.name);
                }
            }).addTo(map);
        });

    fetch(`${window.BASEURL}/assets/data/uk.geo.json`)
        .then(r => r.json())
        .then(d => {
            L.geoJSON(d, {
                pane: "subdivisions",
                renderer,
                style: BASE_STYLE,
                onEachFeature: (f,l) => {
                    const iso1 = f.properties?.ISO_1 || "GB-ENG";
                    const key = `GBR:${iso1}`.toUpperCase();
                    const labels = {
                        "GB-ENG":"England","GB-SCT":"Scotland",
                        "GB-WLS":"Wales","GB-NIR":"Northern Ireland"
                    };
                    bindInteractive(l, byAdminKey[key], labels[iso1]);
                }
            }).addTo(map);
        });

    fetch(`${window.BASEURL}/assets/data/territories.geo.json`)
        .then(r => r.json())
        .then(d => {
            L.geoJSON(d, {
                pane: "territories",
                renderer,
                style: BASE_STYLE,
                onEachFeature: (f,l) => {
                    const key = f.properties?.ADMIN_KEY?.toUpperCase();
                    if (key) bindInteractive(l, byAdminKey[key], f.properties.NAME);
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

    let activeTags = new Set();
    let activeMonths = new Set();

    toggleBtn.addEventListener("click", () => {
        panel.style.display = panel.style.display === "none" ? "block" : "none";
    });

    function applyFilters() {
        featureLayers.forEach(({ layer, place }) => {
            const tags = place?.tags || [];
            const months = place?.best_months || [];

            const tagOK =
                activeTags.size === 0 ||
                [...activeTags].every(t => tags.includes(t));

            const monthOK =
                activeMonths.size === 0 ||
                months.some(m => activeMonths.has(String(m)));

            layer._filteredOut = !(tagOK && monthOK);
            applyStyle(layer);
        });
    }

    function syncCheckboxes() {
        document
            .querySelectorAll('#filterPanel input[type="checkbox"]')
            .forEach(cb => {
                cb.checked =
                    (!isNaN(cb.value) && activeMonths.has(cb.value)) ||
                    (isNaN(cb.value) && activeTags.has(cb.value));
            });
    }

    function renderChips() {
        chipsEl.innerHTML = "";

        [...activeTags].forEach(tag => {
            const chip = document.createElement("span");
            chip.innerHTML = `${tag} <strong style="cursor:pointer;">✕</strong>`;
            chip.style.cssText = `
              background:#eceff1;
              border-radius:14px;
              padding:0.25rem 0.6rem;
              font-size:0.85rem;
            `;
            chip.querySelector("strong").onclick = () => {
                activeTags.delete(tag);
                syncCheckboxes();
                renderChips();
                applyFilters();
            };
            chipsEl.appendChild(chip);
        });

        [...activeMonths].forEach(m => {
            const chip = document.createElement("span");
            chip.innerHTML = `Month ${m} <strong style="cursor:pointer;">✕</strong>`;
            chip.style.cssText = `
              background:#eceff1;
              border-radius:14px;
              padding:0.25rem 0.6rem;
              font-size:0.85rem;
            `;
            chip.querySelector("strong").onclick = () => {
                activeMonths.delete(m);
                syncCheckboxes();
                renderChips();
                applyFilters();
            };
            chipsEl.appendChild(chip);
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

        panel.style.display = "none";
        renderChips();
        applyFilters();
    });

    clearBtn.addEventListener("click", () => {
        activeTags.clear();
        activeMonths.clear();
        syncCheckboxes();
        renderChips();
        applyFilters();
        panel.style.display = "none";
    });

});