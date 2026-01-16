/* =========================
VIEW SWITCH (MAP / LIST)
========================= */

const mapView = document.getElementById("mapView");
const listView = document.getElementById("listView");
const mapBtn = document.getElementById("viewMapBtn");
const listBtn = document.getElementById("viewListBtn");
const listEl = document.getElementById("placeList");

function renderList() {
listEl.innerHTML = "";

    window.places.forEach(place => {
        const item = document.createElement("li");
        item.style.cssText = `
            padding: 1rem;
            border-radius: 10px;
            background: #f6f8f9;
            cursor: pointer;
        `;
        item.innerHTML = `
            <strong>${place.name}</strong><br>
            <span style="font-size:0.75rem; color:#6b7280;">
              ${place.tags?.join(", ") || ""}
            </span>
        `;
        item.onclick = () => {
            window.location.href = place.url;
        };
        listEl.appendChild(item);
    });
}

mapBtn.onclick = () => {
mapView.style.display = "block";
listView.style.display = "none";
mapBtn.style.background = "#6b8f9c";
mapBtn.style.color = "white";
listBtn.style.background = "transparent";
};

listBtn.onclick = () => {
mapView.style.display = "none";
listView.style.display = "block";
listBtn.style.background = "#6b8f9c";
listBtn.style.color = "white";
mapBtn.style.background = "transparent";
renderList();
};
