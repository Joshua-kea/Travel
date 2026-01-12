console.log("ATLAS.JS v2 LOADED");

document.addEventListener("DOMContentLoaded", () => {

    if (!window.places || window.places.length === 0) {
        console.error("No places from Jekyll");
        return;
    }

    // =========================
    // MAP
    // =========================
    const map = L.map("map", { worldCopyJump: true }).setView([20, 0], 2);

    L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
        { attribution: "© OpenStreetMap & CARTO" }
    ).addTo(map);

    // =========================
    // PLACE LOOKUPS
    // =========================
    const countryByISO = {};
    const adminByKey = {};

    window.places.forEach(p => {
        if (p.iso) {
            countryByISO[p.iso.trim().toUpperCase()] = p;
        }
        if (p.admin_key) {
            adminByKey[p.admin_key] = p;
        }
    });

    // =========================
    // STYLES
    // =========================
    const COUNTRY_STYLE = {
        fillColor: "#cfd8dc",
        fillOpacity: 1,
        weight: 1,
        color: "#ffffff"
    };

    const ADMIN_STYLE = {
        fillColor: "#b0bec5",
        fillOpacity: 1,
        weight: 1,
        color: "#ffffff"
    };

    // =========================
    // COUNTRIES LAYER
    // =========================
    fetch(window.BASEURL + "/assets/data/countries.geo.json")
        .then(r => r.json())
        .then(data => {
            L.geoJSON(data, {
                style: COUNTRY_STYLE,
                onEachFeature: (feature, layer) => {

                    const iso =
                        feature.properties?.ISO_A3 ||
                        feature.properties?.ADM0_A3 ||
                        feature.properties?.SOV_A3;

                    if (!iso || iso === "-99") return;

                    const place = countryByISO[iso];

                    layer.bindTooltip(
                        place?.title || feature.properties.NAME,
                        { sticky: true }
                    );

                    if (!place) {
                        layer.setStyle({ fillOpacity: 0.25 });
                        return;
                    }

                    layer.on("click", () => {
                        window.location.href = place.url;
                    });
                }
            }).addTo(map);
        });

    // =========================
    // ADMIN1 LAYER (USA + UK ONLY)
    // =========================
    fetch(window.BASEURL + "/assets/data/admin1.geo.json")
        .then(r => r.json())
        .then(data => {
            L.geoJSON(data, {
                style: feature => {
                    const country = feature.properties.adm0_a3;
                    if (country === "USA" || country === "GBR") {
                        return ADMIN_STYLE;
                    }
                    return { fillOpacity: 0, interactive: false };
                },

                onEachFeature: (feature, layer) => {
                    const country = feature.properties.adm0_a3;
                    const name = feature.properties.name_en;

                    if (country !== "USA" && country !== "GBR") {
                        layer.options.interactive = false;
                        return;
                    }

                    const key = `${country}:${name.toLowerCase()}`;
                    const place = adminByKey[key];

                    layer.bindTooltip(name, { sticky: true });

                    if (!place) {
                        layer.setStyle({ fillOpacity: 0.25 });
                        return;
                    }

                    layer.on("click", () => {
                        window.location.href = place.url;
                    });
                }
            }).addTo(map);
        });

});
