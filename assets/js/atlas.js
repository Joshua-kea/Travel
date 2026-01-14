console.log("ATLAS.JS LOADED");

document.addEventListener("DOMContentLoaded", () => {

    if (!window.places || window.places.length === 0) {
        console.error("No places loaded from Jekyll");
        return;
    }

    /* =========================
       MAP + PANES
    ========================= */

    const map = L.map("map", { worldCopyJump: true }).setView([20, 0], 2);

    L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
        { attribution: "© OpenStreetMap & CARTO" }
    ).addTo(map);

    map.createPane("countries");
    map.createPane("subdivisions");

    map.getPane("countries").style.zIndex = 200;
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
       STYLES
    ========================= */

    const COUNTRY_STYLE = {
        fillColor: "#cfd8dc",
        fillOpacity: 0.35,   // 🔑 gør at UK/USA kan ses under
        weight: 0.5,
        color: "#ffffff"
    };

    const SUBDIVISION_STYLE = {
        fillColor: "#cfd8dc",
        fillOpacity: 1,
        weight: 1,
        color: "#90a4ae"
    };

    /* =========================
       SHARED BIND
    ========================= */

    function bindLayer(layer, place, label) {
        layer.bindTooltip(label, { sticky: true });

        if (place?.url) {
            layer.on("click", () => {
                window.location.href = place.url;
            });

            layer.on("mouseover", () => {
                layer.setStyle({
                    weight: 2,
                    color: "#455a64"
                });
            });

            layer.on("mouseout", () => {
                layer.setStyle(SUBDIVISION_STYLE);
            });
        }
    }

    /* =========================
       COUNTRIES (BACKGROUND)
    ========================= */

    fetch(window.BASEURL + "/assets/data/countries.geo.json")
        .then(r => r.json())
        .then(data => {

            L.geoJSON(data, {
                pane: "countries",
                style: COUNTRY_STYLE,
                interactive: false,
                onEachFeature: (feature, layer) => {
                    const p = feature.properties || {};

                    const iso =
                        p.ISO_A3 || p.ADM0_A3 || p.SOV_A3;

                    if (!iso) return;
                    if (iso === "USA" || iso === "GBR") return;

                    const place = byISO[iso.toUpperCase()];
                    layer.bindTooltip(place?.name || p.NAME, { sticky: true });
                }
            }).addTo(map);
        });

    /* =========================
       USA – STATES
    ========================= */

    fetch(window.BASEURL + "/assets/data/admin1.geo.json")
        .then(r => r.json())
        .then(data => {

            const usaOnly = {
                type: "FeatureCollection",
                features: data.features.filter(
                    f => f.properties?.adm0_a3 === "USA"
                )
            };

            L.geoJSON(usaOnly, {
                pane: "subdivisions",
                style: SUBDIVISION_STYLE,
                onEachFeature: (feature, layer) => {
                    const p = feature.properties;
                    if (!p?.iso_3166_2) return;

                    const key = `USA:${p.iso_3166_2}`.toUpperCase();
                    const place = byAdminKey[key];

                    bindLayer(layer, place, p.name);
                }
            }).addTo(map);
        });

    /* =========================
       UK – CONSTITUENT COUNTRIES
    ========================= */

    fetch(window.BASEURL + "/assets/data/uk.geo.json")
        .then(r => r.json())
        .then(data => {

            L.geoJSON(data, {
                pane: "subdivisions",
                style: SUBDIVISION_STYLE,
                onEachFeature: (feature, layer) => {
                    const p = feature.properties;

                    const iso = p.ISO_1;
                    if (!iso) return;

                    const key = `GBR:${iso}`.toUpperCase();
                    const place = byAdminKey[key];

                    // 🔑 FIX: NAME_1 kan være "NA"
                    const label =
                        p.NAME_1 && p.NAME_1 !== "NA"
                            ? p.NAME_1
                            : iso === "GB-ENG" ? "England"
                                : iso === "GB-SCT" ? "Scotland"
                                    : iso === "GB-WLS" ? "Wales"
                                        : iso === "GB-NIR" ? "Northern Ireland"
                                            : "United Kingdom";

                    bindLayer(layer, place, label);
                }
            }).addTo(map);
        });
});
