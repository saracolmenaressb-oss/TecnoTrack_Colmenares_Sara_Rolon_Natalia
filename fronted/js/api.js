/* Capa de transporte. No contiene reglas de negocio ni manipula el DOM. */
(function () {
    "use strict";
    class ErrorAPI extends Error {
        constructor(message, codigo, status = null) {
            super(message);
            this.name = "ErrorAPI";
            this.codigo = codigo;
            this.status = status;
        }
    }

    const esObjeto = valor => valor !== null && typeof valor === "object" && !Array.isArray(valor);
    const texto = valor => typeof valor === "string" && valor.trim().length > 0;
    const identificador = valor => texto(valor) || (Number.isInteger(valor) && valor >= 0);
    // Contrato interno del frontend; adaptar aquí si el backend usa otros nombres.
    const validadores = {
        equipos: item => esObjeto(item) && ["id", "tipo", "ubicacion", "estado"].every(campo => texto(item[campo])) && typeof item.marca === "string" && typeof item.prestable === "boolean",
        prestamos: item => esObjeto(item) && identificador(item.id) && ["equipoId", "responsable", "fechaPrestamo", "estado"].every(campo => texto(item[campo])),
        historial: item => esObjeto(item) && identificador(item.id) && ["equipoId", "responsable", "tipo", "fecha"].every(campo => texto(item[campo])),
        recomendaciones: item => esObjeto(item) && texto(item.equipoId) && (item.motivo == null || texto(item.motivo))
    };

    const tiposJava = { COMPUTADOR_ESCRITORIO: "Computador", MONITOR: "Monitor", TECLADO: "Teclado", MOUSE: "Mouse" };

    /** Traduce únicamente etiquetas de transporte, sin cambiar elegibilidad ni datos originales.
     * @param {Object} equipo Equipo recibido del servidor Java.
     * @returns {Object} Equipo con etiquetas compatibles con la interfaz.
     * @throws {ErrorAPI} Si el objeto no cumple el contrato de equipos.
     */
    function normalizarEquipo(equipo) {
        if (!esObjeto(equipo)) throw new ErrorAPI("El servidor devolvió un equipo inválido.", "RESPUESTA_INVALIDA");
        const resultado = { ...equipo,
            tipo: Object.hasOwn(tiposJava, equipo.tipo) ? tiposJava[equipo.tipo] : equipo.tipo,
            estado: equipo.estado === "DANADO" ? "DAÑADO" : equipo.estado,
            marca: equipo.marca == null ? "" : equipo.marca
        };
        if (!validadores.equipos(resultado)) throw new ErrorAPI("El servidor devolvió un equipo incompleto.", "RESPUESTA_INVALIDA");
        return resultado;
    }

    /** Adapta las respuestas efectivamente implementadas por ServidorHTTP.java.
     * @param {string} operacion Nombre interno del adaptador.
     * @param {*} respuesta JSON recibido, sin modificar.
     * @returns {*} Modelo interno de lectura o confirmación validada.
     * @throws {ErrorAPI} Si faltan campos del contrato real.
     */
    function normalizarRespuestaJava(operacion, respuesta) {
        if (operacion === "registrarPrestamo" || operacion === "devolverPrestamo") {
            if (!esObjeto(respuesta) || !texto(respuesta.mensaje) || !validadores.prestamos(respuesta.prestamo)) {
                throw new ErrorAPI("El servidor no devolvió una confirmación de préstamo válida. Consulta los datos antes de repetir la operación.", "RESPUESTA_INVALIDA");
            }
            return respuesta.prestamo;
        }
        if (!Array.isArray(respuesta)) throw new ErrorAPI("El servidor no devolvió una lista válida.", "RESPUESTA_INVALIDA");
        if (operacion === "equipos") return respuesta.map(normalizarEquipo);
        if (operacion === "recomendaciones") return respuesta.map(item => {
            const equipo = normalizarEquipo(item);
            // El servidor actual no entrega motivo ni puntuación: no se inventan.
            return { equipoId: equipo.id, equipo, motivo: null };
        });
        return respuesta;
    }

    /** Crea una conexión de modo fijo; nunca mezcla respuestas reales y simuladas.
     * @param {Object} config Configuración del servidor y modo.
     * @param {Object} [adaptadorSimulado] Solo es necesario para el modo simulado.
     * @returns {Object} Operaciones asíncronas de inventario, préstamos e historial.
     */
    function crearAPI(config, adaptadorSimulado) {
        const ajustes = { ...config, endpoints: { ...config.endpoints } };

        async function solicitar(operacion, { id, datos, lista } = {}) {
            let resultado;
            if (ajustes.modo === "simulado") {
                if (!adaptadorSimulado || typeof adaptadorSimulado[operacion] !== "function") {
                    throw new ErrorAPI("No está disponible el adaptador de prueba.", "CONFIGURACION");
                }
                resultado = await adaptadorSimulado[operacion](id, datos);
            } else if (ajustes.modo === "real") {
                const endpoint = ajustes.endpoints[operacion];
                if (!endpoint || !texto(ajustes.baseUrl)) {
                    throw new ErrorAPI("Falta configurar la URL del servidor o la ruta de esta operación.", "CONFIGURACION");
                }
                const ruta = typeof endpoint === "function" ? endpoint(id) : endpoint;
                if (!texto(ruta)) throw new ErrorAPI("La ruta configurada no es válida.", "CONFIGURACION");
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), ajustes.timeoutMs || 10000);
                try {
                    const url = new URL(ruta, ajustes.baseUrl.endsWith("/") ? ajustes.baseUrl : ajustes.baseUrl + "/");
                    const respuesta = await fetch(url, {
                        method: datos === undefined ? "GET" : "POST",
                        headers: { Accept: "application/json", ...(datos === undefined ? {} : { "Content-Type": "application/json" }) },
                        ...(datos === undefined ? {} : { body: JSON.stringify(datos) }),
                        signal: controller.signal
                    });
                    if (!respuesta.ok) {
                        let detalle;
                        try {
                            const cuerpoError = await respuesta.json();
                            if (esObjeto(cuerpoError) && texto(cuerpoError.error)) detalle = cuerpoError.error.slice(0, 500);
                        } catch (error) {
                            if (error.name === "AbortError") throw error;
                        }
                        const mensajes = {
                            400: "Revisa los datos enviados.", 401: "Debes iniciar sesión para continuar.",
                            403: "No tienes permiso para esta operación.", 404: "El recurso solicitado no existe.",
                            409: "Los datos cambiaron o el equipo ya no está disponible. Actualiza e inténtalo de nuevo.",
                            422: "El servidor rechazó los datos de la operación."
                        };
                        const mensaje = mensajes[respuesta.status] || "El servidor no pudo completar la operación.";
                        throw new ErrorAPI(detalle && respuesta.status < 500 ? `${mensaje} ${detalle}` : mensaje, "HTTP", respuesta.status);
                    }
                    if (respuesta.status === 204 && !lista) resultado = null;
                    else {
                        try { resultado = await respuesta.json(); }
                        catch (error) {
                            if (error.name === "AbortError") throw error;
                            throw new ErrorAPI("El servidor devolvió una respuesta que no es JSON válido.", "RESPUESTA_INVALIDA");
                        }
                    }
                } catch (error) {
                    if (error instanceof ErrorAPI) throw error;
                    if (error.name === "AbortError") throw new ErrorAPI("El servidor tardó demasiado en responder. Consulta los datos antes de repetir una operación.", "TIEMPO_AGOTADO");
                    throw new ErrorAPI("No se pudo conectar con el servidor. Revisa la conexión y la configuración CORS.", "CONEXION");
                } finally { clearTimeout(timeout); }
                resultado = normalizarRespuestaJava(operacion, resultado);
            } else {
                throw new ErrorAPI("El modo de conexión configurado no es válido.", "CONFIGURACION");
            }
            if (lista && (!Array.isArray(resultado) || !resultado.every(validadores[lista]))) {
                throw new ErrorAPI("Los datos recibidos no tienen el formato esperado.", "RESPUESTA_INVALIDA");
            }
            if (!lista && resultado !== null && !esObjeto(resultado)) {
                throw new ErrorAPI("La confirmación del servidor no tiene el formato esperado.", "RESPUESTA_INVALIDA");
            }
            return resultado;
        }
        return Object.freeze({
            modo: ajustes.modo,
            obtenerEquipos: () => solicitar("equipos", { lista: "equipos" }),
            obtenerPrestamos: () => solicitar("prestamos", { lista: "prestamos" }),
            obtenerHistorial: () => solicitar("historial", { lista: "historial" }),
            obtenerRecomendaciones: equipoId => solicitar("recomendaciones", { id: equipoId, lista: "recomendaciones" }),
            registrarPrestamo: datos => solicitar("registrarPrestamo", {
                datos: ajustes.modo === "real" ? { equipoId: datos.equipoId, responsable: datos.responsable } : datos
            }),
            /** Devuelve el equipo asociado al préstamo activo seleccionado.
             * @param {string|number} id ID del préstamo, utilizado por el mock.
             * @param {{equipoId: string, observacion?: string}} [detalle] Campos exigidos por Java.
             * @returns {Promise<Object>} Préstamo confirmado por el servidor.
             * @throws {ErrorAPI} Si no se conoce el equipo o falla la petición.
             */
            devolverPrestamo: (id, detalle = {}) => {
                if (ajustes.modo === "real" && !texto(detalle.equipoId)) {
                    return Promise.reject(new ErrorAPI("No se pudo identificar el equipo del préstamo activo. Actualiza los datos.", "VALIDACION"));
                }
                const datos = ajustes.modo === "real" ? { equipoId: detalle.equipoId,
                    ...(detalle.observacion === undefined ? {} : { observacion: detalle.observacion }) } : {};
                return solicitar("devolverPrestamo", { id, datos });
            }
        });
    }
    window.TecnoTrackAPI = { crearAPI, ErrorAPI };
})();
