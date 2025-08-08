if (typeof listing !== "undefined" && listing.geometry && listing.geometry.coordinates) {
    const [lng, lat] = listing.geometry.coordinates;
    var map = new maplibregl.Map({
    container: 'map',
    style: `https://api.maptiler.com/maps/streets/style.json?key=${MAPTILER_API_KEY}`,
    center: [lng, lat],
    zoom: 5
});

    const popupContent = 
    `<div style="padding: 16px; min-width: 220px; border-radius: 14px; background: #e3f6f5; box-shadow: 0 4px 16px rgba(0,0,0,0.10);">
        <h5 style="margin:0; color:#008891; font-weight:700;">${listing.title}</h5>
        <p style="margin:4px 0 0 0; color:#393e46;">${listing.location}</p>
        <span style="font-size:14px; color:#00b8a9;">${listing.country}</span>
    </div>`;

    new maplibregl.Marker({ color: " #1997a0" })
        .setLngLat([lng, lat])
        .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML(popupContent))
        .addTo(map);
}