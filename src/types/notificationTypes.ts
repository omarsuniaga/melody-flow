export interface Coordinates {
    latitude: number;
    longitude: number;
  }
  
  export interface Geofence {
    id: string;
    coordinates: Coordinates;
    radius: number;
    expiration: Date;
  }
  
  export type NotificationType = 
    | 'reminder' 
    | 'payment' 
    | 'proximity' 
    | 'emergency';