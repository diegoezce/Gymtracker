import { describe, expect, it } from "vitest";
import { dimensionesDestino, faltaSubir, fuenteImagen, tieneImagen } from "./imagen";

describe("dimensionesDestino", () => {
  it("achica por el lado mayor manteniendo la proporción", () => {
    // Una foto de iPhone, apaisada.
    expect(dimensionesDestino(4032, 3024, 800)).toEqual({ ancho: 800, alto: 600 });
  });

  it("también cuando la foto es vertical", () => {
    expect(dimensionesDestino(3024, 4032, 800)).toEqual({ ancho: 600, alto: 800 });
  });

  it("no agranda una foto que ya es chica", () => {
    // Interpolar no agrega información: sólo peso.
    expect(dimensionesDestino(320, 240, 800)).toEqual({ ancho: 320, alto: 240 });
  });

  it("deja igual una que mide justo el máximo", () => {
    expect(dimensionesDestino(800, 450, 800)).toEqual({ ancho: 800, alto: 450 });
  });

  it("nunca devuelve un lado de 0 en una imagen muy alargada", () => {
    // 2000×3 escalado a 800 daría 1.2 de alto; redondear a 0 rompe el canvas.
    expect(dimensionesDestino(2000, 3, 800).alto).toBeGreaterThanOrEqual(1);
  });

  it("no inventa nada si no hay tamaño", () => {
    expect(dimensionesDestino(0, 100)).toBeNull();
    expect(dimensionesDestino(undefined, undefined)).toBeNull();
  });
});

describe("fuenteImagen", () => {
  it("prefiere la copia local: se ve sin red y al instante", () => {
    const ej = { imagenId: "abc", imagenKey: "photos/1/gym/x.jpg", imagenUrl: "https://x/y.jpg" };
    expect(fuenteImagen(ej)).toEqual({ tipo: "local", id: "abc", key: "photos/1/gym/x.jpg" });
  });

  it("cae a R2 cuando la foto no está en este teléfono", () => {
    const ej = { imagenKey: "photos/1/gym/x.jpg" };
    expect(fuenteImagen(ej)).toEqual({ tipo: "remota", key: "photos/1/gym/x.jpg" });
  });

  it("sigue respetando una URL pegada a mano", () => {
    expect(fuenteImagen({ imagenUrl: " https://x/y.jpg " })).toEqual({
      tipo: "url",
      url: "https://x/y.jpg",
    });
  });

  it("ignora una URL vacía o en blanco", () => {
    expect(fuenteImagen({ imagenUrl: "   " })).toBeNull();
    expect(fuenteImagen({})).toBeNull();
    expect(fuenteImagen(undefined)).toBeNull();
  });

  it("una foto local sin subir igual se muestra", () => {
    expect(fuenteImagen({ imagenId: "abc" })).toEqual({ tipo: "local", id: "abc", key: null });
  });
});

describe("tieneImagen", () => {
  it("es cierto para cualquiera de las tres formas", () => {
    expect(tieneImagen({ imagenId: "a" })).toBe(true);
    expect(tieneImagen({ imagenKey: "photos/1/gym/x.jpg" })).toBe(true);
    expect(tieneImagen({ imagenUrl: "https://x/y.jpg" })).toBe(true);
  });

  it("y falso cuando no hay ninguna", () => {
    expect(tieneImagen({ nombre: "Prensa" })).toBe(false);
  });
});

describe("faltaSubir", () => {
  it("marca la foto que está sólo en el teléfono", () => {
    expect(faltaSubir({ imagenId: "abc" })).toBe(true);
  });

  it("no marca la que ya llegó a R2", () => {
    expect(faltaSubir({ imagenId: "abc", imagenKey: "photos/1/gym/x.jpg" })).toBe(false);
  });

  it("ni una URL pegada a mano, que no es nuestra para subir", () => {
    expect(faltaSubir({ imagenUrl: "https://x/y.jpg" })).toBe(false);
    expect(faltaSubir({})).toBe(false);
  });
});
