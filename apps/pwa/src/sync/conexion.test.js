import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchSesiones, obtenerToken, probarConexion, pushSesiones } from "./hcAdapter";

// El adapter corre en el browser: en los tests hay que fabricar los dos
// globals que usa (fetch y navigator.onLine).
// node ya define navigator como getter de sólo lectura, así que va por
// stubGlobal en vez de asignación directa.
function conFetch(impl, { online = true } = {}) {
  const f = vi.fn(impl);
  vi.stubGlobal("fetch", f);
  vi.stubGlobal("navigator", { onLine: online });
  return f;
}

const respuesta = (status, body = "") => ({
  ok: status >= 200 && status < 300,
  status,
  text: async () => body,
  json: async () => JSON.parse(body || "{}"),
});

// Lo que tira el browser cuando el pedido nunca llegó a destino.
const sinRed = () => {
  throw new TypeError("Failed to fetch");
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("errores de red", () => {
  it("cambia el 'Failed to fetch' del browser por algo que se entienda", async () => {
    conFetch(sinRed);
    await expect(pushSesiones("t", [])).rejects.toThrow(/No se pudo llegar a hm\.sparkio\.me/);
  });

  it("marca el error como de red para distinguirlo de una respuesta del servidor", async () => {
    conFetch(sinRed);
    await expect(pushSesiones("t", [])).rejects.toMatchObject({ tipo: "red" });
  });

  it("avisa que no hay internet cuando el celular está offline", async () => {
    conFetch(sinRed, { online: false });
    await expect(fetchSesiones("t")).rejects.toThrow("Sin conexión a internet.");
  });
});

describe("errores del servidor", () => {
  it("deja pasar el 401 tal cual para que la UI limpie el token", async () => {
    conFetch(() => respuesta(401));
    await expect(fetchSesiones("t")).rejects.toMatchObject({ message: "401", tipo: "auth" });
  });

  it("incluye el detalle del servidor cuando es corto", async () => {
    conFetch(() => respuesta(400, "sesiones inválidas"));
    await expect(pushSesiones("t", [])).rejects.toThrow("Error 400: sesiones inválidas");
  });

  it("descarta una página HTML de error y deja sólo el código", async () => {
    conFetch(() => respuesta(502, "<!DOCTYPE html><html><body>Bad Gateway</body></html>"));
    await expect(pushSesiones("t", [])).rejects.toThrow("Error 502 del servidor");
  });

  it("en el login un 401 es la contraseña, no una sesión vencida", async () => {
    conFetch(() => respuesta(401));
    await expect(obtenerToken("diego", "mala")).rejects.toThrow("Usuario o contraseña incorrectos");
  });

  it("pero un servidor caído en el login sigue siendo un problema de red", async () => {
    conFetch(sinRed);
    await expect(obtenerToken("diego", "x")).rejects.toThrow(/No se pudo llegar/);
  });
});

describe("probarConexion", () => {
  it("reporta ok cuando el servidor contesta, aunque sea un 401", async () => {
    conFetch(() => respuesta(401));
    expect(await probarConexion()).toMatchObject({ estado: "ok", status: 401 });
  });

  it("detecta CORS: el pedido normal falla pero el opaco llega", async () => {
    conFetch((_url, opts) => {
      if (opts?.mode === "no-cors") return respuesta(0);
      return sinRed();
    });
    const r = await probarConexion();
    expect(r.estado).toBe("cors");
    expect(r.mensaje).toMatch(/rechaza los pedidos de esta app/);
  });

  it("detecta servidor caído: no llega ni el pedido opaco", async () => {
    conFetch(sinRed);
    expect(await probarConexion()).toMatchObject({ estado: "caido" });
  });

  it("no culpa al servidor si el celular está sin red", async () => {
    conFetch(sinRed, { online: false });
    expect(await probarConexion()).toMatchObject({ estado: "offline" });
  });
});
