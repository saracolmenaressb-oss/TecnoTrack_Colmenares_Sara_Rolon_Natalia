/* Integración mínima de las vistas existentes con la capa API. */
(function () {
    "use strict";
    const $ = id => document.getElementById(id);
    const adaptadorSimulado = window.TecnoTrackConfig.modo === "simulado"
        ? window.TecnoTrackMock.crearAdaptador({ equipos, prestamos, movimientos }) : undefined;
    const api = window.TecnoTrackAPI.crearAPI(window.TecnoTrackConfig, adaptadorSimulado);
    let datos = { equipos: [], prestamos: [], historial: [] };
    let cargando = false;
    let enviando = false;
    let listo = false;
    let solicitudRecomendacion = 0;
    // Activar únicamente después de acordar y verificar el orden con la Persona A.
    const recomendacionesOrdenadasPorPrioridad = false;
    const modo = api.modo === "simulado" ? "Modo simulado · datos de prueba; los cambios se reinician al recargar." : "Modo real";
    const estadoHistorial = document.createElement("p");
    estadoHistorial.id = "estado-historial";
    estadoHistorial.setAttribute("role", "status");
    estadoHistorial.setAttribute("aria-live", "polite");
    $("historial").querySelector(".table-responsive").before(estadoHistorial);

    function mensaje(texto, error = false) {
        const nodo = $("mensaje-alerta");
        nodo.textContent = texto;
        nodo.className = "alert " + (error ? "error" : "success");
    }
    function controles() {
        window.TecnoTrackInventario.establecerBloqueo(cargando || enviando || !listo);
        $("actualizar-datos").disabled = cargando || enviando;
        for (const control of $("form-prestamo").elements) control.disabled = cargando || enviando || !listo;
        $("recomendaciones-content").querySelectorAll("button").forEach(boton => {
            boton.disabled = cargando || enviando || !listo;
        });
    }
    function celda(fila, texto) {
        const td = document.createElement("td");
        td.textContent = texto;
        fila.append(td);
        return td;
    }
    /** Crea un SVG decorativo sin interpretar contenido recibido como HTML.
     * @param {string} tipo Tipo de equipo; los desconocidos usan un icono genérico.
     * @returns {SVGElement} Icono reutilizable en inventario y recomendaciones.
     */
    function crearIconoTipo(tipo) {
        const trazos = {
            Computador: "M5 16V5a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v11M3 16h18l-1 4H4l-1-4Zm6 0h6",
            Monitor: "M4 3h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm8 14v4m-4 0h8",
            Teclado: "M3 6h18a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Zm3 4h.01M10 10h.01M14 10h.01M18 10h.01M6 14h.01M9 14h6m3 0h.01",
            Mouse: "M12 3a6 6 0 0 1 6 6v6a6 6 0 0 1-12 0V9a6 6 0 0 1 6-6Zm0 0v7M6 10h12",
            generico: "M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm3 5h8v8H8V8Z"
        };
        const icono = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        const atributos = { viewBox: "0 0 24 24", width: "20", height: "20", fill: "none", stroke: "currentColor", "stroke-width": "1.6", "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true", focusable: "false" };
        Object.entries(atributos).forEach(([nombre, valor]) => icono.setAttribute(nombre, valor));
        const trazo = document.createElementNS("http://www.w3.org/2000/svg", "path");
        trazo.setAttribute("d", Object.hasOwn(trazos, tipo) ? trazos[tipo] : trazos.generico);
        icono.append(trazo);
        return icono;
    }
    /** Actualiza el selector según la operación, conservando selecciones válidas.
     * @returns {void}
     */
    function opcionesOperacion() {
        const devolucion = $("tipo-operacion").value === "DEVOLUCION";
        $("etiqueta-equipo").textContent = devolucion ? "Préstamo activo" : "Equipo disponible";
        $("grupo-responsable").hidden = devolucion;
        $("nombre-responsable").required = !devolucion;
        // Java no recibe ni persiste identificación; no se solicita en modo real.
        $("documento-usuario").parentElement.hidden = devolucion || api.modo === "real";
        $("documento-usuario").required = !devolucion && api.modo === "simulado";
        const selector = $("codigo-equipo");
        const anterior = selector.value;
        selector.replaceChildren(new Option(devolucion ? "Selecciona un préstamo activo" : "Selecciona un equipo disponible", ""));
        if (devolucion) {
            datos.prestamos.filter(item => item.estado === "ACTIVO").forEach(item => selector.add(new Option(`${item.equipoId} · ${item.responsable}`, String(item.id))));
        } else {
            datos.equipos.forEach(item => {
                const opcion = new Option(`${item.id} · ${item.estado}${item.prestable ? "" : " · Uso libre, no prestable"}`, item.id);
                opcion.disabled = item.estado !== "DISPONIBLE" || !item.prestable;
                selector.add(opcion);
            });
        }
        if (Array.from(selector.options).some(item => item.value === anterior && !item.disabled)) selector.value = anterior;
    }
    /** Sincroniza los dos accesos con el único formulario de movimientos.
     * @returns {void}
     */
    function sincronizarOperacion() {
        if (location.hash !== "#prestamos" && location.hash !== "#devoluciones") return;
        const operacion = location.hash === "#devoluciones" ? "DEVOLUCION" : "PRESTAMO";
        if ($("tipo-operacion").value !== operacion) $("codigo-equipo").value = "";
        $("tipo-operacion").value = operacion;
        opcionesOperacion();
    }
    /** Entrega los datos API al inventario compartido.
     * @returns {void}
     */
    function actualizarInventario() {
        window.TecnoTrackInventario.actualizar(datos.equipos);
    }
    /** Precarga un equipo elegible; nunca registra un préstamo automáticamente.
     * @param {string} id Código del equipo existente en la instantánea local.
     * @returns {void}
     */
    function seleccionar(id) {
        if (cargando || enviando || !listo) return;
        if (!datos.equipos.some(equipo => equipo.id === id && equipo.estado === "DISPONIBLE" && equipo.prestable === true)) return;
        $("tipo-operacion").value = "PRESTAMO";
        opcionesOperacion();
        $("codigo-equipo").value = id;
        location.hash = "prestamos";
        requestAnimationFrame(() => $("codigo-equipo").focus({ preventScroll: true }));
    }
    /** Presenta hasta cinco alternativas en el orden del servicio, sin puntuarlas.
     * @param {Array<{equipoId: string, motivo: string, nombre?: string}>} lista Respuesta validada por api.js.
     * @param {string} equipoSolicitadoId Equipo que originó la consulta.
     * @returns {void}
     */
    function mostrarAlternativas(lista, equipoSolicitadoId) {
        const contenedor = $("recomendaciones-content");
        // Solo se presentan candidatos del servicio; no se generan ni se ordenan aquí.
        const alternativas = lista.map(item => ({ item, equipo: item.equipo || datos.equipos.find(equipo => equipo.id === item.equipoId) }))
            .filter(({ equipo }) => equipo && equipo.id !== equipoSolicitadoId && equipo.estado === "DISPONIBLE" && equipo.prestable === true)
            .slice(0, 5);
        contenedor.replaceChildren();
        const solicitado = datos.equipos.find(equipo => equipo.id === equipoSolicitadoId);
        const contexto = document.createElement("p");
        contexto.className = "alternativas-contexto";
        contexto.textContent = `Equipo solicitado: ${equipoSolicitadoId}${solicitado ? ` · ${solicitado.tipo} · ${solicitado.marca} · ${solicitado.ubicacion}` : ""}`;
        contenedor.append(contexto);
        if (!alternativas.length) {
            const vacio = document.createElement("p");
            vacio.className = "alternativas-aviso";
            vacio.textContent = "No hay alternativas disponibles para este equipo.";
            contenedor.append(vacio);
            return;
        }
        const cantidad = document.createElement("p");
        cantidad.className = "alternativas-aviso";
        cantidad.textContent = alternativas.length === 1 ? "Solo hay una alternativa disponible."
            : alternativas.length === 2 ? "Hay dos alternativas disponibles."
            : `${alternativas.length} alternativas disponibles para comparar.`;
        contenedor.append(cantidad);
        const grupo = document.createElement("ul");
        grupo.className = "alternativas-lista";
        grupo.setAttribute("aria-label", "Alternativas disponibles");
        alternativas.forEach(({ item, equipo }, indice) => {
            const tarjeta = document.createElement("li");
            tarjeta.className = "alternativa-card";
            if (indice === 0 && (api.modo === "simulado" || recomendacionesOrdenadasPorPrioridad)) {
                tarjeta.classList.add("alternativa-principal");
                const prioridad = document.createElement("span");
                prioridad.className = "alternativa-prioridad";
                prioridad.textContent = api.modo === "simulado" ? "Primera opción de prueba" : "Mejor coincidencia";
                tarjeta.append(prioridad);
            }
            const nombre = document.createElement("h3");
            const nombreEquipo = [item.nombre, equipo.nombre].find(valor => typeof valor === "string" && valor.trim());
            nombre.textContent = nombreEquipo ? `${nombreEquipo} · ${equipo.id}` : equipo.id;
            const encabezado = document.createElement("div");
            encabezado.className = "alternativa-encabezado";
            const icono = document.createElement("span");
            icono.className = "alternativa-icono";
            icono.append(crearIconoTipo(equipo.tipo));
            encabezado.append(icono, nombre);
            const estado = document.createElement("span");
            estado.className = "badge badge-disponible";
            estado.textContent = "Disponible para préstamo";
            const detalles = document.createElement("dl");
            detalles.className = "alternativa-detalles";
            [["Tipo", equipo.tipo], ["Marca", equipo.marca], ["Ubicación", equipo.ubicacion]].forEach(([etiqueta, valor]) => {
                if (typeof valor !== "string" || !valor.trim()) return;
                const par = document.createElement("div");
                const titulo = document.createElement("dt");
                titulo.textContent = etiqueta;
                const contenido = document.createElement("dd");
                contenido.textContent = valor;
                par.append(titulo, contenido);
                detalles.append(par);
            });
            const motivo = document.createElement("p");
            motivo.className = "alternativa-motivo";
            motivo.textContent = item.motivo || "El servicio no proporciona un motivo de recomendación.";
            const boton = document.createElement("button");
            boton.type = "button";
            boton.className = "btn btn-secondary";
            boton.textContent = "Seleccionar equipo";
            boton.disabled = cargando || enviando || !listo;
            boton.addEventListener("click", () => seleccionar(equipo.id));
            tarjeta.append(encabezado, estado, detalles, motivo, boton);
            grupo.append(tarjeta);
        });
        contenedor.append(grupo);
    }
    /** Consulta alternativas y descarta respuestas de consultas anteriores.
     * @param {string} id Código del equipo solicitado.
     * @returns {Promise<void>} Los errores se muestran en la sección de resultados.
     */
    async function recomendaciones(id) {
        if (cargando || enviando || !listo) return;
        const solicitud = ++solicitudRecomendacion;
        const contenedor = $("recomendaciones-content");
        contenedor.textContent = "Consultando alternativas…";
        contenedor.setAttribute("aria-busy", "true");
        location.hash = "recomendaciones";
        try {
            const lista = await api.obtenerRecomendaciones(id);
            if (solicitud !== solicitudRecomendacion) return;
            mostrarAlternativas(lista, id);
        } catch (error) {
            if (solicitud === solicitudRecomendacion) contenedor.textContent = error.message;
        } finally {
            if (solicitud === solicitudRecomendacion) contenedor.setAttribute("aria-busy", "false");
        }
    }
    function renderizar() {
        const contar = estado => datos.equipos.filter(item => item.estado === estado).length;
        const resumen = { "total-equipos": datos.equipos.length,
            "equipos-disponibles": contar("DISPONIBLE"),
            "equipos-prestados": contar("PRESTADO"),
            "equipos-danados": contar("DAÑADO"), "equipos-inhabilitados": contar("INHABILITADO"),
            "prestamos-pendientes": datos.prestamos.filter(item => item.estado === "ACTIVO").length };
        Object.entries(resumen).forEach(([id, valor]) => { $(id).textContent = valor; });
        opcionesOperacion();
        actualizarInventario();
        const cuerpo = $("tabla-historial-body");
        cuerpo.replaceChildren();
        datos.historial.slice().sort((a, b) => b.fecha.localeCompare(a.fecha)).forEach(item => {
            const fila = document.createElement("tr");
            [item.fecha, item.equipoId, item.responsable, item.tipo].forEach(valor => celda(fila, valor));
            cuerpo.append(fila);
        });
        if (!datos.historial.length) {
            const fila = document.createElement("tr");
            celda(fila, "Sin movimientos registrados.").colSpan = 4;
            cuerpo.append(fila);
        }
    }
    /** Recarga inventario y préstamos en conjunto; aísla los fallos del historial.
     * @returns {Promise<boolean>} Indica si todas las consultas se completaron.
     */
    async function cargar() {
        if (cargando) return false;
        ++solicitudRecomendacion;
        $("recomendaciones-content").textContent = "Consulta nuevamente las alternativas para ver su disponibilidad actual.";
        $("recomendaciones-content").setAttribute("aria-busy", "false");
        cargando = true;
        controles();
        document.querySelector("main").setAttribute("aria-busy", "true");
        $("estado-conexion").textContent = `${modo} Cargando datos…`;
        try {
            const [equipos, prestamos, historial] = await Promise.allSettled([api.obtenerEquipos(), api.obtenerPrestamos(), api.obtenerHistorial()]);
            listo = equipos.status === "fulfilled" && prestamos.status === "fulfilled";
            if (listo) {
                datos.equipos = equipos.value;
                datos.prestamos = prestamos.value;
            }
            if (historial.status === "fulfilled") {
                datos.historial = historial.value;
                estadoHistorial.textContent = "";
            } else {
                estadoHistorial.textContent = `No se pudo actualizar el historial. ${historial.reason.message} Los registros visibles pueden estar incompletos o desactualizados.`;
            }
            const falloPrincipal = equipos.status === "rejected" ? equipos.reason : prestamos.status === "rejected" ? prestamos.reason : null;
            $("estado-conexion").textContent = !listo
                ? `${modo} ${falloPrincipal.message} Los datos visibles pueden estar desactualizados.`
                : `${modo} Inventario y préstamos actualizados.${historial.status === "rejected" ? " Historial no disponible; consulta el aviso de esa sección." : ""}`;
            return listo && historial.status === "fulfilled";
        } finally {
            cargando = false;
            controles();
            renderizar();
            document.querySelector("main").setAttribute("aria-busy", "false");
        }
    }
    $("form-prestamo").addEventListener("submit", async evento => {
        evento.preventDefault();
        if (enviando || cargando || !listo || !evento.target.reportValidity()) return;
        const devolucion = $("tipo-operacion").value === "DEVOLUCION";
        const id = $("codigo-equipo").value;
        const responsable = $("nombre-responsable").value.trim();
        const identificacion = $("documento-usuario").value.trim();
        if (!devolucion && (!responsable || (api.modo === "simulado" && !identificacion))) return mensaje("Completa los datos del responsable sin usar solo espacios.", true);
        const prestamoActivo = devolucion ? datos.prestamos.find(item => String(item.id) === id && item.estado === "ACTIVO") : null;
        if (devolucion && !prestamoActivo) return mensaje("El préstamo seleccionado ya no está activo. Actualiza los datos.", true);
        if (!devolucion && !datos.equipos.some(item => item.id === id && item.estado === "DISPONIBLE" && item.prestable === true)) {
            return mensaje("El equipo no está disponible para préstamo. Actualiza los datos.", true);
        }
        if (!window.confirm(`¿Confirmas ${devolucion ? "la devolución del préstamo" : "el préstamo del equipo"} ${id}?${api.modo === "simulado" ? " Es una operación de prueba." : ""}`)) return;
        enviando = true;
        controles();
        actualizarInventario();
        mensaje("Enviando operación…");
        try {
            if (devolucion) await api.devolverPrestamo(id, { equipoId: prestamoActivo.equipoId });
            else await api.registrarPrestamo({ equipoId: id, responsable, identificacion });
            evento.target.reset();
            sincronizarOperacion();
            const actualizado = await cargar();
            mensaje(actualizado ? "Operación confirmada. Datos actualizados." : listo
                ? "Operación confirmada. Inventario y préstamos actualizados, pero el historial no está disponible. No repitas la operación."
                : "Operación confirmada, pero no se pudieron actualizar los datos. Pulsa Actualizar datos; no repitas la operación.", !actualizado);
            ++solicitudRecomendacion;
            $("recomendaciones-content").textContent = "Consulta nuevamente las alternativas para ver su disponibilidad actual.";
            $("recomendaciones-content").setAttribute("aria-busy", "false");
        } catch (error) {
            mensaje(error.message + " Consulta los datos antes de repetir la operación.", true);
            // Un fallo de red puede ocurrir después de que el servidor registre la operación.
            listo = false;
        } finally {
            enviando = false;
            controles();
            actualizarInventario();
        }
    });
    // El evento del inventario solo precarga el formulario, sin enviar solicitudes.
    window.TecnoTrackInventario.configurarPresentacion(crearIconoTipo);
    document.addEventListener("tecnotrack:solicitar-prestamo", evento => seleccionar(evento.detail.equipoId));
    document.addEventListener("tecnotrack:consultar-alternativas", evento => recomendaciones(evento.detail.equipoId));
    window.addEventListener("tecnotrack:navegacion", sincronizarOperacion);
    $("tipo-operacion").addEventListener("change", () => {
        $("codigo-equipo").value = "";
        opcionesOperacion();
        location.hash = $("tipo-operacion").value === "DEVOLUCION" ? "devoluciones" : "prestamos";
    });
    $("actualizar-datos").addEventListener("click", cargar);
    sincronizarOperacion();
    cargar();
})();
