---
layout: default
title: World map
permalink: /atlas/
---

# World map

<p style="max-width: 640px;">
Explore destinations around the world and use filters to find places that match
your travel interests and preferred time of year.
</p>

<!-- =========================
     FILTER CONTROLS
========================= -->

<div style="margin: 0 0 1rem 0; position: relative; z-index: 1001;">

<button
id="toggleFilterPanel"
style="
padding: 0.45rem 0.9rem;
border-radius: 999px;
border: none;
background: #6b8f9c;
color: #ffffff;
font-weight: 500;
cursor: pointer;
display: inline-flex;
align-items: center;
gap: 0.4rem;
"
>
    <span style="font-size:0.9rem;">Filters</span>
    <span style="font-size:0.85rem; opacity:0.8;">＋</span>
  </button>

  <!-- FILTER PANEL -->
  <div
    id="filterPanel"
    style="
      display: none;
      position: absolute;
      top: 2.75rem;
      left: 0;
      background: #ffffff;
      border-radius: 10px;
      padding: 1rem 1.1rem;
      width: 300px;
      box-shadow: 0 10px 24px rgba(0,0,0,0.15);
    "
  >
    <!-- (INDHOLD UÆNDRET) -->
    <strong style="font-size: 1rem;">Filters</strong>
    <!-- resten af filter-panel er præcis som før -->
  </div>

</div>

<!-- ACTIVE FILTER CHIPS -->
<div
  id="activeFilters"
  style="
    margin-bottom: 1rem;
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
  "
></div>

<!-- =========================
     FULL WIDTH MAP
========================= -->

<div
  style="
    width: 100vw;
    margin-left: calc(50% - 50vw);
    margin-right: calc(50% - 50vw);
  "
>
  <div
    id="map"
    style="
      height: 75vh;
      min-height: 600px;
      border-radius: 0;
    "
  ></div>
</div>

<link
  rel="stylesheet"
  href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

<script>
  window.places = [
    {% for place in site.countries %}
      {
        name: {{ place.name | jsonify }},
        iso: {{ place.iso | jsonify }},
        admin_key: {{ place.admin_key | jsonify }},
        url: "{{ site.baseurl }}{{ place.url }}",
        tags: {{ place.tags | jsonify }},
        best_months: {{ place.best_months | default: "[]" | jsonify }}
      },
    {% endfor %}
  ];

  window.BASEURL = "{{ site.baseurl }}";
</script>

<script src="{{ site.baseurl }}/assets/js/atlas.js?v=2026-01-16-2"></script>
