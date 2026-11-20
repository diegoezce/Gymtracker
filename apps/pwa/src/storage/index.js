// Punto único de acceso a la persistencia. Para cambiar de backend
// (IndexedDB, un servidor, etc.) alcanza con reemplazar este adapter
// por otro que cumpla StorageAdapter — el resto de la app no cambia.
import { localStorageAdapter } from "./localStorageAdapter";

export const storage = localStorageAdapter;
export const CLAVE_RUTINA = "gym:estado:v1";
export const CLAVE_SESION = "gym:sesion:v1";
