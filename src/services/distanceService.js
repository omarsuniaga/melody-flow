export async function calculateDistanceAndTime(eventCoords, deviceCoords) {
  // Transformar las coordenadas: OSRM requiere "lng,lat"
  const origin = `${deviceCoords.lng},${deviceCoords.lat}`;
  const destination = `${eventCoords.lng},${eventCoords.lat}`;
  // Construir el endpoint de OSRM
  const url = `https://router.project-osrm.org/route/v1/driving/${origin};${destination}?overview=full&geometries=geojson&steps=true`;

  const response = await fetch(url);
  const data = await response.json();
  if (data.code !== "Ok") {
    throw new Error("Error fetching directions: " + data.code);
  }
  const route = data.routes[0];
  return {
    distance: { text: `${(route.distance / 1000).toFixed(1)} km`, value: route.distance },
    duration: { text: `${Math.round(route.duration / 60)} mins`, value: route.duration },
    routePolyline: route.geometry, // GeoJSON LineString
    steps: route.legs[0].steps    // Pasos detallados
  };
}
