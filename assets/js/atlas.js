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
       PLACE LOOKUP (SOURCE OF TRUTH)
    ========================= */

    const byISO = {};
    const byAdminKey = {};

    window.places.forEach(p => {
        if (p.iso) byISO[p.iso.toUpperCase()] = p;
        if (p.admin_key) byAdminKey[p.admin_key.toUpperCase()] = p;
    });

    function getISO(props = {}) {
        return (
            props.ISO_A3 ||
            props.ADM0_A3 ||
            props.SOV_A3 ||
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

    const MATCH_STYLE = {
        fillColor: "#2b7cff",
        fillOpacity: 1,
        weight: 2,
        color: "#083d77"
    };

    const HOVER_STYLE = {
        fillColor: "#1a5ed8",
        fillOpacity: 1,
        weight: 3,
        color: "#052a52"
    };

    /* =========================
       FEATURE REGISTRY
    ========================= */

    const features = [];

    function applyStyle(f) {
        if (f.filteredOut) {
            f.layer.setStyle({
                fillOpacity: 0.06,
                weight: 0.5
            });
        } else {
            f.layer.setStyle(f.hasFilters && f.isMatch ? MATCH_STYLE : BASE_STYLE);
        }
    }

    function bind(layer, placeKey, fallbackLabel) {
        layer.bindTooltip(fallbackLabel, { sticky: true });

        layer.on("mouseover", () => {
            if (layer._isMatch) layer.setStyle(HOVER_STYLE);
        });

        layer.on("mouseout", () => applyStyle(layer._featureRef));

        const featureRef = {
            layer,
            placeKey,
            isMatch: true,
            filteredOut: false,
            hasFilters: false
        };

        layer._featureRef = featureRef;
        features.push(featureRef);
    }

    /* =========================
       LOAD COUNTRIES
    ========================= */

    fetch(`${window.BASEURL}/assets/data/countries.geo.json`)
        .then(r => r.json())
        .then(data => {
            L.geoJSON(data, {
                pane: "countries",
                style: BASE_STYLE,
                onEachFeature: (f, l) => {
                    const iso = getISO(f.properties);
                    if (!iso || iso === "USA" || iso === "GBR") return;
                    bind(l, iso.toUpperCase(), f.properties.NAME);
                }
            }).addTo(map);
        });

    fetch(`${window.BASEURL}/assets/data/admin1.geo.json`)
        .then(r => r.json())
        .then(data => {
            data.features
                .filter(f => f.properties?.adm0_a3 === "USA")
                .forEach(f => {
                    const l = L.geoJSON(f, { style: BASE_STYLE }).addTo(map);
                    bind(l, `USA:${f.properties.iso_3166_2}`, f.properties.name);
                });
        });

    fetch(`${window.BASEURL}/assets/data/uk.geo.json`)
        .then(r => r.json())
        .then(data => {
            data.features.forEach(f => {
                const iso = f.properties?.ISO_1 || "GB-ENG";
                const l = L.geoJSON(f, { style: BASE_STYLE }).addTo(map);
                bind(l, `GBR:${iso}`, f.properties.NAME_1 || iso);
            });
        });

    /* =========================
       FILTER LOGIC
    ========================= */

    const activeTags = new Set();
    const activeMonths = new Set();

    function applyFilters() {
        const hasFilters = activeTags.size > 0 || activeMonths.size > 0;

        features.forEach(f => {
            const place =
                byISO[f.placeKey] ||
                byAdminKey[f.placeKey];

            const tags = place?.tags || [];
            const months = (place?.best_months || []).map(String);

            let match = true;

            if (hasFilters) {
                if (activeTags.size > 0) {
                    match = [...activeTags].every(t => tags.includes(t));
                }
                if (match && activeMonths.size > 0) {
                    match = months.some(m => activeMonths.has(m));
                }
            }

            f.hasFilters = hasFilters;
            f.isMatch = match;
            f.filteredOut = hasFilters && !match;

            applyStyle(f);
        });
    }

    /* =========================
       UI
    ========================= */

    document.getElementById("applyFilterBtn").onclick = () => {
        activeTags.clear();
        activeMonths.clear();

        document
            .querySelectorAll("#filterPanel input:checked")
            .forEach(cb => {
                if (isNaN(cb.value)) activeTags.add(cb.value);
                else activeMonths.add(cb.value);
            });

        applyFilters();
    };

    document.getElementById("clearFilterBtn").onclick = () => {
        activeTags.clear();
        activeMonths.clear();
        applyFilters();
    };
});
