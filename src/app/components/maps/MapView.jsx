"use client";

import React from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export default function MapView({ buildings, address, height = "400px" }) {
  const mapContainer = React.useRef(null);
  const map = React.useRef(null);
  const markers = React.useRef([]);

  React.useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://tiles.openfreemap.org/styles/liberty",
      center: [0, 0],
      zoom: 1,
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  React.useEffect(() => {
    if (!map.current) return;

    // Helper to build a high-accuracy search string from available data
    const buildSearchQuery = (b) => {
      if (!b) return null;
      if (b.full_formatted_address) return b.full_formatted_address;

      // Join parts: Street (address or location fallback), City, State, Zip, Country
      return [b.address || b.location, b.city, b.state, b.zipcode, b.country]
        .filter(Boolean)
        .join(", ");
    };

    const searchQuery = address || buildSearchQuery(buildings?.[0]);

    if (!searchQuery) return;

    // Only geocode the address if we don't have buildings with actual GPS coordinates
    const hasCoordinates = buildings?.some((b) => b.latitude && b.longitude);
    if (hasCoordinates) return;

    const geocodeAddress = async () => {
      try {
        const b = buildings?.[0];
        let data = [];

        // Attempt 1: Structured Search (Explicitly narrowing by city/country)
        if (b && (b.address || b.location) && b.city) {
          const params = new URLSearchParams({
            format: "json",
            street: b.address || b.location,
            city: b.city,
            state: b.state || "",
            country: b.country || "",
            postalcode: b.zipcode || "",
            limit: "1",
          });
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?${params.toString()}`,
          );
          data = await response.json();
        }

        // Attempt 2: Fallback to general query string if structured search failed
        if (data.length === 0) {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`,
          );
          data = await response.json();
        }

        if (data && data.length > 0) {
          const { lat, lon } = data[0];
          const coords = [parseFloat(lon), parseFloat(lat)];

          map.current.setCenter(coords);
          map.current.setZoom(14);

          // Clear old markers
          markers.current.forEach((m) => m.remove());

          const marker = new maplibregl.Marker({ color: "#001f3f" })
            .setLngLat(coords)
            .setPopup(
              new maplibregl.Popup({ offset: 25 }).setHTML(
                `<b>${searchQuery}</b>`,
              ),
            )
            .addTo(map.current);

          markers.current = [marker];
        }
      } catch (error) {
        console.error("Geocoding error:", error);
      }
    };

    geocodeAddress();
  }, [address, buildings]);

  React.useEffect(() => {
    if (!map.current || !buildings) return;

    // Clear existing markers if the buildings array changes
    markers.current.forEach((marker) => marker.remove());
    markers.current = [];

    buildings.forEach((building) => {
      if (building.latitude && building.longitude) {
        const marker = new maplibregl.Marker({ color: "#001f3f" })
          .setLngLat([
            parseFloat(building.longitude),
            parseFloat(building.latitude),
          ])
          .setPopup(
            new maplibregl.Popup({ offset: 25 }).setHTML(
              `<div style="padding: 8px;">
                <h4 style="font-weight: bold; color: #001f3f; margin: 0;">${building.name}</h4>
                <p style="font-size: 11px; color: #64748b; margin: 4px 0 0;">${building.full_formatted_address || building.address || building.location}</p>
              </div>`,
            ),
          )
          .addTo(map.current);
        markers.current.push(marker);

        // Auto-center on the first building that has valid coordinates
        if (markers.current.length === 1) {
          map.current.setCenter([
            parseFloat(building.longitude),
            parseFloat(building.latitude),
          ]);
          map.current.setZoom(15);
        }
      }
    });
  }, [buildings]);

  return (
    <div
      className='w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm'
      style={{ height }}>
      <div ref={mapContainer} className='h-full w-full' />
    </div>
  );
}
