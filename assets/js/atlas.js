console.log("ATLAS – FILTERS ACTUALLY WORK");

document.addEventListener("DOMContentLoaded", () => {

        if (!window.places?.length) return;

        /* =========================
           FILTER STATE (INIT FIRST)
        ========================= */

    const activeTags = new Set();
    const activeMonths = new Set();

    let activeBudgetMin = null;
    let activeBudgetMax = null;


    const params = new URLSearchParams(window.location.search);
        const tagFromURL = params.get("tag");
        if (tagFromURL) activeTags.add(tagFromURL);

        function normalizeMonths(value) {
            return Array.isArray(value) ? value.map(v => String(v)) : [];
        }
    function parseBudgetRange(budget) {
        if (!budget || typeof budget !== "string") return null;

        const nums = budget
            .replace(/\./g, "")
            .split("-")
            .map(n => parseInt(n.trim(), 10));

        if (nums.length !== 2 || nums.some(isNaN)) return null;

        return { min: nums[0], max: nums[1] };
    }

    function parseUserNumber(value) {
        if (!value) return null;

        const n = Number(
            value
                .toString()
                .replace(/\s/g, "")
                .replace(/\./g, "")
        );

        return isNaN(n) ? null : n;
    }



    function placeMatchesFilters(place) {
            if (!place) return false;

            if (activeTags.size) {
                for (const tag of activeTags) {

                    // 👇 SPECIAL CASE: language
                    if (tag === "language") {
                        const native = Array.isArray(place.language)
                            ? place.language.map(l => String(l).toLowerCase())
                            : typeof place.language === "string"
                                ? [place.language.toLowerCase()]
                                : [];

                        const touristLangs = ["english", "spanish", "french"];

                        const matches =
                            place.tags?.includes("language") ||
                            native.some(l => touristLangs.includes(l));

                        if (!matches) return false;
                    }

                    // 👇 normal tags
                    else {
                        if (!place.tags?.includes(tag)) return false;
                    }
                }
            }

            if (activeMonths.size) {
                const months = normalizeMonths(place.best_months);
                if (!months.some(m => activeMonths.has(m))) return false;
            }

        // 👇 BUDGET FILTER
        if (activeBudgetMin !== null || activeBudgetMax !== null) {

            const range = parseBudgetRange(place.budget?.dkk);
            if (!range) return false;

            const userMin = activeBudgetMin ?? 0;
            const userMax = activeBudgetMax ?? Infinity;

            const overlaps =
                range.max >= userMin &&
                range.min < userMax;

            if (!overlaps) return false;
        }

        return true;

    }


        /* =========================
           MAP SETUP
        ========================= */

        const INITIAL_VIEW = {center: [20, 0], zoom: 3};

        const map = L.map("map", {
            zoomControl: true,
            worldCopyJump: false
        }).setView(INITIAL_VIEW.center, INITIAL_VIEW.zoom);

        L.tileLayer(
            "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
            {attribution: "© OpenStreetMap & CARTO", noWrap: true}
        ).addTo(map);

        map.zoomControl.setPosition("bottomright");

        map.createPane("countries");
        map.createPane("subdivisions");
        map.createPane("territories");
        map.getPane("territories").style.zIndex = 350;
        map.getPane("countries").style.zIndex = 300;
        map.getPane("subdivisions").style.zIndex = 400;
        map.getPane("tooltipPane").style.zIndex = 450;

        /* =========================
           LOOKUPS
        ========================= */

        const byISO = {};
        const byAdminKey = {};

        window.places.forEach(p => {
            if (p.iso) byISO[p.iso.toUpperCase()] = p;
            if (p.admin_key) byAdminKey[p.admin_key.toUpperCase()] = p;
        });

    function getCountryKey(p = {}) {
        if (p.ISO_A3 && p.ISO_A3 !== "-99") return p.ISO_A3;
        if (p.ADM0_A3 && p.ADM0_A3 !== "-99") return p.ADM0_A3;
        if (p.SOV_A3 && p.SOV_A3 !== "-99") return p.SOV_A3;
        return null;
    }

    /* =========================
       MAP STYLES
    ========================= */

        const STYLE_BASE = {fillColor: "#e8eef1", fillOpacity: 1, weight: 0.8, color: "#a9bcc8"};
        const STYLE_DIM = {fillColor: "#dde5ea", fillOpacity: 1, weight: 0.5, color: "#c6d2d9"};
        const STYLE_MATCH = {fillColor: "#6b8f9c", fillOpacity: 1, weight: 1.5, color: "#4e6f7c"};
        const STYLE_MATCH_HOVER = {fillColor: "#577f8c", fillOpacity: 1, weight: 2.5, color: "#3e5f6b"};
        const STYLE_HOVER_NORMAL = {fillColor: "#d6e1e7", fillOpacity: 1, weight: 2, color: "#7d98a6"};

        /* =========================
           MAP REGISTRY
        ========================= */

        const layers = [];

        function applyStyle(layer) {
            if (!layer._hasFilters) layer.setStyle(STYLE_BASE);
            else if (layer._isMatch) layer.setStyle(STYLE_MATCH);
            else layer.setStyle(STYLE_DIM);
        }

        function applyFilters() {
            layers.forEach(layer => {
                layer._hasFilters =
                    activeTags.size > 0 ||
                    activeMonths.size > 0 ||
                    activeBudgetMin !== null ||
                    activeBudgetMax !== null;
                layer._isMatch = layer._place ? placeMatchesFilters(layer._place) : false;
                applyStyle(layer);
            });
        }

        function bindLayer(layer, place, label) {
            layer._place = place || null;
            layer._hasFilters = false;
            layer._isMatch = true;

            layer.bindTooltip(label || "", {sticky: true, direction: "center"});

            if (place?.url) {
                layer.on("click", () => {
                    const url = place.url.includes("?")
                        ? place.url + "&from=map"
                        : place.url + "?from=map";

                    window.open(url, "_blank", "noopener");
                });

                layer.on("mouseover", () => {
                    layer.bringToFront();
                    if (!layer._hasFilters) layer.setStyle(STYLE_HOVER_NORMAL);
                    else if (layer._isMatch) layer.setStyle(STYLE_MATCH_HOVER);
                });

                layer.on("mouseout", () => applyStyle(layer));

                layers.push(layer);
                applyFilters();
            }
        }

        /* =========================
           LOAD GEO DATA
        ========================= */

        fetch(`${window.BASEURL}/assets/data/countries.geo.json`)
            .then(r => r.json())
            .then(data => {
                L.geoJSON(data, {
                    pane: "countries",
                    style: STYLE_BASE,
                    filter: f => {
                        const key = getCountryKey(f.properties);
                        return key && key !== "USA" && key !== "GBR";
                    },
                    onEachFeature: (f, l) => {
                        const key = getCountryKey(f.properties);
                        const place = byISO[key] || byAdminKey[key];

                        bindLayer(
                            l,
                            place,
                            place?.name || f.properties.NAME
                        );
                    }
                }).addTo(map);
            });

        fetch(`${window.BASEURL}/assets/data/territories.geo.json`)
            .then(r => r.json())
            .then(data => {
                L.geoJSON(data, {
                    pane: "territories",
                    style: STYLE_BASE,
                    onEachFeature: (f, l) => {
                        const p = f.properties || {};

                        const iso =
                            p.ISO_A3 ||
                            p.iso_a3 ||
                            p.ADM0_A3 ||
                            p.SOV_A3;

                        const place =
                            (iso && byISO[iso]) ||
                            (iso && byAdminKey[iso]);

                        bindLayer(
                            l,
                            place,
                            place?.name || p.NAME || p.name
                        );

                        l.on("mouseover", () => l.bringToFront());
                    }
                }).addTo(map);
            });


        fetch(`${window.BASEURL}/assets/data/admin1.geo.json`)
            .then(r => r.json())
            .then(data => {
                const usa = data.features.filter(f => f.properties?.adm0_a3 === "USA");
                L.geoJSON(usa, {
                    pane: "subdivisions",
                    style: STYLE_BASE,
                    onEachFeature: (f, l) => {
                        const key = `USA:${f.properties.iso_3166_2}`.toUpperCase();
                        bindLayer(l, byAdminKey[key], f.properties.name);
                    }
                }).addTo(map);
            });

        fetch(`${window.BASEURL}/assets/data/uk.geo.json`)
            .then(r => r.json())
            .then(data => {
                L.geoJSON(data, {
                    pane: "subdivisions",
                    style: STYLE_BASE,
                    onEachFeature: (f, l) => {
                        const p = f.properties || {};
                        let iso = p.ISO_1 || "";
                        let label = "";
                        if (p.GID_1 === "GBR.1_1") {
                            iso = "GB-ENG";
                            label = "England";
                        } else if (iso === "GB-SCT") label = "Scotland";
                        else if (iso === "GB-WLS") label = "Wales";
                        else if (iso === "GB-NIR") label = "Northern Ireland";
                        bindLayer(l, byAdminKey[`GBR:${iso}`], label);
                    }
                }).addTo(map);
            });

        /* =========================
       FILTER UI + CHIPS (RESTORED)
    ========================= */

        const panel = document.getElementById("filterPanel");
        const toggleBtn = document.getElementById("toggleFilterPanel");
        const applyBtn = document.getElementById("applyFilterBtn");
        const clearBtn = document.getElementById("clearFilterBtn");
        const chipsEl = document.getElementById("activeFilters");

        if (panel && toggleBtn) {
            panel.style.display = "none";

            toggleBtn.onclick = () => {
                panel.style.display = panel.style.display === "none" ? "block" : "none";
            };
        }

        const MONTH_NAMES = {
            "1": "Jan",
            "2": "Feb",
            "3": "Mar",
            "4": "Apr",
            "5": "May",
            "6": "Jun",
            "7": "Jul",
            "8": "Aug",
            "9": "Sep",
            "10": "Oct",
            "11": "Nov",
            "12": "Dec"
        };

    const TAG_TITLES = {
        culture: "Culture",
        nature: "Nature",
        food: "Food",
        cheap: "Budget friendly",
        expensive: "Expensive",
        island: "Island",
        beach: "Beach",
        walkable: "Walkable",
        short_trip: "Short trip",
        long_trip: "Long trip",
        friends_and_family: "Friends/family live here",
        gay_friendly: "Gay friendly",
        language: "Easy to communicate (EN/ES/FR)",
        j_wants_to_go: "Places J wants to visit asap",
        m_wants_to_go: "Places M wants to visit asap",
        j_has_been: "Places J has been",
        m_has_been: "Places M has been"
    };

    function formatNumberDK(n) {
        return n.toLocaleString("da-DK");
    }

    function renderChips() {
            if (!chipsEl) return;

            chipsEl.innerHTML = "";

            /* TAG CHIPS */
            activeTags.forEach(tag => {
                const chip = document.createElement("span");
                const label = TAG_TITLES[tag] || tag;
                chip.textContent = `${label} ×`;
                chip.style.cssText = `
            background:#6b8f9c;
            color:white;
            padding:0.2rem 0.55rem;
            border-radius:999px;
            cursor:pointer;
            font-size:0.7rem;
        `;

                chip.onclick = () => {
                    activeTags.delete(tag);

                    document
                        .querySelectorAll('#filterPanel input[type="checkbox"]')
                        .forEach(cb => {
                            if (cb.value === tag) cb.checked = false;
                        });

                    updateURL();
                    renderChips();
                    applyFilters();
                };

                chipsEl.appendChild(chip);
            });

            /* budget cips */
        if (activeBudgetMin !== null || activeBudgetMax !== null) {
            const chip = document.createElement("span");

            const min = activeBudgetMin !== null ? formatNumberDK(activeBudgetMin) : "0";
            const max = activeBudgetMax !== null ? formatNumberDK(activeBudgetMax) : "∞";

            chip.textContent = `Budget: ${min} – ${max} ×`;
            chip.style.cssText = `
        background:#94a3b8;
        color:white;
        padding:0.2rem 0.55rem;
        border-radius:999px;
        cursor:pointer;
        font-size:0.7rem;
    `;

            chip.onclick = () => {
                activeBudgetMin = null;
                activeBudgetMax = null;
                document.getElementById("budgetMin").value = "";
                document.getElementById("budgetMax").value = "";
                renderChips();
                applyFilters();
            };

            chipsEl.appendChild(chip);
        }

        /* MONTH CHIPS */
            activeMonths.forEach(month => {
                const chip = document.createElement("span");
                chip.textContent = `${MONTH_NAMES[month]} ×`;
                chip.style.cssText = `
            background:#94a3b8;
            color:white;
            padding:0.2rem 0.55rem;
            border-radius:999px;
            cursor:pointer;
            font-size:0.7rem;
        `;

                chip.onclick = () => {
                    activeMonths.delete(month);

                    document
                        .querySelectorAll('#filterPanel input[type="checkbox"]')
                        .forEach(cb => {
                            if (cb.value === month) cb.checked = false;
                        });

                    updateURL();
                    renderChips();
                    applyFilters();
                };

                chipsEl.appendChild(chip);
            });
        }

        function updateURL() {
            const params = new URLSearchParams(window.location.search);
            if (activeTags.size === 1) {
                params.set("tag", [...activeTags][0]);
            } else {
                params.delete("tag");
            }
            history.replaceState({}, "", `${location.pathname}?${params}`);
        }

        if (applyBtn) {
            applyBtn.onclick = () => {
                activeTags.clear();
                activeMonths.clear();

                const minInput = document.getElementById("budgetMin");
                const maxInput = document.getElementById("budgetMax");

                activeBudgetMin = parseUserNumber(minInput?.value);
                activeBudgetMax = parseUserNumber(maxInput?.value);


                panel.querySelectorAll("input[type='checkbox']:checked").forEach(cb => {
                    isNaN(cb.value)
                        ? activeTags.add(cb.value)
                        : activeMonths.add(String(cb.value));
                });

                updateURL();
                renderChips();
                applyFilters();

                if (listView.style.display !== "none") {
                    renderList();
                }

                panel.style.display = "none";

            };
        }

        if (clearBtn) {
            clearBtn.onclick = () => {
                activeTags.clear();
                activeMonths.clear();

                activeBudgetMin = null;
                activeBudgetMax = null;

                document.getElementById("budgetMin").value = "";
                document.getElementById("budgetMax").value = "";
                panel.querySelectorAll("input[type='checkbox']").forEach(cb => cb.checked = false);
                updateURL();
                renderChips();
                applyFilters();

                if (listView.style.display !== "none") {
                    renderList();
                }

                panel.style.display = "none";
            };
        }

        /* init chips if tag came from URL */
        if (activeTags.size) {
            renderChips();
            applyFilters();
        }

        /* =========================
           VIEW SWITCH (FIXED)
        ========================= */

        const mapView = document.getElementById("mapView");
        const listView = document.getElementById("listView");
        const listEl = document.getElementById("placeList");
        const indicator = document.getElementById("viewIndicator");

        function renderList() {
            listEl.innerHTML = "";

            const filtered = window.places.filter(placeMatchesFilters);

            if (!filtered.length) {
                listEl.innerHTML = "<p>No places match your filters.</p>";
                return;
            }

            // Gruppér efter continent
            const byContinent = {};

            filtered.forEach(place => {
                const continent = place.continent || "Other";
                if (!byContinent[continent]) {
                    byContinent[continent] = [];
                }
                byContinent[continent].push(place);
            });

            // Sortér kontinenter alfabetisk
            const continents = Object.keys(byContinent).sort((a, b) =>
                a.localeCompare(b, "da-DK")
            );

            continents.forEach(continent => {
                const section = document.createElement("section");
                section.style.marginBottom = "2.5rem";

                const heading = document.createElement("h2");
                heading.textContent = continent;
                heading.style.marginBottom = "0.75rem";
                section.appendChild(heading);

                const grid = document.createElement("div");
                grid.style.display = "grid";
                grid.style.gridTemplateColumns = "repeat(3, 1fr)"; // 🔒 FAST 3 KOLONNER
                grid.style.gap = "0.6rem";

                byContinent[continent]
                    .sort((a, b) => a.name.localeCompare(b.name, "da-DK"))
                    .forEach(place => {
                        const item = document.createElement("div");
                        item.textContent = place.name;

                        item.style.cursor = "pointer";
                        item.style.padding = "0.5rem 0.65rem";
                        item.style.borderRadius = "6px";
                        item.style.background = "#eef3f6";
                        item.style.fontSize = "0.95rem"; // 🔍 STØRRE TEKST
                        item.style.lineHeight = "1.2";

                        item.onmouseenter = () => {
                            item.style.background = "#dfe8ee";
                        };
                        item.onmouseleave = () => {
                            item.style.background = "#eef3f6";
                        };

                        item.onclick = () => {
                            const url = place.url.includes("?")
                                ? place.url + "&from=list"
                                : place.url + "?from=list";

                            window.open(url, "_blank", "noopener");
                        };

                        grid.appendChild(item);
                    });

                section.appendChild(grid);
                listEl.appendChild(section);
            });
        }


        function setView(view) {
            if (view === "map") {
                mapView.style.display = "block";
                listView.style.display = "none";
                indicator.style.transform = "translateX(0%)";
                map.invalidateSize();
            } else {
                mapView.style.display = "none";
                listView.style.display = "block";
                indicator.style.transform = "translateX(100%)";
                renderList();
            }
        }

        // 👇 INITIAL VIEW FROM URL
        const viewFromURL = params.get("view") || "map";
        setView(viewFromURL);


        document.getElementById("viewMapBtn").onclick = () => setView("map");
        document.getElementById("viewListBtn").onclick = () => setView("list");

        /* =========================
   RANDOM DESTINATION BUTTON
========================= */

        const siteTitle = document.querySelector(".page-link");

        if (siteTitle && window.places.length) {
            siteTitle.style.cursor = "pointer";
            siteTitle.textContent = "Random destination";

            siteTitle.onclick = (e) => {
                e.preventDefault();

                const randomPlace =
                    window.places[Math.floor(Math.random() * window.places.length)];

                if (randomPlace?.url) {
                    window.location.href = randomPlace.url;
                }
            };
        }

    }
)
;
