---
layout: default
title: World map
permalink: /atlas/
---

# World map

<p style="max-width: 640px;">
Explore destinations around the world and switch between map and list view to
browse places that match your travel interests and preferred time of year.
</p>

<!-- =========================
     VIEW SWITCH + FILTERS
========================= -->

<div
  style="
    position: sticky;
    top: 1rem;
    z-index: 5000;
    display: flex;
    gap: 0.75rem;
    align-items: center;
    margin-bottom: 1rem;
    pointer-events: auto;
  "
>

  <!-- VIEW SWITCH -->
  <div
    id="viewSwitch"
    style="
      position: relative;
      display: inline-flex;
      border-radius: 999px;
      background: #eef3f6;
      padding: 0.25rem;
    "
  >
    <div
      id="viewIndicator"
      style="
        position: absolute;
        top: 0.25rem;
        left: 0.25rem;
        width: calc(50% - 0.25rem);
        height: calc(100% - 0.5rem);
        background: #6b8f9c;
        border-radius: 999px;
        transition: transform 0.25s ease;
      "
    ></div>

    <button
      id="viewMapBtn"
      style="
        position: relative;
        z-index: 1;
        padding: 0.35rem 0.9rem;
        border-radius: 999px;
        border: none;
        background: transparent;
        color: white;
        cursor: pointer;
        font-size: 0.8rem;
      "
    >
      Map
    </button>

    <button
      id="viewListBtn"
      style="
        position: relative;
        z-index: 1;
        padding: 0.35rem 0.9rem;
        border-radius: 999px;
        border: none;
        background: transparent;
        color: #374151;
        cursor: pointer;
        font-size: 0.8rem;
      "
    >
      List
    </button>
  </div>

  <!-- FILTER BUTTON -->
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
      top: 3rem;
      left: 0;
      background: #ffffff;
      border-radius: 10px;
      padding: 1rem 1.1rem;
      width: 300px;
      box-shadow: 0 10px 24px rgba(0,0,0,0.15);
      z-index: 2001;
    "
  >
    <strong>Filters</strong>

    <div style="margin-top:0.9rem;">
      <div style="font-size:0.85rem;">When do you travel?</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.35rem;">
        {% assign months = "Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec" | split: "," %}
        {% for m in months %}
          <label><input type="checkbox" value="{{ forloop.index }}"> {{ m }}</label>
        {% endfor %}
      </div>
    </div>

    <div style="margin-top:0.9rem;">
      <div style="font-size:0.85rem;">Interests</div>
      <div style="display:flex;flex-direction:column;gap:0.35rem;">
        <label><input type="checkbox" value="culture"> Culture</label>
        <label><input type="checkbox" value="food"> Food</label>
        <label><input type="checkbox" value="cheap"> Budget friendly</label>
        <label><input type="checkbox" value="expensive"> Expensive</label>
        <label><input type="checkbox" value="island"> Island</label>
        <label><input type="checkbox" value="beach"> Beach</label>
        <label><input type="checkbox" value="walkable"> Walkable</label>
        <label><input type="checkbox" value="gay_friendly"> Gay friendly</label>
        <label><input type="checkbox" value="j_wants_to_go"> Places J wants to visit asap</label>
        <label><input type="checkbox" value="m_wants_to_go"> Places M wants to visit asap</label>
        <label><input type="checkbox" value="j_has_been"> Places J has been</label>
        <label><input type="checkbox" value="m_has_been"> Places M has been</label>
      </div>
    </div>

    <div style="margin-top:1rem;display:flex;gap:0.5rem;">
      <button id="applyFilterBtn" style="flex:1;">Apply</button>
      <button id="clearFilterBtn" style="flex:1;">Clear</button>
    </div>
  </div>

</div>

<div id="activeFilters" style="margin-bottom:1rem;display:flex;gap:0.4rem;flex-wrap:wrap;"></div>

<!-- MAP VIEW -->
<div id="mapView" style="width:100vw;margin-left:calc(50% - 50vw);margin-right:calc(50% - 50vw);">
  <div id="map" style="height:85vh;min-height:700px;"></div>
</div>

<!-- LIST VIEW -->
<div id="listView" style="display:none;max-width:1000px;margin:0 auto;">
<div id="placeList"></div>
</div>

<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

<script>
  window.places = [
    {% for place in site.countries %}
      {
        name: {{ place.name | jsonify }},
        iso: {{ place.iso | jsonify }},
        admin_key: {{ place.admin_key | jsonify }},
        continent: {{ place.continent | jsonify }},
        url: "{{ site.baseurl }}{{ place.url }}",
        tags: {{ place.tags | jsonify }},
        best_months: {{ place.best_months | default: "[]" | jsonify }}
      },
    {% endfor %}
  ];
  window.BASEURL = "{{ site.baseurl }}";
</script>

<script src="{{ site.baseurl }}/assets/js/atlas.js"></script>
