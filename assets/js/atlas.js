console.log("ATLAS.JS LOADED");

document.addEventListener("DOMContentLoaded", () => {

    if (!window.places || window.places.length === 0) {
        console.error("No places from Jekyll");
        return;
    }

    // =====================
    // MAP SETUP
    // =====================
    const map = L.map("map", {
        worldCopyJump: true
    }).setView([20, 0], 2);

    L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
        { attribution: "© OpenStreetMap & CARTO" }
    ).addTo(map);

    // =====================
    // PANES (ORDER MATTERS)
    // =====================
    map.createPane("countries");
    map.getPane("countries").style.zIndex = 400;

    map.createPane("admin");
    map.getPane("admin").style.zIndex = 500;

    // =====================
    // BUILD LOOKUPS
    // =====================
    const countryByISO = {};
    const adminByKey = {};

    window.places.forEach(p => {
        if (p.iso) {
            countryByISO[p.iso.trim().toUpperCase()] = p;
        }
        if (p.admin_key) {
            adminByKey[p.admin_key.trim().toUpperCase()] = p;
        }
    });

    console.log("Countries:", Object.keys(countryByISO).length);
    console.log("Admin regions:", Object.keys(adminByKey).length);

    // =====================
    // COUNTRY LAYER (NON-INTERACTIVE)
    // =====================
    fetch(window.BASEURL + "/assets/data/countries.geo.json")
        .then(r => r.json())
        .then(data => {
            L.geoJSON(data, {
                pane: "countries",
                interactive: false, // 🔴 IMPORTANT
                style: {
                    fillColor: "#cfd8dc",
                    fillOpacity: 1,
                    weight: 1,
                    color: "#ffffff"
                }
            }).addTo(map);
        });

    // =====================
    // ADMIN1 LAYER (USA + UK ETC)
    // =====================
    fetch(window.BASEURL + "/assets/data/admin1.geo.json")
        .then(r => r.json())
        .then(data => {

            L.geoJSON(data, {
                pane: "admin",
                interactive: true,
                style: {
                    fillColor: "#b0bec5",
                    fillOpacity: 1,
                    weight: 1,
                    color: "#ffffff"
                },

                onEachFeature: (feature, layer) => {

                    const iso2 = feature.properties?.iso_a2;
                    const region =
                        feature.properties?.iso_3166_2 ||
                        feature.properties?.region_code;

                    if (!iso2 || !region) {
                        layer.setStyle({ fillOpacity: 0 });
                        return;
                    }

                    const key = `${iso2}:${region}`.toUpperCase();
                    const place = adminByKey[key];

                    // TOOLTIP (ALWAYS ON ADMIN)
                    layer.bindTooltip(
                        feature.properties?.name || "Unknown",
                        {
                            sticky: true,
                            direction: "top",
                            offset: [0, -10]
                        }
                    );

                    if (!place) {
                        layer.setStyle({ fillOpacity: 0.35 });
                        return;
                    }

                    layer.on("click", () => {
                        window.location.href = place.url;
                    });

                    layer.on("mouseover", () => {
                        layer.setStyle({ weight: 2 });
                    });

                    layer.on("mouseout", () => {
                        layer.setStyle({ weight: 1 });
                    });
                }
            }).addTo(map);
        });

});
