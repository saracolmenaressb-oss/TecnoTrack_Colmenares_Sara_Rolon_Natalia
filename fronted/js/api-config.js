// Contratos inspeccionados en ServidorHTTP.java. El mock solo se activa explícitamente.
window.TecnoTrackConfig = {
    modo: "real", // Cambiar a "simulado" para pruebas aisladas. Nunca hay fallback automático.
    baseUrl: "http://localhost:8081/api/",
    timeoutMs: 10000,
    endpoints: {
        equipos: "equipos",
        prestamos: "prestamos",
        registrarPrestamo: "prestamos",
        devolverPrestamo: "devoluciones",
        historial: "movimientos",
        recomendaciones: equipoId => `recomendaciones?equipoId=${encodeURIComponent(equipoId)}`
    }
};
