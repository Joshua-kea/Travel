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

    // 🔧 FIX: tooltips must be above polygons
    map.getPane("tooltipPane").style.zIndex = 450;

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

    /* =========================
       MAP REGISTRY
    ========================= */

    const layers = [];

    function bindLayer(layer, place, label) {
        layer._place = place || null;
        layer._hasFilters = false;
        layer._isMatch = true;

        layer.bindTooltip(label, {
            sticky: true,
            direction: "center"
        });

        if (place?.url) {
            layer.on("click", () => location.href = place.url);
        }

        layer.on("mouseover", () => {
            // 🔧 FIX: hovered layer MUST be on top
            layer.bringToFront();
        });

        layers.push(layer);
    }

    /* =========================
       LOAD GEO DATA
    ========================= */

    fetch(`${window.BASEURL}/assets/data/countries.geo.json`)
        .then(r => r.json())
        .then(data => {
            L.geoJSON(data, {
                pane: "countries",
                style: {
                    fillColor: "#e8eef1",
                    fillOpacity: 1,
                    weight: 0.8,
                    color: "#a9bcc8"
                },
                filter: f => {
                    const key = getCountryKey(f.properties);
                    return key && key !== "USA" && key !== "GBR";
                },
                onEachFeature: (f, l) => {
                    bindLayer(l, byISO[getCountryKey(f.properties)], f.properties.NAME);
                }
            }).addTo(map);
        });

    fetch(`${window.BASEURL}/assets/data/admin1.geo.json`)
        .then(r => r.json())
        .then(data => {
            const usa = data.features.filter(f => f.properties?.adm0_a3 === "USA");
            L.geoJSON(usa, {
                pane: "subdivisions",
                style: {
                    fillColor: "#e8eef1",
                    fillOpacity: 1,
                    weight: 0.8,
                    color: "#a9bcc8"
                },
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
                style: {
                    fillColor: "#e8eef1",
                    fillOpacity: 1,
                    weight: 0.8,
                    color: "#a9bcc8"
                },
                onEachFeature: (f, l) => {
                    const iso = f.properties?.ISO_1 || "GB-ENG";
                    const labels = {
                        "GB-ENG": "England",
                        "GB-SCT": "Scotland",
                        "GB-WLS": "Wales",
                        "GB-NIR": "Northern Ireland"
                    };
                    bindLayer(l, byAdminKey[`GBR:${iso}`], labels[iso]);
                }
            }).addTo(map);
        });

});
