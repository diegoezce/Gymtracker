import { describe, expect, it } from "vitest";
import { claveNombre, mismoNombre } from "./nombre";

describe("mismoNombre", () => {
  it("ignora espacios al principio y al final", () => {
    expect(mismoNombre("Face pull en polea ", "Face pull en polea")).toBe(true);
    expect(mismoNombre("  Prensa de piernas", "Prensa de piernas")).toBe(true);
  });

  it("ignora espacios repetidos adentro", () => {
    expect(mismoNombre("Face  pull   en polea", "Face pull en polea")).toBe(true);
  });

  it("ignora mayúsculas", () => {
    expect(mismoNombre("Face Pull En Polea", "face pull en polea")).toBe(true);
  });

  it("empareja la misma tilde codificada de las dos formas", () => {
    // NFC: "ó" es un carácter. NFD: es "o" + acento combinante. Se ven
    // idénticas en pantalla y son bytes distintos — es lo que se cuela al
    // pegar JSON editado fuera de la app.
    const nfc = "Extensión tríceps en polea".normalize("NFC");
    const nfd = "Extensión tríceps en polea".normalize("NFD");
    expect(nfc).not.toBe(nfd); // de verdad son strings distintos
    expect(mismoNombre(nfc, nfd)).toBe(true);
  });

  it("también empareja el nombre escrito sin tildes", () => {
    expect(mismoNombre("Extension triceps en polea", "Extensión tríceps en polea")).toBe(true);
  });

  it("sigue distinguiendo ejercicios que son distintos", () => {
    expect(mismoNombre("Face pull en polea", "Jalón a la cara")).toBe(false);
    expect(mismoNombre("Plancha frontal", "Plancha lateral")).toBe(false);
    expect(mismoNombre("Remo bajo en polea", "Remo con apoyo de pecho")).toBe(false);
  });

  it("no empareja nada con un nombre faltante", () => {
    expect(mismoNombre(undefined, "Prensa")).toBe(false);
    expect(mismoNombre(null, "Prensa")).toBe(false);
  });

  it("dos nombres vacíos sí son el mismo (ninguno existe)", () => {
    expect(mismoNombre("", "   ")).toBe(true);
  });
});

describe("claveNombre", () => {
  it("devuelve la forma canónica, que nunca se muestra", () => {
    expect(claveNombre("  Extensión  TRÍCEPS en polea ")).toBe("extension triceps en polea");
  });

  it("no rompe con un nombre ausente", () => {
    expect(claveNombre(undefined)).toBe("");
  });
});
