---
layout: default
title: World map
permalink: /atlas/
---

# World map

<p>Select one or more tags to highlight suitable countries.</p>

<!-- =========================
     FILTER CONTROLS
========================= -->

<div style="position: relative; max-width: 300px;">

  <!-- Open dropdown -->
<button
id="openFilterBtn"
style="
padding: 0.4rem 0.6rem;
border-radius: 4px;
border: 1px solid #ccc;
background: #fff;
cursor: pointer;
"
>
    Add filters
  </button>

  <!-- DROPDOWN PANEL -->
  <div
    id="filterDropdown"
    style="
      display: none;
      position: absolute;
      top: 110%;
      left: 0;
      z-index: 1000;
      background: #fff;
      border: 1px solid #ccc;
      border-radius: 6px;
      padding: 0.75rem;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      min-width: 220px;
    "
  >
    <div style="display: flex; flex-direction: column; gap: 0.4rem;">
      <label><input type="checkbox" value="culture"> Culture</label>
      <label><input type="checkbox" value="food"> Food</label>
      <label><input type="checkbox" value="cheap"> Cheap</label>
      <label><input type="checkbox" value="expensive"> Expensive</label>
      <label><input type="checkbox" value="island"> Island</label>
      <label><input type="checkbox" value="gay_friendly"> Gay friendly</label>
    </div>

    <button
      id="applyFilterBtn"
      style="
        margin-top: 0.6rem;
        padding: 0.4rem 0.6rem;
        width: 100%;
        border-radius: 4px;
        border: none;
        background: #455a64;
        color: white;
        cursor: pointer;
      "
    >
      Apply filters
    </button>
  </div>

  <!-- ACTIVE FILTER CHIPS -->
  <div
    id="activeFilters"
    style="
      margin-top: 0.5rem;
      display: flex;
      gap: 0.4rem;
      flex-wrap: wrap;
    "
  ></div>

</div>

<!-- =========================
     MAP
========================= -->

<div id="map" style="height: 600px; margin-top: 1rem;"></div>

<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

<script>
  window.places = [
    {% for place in site.countries %}
      {
        name: {{ place.name | jsonify }},
        iso: {{ place.iso | jsonify }},
        admin_key: {{ place.admin_key | jsonify }},
        url: "{{ site.baseurl }}{{ place.url }}",
        tags: {{ place.tags | jsonify }}
      },
    {% endfor %}
  ];

  window.BASEURL = "{{ site.baseurl }}";
</script>

<script src="{{ site.baseurl }}/assets/js/atlas.js"></script>
