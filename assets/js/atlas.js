console.log("ATLAS – FILTERS ACTUALLY WORK");

document.addEventListener("DOMContentLoaded", () => {

    if (!window.places?.length) return;

    /* =========================
       MAP SETUP
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
    map.getPane("tooltipPane").style.zIndex = 450;

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

    /* =========================
       FILTER STATE
    ========================= */

    const activeTags = new Set();
    const activeMonths = new Set();

    function normalizeMonths(value) {
        return Array.isArray(value) ? value.map(v => String(v)) : [];
    }

    function placeMatchesFilters(place) {
        if (!place) return false;

        if (activeTags.size) {
            if (![...activeTags].every(t => place.tags?.includes(t))) return false;
        }

        if (activeMonths.size) {
            const months = normalizeMonths(place.best_months);
            if (!months.some(m => activeMonths.has(m))) return false;
        }

        return true;
    }

    /* =========================
       MAP STYLES
    ========================= */

    const STYLE_BASE = { fillColor:"#e8eef1", fillOpacity:1, weight:0.8, color:"#a9bcc8" };
    const STYLE_DIM  = { fillColor:"#dde5ea", fillOpacity:1, weight:0.5, color:"#c6d2d9" };
    const STYLE_MATCH = { fillColor:"#6b8f9c", fillOpacity:1, weight:1.5, color:"#4e6f7c" };
    const STYLE_MATCH_HOVER = { fillColor:"#577f8c", fillOpacity:1, weight:2.5, color:"#3e5f6b" };
    const STYLE_HOVER_NORMAL = { fillColor:"#d6e1e7", fillOpacity:1, weight:2, color:"#7d98a6" };

    /* =========================
       MAP REGISTRY
    ========================= */

    const layers = [];

    function applyStyle(layer) {
        if (!layer._hasFilters) layer.setStyle(STYLE_BASE);
        else if (layer._isMatch) layer.setStyle(STYLE_MATCH);
        else layer.setStyle(STYLE_DIM);
    }

    function applyFilters() {
        layers.forEach(layer => {
            layer._hasFilters = activeTags.size > 0 || activeMonths.size > 0;
            layer._isMatch = layer._place ? placeMatchesFilters(layer._place) : false;
            applyStyle(layer);
        });
    }

    function bindLayer(layer, place, label) {
        layer._place = place || null;
        layer._hasFilters = false;
        layer._isMatch = true;

        layer.bindTooltip(label || "", { sticky:true, direction:"center" });

        if (place?.url) {
            layer.on("click", () => location.href = place.url);
        }

        layer.on("mouseover", () => {
            layer.bringToFront();
            if (!layer._hasFilters) layer.setStyle(STYLE_HOVER_NORMAL);
            else if (layer._isMatch) layer.setStyle(STYLE_MATCH_HOVER);
        });

        layer.on("mouseout", () => applyStyle(layer));

        layers.push(layer);

        // 🔥 DET HER ER FIXET
        applyFilters();
    }

    /* =========================
       LOAD GEO DATA
    ========================= */

    fetch(`${window.BASEURL}/assets/data/countries.geo.json`)
        .then(r => r.json())
        .then(data => {
            L.geoJSON(data, {
                pane:"countries",
                style:STYLE_BASE,
                filter:f => {
                    const key = getCountryKey(f.properties);
                    return key && key !== "USA" && key !== "GBR";
                },
                onEachFeature:(f,l) => {
                    bindLayer(l, byISO[getCountryKey(f.properties)], f.properties.NAME);
                }
            }).addTo(map);
        });

    fetch(`${window.BASEURL}/assets/data/admin1.geo.json`)
        .then(r => r.json())
        .then(data => {
            const usa = data.features.filter(f => f.properties?.adm0_a3 === "USA");
            L.geoJSON(usa, {
                pane:"subdivisions",
                style:STYLE_BASE,
                onEachFeature:(f,l) => {
                    const key = `USA:${f.properties.iso_3166_2}`.toUpperCase();
                    bindLayer(l, byAdminKey[key], f.properties.name);
                }
            }).addTo(map);
        });

    fetch(`${window.BASEURL}/assets/data/uk.geo.json`)
        .then(r => r.json())
        .then(data => {
            L.geoJSON(data, {
                pane:"subdivisions",
                style:STYLE_BASE,
                onEachFeature:(f,l) => {
                    const p = f.properties || {};
                    let iso = p.ISO_1 || "";
                    let label = "";
                    if (p.GID_1 === "GBR.1_1") { iso="GB-ENG"; label="England"; }
                    else if (iso==="GB-SCT") label="Scotland";
                    else if (iso==="GB-WLS") label="Wales";
                    else if (iso==="GB-NIR") label="Northern Ireland";
                    bindLayer(l, byAdminKey[`GBR:${iso}`], label);
                }
            }).addTo(map);
        });

    /* =========================
       URL TAG INIT
    ========================= */

    const params = new URLSearchParams(window.location.search);
    const tag = params.get("tag");
    if (tag) activeTags.add(tag);

    /* =========================
       VIEW SWITCH (uændret)
    ========================= */

    document.getElementById("viewMapBtn").onclick = () => {
        document.getElementById("mapView").style.display = "block";
        document.getElementById("listView").style.display = "none";
        map.invalidateSize();
    };

    document.getElementById("viewListBtn").onclick = () => {
        document.getElementById("mapView").style.display = "none";
        document.getElementById("listView").style.display = "block";
    };

});
