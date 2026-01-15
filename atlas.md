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

<div style="display: flex; flex-direction: column; gap: 0.5rem; max-width: 300px;">

  <select id="tagFilter">
    <option value="">Add filter…</option>
    <option value="culture">Culture</option>
    <option value="food">Food</option>
    <option value="cheap">Cheap</option>
    <option value="expensive">Expensive</option>
    <option value="island">Island</option>
    <option value="gay_friendly">Gay friendly</option>
  </select>

  <!-- ACTIVE FILTER CHIPS -->
  <div
    id="activeFilters"
    style="
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
