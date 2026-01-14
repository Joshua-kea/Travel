console.log("ATLAS.JS LOADED");

document.addEventListener("DOMContentLoaded", () => {

    if (!window.places || window.places.length === 0) {
        console.error("No places loaded from Jekyll");
        return;
    }

    /* =========================
       MAP
    ========================= */

    const map = L.map("map", { worldCopyJump: true }).setView([20, 0], 2);

    L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
        { attribution: "© OpenStreetMap & CARTO" }
    ).addTo(map);

    map.createPane("countries");
    map.createPane("territories");

    map.getPane("countries").style.zIndex = 300;
    map.getPane("territories").style.zIndex = 500;

    /* =========================
       LOOKUPS
    ========================= */

    const byAdminKey = {};
    window.places.forEach(p => {
        if (p.admin_key) byAdminKey[p.admin_key.toUpperCase()] = p;
    });

    /* =========================
       WORLD COUNTRIES
    ========================= */

    fetch(window.BASEURL + "/assets/data/countries.geo.json")
        .then(r => r.json())
        .then(data => {
            L.geoJSON(data, {
                pane: "countries",
                style: {
                    fillColor: "#cfd8dc",
                    fillOpacity: 1,
                    weight: 1,
                    color: "#90a4ae"
                }
            }).addTo(map);
        });

    /* =========================
       TERRITORIES DEBUG
    ========================= */

    fetch(window.BASEURL + "/assets/data/territories.geo.json")
        .then(r => {
            console.log("territories fetch status:", r.status);
            return r.json();
        })
        .then(data => {
            console.log("territories loaded:", data);
            console.log("territories feature count:", data.features?.length);

            const layer = L.geoJSON(data, {
                pane: "territories",
                style: {
                    fillColor: "red",
                    fillOpacity: 0.9,
                    color: "red",
                    weight: 2
                },
                onEachFeature: (feature, layer) => {
                    console.log("territory feature:", feature.properties);

                    layer.bindTooltip(
                        feature.properties.NAME || "Territory",
                        { sticky: true }
                    );

                    // FORCE zoom so we KNOW if it exists
                    map.fitBounds(layer.getBounds());
                }
            }).addTo(map);

            layer.bringToFront();
        })
        .catch(err => {
            console.error("territories failed to load", err);
        });

});
