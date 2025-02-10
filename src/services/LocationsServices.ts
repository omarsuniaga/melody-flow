// LocationsServices.ts

import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where 
} from "firebase/firestore";
import { db } from "../firebase/config"; // Asegúrate de tener este archivo configurado correctamente

// Definimos la colección donde se almacenarán las ubicaciones
const locationsCollection = collection(db, "locations");

/**
 * Interfaz para definir la estructura de una ubicación.
 */
export interface LocationData {
  id?: string; // Este campo se asigna automáticamente por Firestore
  location: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

/**
 * Agrega una nueva ubicación a la colección "locations".
 * @param location - Nombre o descripción de la ubicación.
 * @param coordinates - Objeto con las coordenadas { lat, lng }.
 * @returns Una promesa que se resuelve con el ID del documento agregado.
 */
export async function addLocation(
  location: string, 
  coordinates: { lat: number; lng: number }
): Promise<string> {
  try {
    const docRef = await addDoc(locationsCollection, { location, coordinates });
    console.log("Ubicación agregada con ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error agregando la ubicación:", error);
    throw error;
  }
}

/**
 * Actualiza una ubicación existente en la colección "locations".
 * @param id - ID del documento a actualizar.
 * @param data - Datos a actualizar (por ejemplo, nuevos valores de location o coordinates).
 * @returns Una promesa que se resuelve cuando la operación se completa.
 */
export async function updateLocation(id: string, data: Partial<LocationData>): Promise<void> {
  try {
    const docRef = doc(db, "locations", id);
    await updateDoc(docRef, data);
    console.log("Ubicación actualizada:", id);
  } catch (error) {
    console.error("Error actualizando la ubicación:", error);
    throw error;
  }
}

/**
 * Elimina una ubicación de la colección "locations".
 * @param id - ID del documento a eliminar.
 * @returns Una promesa que se resuelve cuando la operación se completa.
 */
export async function deleteLocation(id: string): Promise<void> {
  try {
    const docRef = doc(db, "locations", id);
    await deleteDoc(docRef);
    console.log("Ubicación eliminada:", id);
  } catch (error) {
    console.error("Error eliminando la ubicación:", error);
    throw error;
  }
}

/**
 * Obtiene todas las ubicaciones almacenadas en la colección "locations".
 * @returns Una promesa que se resuelve con un arreglo de objetos LocationData.
 */
export async function getLocations(): Promise<LocationData[]> {
  try {
    const querySnapshot = await getDocs(locationsCollection);
    const locations: LocationData[] = [];
    querySnapshot.forEach((docSnap) => {
      locations.push({ id: docSnap.id, ...docSnap.data() } as LocationData);
    });
    return locations;
  } catch (error) {
    console.error("Error obteniendo las ubicaciones:", error);
    throw error;
  }
}

/**
 * Consulta las ubicaciones que coincidan con un nombre específico.
 * @param locationName - El nombre o parte del nombre de la ubicación a buscar.
 * @returns Una promesa que se resuelve con un arreglo de objetos LocationData.
 */
export async function getLocationByName(locationName: string): Promise<LocationData[]> {
  try {
    const q = query(locationsCollection, where("location", "==", locationName));
    const querySnapshot = await getDocs(q);
    const locations: LocationData[] = [];
    querySnapshot.forEach((docSnap) => {
      locations.push({ id: docSnap.id, ...docSnap.data() } as LocationData);
    });
    return locations;
  } catch (error) {
    console.error("Error consultando la ubicación:", error);
    throw error;
  }
}
