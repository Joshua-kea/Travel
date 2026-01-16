console.log("ATLAS – FILTERS ACTUALLY WORK");

document.addEventListener("DOMContentLoaded", () => {

    if (!window.places?.length) return;

    const INITIAL_VIEW = { center:[20,0], zoom:3 };

    const map = L.map("map",{ zoomControl:true, worldCopyJump:false })
        .setView(INITIAL_VIEW.center, INITIAL_VIEW.zoom);

    L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
        { attribution:"© OpenStreetMap & CARTO", noWrap:true }
    ).addTo(map);

    map.zoomControl.setPosition("bottomright");
    map.createPane("countries");
    map.createPane("subdivisions");
    map.getPane("countries").style.zIndex = 300;
    map.getPane("subdivisions").style.zIndex = 400;

    window.addEventListener("pageshow", () =>
        map.setView(INITIAL_VIEW.center, INITIAL_VIEW.zoom, { animate:false })
    );

    const byISO = {};
    const byAdminKey = {};

    window.places.forEach(p=>{
        if(p.iso) byISO[p.iso.toUpperCase()] = p;
        if(p.admin_key) byAdminKey[p.admin_key.toUpperCase()] = p;
    });

    function getCountryKey(p={}){
        return p.ADM0_A3 && p.ADM0_A3!=="-99" ? p.ADM0_A3 :
            p.ISO_A3  && p.ISO_A3!=="-99"  ? p.ISO_A3  :
                p.SOV_A3  && p.SOV_A3!=="-99"  ? p.SOV_A3  : null;
    }

    const activeTags = new Set();
    const activeMonths = new Set();

    function placeMatches(place){
        if(activeTags.size && ![...activeTags].every(t=>place.tags?.includes(t))) return false;
        if(activeMonths.size && !place.best_months?.some(m=>activeMonths.has(String(m)))) return false;
        return true;
    }

    const STYLE_BASE = { fillColor:"#e8eef1", fillOpacity:1, weight:0.8, color:"#a9bcc8" };
    const STYLE_DIM  = { fillColor:"#f8f9fa", fillOpacity:1, weight:0.5, color:"#e1e4e6" };
    const STYLE_MATCH = { fillColor:"#6b8f9c", fillOpacity:1, weight:1.5, color:"#4e6f7c" };

    const layers = [];

    function bindLayer(layer, place, label){
        layer._place = place;
        layer.bindTooltip(label,{sticky:true});
        if(place?.url) layer.on("click",()=>location.href=place.url);
        layers.push(layer);
    }

    function applyFilters(){
        const has = activeTags.size || activeMonths.size;
        layers.forEach(l=>{
            if(!has) l.setStyle(STYLE_BASE);
            else l.setStyle(placeMatches(l._place)?STYLE_MATCH:STYLE_DIM);
        });
        if(listView.style.display==="block") renderList();
    }

    fetch(`${window.BASEURL}/assets/data/countries.geo.json`)
        .then(r=>r.json())
        .then(d=>L.geoJSON(d,{
            pane:"countries",
            style:STYLE_BASE,
            filter:f=>{
                const k=getCountryKey(f.properties);
                return k && k!=="USA" && k!=="GBR";
            },
            onEachFeature:(f,l)=>bindLayer(l,byISO[getCountryKey(f.properties)],f.properties.NAME)
        }).addTo(map));

    fetch(`${window.BASEURL}/assets/data/admin1.geo.json`)
        .then(r=>r.json())
        .then(d=>L.geoJSON(
            d.features.filter(f=>f.properties?.adm0_a3==="USA"),
            {
                pane:"subdivisions",
                style:STYLE_BASE,
                onEachFeature:(f,l)=>bindLayer(
                    l,
                    byAdminKey[`USA:${f.properties.iso_3166_2}`],
                    f.properties.name
                )
            }
        ).addTo(map));

    fetch(`${window.BASEURL}/assets/data/uk.geo.json`)
        .then(r=>r.json())
        .then(d=>L.geoJSON(d,{
            pane:"subdivisions",
            style:STYLE_BASE,
            onEachFeature:(f,l)=>{
                const iso=f.properties.ISO_1||"GB-ENG";
                bindLayer(l,byAdminKey[`GBR:${iso}`],f.properties.NAME);
            }
        }).addTo(map));

    const panel = document.getElementById("filterPanel");
    document.getElementById("toggleFilterPanel").onclick =
        ()=>panel.style.display=panel.style.display==="none"?"block":"none";

    document.getElementById("applyFilterBtn").onclick=()=>{
        activeTags.clear(); activeMonths.clear();
        panel.querySelectorAll("input:checked").forEach(cb=>{
            isNaN(cb.value)?activeTags.add(cb.value):activeMonths.add(cb.value);
        });
        panel.style.display="none";
        applyFilters();
    };

    document.getElementById("clearFilterBtn").onclick=()=>{
        activeTags.clear(); activeMonths.clear();
        panel.querySelectorAll("input").forEach(cb=>cb.checked=false);
        applyFilters();
        panel.style.display="none";
    };

    const mapView=document.getElementById("mapView");
    const listView=document.getElementById("listView");
    const listEl=document.getElementById("placeList");
    const indicator=document.getElementById("viewIndicator");

    function renderList(){
        listEl.innerHTML="";
        window.places.filter(placeMatches).forEach(p=>{
            const li=document.createElement("li");
            li.style.cssText="padding:1rem;background:#f6f8f9;border-radius:10px;cursor:pointer";
            li.innerHTML=`<strong>${p.name}</strong><br><small>${p.tags?.join(", ")||""}</small>`;
            li.onclick=()=>location.href=p.url;
            listEl.appendChild(li);
        });
    }

    function setView(v){
        if(v==="map"){
            mapView.style.display="block";
            listView.style.display="none";
            indicator.style.transform="translateX(0%)";
            map.invalidateSize();
        }else{
            mapView.style.display="none";
            listView.style.display="block";
            indicator.style.transform="translateX(100%)";
            renderList();
        }
    }

    document.getElementById("viewMapBtn").onclick=()=>setView("map");
    document.getElementById("viewListBtn").onclick=()=>setView("list");

});
