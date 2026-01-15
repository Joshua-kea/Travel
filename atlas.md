---
layout: default
title: World map
permalink: /atlas/
---

# World map

<p>Select month and/or tag to highlight suitable countries.</p>

<!-- =========================
     FILTER CONTROLS
========================= -->

<div style="display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center;">

  <select id="monthFilter">
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

  <select id="tagFilter">
    <option value="">Add tag filter…</option>
    <option value="culture">Culture</option>
    <option value="food">Food</option>
    <option value="cheap">Cheap</option>
    <option value="expensive">Expensive</option>
    <option value="island">Island</option>
    <option value="gay_friendly">Gay friendly</option>
  </select>

</div>

<!-- =========================
     ACTIVE FILTER CHIPS
     (THIS IS WHAT JS USES)
========================= -->

<div
  id="activeFilters"
  style="
    margin-top: 0.5rem;
    display: flex;
    gap: 0.25rem;
    flex-wrap: wrap;
  "
></div>

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
     (ALL CLICKABLE PLACES)
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
