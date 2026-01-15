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
        fillColor: "#e6ecef",
        fillOpacity: 1,
        weight: 1,
        color: "#8fa1ad"
    };

    const HOVER_BASE_STYLE = {
        fillColor: "#d5e0e6",
        weight: 2,
        color: "#4f6d7a"
    };

    const MATCH_STYLE = {
        fillColor: "#2b7cff",
        fillOpacity: 1,
        weight: 2,
        color: "#083d77"
    };

    const HOVER_MATCH_STYLE = {
        fillColor: "#1a5ed8",
        fillOpacity: 1,
        weight: 3,
        color: "#052a52"
    };

    const renderer = L.canvas();

    /* =========================
       FEATURE REGISTRY
    ========================= */

    const featureLayers = [];

    function applyStyle(layer) {
        if (layer._filteredOut) {
            layer.setStyle({
                fillColor: "#e8ecef",
                fillOpacity: 0.06,
                weight: 0.5,
                color: "#c0ccd3"
            });
            return;
        }

        if (layer._hasActiveFilters) {
            layer.setStyle(layer._isMatch ? MATCH_STYLE : BASE_STYLE);
        } else {
            layer.setStyle(BASE_STYLE);
        }
    }

    function bindInteractive(layer, place, fallbackLabel) {
        const label = place?.name || fallbackLabel || "Unknown";

        // 🔑 VIGTIGT: bind place direkte på layer
        layer._place = place || null;

        layer.bindTooltip(label, { sticky: true });

        if (place?.url) {
            layer.on("click", () => {
                window.location.href = place.url;
            });
        }

        layer.on("mouseover", () => {
            if (layer._filteredOut) return;

            if (layer._hasActiveFilters) {
                if (layer._isMatch) {
                    layer.setStyle(HOVER_MATCH_STYLE);
                }
            } else {
                layer.setStyle(HOVER_BASE_STYLE);
            }
        });

        layer.on("mouseout", () => {
            applyStyle(layer);
        });

        featureLayers.push(layer);
    }

    /* =========================
       ASYNC LOAD TRACKING
    ========================= */

    let pending = 0;

    function layerDone() {
        pending--;
        if (pending === 0) {
            console.log("All map layers loaded");
            applyFilters();
        }
    }

    function safeFetch(url, onData) {
        pending++;
        fetch(url)
            .then(r => r.ok ? r.json() : Promise.reject(url))
            .then(onData)
            .catch(err => console.warn("Skipped:", err))
            .finally(layerDone);
    }

    /* =========================
       LOAD DATA
    ========================= */

    safeFetch(`${window.BASEURL}/assets/data/countries.geo.json`, data => {
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

    safeFetch(`${window.BASEURL}/assets/data/admin1.geo.json`, data => {
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

    safeFetch(`${window.BASEURL}/assets/data/uk.geo.json`, data => {
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
       FILTER STATE
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

    function applyFilters() {
        const hasFilters = activeTags.size > 0 || activeMonths.size > 0;

        featureLayers.forEach(layer => {
            const place = layer._place;
            const tags = place?.tags || [];
            const months = (place?.best_months || []).map(String);

            let isMatch = true;

            if (hasFilters) {
                const tagsOK =
                    activeTags.size === 0 ||
                    [...activeTags].every(t => tags.includes(t));

                const monthsOK =
                    activeMonths.size === 0 ||
                    months.some(m => activeMonths.has(m));

                isMatch = tagsOK && monthsOK;
            }

            layer._hasActiveFilters = hasFilters;
            layer._isMatch = isMatch;
            layer._filteredOut = hasFilters && !isMatch;

            applyStyle(layer);
        });
    }

    function renderChips() {
        chipsEl.innerHTML = "";

        [...activeTags].forEach(tag => {
            const chip = document.createElement("span");
            chip.textContent = `${tag} ✕`;
            chip.style.cssText =
                "background:#eceff1;border-radius:14px;padding:0.25rem 0.6rem;font-size:0.85rem;cursor:pointer;";
            chip.onclick = () => {
                activeTags.delete(tag);
                renderChips();
                applyFilters();
            };
            chipsEl.appendChild(chip);
        });

        [...activeMonths].forEach(m => {
            const chip = document.createElement("span");
            chip.textContent = `Month ${m} ✕`;
            chip.style.cssText =
                "background:#eceff1;border-radius:14px;padding:0.25rem 0.6rem;font-size:0.85rem;cursor:pointer;";
            chip.onclick = () => {
                activeMonths.delete(m);
                renderChips();
                applyFilters();
            };
            chipsEl.appendChild(chip);
        });
    }

    applyBtn.onclick = () => {
        activeTags.clear();
        activeMonths.clear();

        panel.querySelectorAll('input[type="checkbox"]:checked')
            .forEach(cb => {
                if (isNaN(cb.value)) activeTags.add(cb.value);
                else activeMonths.add(cb.value);
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
