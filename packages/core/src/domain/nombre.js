// Comparación de nombres de ejercicio entre la rutina y las sesiones de HM.
//
// Las sesiones no guardan el id del ejercicio: el nombre es el único
// vínculo entre una serie registrada y el ejercicio al que pertenece. Por
// eso comparar los strings tal cual es frágil — deja afuera diferencias que
// en pantalla no se ven:
//
//   "Face pull en polea " ≠ "Face pull en polea"    (un espacio de más)
//   "Face Pull en polea"  ≠ "Face pull en polea"    (una mayúscula)
//   "Extensión"           ≠ "Extensión"             (misma tilde, distinta
//                                                    codificación: NFC vs NFD)
//
// El tercero es el peligroso: iOS compone "ó" como un solo carácter y un
// texto pegado de otro lado puede traerla como "o" + acento combinante.
// Son bytes distintos que se ven idénticos. Y la rutina se edita a mano
// fuera de la app, pegando JSON, que es justo donde eso se cuela.

/**
 * Forma canónica de un nombre, para usar como clave de comparación.
 * Nunca se muestra: el nombre que ve el usuario sigue siendo el original.
 */
export function claveNombre(nombre) {
  return (nombre ?? "")
    .normalize("NFD") // separa la letra de su tilde…
    .replace(/[̀-ͯ]/g, "") // …y la saca: "Extensión" == "Extension"
    .replace(/\s+/g, " ") // espacios repetidos o tabs quedan en uno solo
    .trim()
    .toLowerCase();
}

/**
 * Si dos nombres se refieren al mismo ejercicio.
 *
 * No resuelve un renombre de verdad: "Face pull en polea" y "Jalón a la
 * cara" siguen siendo dos cosas distintas. Para eso haría falta que la
 * sesión guardara el id del ejercicio, no sólo su nombre.
 */
export const mismoNombre = (a, b) => claveNombre(a) === claveNombre(b);
