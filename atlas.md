---
layout: default
title: World map
permalink: /atlas/
---

# World map

<p>Select filters to highlight suitable countries.</p>

<!-- =========================
     FILTER CONTROLS
========================= -->

<div style="margin: 0 0 0.75rem 20px; position: relative; z-index: 1001;">

<button
id="toggleFilterPanel"
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

  <!-- FILTER PANEL -->
  <div
    id="filterPanel"
    style="
      display: none;
      position: absolute;
      top: 2.5rem;
      left: 0;
      background: #ffffff;
      border-radius: 8px;
      padding: 1rem;
      width: 300px;
      box-shadow: 0 6px 18px rgba(0,0,0,0.15);
    "
  >
    <strong>Filters</strong>

    <!-- MONTHS -->
    <div style="margin-top: 0.75rem;">
      <div style="font-size: 0.85rem; margin-bottom: 0.25rem;">
        When do you travel?
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.3rem;">
        {% assign months = "Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec" | split: "," %}
        {% for m in months %}
          <label>
            <input type="checkbox" value="{{ forloop.index }}">
            {{ m }}
          </label>
        {% endfor %}
      </div>
    </div>

    <!-- TAGS -->
    <div style="margin-top: 0.75rem;">
      <div style="font-size: 0.85rem; margin-bottom: 0.25rem;">
        Interests
      </div>

      <div style="display: flex; flex-direction: column; gap: 0.3rem;">
        <label><input type="checkbox" value="culture"> Culture</label>
        <label><input type="checkbox" value="food"> Food</label>
        <label><input type="checkbox" value="cheap"> Cheap</label>
        <label><input type="checkbox" value="expensive"> Expensive</label>
        <label><input type="checkbox" value="island"> Island</label>
        <label><input type="checkbox" value="beach"> Beach destination</label>
        <label><input type="checkbox" value="fandf"> Friends/family live here</label>
        <label><input type="checkbox" value="gay_friendly"> Gay friendly</label>
        <label><input type="checkbox" value="jwashere"> Places J has been</label>
        <label><input type="checkbox" value="mwashere"> Places M has been</label>
        <label><input type="checkbox" value="jgohere"> Places J wants to visit asap</label>
        <label><input type="checkbox" value="mgohere"> Places M wants to visit asap</label>
      </div>
    </div>

    <!-- ACTIONS -->
    <div style="margin-top: 1rem; display: flex; gap: 0.5rem;">
      <button id="applyFilterBtn" style="flex: 1;">Apply</button>
      <button id="clearFilterBtn" style="flex: 1;">Clear</button>
    </div>
  </div>

</div>

<!-- ACTIVE FILTER CHIPS -->
<div
  id="activeFilters"
  style="
    margin-left: 20px;
    margin-bottom: 0.75rem;
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
  "
></div>

<!-- MAP -->
<div id="map" style="height: 600px;"></div>

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
        tags: {{ place.tags | jsonify }},
        best_months: {{ place.best_months | default: "[]" | jsonify }}
      },
    {% endfor %}
  ];

  window.BASEURL = "{{ site.baseurl }}";
</script>

<script src="{{ site.baseurl }}/assets/js/atlas.js"></script>
