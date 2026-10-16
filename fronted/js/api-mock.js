/* Simulación en memoria: se reinicia al recargar. No es lógica del backend. */
(function () {
    "use strict";
    /** Crea una simulación aislada, sin persistencia ni algoritmo de recomendación.
     * @param {{equipos: Array, prestamos: Array, movimientos: Array}} datos Datos existentes de prueba.
     * @returns {Object} Operaciones asíncronas compatibles con el adaptador API.
     */
    function crearAdaptador({ equipos, prestamos, movimientos }) {
        const copiar = valor => JSON.parse(JSON.stringify(valor));
        const estado = copiar({ equipos, prestamos, movimientos });
        const responder = valor => new Promise(resolve => setTimeout(() => resolve(copiar(valor)), 150));
        const error = mensaje => { throw new window.TecnoTrackAPI.ErrorAPI(mensaje, "SIMULACION", 409); };
        const nuevoId = lista => Math.max(0, ...lista.map(item => Number(item.id) || 0)) + 1;
        // Orden de fixture explícito para PC-APO-003; no se infieren candidatos.
        const alternativasDePrueba = [
            { equipoId: "PC-APO-001", motivo: "Ejemplo de prueba: mismo tipo, ubicación y marca que el equipo solicitado." },
            { equipoId: "PC-SPU-001", motivo: "Ejemplo de prueba: computador Compumax disponible en Sputnik; requiere cambiar de ubicación." },
            { equipoId: "PC-SPU-002", motivo: "Ejemplo de prueba: otro computador Compumax disponible en Sputnik; requiere cambiar de ubicación." },
            { equipoId: "PC-ART-001", motivo: "Ejemplo de prueba: computador Compumax disponible en Artemis; requiere cambiar de ubicación." },
            { equipoId: "PC-HOU-001", motivo: "Ejemplo de prueba: computador Compumax disponible en Houston; requiere cambiar de ubicación." }
        ];
        return {
            equipos: () => responder(estado.equipos),
            prestamos: () => responder(estado.prestamos),
            historial: () => responder(estado.movimientos),
            // Fixtures explícitos: no se calcula un algoritmo de recomendaciones.
            recomendaciones: equipoId => responder(equipoId === "PC-APO-003"
                ? alternativasDePrueba.filter(item => estado.equipos.some(equipo => equipo.id === item.equipoId && equipo.estado === "DISPONIBLE" && equipo.prestable === true)) : []),
            registrarPrestamo: async (_, datos) => {
                const equipo = estado.equipos.find(item => item.id === datos.equipoId);
                if (!equipo || equipo.estado !== "DISPONIBLE" || !equipo.prestable) error("Simulación: el equipo no está disponible para préstamo.");
                if (!datos.responsable?.trim() || !datos.identificacion?.trim()) error("Completa los datos del responsable.");
                const fecha = new Date().toISOString();
                const prestamo = { ...copiar(datos), id: nuevoId(estado.prestamos), fechaPrestamo: fecha, estado: "ACTIVO", fechaDevolucion: null };
                estado.prestamos.push(prestamo);
                equipo.estado = "PRESTADO";
                estado.movimientos.push({ id: nuevoId(estado.movimientos), prestamoId: prestamo.id, equipoId: equipo.id, responsable: datos.responsable, tipo: "PRESTAMO", fecha });
                return responder(prestamo);
            },
            devolverPrestamo: async id => {
                const prestamo = estado.prestamos.find(item => String(item.id) === String(id) && item.estado === "ACTIVO");
                if (!prestamo) error("Simulación: el préstamo ya no está activo.");
                prestamo.estado = "DEVUELTO";
                prestamo.fechaDevolucion = new Date().toISOString();
                estado.equipos.find(item => item.id === prestamo.equipoId).estado = "DISPONIBLE";
                estado.movimientos.push({ id: nuevoId(estado.movimientos), prestamoId: prestamo.id, equipoId: prestamo.equipoId, responsable: prestamo.responsable, tipo: "DEVOLUCION", fecha: prestamo.fechaDevolucion });
                return responder(prestamo);
            }
        };
    }
    window.TecnoTrackMock = { crearAdaptador };
})();
