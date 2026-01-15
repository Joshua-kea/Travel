console.log("ATLAS.JS LOADED");

document.addEventListener("DOMContentLoaded", () => {

    if (!window.places || window.places.length === 0) {
        console.error("No places loaded from Jekyll");
        return;
    }

    const map = L.map("map", {
        worldCopyJump: true,
        zoomControl: true,
        zoomAnimation: false,
        fadeAnimation: false,
        preferCanvas: true
    }).setView([20, 0], 2);

    L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
        {
            attribution: "© OpenStreetMap & CARTO",
            updateWhenZooming: false,
            updateWhenIdle: true
        }
    ).addTo(map);

    map.createPane("countries");
    map.createPane("territories");
    map.createPane("subdivisions");

    map.getPane("countries").style.zIndex = 300;
    map.getPane("territories").style.zIndex = 350;
    map.getPane("subdivisions").style.zIndex = 400;

    const byISO = Object.create(null);
    const byAdminKey = Object.create(null);

    window.places.forEach(p => {
        if (p.iso) byISO[p.iso.toUpperCase()] = p;
        if (p.admin_key) byAdminKey[p.admin_key.toUpperCase()] = p;
    });

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

    function bindInteractive(layer, place, fallbackLabel) {
        const label = place?.name || fallbackLabel || "Unknown";
        layer.bindTooltip(label, { sticky: true });

        if (place?.url) {
            layer.on("click", () => {
                window.location.href = place.url;
            });
        }

        layer.on("mouseover", () => layer.setStyle(HOVER_STYLE));
        layer.on("mouseout", () => layer.setStyle(BASE_STYLE));
    }

    const canvasRenderer = L.canvas();

    /* === COUNTRIES === */
    fetch(`${window.BASEURL}/assets/data/countries.geo.json`)
        .then(r => r.json())
        .then(data => {
            L.geoJSON(data, {
                pane: "countries",
                style: BASE_STYLE,
                renderer: canvasRenderer,
                interactive: true,
                onEachFeature: (feature, layer) => {
                    const p = feature.properties || {};
                    const iso =
                        (p.ISO_A3 && p.ISO_A3 !== "-99" && p.ISO_A3) ||
                        (p.ADM0_A3 && p.ADM0_A3 !== "-99" && p.ADM0_A3) ||
                        (p.SOV_A3 && p.SOV_A3 !== "-99" && p.SOV_A3);

                    if (!iso || iso === "USA" || iso === "GBR") return;
                    bindInteractive(layer, byISO[iso], p.NAME);
                }
            }).addTo(map);
        });

    /* === USA STATES === */
    fetch(`${window.BASEURL}/assets/data/admin1.geo.json`)
        .then(r => r.json())
        .then(data => {
            const usa = {
                type: "FeatureCollection",
                features: data.features.filter(f => f.properties?.adm0_a3 === "USA")
            };

            L.geoJSON(usa, {
                pane: "subdivisions",
                style: BASE_STYLE,
                renderer: canvasRenderer,
                interactive: true,
                onEachFeature: (feature, layer) => {
                    const p = feature.properties;
                    const key = `USA:${p.iso_3166_2}`.toUpperCase();
                    bindInteractive(layer, byAdminKey[key], p.name);
                }
            }).addTo(map);
        });

    /* === UK === */
    fetch(`${window.BASEURL}/assets/data/uk.geo.json`)
        .then(r => r.json())
        .then(data => {
            L.geoJSON(data, {
                pane: "subdivisions",
                style: BASE_STYLE,
                renderer: canvasRenderer,
                interactive: true,
                onEachFeature: (feature, layer) => {
                    const iso1 = feature.properties?.ISO_1 || "GB-ENG";
                    const key = `GBR:${iso1}`.toUpperCase();

                    const labelMap = {
                        "GB-ENG": "England",
                        "GB-SCT": "Scotland",
                        "GB-WLS": "Wales",
                        "GB-NIR": "Northern Ireland"
                    };

                    bindInteractive(layer, byAdminKey[key], labelMap[iso1]);
                }
            }).addTo(map);
        });

    /* === TERRITORIES === */
    fetch(`${window.BASEURL}/assets/data/territories.geo.json`)
        .then(r => r.json())
        .then(data => {
            L.geoJSON(data, {
                pane: "territories",
                style: BASE_STYLE,
                renderer: canvasRenderer,
                interactive: true,
                onEachFeature: (feature, layer) => {
                    const key = feature.properties?.ADMIN_KEY?.toUpperCase();
                    if (!key) return;
                    bindInteractive(layer, byAdminKey[key], feature.properties.NAME);
                }
            }).addTo(map);
        });

});
