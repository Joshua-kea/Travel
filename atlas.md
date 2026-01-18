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
     CONTROLS
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
      style="background:none;border:none;padding:0.35rem 0.9rem;color:white;cursor:pointer;"
    >
      Map
    </button>

    <button
      id="viewListBtn"
      style="background:none;border:none;padding:0.35rem 0.9rem;color:#374151;cursor:pointer;"
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
cursor: pointer;
"
>
    Filters +
  </button>

  <!-- FILTER PANEL -->
  <div
    id="filterPanel"
    style="
      display: none;
      position: absolute;
      top: 3rem;
      left: 0;
      width: 320px;
      max-height: calc(100vh - 6rem);
      background: #ffffff;
      border-radius: 14px;
      box-shadow: 0 10px 24px rgba(0,0,0,0.15);
      z-index: 2001;
      overflow: hidden;
    "
  >

    <!-- HEADER -->
    <div
      style="
        padding: 1rem 1.1rem;
        border-bottom: 1px solid #e5e7eb;
        font-weight: 600;
      "
    >
      Filters
    </div>

    <!-- SCROLLABLE CONTENT -->
    <div
      style="
        padding: 1rem 1.1rem;
        overflow-y: auto;
        max-height: calc(100vh - 12rem);
      "
    >

      <!-- MONTHS -->
      <div style="margin-bottom: 1rem;">
        <div style="margin-bottom: 0.3rem;">When do you travel?</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:.4rem;">
          {% assign months = "Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec" | split: "," %}
          {% for m in months %}
            <label><input type="checkbox" value="{{ forloop.index }}"> {{ m }}</label>
          {% endfor %}
        </div>
      </div>

      <!-- INTERESTS -->
      <div>
        <div style="margin-bottom:0.3rem;">Interests</div>
        <div style="display:flex;flex-direction:column;gap:.35rem;">
          <label><input type="checkbox" value="culture"> Culture</label>
          <label><input type="checkbox" value="food"> Food</label>
          <label><input type="checkbox" value="cheap"> Budget friendly</label>
          <label><input type="checkbox" value="expensive"> Expensive</label>
          <label><input type="checkbox" value="island"> Island</label>
          <label><input type="checkbox" value="beach"> Beach</label>
          <label><input type="checkbox" value="walkable"> Walkable</label>
          <label><input type="checkbox" value="short_trip"> Short trip</label>
          <label><input type="checkbox" value="long_trip"> Long trip</label>
          <label><input type="checkbox" value="friends_and_family"> Friends/family live here</label>
          <label><input type="checkbox" value="gay_friendly"> Gay friendly</label>
          <label><input type="checkbox" value="j_wants_to_go"> Places J wants to visit asap</label>
          <label><input type="checkbox" value="m_wants_to_go"> Places M wants to visit asap</label>
          <label><input type="checkbox" value="j_has_been"> Places J has been</label>
          <label><input type="checkbox" value="m_has_been"> Places M has been</label>
        </div>
      </div>

    </div>

    <!-- FOOTER -->
    <div
      style="
        padding: 0.8rem 1.1rem;
        border-top: 1px solid #e5e7eb;
        display: flex;
        gap: 0.5rem;
      "
    >
      <button id="clearFilterBtn" style="flex:1;">Clear</button>
      <button id="applyFilterBtn" style="flex:1;">Apply</button>
    </div>

  </div>
</div>

<!-- ACTIVE FILTER CHIPS -->
<div
  id="activeFilters"
  style="margin-bottom:1rem;display:flex;gap:.4rem;flex-wrap:wrap;"
></div>

<!-- MAP VIEW -->
<div id="mapView">
  <div id="map" style="height:85vh;min-height:700px;"></div>
</div>

<!-- LIST VIEW -->
<div id="listView" style="display:none;max-width:1000px;margin:0 auto;">
  <div id="placeList"></div>
</div>

<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script src="{{ site.baseurl }}/assets/js/atlas.js"></script>
