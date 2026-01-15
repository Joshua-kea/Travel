---
layout: default
title: World map
permalink: /atlas/
---

# World map

<p>Select month and one or more tags to highlight suitable countries.</p>

<!-- =========================
     FILTER CONTROLS
========================= -->

<div style="display: flex; flex-direction: column; gap: 0.75rem;">

  <!-- Month filter (klar til senere brug) -->
  <select id="monthFilter" style="max-width: 200px;">
    <option value="">All months</option>
    <option value="1">January</option>
    <option value="2">February</option>
    <option value="3">March</option>
    <option value="4">April</option>
    <option value="5">May</option>
    <option value="6">June</option>
    <option value="7">July</option>
    <option value="8">August</option>
    <option value="9">September</option>
    <option value="10">October</option>
    <option value="11">November</option>
    <option value="12">December</option>
  </select>

  <!-- TAG FILTERS (MULTI-SELECT) -->
  <div id="tagFilters" style="display: flex; gap: 1rem; flex-wrap: wrap;">
    <label><input type="checkbox" value="culture"> Culture</label>
    <label><input type="checkbox" value="food"> Food</label>
    <label><input type="checkbox" value="cheap"> Cheap</label>
    <label><input type="checkbox" value="expensive"> Expensive</label>
    <label><input type="checkbox" value="island"> Island</label>
    <label><input type="checkbox" value="gay_friendly"> Gay friendly</label>
  </div>

</div>

<!-- =========================
     MAP
========================= -->

<div id="map" style="height: 600px; margin-top: 1rem;"></div>

<!-- =========================
     LEAFLET
========================= -->

<link
  rel="stylesheet"
  href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
/>

<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

<!-- =========================
     DATA FROM JEKYLL
========================= -->

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

<!-- =========================
     ATLAS LOGIC
========================= -->

<script src="{{ site.baseurl }}/assets/js/atlas.js"></script>
