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

    map.createPane("world");
    map.createPane("subdivisions");

    map.getPane("world").style.zIndex = 300;
    map.getPane("subdivisions").style.zIndex = 400;

    /* =========================
       LOOKUPS
    ========================= */

    const byISO = {};
    const byAdminKey = {};

    window.places.forEach(p => {
        if (p.iso) byISO[p.iso.toUpperCase()] = p;
        if (p.admin_key) byAdminKey[p.admin_key.toUpperCase()] = p;
    });

    /* =========================
       STYLE (ONE STYLE FOR ALL)
    ========================= */

    const FEATURE_STYLE = {
        fillColor: "#cfd8dc",
        fillOpacity: 1,
        weight: 1,
        color: "#90a4ae"
    };

    /* =========================
       INTERACTION
    ========================= */

    function bindInteractive(layer, place, label) {
        layer.bindTooltip(label, { sticky: true });

        if (place?.permalink) {
            layer.on("click", () => {
                window.location.href = place.permalink;
            });
            layer.getElement()?.classList.add("clickable");
        }

        layer.on("mouseover", () => {
            layer.setStyle({
                weight: 2,
                color: "#455a64",
                fillColor: "#b0bec5"
            });
        });

        layer.on("mouseout", () => {
            layer.setStyle(FEATURE_STYLE);
        });
    }

    /* =========================
       WORLD COUNTRIES
    ========================= */

    fetch(window.BASEURL + "/assets/data/countries.geo.json")
        .then(r => r.json())
        .then(data => {

            L.geoJSON(data, {
                pane: "world",
                style: FEATURE_STYLE,
                onEachFeature: (feature, layer) => {
                    const p = feature.properties || {};

                    const blocked = ["USA", "GBR"];

                    const isoCandidates = [
                        p.ISO_A3,
                        p.ADM0_A3,
                        p.SOV_A3
                    ].filter(Boolean);

                    if (isoCandidates.some(code => blocked.includes(code))) return;

                    const iso = isoCandidates[0];


                    const place = byISO[iso.toUpperCase()];
                    const label = place?.name || p.NAME || "Unknown";

                    bindInteractive(layer, place, label);
                }
            }).addTo(map);
        });

    /* =========================
       USA STATES
    ========================= */

    fetch(window.BASEURL + "/assets/data/admin1.geo.json")
        .then(r => r.json())
        .then(data => {

            const usa = {
                type: "FeatureCollection",
                features: data.features.filter(
                    f => f.properties?.adm0_a3 === "USA"
                )
            };

            L.geoJSON(usa, {
                pane: "subdivisions",
                style: FEATURE_STYLE,
                onEachFeature: (feature, layer) => {
                    const p = feature.properties;
                    if (!p?.iso_3166_2) return;

                    const key = `USA:${p.iso_3166_2}`.toUpperCase();
                    const place = byAdminKey[key];

                    bindInteractive(layer, place, p.name);
                }
            }).addTo(map);
        });

    /* =========================
       UK COUNTRIES
    ========================= */

    fetch(window.BASEURL + "/assets/data/uk.geo.json")
        .then(r => r.json())
        .then(data => {

            L.geoJSON(data, {
                pane: "subdivisions",
                style: FEATURE_STYLE,
                onEachFeature: (feature, layer) => {
                    const p = feature.properties;
                    if (!p?.ISO_1) return;

                    const key = `GBR:${p.ISO_1}`.toUpperCase();
                    const place = byAdminKey[key];

                    const label =
                        p.ISO_1 === "GB-ENG" ? "England" :
                            p.ISO_1 === "GB-SCT" ? "Scotland" :
                                p.ISO_1 === "GB-WLS" ? "Wales" :
                                    p.ISO_1 === "GB-NIR" ? "Northern Ireland" :
                                        "United Kingdom";

                    bindInteractive(layer, place, label);
                }
            }).addTo(map);
        });
});
