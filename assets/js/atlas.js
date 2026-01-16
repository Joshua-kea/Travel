console.log("ATLAS – FILTERS ACTUALLY WORK");

document.addEventListener("DOMContentLoaded", () => {

    if (!window.places?.length) return;

    /* =========================
       MAP
    ========================= */

    const INITIAL_VIEW = { center: [20, 0], zoom: 3 };

    const map = L.map("map", {
        zoomControl: true,
        worldCopyJump: false
    }).setView(INITIAL_VIEW.center, INITIAL_VIEW.zoom);

    L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
        { attribution: "© OpenStreetMap & CARTO", noWrap: true }
    ).addTo(map);

    map.zoomControl.setPosition("bottomright");

    map.createPane("countries");
    map.createPane("subdivisions");
    map.getPane("countries").style.zIndex = 300;
    map.getPane("subdivisions").style.zIndex = 400;

    window.addEventListener("pageshow", () => {
        map.setView(INITIAL_VIEW.center, INITIAL_VIEW.zoom, { animate: false });
    });

    /* =========================
       LOOKUPS
    ========================= */

    const byISO = {};
    const byAdminKey = {};

    window.places.forEach(p => {
        if (p.iso) byISO[p.iso.toUpperCase()] = p;
        if (p.admin_key) byAdminKey[p.admin_key.toUpperCase()] = p;
    });

    function getCountryKey(p = {}) {
        if (p.ADM0_A3 && p.ADM0_A3 !== "-99") return p.ADM0_A3;
        if (p.ISO_A3 && p.ISO_A3 !== "-99") return p.ISO_A3;
        if (p.SOV_A3 && p.SOV_A3 !== "-99") return p.SOV_A3;
        return null;
    }

    function normalizeMonths(value) {
        return Array.isArray(value) ? value.map(String) : [];
    }

    /* =========================
       FILTER STATE
    ========================= */

    const activeTags = new Set();
    const activeMonths = new Set();

    function placeMatchesFilters(place) {
        const tags = place?.tags || [];
        const months = normalizeMonths(place?.best_months);

        if (activeTags.size) {
            if (![...activeTags].every(t => tags.includes(t))) return false;
        }

        if (activeMonths.size) {
            if (!months.some(m => activeMonths.has(m))) return false;
        }

        return true;
    }

    /* =========================
       STYLES
    ========================= */

    const STYLE_BASE = { fillColor:"#e8eef1", fillOpacity:1, weight:0.8, color:"#a9bcc8" };
    const STYLE_DIM  = { fillColor:"#f8f9fa", fillOpacity:1, weight:0.5, color:"#e1e4e6" };
    const STYLE_MATCH = { fillColor:"#6b8f9c", fillOpacity:1, weight:1.5, color:"#4e6f7c" };
    const STYLE_MATCH_HOVER = { fillColor:"#577f8c", fillOpacity:1, weight:2.5, color:"#3e5f6b" };
    const STYLE_HOVER_NORMAL = { fillColor:"#d6e1e7", fillOpacity:1, weight:2, color:"#7d98a6" };

    /* =========================
       REGISTRY
    ========================= */

    const layers = [];

    function bindLayer(layer, place, label) {
        layer._place = place || null;
        layer._hasFilters = false;
        layer._isMatch = true;

        layer.bindTooltip(label, { sticky: true });

        if (place?.url) {
            layer.on("click", () => window.location.href = place.url);
        }

        layer.on("mouseover", () => {
            layer.bringToFront();
            if (!layer._hasFilters) layer.setStyle(STYLE_HOVER_NORMAL);
            else if (layer._isMatch) layer.setStyle(STYLE_MATCH_HOVER);
        });

        layer.on("mouseout", () => applyStyle(layer));
        layers.push(layer);
    }

    function applyStyle(layer) {
        if (!layer._hasFilters) layer.setStyle(STYLE_BASE);
        else if (layer._isMatch) layer.setStyle(STYLE_MATCH);
        else layer.setStyle(STYLE_DIM);
    }

    /* =========================
       LOAD DATA (kort)
    ========================= */

    fetch(`${window.BASEURL}/assets/data/countries.geo.json`)
        .then(r => r.json())
        .then(data => {
            L.geoJSON(data, {
                pane: "countries",
                style: STYLE_BASE,
                filter: f => {
                    const key = getCountryKey(f.properties);
                    return key && key !== "USA" && key !== "GBR";
                },
                onEachFeature: (f, l) => {
                    bindLayer(l, byISO[getCountryKey(f.properties)], f.properties.NAME);
                }
            }).addTo(map);
        });

    /* =========================
       FILTER UI
    ========================= */

    const panel = document.getElementById("filterPanel");
    const toggleBtn = document.getElementById("toggleFilterPanel");
    const applyBtn = document.getElementById("applyFilterBtn");
    const clearBtn = document.getElementById("clearFilterBtn");
    const chipsEl = document.getElementById("activeFilters");

    toggleBtn.onclick = () => {
        panel.style.display = panel.style.display === "none" ? "block" : "none";
    };

    function renderChips() {
        chipsEl.innerHTML = "";
        activeTags.forEach(tag => {
            const chip = document.createElement("span");
            chip.textContent = `${tag} ×`;
            chip.style.cssText = `
              background:#6b8f9c;color:white;
              padding:0.25rem 0.7rem;border-radius:999px;
              cursor:pointer;font-size:0.75rem;
            `;
            chip.onclick = () => {
                activeTags.delete(tag);
                renderChips();
                applyFilters();
            };
            chipsEl.appendChild(chip);
        });
    }

    function applyFilters() {
        const hasFilters = activeTags.size || activeMonths.size;

        layers.forEach(layer => {
            const match = placeMatchesFilters(layer._place);
            layer._hasFilters = hasFilters;
            layer._isMatch = match;
            applyStyle(layer);
        });

        if (listView.style.display === "block") {
            renderList();
        }
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
        panel.querySelectorAll("input[type='checkbox']").forEach(cb => cb.checked = false);
        renderChips();
        applyFilters();
        panel.style.display = "none";
    };

    /* =========================
       LIST VIEW
    ========================= */

    const mapView = document.getElementById("mapView");
    const listView = document.getElementById("listView");
    const mapBtn = document.getElementById("viewMapBtn");
    const listBtn = document.getElementById("viewListBtn");
    const listEl = document.getElementById("placeList");

    function renderList() {
        listEl.innerHTML = "";

        window.places
            .filter(placeMatchesFilters)
            .forEach(place => {
                const li = document.createElement("li");
                li.style.cssText = `
                  padding:1rem;background:#f6f8f9;
                  border-radius:10px;cursor:pointer;
                `;
                li.innerHTML = `
                  <strong>${place.name}</strong><br>
                  <span style="font-size:0.75rem;color:#6b7280;">
                    ${place.tags?.join(", ") || ""}
                  </span>
                `;
                li.onclick = () => window.location.href = place.url;
                listEl.appendChild(li);
            });
    }

    mapBtn.onclick = () => {
        mapView.style.display = "block";
        listView.style.display = "none";
        map.invalidateSize();
    };

    listBtn.onclick = () => {
        mapView.style.display = "none";
        listView.style.display = "block";
        renderList();
    };

});
