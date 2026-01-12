console.log("ATLAS.JS LOADED");

document.addEventListener("DOMContentLoaded", () => {
    if (!window.places || window.places.length === 0) {
        console.error("No places loaded from Jekyll");
        return;
    }

    // =====================
    // MAP
    // =====================
    const map = L.map("map", { worldCopyJump: true }).setView([20, 0], 2);

    L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
        { attribution: "© OpenStreetMap & CARTO" }
    ).addTo(map);

    // =====================
    // LOOKUP TABLE
    // =====================
    const placeByKey = {};
    window.places.forEach(p => {
        if (p.admin_key) {
            placeByKey[p.admin_key.toUpperCase()] = p;
        }
        if (p.iso) {
            placeByKey[p.iso.toUpperCase()] = p;
        }
    });

    console.log("Place keys:", Object.keys(placeByKey).slice(0, 20));

    // =====================
    // STYLES
    // =====================
    const BASE_STYLE = {
        fillColor: "#cfd8dc",
        fillOpacity: 1,
        weight: 1,
        color: "#ffffff"
    };

    function attachInteraction(layer, place, label) {
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
    // ADMIN-1 LAYER (USA STATES)
    // =====================
    fetch(window.BASEURL + "/assets/data/admin1.geo.json")
        .then(r => r.json())
        .then(data => {
            L.geoJSON(data, {
                style: BASE_STYLE,
                onEachFeature: (feature, layer) => {
                    const iso2 = feature.properties?.iso_a2;
                    const region = feature.properties?.region_code || feature.properties?.iso_3166_2;
                    const name = feature.properties?.name;

                    if (!iso2 || !region) {
                        layer.setStyle({ fillOpacity: 0 });
                        return;
                    }

                    const adminKey = `${iso2}:${region.toLowerCase()}`.toUpperCase();
                    const place = placeByKey[adminKey];

                    attachInteraction(layer, place, name);
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

                    const place = placeByKey[iso.toUpperCase()];
                    const name = feature.properties?.NAME || "Unknown";

                    attachInteraction(layer, place, name);
                }
            }).addTo(map);
        });
});
