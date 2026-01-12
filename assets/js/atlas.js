console.log("ATLAS.JS LOADED");

document.addEventListener("DOMContentLoaded", () => {
    if (!window.places || window.places.length === 0) {
        console.error("No places from Jekyll");
        return;
    }

    const map = L.map("map", { worldCopyJump: true }).setView([20, 0], 2);

    L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
        { attribution: "© OpenStreetMap & CARTO" }
    ).addTo(map);

    // =====================
    // BUILD LOOKUP
    // =====================
    const placeByISO = {};
    window.places.forEach(p => {
        if (!p.iso) return;
        placeByISO[p.iso.trim().toUpperCase()] = p;
    });

    console.log("ISO keys loaded:", Object.keys(placeByISO));

    const BASE_STYLE = {
        fillColor: "#cfd8dc",
        fillOpacity: 1,
        weight: 1,
        color: "#ffffff"
    };

    fetch(window.BASEURL + "/assets/data/countries.geo.json")
        .then(r => r.json())
        .then(data => {
            L.geoJSON(data, {
                style: BASE_STYLE,

                onEachFeature: (feature, layer) => {
                    const props = feature.properties || {};

                    let iso = null;

                    if (props.ISO_A3 && props.ISO_A3 !== "-99") {
                        iso = props.ISO_A3;
                    } else if (props.ADM0_A3) {
                        iso = props.ADM0_A3;
                    } else if (props.ADM0_A3_EH) {
                        iso = props.ADM0_A3_EH;
                    } else if (props.ISO_A3_EH) {
                        iso = props.ISO_A3_EH;
                    }

                    iso = iso?.trim().toUpperCase();

                    const place = iso ? placeByISO[iso] : null;

                    const displayName =
                        place?.title ||
                        props.NAME ||
                        "Unknown";

                    layer.bindTooltip(displayName, { sticky: true });

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
            }).addTo(map);
        });
});