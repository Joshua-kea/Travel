console.log("ATLAS.JS LOADED");

document.addEventListener("DOMContentLoaded", () => {
    if (!window.places || window.places.length === 0) {
        console.error("No places from Jekyll");
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
    // BUILD LOOKUP FROM JEKYLL
    // =====================
    const placeByISO = {};
    window.places.forEach(p => {
        if (!p.iso) return;
        placeByISO[p.iso.trim().toUpperCase()] = p;
    });

    console.log("ISO keys loaded:", Object.keys(placeByISO));

    // =====================
    // ISO NORMALIZER (CRITICAL)
    // =====================
    function getCountryISO(props) {
        const candidates = [
            props.SOV_A3,
            props.ADM0_A3,
            props.ISO_A3
        ];

        return candidates.find(v => v && v !== "-99") || null;
    }

    // =====================
    // COUNTRY LAYER
    // =====================
    fetch(window.BASEURL + "/assets/data/countries.geo.json")
        .then(r => r.json())
        .then(data => {
            L.geoJSON(data, {
                style: feature => {
                    const iso = getCountryISO(feature.properties);
                    const place = iso ? placeByISO[iso] : null;

                    return {
                        fillColor: place ? "#cfd8dc" : "#e0e0e0",
                        fillOpacity: place ? 1 : 0.25,
                        weight: 1,
                        color: "#ffffff"
                    };
                },

                onEachFeature: (feature, layer) => {
                    const iso = getCountryISO(feature.properties);
                    const place = iso ? placeByISO[iso] : null;

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

    // =====================
    // ADMIN1 LAYER (USA + UK)
    // =====================
    fetch(window.BASEURL + "/assets/data/admin1.geo.json")
        .then(r => r.json())
        .then(data => {
            L.geoJSON(data, {
                style: feature => ({
                    fillColor: "#b0bec5",
                    fillOpacity: 1,
                    weight: 1,
                    color: "#ffffff"
                }),

                onEachFeature: (feature, layer) => {
                    const props = feature.properties;

                    // Country of admin1
                    const countryISO =
                        props.adm0_a3 ||
                        props.ADM0_A3 ||
                        props.sov_a3 ||
                        null;

                    // Only USA + UK
                    if (!["USA", "GBR"].includes(countryISO)) {
                        layer.setStyle({ fillOpacity: 0 });
                        return;
                    }

                    const slug =
                        props.name_en ||
                        props.name ||
                        props.NAME;

                    if (!slug) return;

                    const urlSlug = slug
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, "-")
                        .replace(/^-|-$/g, "");

                    const url =
                        countryISO === "USA"
                            ? `${window.BASEURL}/countries/usa/${urlSlug}/`
                            : `${window.BASEURL}/countries/uk/${urlSlug}/`;

                    layer.bindTooltip(slug, { sticky: true });

                    layer.on("click", () => {
                        window.location.href = url;
                    });

                    layer.on("mouseover", () => layer.setStyle({ weight: 2 }));
                    layer.on("mouseout", () => layer.setStyle({ weight: 1 }));
                }
            }).addTo(map);
        });
});
