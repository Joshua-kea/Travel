---
layout: default
title: Verdensatlas
permalink: /atlas/
---

# Verdensatlas

<p>Vælg måned og/eller tag for at se egnede lande.</p>

<select id="monthFilter">
  <option value="">Alle måneder</option>
  <option value="1">Januar</option>
  <option value="2">Februar</option>
  <option value="3">Marts</option>
  <option value="4">April</option>
  <option value="5">Maj</option>
  <option value="6">Juni</option>
  <option value="7">Juli</option>
  <option value="8">August</option>
  <option value="9">September</option>
  <option value="10">Oktober</option>
  <option value="11">November</option>
  <option value="12">December</option>
</select>

<select id="tagFilter">
  <option value="">Alle tags</option>
  <option value="culture">Kultur</option>
  <option value="food">Mad</option>
  <option value="cheap">Billig</option>
  <option value="expensive">Dyr</option>
  <option value="island">Ø</option>
  <option value="gay_friendly">Gay friendly</option>
</select>

<div id="map" style="height: 600px; margin-top: 1rem;"></div>

<!-- Leaflet CSS -->
<link
  rel="stylesheet"
  href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
/>

<!-- Leaflet JS -->
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

<!-- DATA FRA JEKYLL -->
<script>
  window.places = [
    {% for land in site.lande %}
      {
        title: "{{ land.title }}",
        kode: "{{ land.kode }}",
        url: "{{ site.baseurl }}{{ land.url }}",
        tags: {{ land.tags | jsonify }},
        best_months: {{ land.best_months | jsonify }},
        ok_months: {{ land.ok_months | jsonify }}
      },
    {% endfor %}
  ];
</script>

<script src="{{ site.baseurl }}/assets/js/atlas.js"></script>
