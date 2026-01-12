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

    // =============================
    // LOOKUPS
    // =============================
    const countryByISO = {};
    const regionByKey = {};

    window.places.forEach(p => {
        if (p.type === "country" && p.iso) {
            countryByISO[p.iso.toUpperCase()] = p;
        }

        if (p.type === "region") {
            const key = `${p.country_iso}-${p.region_code}`;
            regionByKey[key] = p;
        }
    });

    const BASE_STYLE = {
        fillColor: "#cfd8dc",
        fillOpacity: 1,
        weight: 1,
        color: "#ffffff"
    };

    // =============================
    // COUNTRY LAYER
    // =============================
    fetch(window.BASEURL + "/assets/data/countries.geo.json")
        .then(r => r.json())
        .then(data => {
            L.geoJSON(data, {
                style: BASE_STYLE,
                onEachFeature: (feature, layer) => {
                    const iso =
                        feature.properties?.ADM0_A3 ||
                        feature.properties?.ISO_A3;

                    if (!iso) return;

                    // ❌ Skip USA & UK (handled by admin1)
                    if (iso === "USA" || iso === "GBR") {
                        layer.setStyle({ fillOpacity: 0 });
                        return;
                    }

                    const place = countryByISO[iso];

                    if (!place) {
                        layer.setStyle({ fillOpacity: 0.2 });
                        return;
                    }

                    layer.bindTooltip(place.name, { sticky: true });
                    layer.on("click", () => (window.location.href = place.url));
                }
            }).addTo(map);
        });

    // =============================
    // ADMIN1 LAYER (USA + UK)
    // =============================
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
                    const country = feature.properties?.ADM0_A3;
                    const region = feature.properties?.ISO_3166_2;

                    if (!country || !region) return;

                    // Only USA + UK
                    if (country !== "USA" && country !== "GBR") {
                        layer.setStyle({ fillOpacity: 0 });
                        return;
                    }

                    const key = `${country}-${region.split("-")[1]}`;
                    const place = regionByKey[key];

                    const label =
                        place?.name ||
                        feature.properties.NAME;

                    layer.bindTooltip(label, { sticky: true });

                    if (place) {
                        layer.on("click", () => {
                            window.location.href = place.url;
                        });
                    }
                }
            }).addTo(map);
        });
});
