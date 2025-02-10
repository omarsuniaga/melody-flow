import L from 'leaflet';
import 'leaflet-routing-machine';

interface RouteInfo {
  distance: number; // distancia en metros
  duration: number; // duración en segundos
}

// Velocidades promedio según el tipo de ruta (en km/h)
const AVERAGE_SPEEDS = {
  URBAN: 30,    // Zona urbana
  HIGHWAY: 80,  // Carretera
  DEFAULT: 40   // Velocidad por defecto
};

export async function calculateRoute(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): Promise<RouteInfo> {
  try {
    // Calcular distancia en línea recta
    const distanceKm = calculateHaversineDistance(from, to);
    
    // Estimar la velocidad promedio basada en la distancia
    let averageSpeed;
    if (distanceKm <= 5) {
      // Para distancias cortas, usar velocidad urbana
      averageSpeed = AVERAGE_SPEEDS.URBAN;
    } else if (distanceKm > 20) {
      // Para distancias largas, usar velocidad de carretera
      averageSpeed = AVERAGE_SPEEDS.HIGHWAY;
    } else {
      // Para distancias intermedias, usar velocidad por defecto
      averageSpeed = AVERAGE_SPEEDS.DEFAULT;
    }

    // Calcular duración estimada
    const durationHours = distanceKm / averageSpeed;
    const durationSeconds = durationHours * 3600;

    // Añadir un 20% de margen para tráfico y paradas
    const adjustedDuration = durationSeconds * 1.2;

    return {
      distance: distanceKm * 1000, // Convertir a metros
      duration: Math.round(adjustedDuration)
    };
  } catch (error) {
    console.error('Error en el cálculo de ruta:', error);
    throw new Error('Error calculando la ruta');
  }
}

function calculateHaversineDistance(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): number {
  const R = 6371; // Radio de la Tierra en kilómetros
  const dLat = toRad(to.lat - from.lat);
  const dLon = toRad(to.lng - from.lng);
  const lat1 = toRad(from.lat);
  const lat2 = toRad(to.lat);

  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
  // Añadir un 30% adicional para compensar que no es línea recta
  return (R * c) * 1.3;
}

function toRad(value: number): number {
  return value * Math.PI / 180;
}

// Formatear duración para mostrar
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  }
  return `${minutes}min`;
}

// Formatear distancia para mostrar
export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)}km`;
  }
  return `${Math.round(meters)}m`;
}
