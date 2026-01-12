console.log("ATLAS.JS LOADED");

document.addEventListener("DOMContentLoaded", () => {

    if (!window.places || window.places.length === 0) {
        console.error("No places from Jekyll");
        return;
    }

    const map = L.map("map", { worldCopyJump: true })
        .setView([20, 0], 2);

    L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
        { attribution: "© OpenStreetMap & CARTO" }
    ).addTo(map);

    // =====================
    // PLACE LOOKUP
    // =====================
    const placeByISO = {};
    window.places.forEach(p => {
        if (!p.iso) return;
        placeByISO[p.iso.trim().toUpperCase()] = p;
    });

    const BASE_STYLE = {
        fillColor: "#cfd8dc",
        fillOpacity: 1,
        weight: 1,
        color: "#ffffff"
    };

    // =====================
    // ADMIN 0 – COUNTRIES
    // =====================
    fetch(window.BASEURL + "/assets/data/countries.geo.json")
        .then(r => r.json())
        .then(data => {
            L.geoJSON(data, {
                style: BASE_STYLE,
                onEachFeature: (feature, layer) => {

                    const iso =
                        feature.properties?.ADM0_A3 ||
                        feature.properties?.ISO_A3 ||
                        feature.properties?.ISO_A3_EH;

                    if (!iso || iso === "-99") return;

                    const place = placeByISO[iso];

                    if (!place) {
                        layer.setStyle({ fillOpacity: 0.25 });
                        return;
                    }

                    layer.bindTooltip(place.title, { sticky: true });

                    layer.on("click", () => {
                        window.location.href = place.url;
                    });
                }
            }).addTo(map);
        });

    // =====================
    // ADMIN 1 – USA + UK
    // =====================
    fetch(window.BASEURL + "/assets/data/admin1.geo.json")
        .then(r => r.json())
        .then(data => {
            L.geoJSON(data, {
                style: {
                    fillColor: "#b0bec5",
                    fillOpacity: 1,
                    weight: 1,
                    color: "#ffffff"
                },
                onEachFeature: (feature, layer) => {

                    const country = feature.properties?.adm0_a3 ||
                        feature.properties?.ADM0_A3;

                    if (!["USA", "GBR"].includes(country)) return;

                    const name = feature.properties.name_en || feature.properties.name;

                    layer.bindTooltip(name, { sticky: true });

                    layer.on("click", () => {
                        console.log("Clicked:", name);
                    });
                }
            }).addTo(map);
        });

});
