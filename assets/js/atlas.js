console.log("ATLAS.JS LOADED");

document.addEventListener("DOMContentLoaded", () => {
    if (!window.places || window.places.length === 0) {
        console.error("No places loaded");
        return;
    }

    const map = L.map("map", { worldCopyJump: true }).setView([20, 0], 2);

    L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
        { attribution: "© OpenStreetMap & CARTO" }
    ).addTo(map);

    // =====================
    // PANES (VIGTIGT)
    // =====================
    map.createPane("countries");
    map.createPane("admin");
    map.getPane("admin").style.zIndex = 650;
    map.getPane("countries").style.zIndex = 400;
    map.getPane("countries").style.pointerEvents = "none";

    // =====================
    // LOOKUPS
    // =====================
    const countryByISO3 = {};
    const adminByKey = {};

    window.places.forEach(p => {
        if (p.iso) countryByISO3[p.iso.toUpperCase()] = p;
        if (p.admin_key) adminByKey[p.admin_key.toUpperCase()] = p;
    });

    // =====================
    // STYLES
    // =====================
    const BASE_STYLE = {
        fillColor: "#cfd8dc",
        fillOpacity: 1,
        weight: 1,
        color: "#ffffff"
    };

    function attach(layer, place, label) {
        layer.bindTooltip(label, { sticky: true });

        if (!place) {
            layer.setStyle({ fillOpacity: 0.25 });
            return;
        }

        layer.on("click", () => {
            window.location.href = place.url;
        });

        layer.on("mouseover", () => layer.setStyle({ weight: 2 }));
        layer.on("mouseout", () => layer.setStyle({ weight: 1 }));
    }

    // =====================
    // ADMIN1 LAYER (USA STATES)
    // =====================
    fetch(window.BASEURL + "/assets/data/admin1.geo.json")
        .then(r => r.json())
        .then(data => {
            L.geoJSON(data, {
                pane: "admin",
                style: BASE_STYLE,
                onEachFeature: (feature, layer) => {
                    const iso2 = feature.properties?.iso_a2;
                    const region =
                        feature.properties?.iso_3166_2 ||
                        feature.properties?.region_code;

                    if (!iso2 || !region) {
                        layer.setStyle({ fillOpacity: 0 });
                        return;
                    }

                    const key = `${iso2}:${region.toLowerCase()}`.toUpperCase();
                    const place = adminByKey[key];

                    attach(layer, place, feature.properties?.name || "Unknown");
                }
            }).addTo(map);
        });

    // =====================
    // COUNTRY LAYER
    // =====================
    fetch(window.BASEURL + "/assets/data/countries.geo.json")
        .then(r => r.json())
        .then(data => {
            L.geoJSON(data, {
                pane: "countries",
                style: BASE_STYLE,
                onEachFeature: (feature, layer) => {
                    const iso =
                        feature.properties?.ISO_A3_EH ||
                        feature.properties?.ISO_A3 ||
                        feature.properties?.ADM0_A3;

                    if (!iso || iso === "-99") {
                        layer.setStyle({ fillOpacity: 0 });
                        return;
                    }

                    const place = countryByISO3[iso.toUpperCase()];
                    attach(layer, place, feature.properties?.NAME || "Unknown");
                }
            }).addTo(map);
        });
});
