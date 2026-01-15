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

    // Used when NO filters are active
    const HOVER_BASE_STYLE = {
        fillColor: "#d5e0e6",
        weight: 2,
        color: "#4f6d7a"
    };

    // Match when filters ARE active
    const MATCH_STYLE = {
        fillColor: "#5f93b0",   // strong blue
        fillOpacity: 1,
        weight: 1.5,
        color: "#2f4f5f"
    };

    const HOVER_MATCH_STYLE = {
        fillColor: "#3f7f9f",
        fillOpacity: 1,
        weight: 2.5,
        color: "#1f3f4f"
    };

    const renderer = L.canvas();
    const featureLayers = [];

    function applyStyle(layer) {
        if (layer._filteredOut) {
            layer.setStyle({
                ...BASE_STYLE,
                fillOpacity: 0.08
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

        featureLayers.push({ layer, place });
    }

    /* =========================
       ASYNC LOAD TRACKING
    ========================= */

    let pending = 0;

    function done() {
        pending--;
        if (pending === 0) applyFilters();
    }

    function safeFetch(url, cb) {
        pending++;
        fetch(url)
            .then(r => r.ok ? r.json() : Promise.reject(url))
            .then(cb)
            .catch(() => {})
            .finally(done);
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
       FILTER LOGIC
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

        featureLayers.forEach(({ layer, place }) => {
            const tags = place?.tags || [];
            const months = (place?.best_months || []).map(String);

            const tagsOK =
                activeTags.size === 0 ||
                [...activeTags].every(t => tags.includes(t));

            const monthsOK =
                activeMonths.size === 0 ||
                months.some(m => activeMonths.has(m));

            const isMatch = tagsOK && monthsOK;

            layer._hasActiveFilters = hasFilters;
            layer._isMatch = isMatch;
            layer._filteredOut = hasFilters && !isMatch;

            applyStyle(layer);
        });
    }

    function renderChips() {
        chipsEl.innerHTML = "";

        [...activeTags].forEach(t => {
            const c = document.createElement("span");
            c.textContent = `${t} ✕`;
            c.style.cssText =
                "background:#eceff1;border-radius:14px;padding:0.25rem 0.6rem;font-size:0.85rem;cursor:pointer;";
            c.onclick = () => {
                activeTags.delete(t);
                renderChips();
                applyFilters();
            };
            chipsEl.appendChild(c);
        });

        [...activeMonths].forEach(m => {
            const c = document.createElement("span");
            c.textContent = `Month ${m} ✕`;
            c.style.cssText =
                "background:#eceff1;border-radius:14px;padding:0.25rem 0.6rem;font-size:0.85rem;cursor:pointer;";
            c.onclick = () => {
                activeMonths.delete(m);
                renderChips();
                applyFilters();
            };
            chipsEl.appendChild(c);
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
