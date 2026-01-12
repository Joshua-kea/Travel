console.log("ATLAS.JS LOADED");

document.addEventListener("DOMContentLoaded", () => {
    if (!window.places || window.places.length === 0) {
        console.error("No places loaded from Jekyll");
        return;
    }

    const map = L.map("map", { worldCopyJump: true }).setView([20, 0], 2);

    L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
        { attribution: "© OpenStreetMap & CARTO" }
    ).addTo(map);

    /* ===============================
       BUILD LOOKUPS
    =============================== */

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

    /* ===============================
       STYLES
    =============================== */

    const BASE_STYLE = {
        fillColor: "#cfd8dc",
        fillOpacity: 1,
        weight: 1,
        color: "#ffffff"
    };

    function bindLayer(layer, place, fallbackName) {
        const name = place?.title || fallbackName || "Unknown";

        layer.bindTooltip(name, { sticky: true });

        if (place?.url) {
            layer.on("click", () => {
                window.location.href = place.url;
            });

            layer.on("mouseover", () => layer.setStyle({ weight: 2 }));
            layer.on("mouseout", () => layer.setStyle({ weight: 1 }));
        } else {
            layer.setStyle({ fillOpacity: 0.25 });
        }
    }

    /* ===============================
       LOAD COUNTRIES (ADMIN 0)
    =============================== */

    fetch(window.BASEURL + "/assets/data/countries.geo.json")
        .then(r => r.json())
        .then(data => {
            L.geoJSON(data, {
                style: BASE_STYLE,
                onEachFeature: (feature, layer) => {
                    const props = feature.properties || {};

                    const iso =
                        props.ISO_A3 ||
                        props.ADM0_A3 ||
                        props.ADM0_ISO;

                    if (!iso || iso === "-99") {
                        layer.setStyle({ fillOpacity: 0 });
                        return;
                    }

                    const place = countryByISO[iso.toUpperCase()];
                    bindLayer(layer, place, props.NAME);
                }
            }).addTo(map);
        });

    /* ===============================
       LOAD ADMIN-1 (USA + UK)
    =============================== */

    fetch(window.BASEURL + "/assets/data/admin1.geo.json")
        .then(r => r.json())
        .then(data => {
            L.geoJSON(data, {
                style: BASE_STYLE,
                onEachFeature: (feature, layer) => {
                    const props = feature.properties || {};
                    const iso2 = props.iso_3166_2;

                    if (!iso2) {
                        layer.setStyle({ fillOpacity: 0 });
                        return;
                    }

                    const key = `${props.adm0_a3}:${iso2}`.toUpperCase();
                    const place = adminByKey[key];

                    bindLayer(layer, place, props.name);
                }
            }).addTo(map);
        });
});
