/**
 * Contrato que debe cumplir cualquier backend de persistencia usado por la app.
 * Async por diseño: permite swapear localStorage por IndexedDB, un backend
 * remoto, etc. sin tocar el resto del código.
 *
 * @typedef {Object} StorageAdapter
 * @property {(key: string) => Promise<{ value: string } | null>} get
 * @property {(key: string, value: string) => Promise<void>} set
 */

export {};
