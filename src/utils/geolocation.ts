/**
 * /utils/geolocation.ts
 * 
 * Utilidades para obtener la ubicación del usuario utilizando la API de Geolocalización.
 * Provee funciones para:
 *   - Comprobar la disponibilidad de la geolocalización.
 *   - Obtener la ubicación actual.
 *   - Observar cambios en la ubicación.
 *   - Detener la observación de la ubicación.
 */

/**
 * Comprueba si la geolocalización está disponible en el navegador.
 * @returns {boolean} true si la geolocalización es soportada; false en caso contrario.
 */
export function isGeolocationAvailable(): boolean {
    return "geolocation" in navigator;
  }
  
  /**
   * Obtiene la ubicación actual del usuario.
   * @param options Opciones adicionales para la geolocalización (opcional).
   * @returns {Promise<{ lat: number; lng: number }>} Promesa que se resuelve con un objeto con latitud y longitud.
   */
  export function getUserLocation(options?: PositionOptions): Promise<{ lat: number; lng: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("La geolocalización no es soportada por este navegador."));
      } else {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
          },
          (error) => {
            reject(error);
          },
          options
        );
      }
    });
  }
  
  /**
   * Observa cambios en la ubicación del usuario.
   * Llama al callback cada vez que se actualicen las coordenadas.
   * @param callback Función que recibe un objeto { lat, lng } con la nueva ubicación.
   * @param options Opciones adicionales para la geolocalización (opcional).
   * @returns {number} Un identificador que se puede usar para detener la observación.
   */
  export function watchUserLocation(
    callback: (coords: { lat: number; lng: number }) => void,
    options?: PositionOptions
  ): number {
    if (!navigator.geolocation) {
      throw new Error("La geolocalización no es soportada por este navegador.");
    }
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        callback({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        console.error("Error observando la ubicación:", error);
      },
      options
    );
    return watchId;
  }
  
  /**
   * Detiene la observación de la ubicación del usuario.
   * @param watchId Identificador obtenido con watchUserLocation.
   */
  export function clearLocationWatch(watchId: number): void {
    if (navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId);
    }
  }
  