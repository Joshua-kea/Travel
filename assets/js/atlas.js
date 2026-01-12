console.log("ATLAS.JS LOADED");

document.addEventListener("DOMContentLoaded", () => {

    if (!window.places || window.places.length === 0) {
        console.warn("No places loaded from Jekyll");
        return;
    }

    // =========================
    // MAP SETUP
    // =========================
    const map = L.map("map", { worldCopyJump: true }).setView([20, 0], 2);

    L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
        { attribution: "© OpenStreetMap & CARTO" }
    ).addTo(map);

    // =========================
    // INDEX JEKYLL DATA
    // =========================
    const placeByISO = {};
    window.places.forEach(p => {
        if (!p.iso) return;
        placeByISO[p.iso.trim().toUpperCase()] = p;
    });

    // =========================
    // COUNTRY LAYER
    // =========================
    fetch(window.BASEURL + "/assets/data/countries.geo.json")
        .then(r => r.json())
        .then(data => {

            L.geoJSON(data, {
                style: feature => {
                    const iso =
                        feature.properties.ISO_A3 ||
                        feature.properties.ADM0_A3 ||
                        feature.properties.SOV_A3;

                    const place = placeByISO[iso];

                    return {
                        fillColor: place ? "#cfd8dc" : "#e0e0e0",
                        fillOpacity: place ? 1 : 0.25,
                        weight: 1,
                        color: "#ffffff"
                    };
                },

                onEachFeature: (feature, layer) => {
                    const iso =
                        feature.properties.ISO_A3 ||
                        feature.properties.ADM0_A3 ||
                        feature.properties.SOV_A3;

                    const place = placeByISO[iso];

                    const name =
                        place?.title ||
                        feature.properties.NAME ||
                        feature.properties.ADMIN ||
                        "Unknown";

                    layer.bindTooltip(name, { sticky: true });

                    if (place) {
                        layer.on("click", () => {
                            window.location.href = place.url;
                        });

                        layer.on("mouseover", () => layer.setStyle({ weight: 2 }));
                        layer.on("mouseout", () => layer.setStyle({ weight: 1 }));
                    }
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
                filter: feature => {
                    const country =
                        feature.properties.ADM0_A3 ||
                        feature.properties.adm0_a3;

                    return country === "USA" || country === "GBR";
                },

                style: {
                    fillColor: "#b0bec5",
                    fillOpacity: 0.9,
                    weight: 1,
                    color: "#ffffff"
                },

                onEachFeature: (feature, layer) => {
                    const country =
                        feature.properties.ADM0_A3 ||
                        feature.properties.adm0_a3;

                    let iso = null;

                    if (country === "USA") {
                        iso = feature.properties.iso_3166_2; // US-AL
                    }

                    if (country === "GBR") {
                        const name = feature.properties.name_en?.toLowerCase();
                        if (name?.includes("england")) iso = "ENG";
                        if (name?.includes("scotland")) iso = "SCT";
                        if (name?.includes("wales")) iso = "WLS";
                        if (name?.includes("ireland")) iso = "NIR";
                    }

                    if (!iso) return;

                    const place = placeByISO[iso];

                    layer.bindTooltip(feature.properties.name_en || "Region", {
                        sticky: true
                    });

                    if (place) {
                        layer.on("click", () => {
                            window.location.href = place.url;
                        });
                    }
                }
            }).addTo(map);
        });

});
