console.log("ATLAS.JS LOADED");

document.addEventListener("DOMContentLoaded", () => {

    if (!window.places || window.places.length === 0) {
        console.error("No places loaded from Jekyll");
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
       LOOKUPS (FROM MD FILES)
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

    const FADED_STYLE = {
        fillColor: "#e6ecef",
        fillOpacity: 0.08,
        weight: 0.5,
        color: "#c0ccd3"
    };

    const MATCH_STYLE = {
        fillColor: "#2b7cff",
        fillOpacity: 1,
        weight: 2,
        color: "#083d77"
    };

    const HOVER_STYLE = {
        weight: 3,
        color: "#052a52"
    };

    const renderer = L.canvas();

    /* =========================
       FEATURE REGISTRY
    ========================= */

    const features = [];

    function applyStyle(f) {
        if (f.filteredOut) {
            f.layer.setStyle(FADED_STYLE);
        } else if (f.hasFilters && f.isMatch) {
            f.layer.setStyle(MATCH_STYLE);
        } else {
            f.layer.setStyle(BASE_STYLE);
        }
    }

    function bindFeature(layer, place, label) {
        layer.bindTooltip(label, { sticky: true });

        if (place?.url) {
            layer.on("click", () => {
                window.location.href = place.url;
            });
        }

        layer.on("mouseover", () => {
            layer.setStyle(HOVER_STYLE);
        });

        layer.on("mouseout", () => {
            applyStyle(layer._featureRef);
        });

        const featureRef = {
            layer,
            place,
            isMatch: true,
            filteredOut: false,
            hasFilters: false
        };

        layer._featureRef = featureRef;
        features.push(featureRef);
    }

    /* =========================
       LOAD COUNTRIES (ADMIN-0)
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
                    const iso = getISO(f.properties);
                    return iso && iso !== "USA" && iso !== "GBR";
                },
                onEachFeature: (f, l) => {
                    const iso = getISO(f.properties);
                    bindFeature(
                        l,
                        byISO[iso],
                        f.properties.NAME
                    );
                }
            }).addTo(map);
        });

    /* =========================
       USA STATES
    ========================= */

    fetch(`${window.BASEURL}/assets/data/admin1.geo.json`)
        .then(r => r.json())
        .then(data => {
            const usa = data.features.filter(
                f => f.properties?.adm0_a3 === "USA"
            );

            L.geoJSON(usa, {
                pane: "subdivisions",
                renderer,
                style: BASE_STYLE,
                onEachFeature: (f, l) => {
                    const key = `USA:${f.properties.iso_3166_2}`.toUpperCase();
                    bindFeature(
                        l,
                        byAdminKey[key],
                        f.properties.name
                    );
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

                    bindFeature(
                        l,
                        byAdminKey[key],
                        labels[iso1]
                    );
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

    const activeTags = new Set();
    const activeMonths = new Set();

    toggleBtn.addEventListener("click", () => {
        panel.style.display =
            panel.style.display === "none" ? "block" : "none";
    });

    function applyFilters() {
        const hasFilters =
            activeTags.size > 0 || activeMonths.size > 0;

        features.forEach(f => {
            const place = f.place;
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

    applyBtn.addEventListener("click", () => {
        activeTags.clear();
        activeMonths.clear();

        panel.querySelectorAll("input[type='checkbox']:checked")
            .forEach(cb => {
                if (isNaN(cb.value)) activeTags.add(cb.value);
                else activeMonths.add(cb.value);
            });

        panel.style.display = "none";
        applyFilters();
    });

    clearBtn.addEventListener("click", () => {
        activeTags.clear();
        activeMonths.clear();
        applyFilters();
        panel.style.display = "none";
    });

});
