/*
1. mostrarEquipos(lista)
Recibe una lista y crea las filas de la tabla con el código, tipo, ubicación, estado y acciones disponibles.


2. filtrarEquipos()
Lee los valores de búsqueda y los tres selectores, aplica todos los criterios y llama a mostrarEquipos() con los resultados.


3. buscarPorCodigo() — opcional
Puedes incluir la búsqueda dentro de filtrarEquipos() para evitar duplicar lógica. La búsqueda debería ignorar mayúsculas y minúsculas y espacios al principio o al final.


4. actualizarResumen() — recomendable
Actualiza los contadores de equipos disponibles, prestados y dañados. Deben calcularse con los datos reales que se estén mostrando o con el inventario completo, según qué represente cada indicador.
*/
const campoBusquedaInventario =
    document.getElementById("buscarEquipo");

const filtroTipoInventario =
    document.getElementById("filtroTipo");

const filtroUbicacionInventario =
    document.getElementById("filtroUbicacion");

const filtroEstadoInventario =
    document.getElementById("filtroEstado");

const cuerpoTablaInventario =
    document.getElementById("cuerpoInventario");

const mensajeSinResultadosInventario =
    document.getElementById("mensajeSinResultados");

const cantidadResultadosInventario =
    document.getElementById("cantidadResultados");

const mensajeInventario =
    document.getElementById("mensajeInventario");

// La capa de integración entrega la instantánea; nunca se modifica datos.js.
let equiposInventario = [];
let paginaInventario = 1;
const equiposPorPaginaInventario = 8;
let inventarioBloqueado = true;
let inventarioInicializado = false;
let crearIconoTipoInventario = null;

/** Normaliza los valores de búsqueda sin cambiar los datos originales.
 * @param {*} valor Texto del formulario o dato recibido.
 * @returns {string} Texto sin espacios externos y en minúsculas.
 */
function normalizarTextoInventario(valor) {
    return String(valor ?? "").trim().toLocaleLowerCase();
}
function obtenerTextoEstado(estado) {
    const estados = {
        DISPONIBLE: "Disponible",
        PRESTADO: "Prestado",
        DAÑADO: "Dañado",
        INHABILITADO: "Inhabilitado"
    };

    return estados[estado] ?? "Estado desconocido";
}
/**
 * Comprueba si un equipo puede solicitarse en préstamo en la instantánea local.
 * @param {Object} equipo Equipo obtenido de la capa API.
 * @returns {boolean} Elegibilidad visual; el backend valida la operación real.
 */
function equipoPuedePrestarse(equipo) {
    return equipo.estado === "DISPONIBLE"
        && equipo.prestable === true;
}

// ==========================================
// 3. ACTUALIZAR CONTADORES DEL INVENTARIO
// ==========================================

function actualizarResumenInventario() {
    const total = equiposInventario.length;

    const disponibles = equiposInventario.filter(
        equipo => equipo.estado === "DISPONIBLE"
    ).length;

    const prestados = equiposInventario.filter(
        equipo => equipo.estado === "PRESTADO"
    ).length;

    const danados = equiposInventario.filter(
        equipo => equipo.estado === "DAÑADO"
    ).length;

    document.getElementById("totalEquipos").textContent = total;
    document.getElementById("totalDisponibles").textContent = disponibles;
    document.getElementById("totalPrestados").textContent = prestados;
    document.getElementById("totalDanados").textContent = danados;
}
// ==========================================
// 4. MOSTRAR EQUIPOS EN LA TABLA
// ==========================================

/** Renderiza una página de los equipos filtrados y sus acciones.
 * @param {Array<Object>} listaEquipos Equipos que cumplen los filtros existentes.
 * @returns {void}
 */
function mostrarEquipos(listaEquipos) {
    // Elimina las filas anteriores para evitar duplicados.
    cuerpoTablaInventario.replaceChildren();

    // Muestra la cantidad de coincidencias.
    cantidadResultadosInventario.textContent =
        `Se encontraron ${listaEquipos.length} equipo(s).`;

    // Muestra el mensaje vacío cuando no hay coincidencias.
    mensajeSinResultadosInventario.hidden =
        listaEquipos.length !== 0;

    const totalPaginas = Math.max(1, Math.ceil(listaEquipos.length / equiposPorPaginaInventario));
    paginaInventario = Math.min(paginaInventario, totalPaginas);
    const inicio = (paginaInventario - 1) * equiposPorPaginaInventario;
    document.getElementById("pagina-inventario").textContent = listaEquipos.length
        ? `${inicio + 1}–${Math.min(inicio + equiposPorPaginaInventario, listaEquipos.length)} de ${listaEquipos.length} equipos · Página ${paginaInventario} de ${totalPaginas}`
        : "Sin resultados";
    document.getElementById("pagina-anterior").disabled = paginaInventario <= 1;
    document.getElementById("pagina-siguiente").disabled = paginaInventario >= totalPaginas;

    // Conserva el renderizado del inventario y añade paginación y SVG de la integración.
    listaEquipos.slice(inicio, inicio + equiposPorPaginaInventario).forEach(equipo => {
        const fila = document.createElement("tr");

        // Código
        const celdaCodigo = document.createElement("td");
        celdaCodigo.textContent = equipo.id;

        // Tipo
        const celdaTipo = document.createElement("td");
        const tipoPresentado = document.createElement("span");
        tipoPresentado.className = "tipo-equipo";
        if (crearIconoTipoInventario) tipoPresentado.append(crearIconoTipoInventario(equipo.tipo));
        const nombreTipo = document.createElement("span");
        nombreTipo.textContent = equipo.tipo;
        tipoPresentado.append(nombreTipo);
        celdaTipo.append(tipoPresentado);

        // Marca
        const celdaMarca = document.createElement("td");
        celdaMarca.textContent = equipo.marca || "Sin especificar";

        // Ubicación
        const celdaUbicacion = document.createElement("td");
        celdaUbicacion.textContent = equipo.ubicacion;

        // Estado
        const celdaEstado = document.createElement("td");
        const etiquetaEstado = document.createElement("span");

        etiquetaEstado.textContent =
            obtenerTextoEstado(equipo.estado);

        etiquetaEstado.classList.add("estado-equipo");

        const estadosConocidos = [
            "DISPONIBLE",
            "PRESTADO",
            "DAÑADO",
            "INHABILITADO"
        ];

        if (estadosConocidos.includes(equipo.estado)) {
            etiquetaEstado.classList.add(
                `estado-${equipo.estado.toLowerCase()}`
            );
        } else {
            etiquetaEstado.classList.add("estado-desconocido");
        }

        celdaEstado.appendChild(etiquetaEstado);

        // Acción
        const celdaAccion = document.createElement("td");

        if (equipoPuedePrestarse(equipo)) {
            const botonPrestar = document.createElement("button");

            botonPrestar.type = "button";
            botonPrestar.textContent = "Solicitar préstamo";
            botonPrestar.classList.add("boton-prestar");
            botonPrestar.classList.add("btn", "btn-primary");
            botonPrestar.disabled = inventarioBloqueado;

            botonPrestar.addEventListener("click", () => {
                // Se comunica con el módulo de préstamos.
                // Este evento no registra el préstamo por sí solo.
                document.dispatchEvent(
                    new CustomEvent("tecnotrack:solicitar-prestamo", {
                        detail: { equipoId: equipo.id }
                    })
                );
            });

            celdaAccion.appendChild(botonPrestar);

        } else {
            const textoAccion = document.createElement("span");

            if (equipo.estado !== "DISPONIBLE") {
                textoAccion.textContent = "No disponible";
            } else if (equipo.prestable !== true) {
                textoAccion.textContent = "Uso libre";
            } else {
                textoAccion.textContent = "No disponible";
            }

            celdaAccion.appendChild(textoAccion);
            const botonAlternativas = document.createElement("button");
            botonAlternativas.type = "button";
            botonAlternativas.textContent = "Ver alternativas";
            botonAlternativas.className = "btn btn-secondary";
            botonAlternativas.disabled = inventarioBloqueado;
            botonAlternativas.addEventListener("click", () => {
                document.dispatchEvent(new CustomEvent("tecnotrack:consultar-alternativas", {
                    detail: { equipoId: equipo.id }
                }));
            });
            celdaAccion.appendChild(botonAlternativas);
        }

        // Agrega las celdas a la fila.
        fila.append(
            celdaCodigo,
            celdaTipo,
            celdaMarca,
            celdaUbicacion,
            celdaEstado,
            celdaAccion
        );

        cuerpoTablaInventario.appendChild(fila);
    });
}
// ==========================================
// 5. BÚSQUEDA Y FILTROS
// ==========================================

/** Aplica conjuntamente los criterios del formulario a la instantánea API.
 * @returns {void}
 */
function filtrarEquipos() {
    const busqueda = normalizarTextoInventario(
        campoBusquedaInventario.value
    );

    const tipoSeleccionado = normalizarTextoInventario(
        filtroTipoInventario.value
    );

    const ubicacionSeleccionada = normalizarTextoInventario(
        filtroUbicacionInventario.value
    );

    const estadoSeleccionado = normalizarTextoInventario(
        filtroEstadoInventario.value
    );

    const equiposFiltrados = equiposInventario.filter(equipo => {
        const coincideCodigo =
            normalizarTextoInventario(equipo.id).includes(busqueda);

        const coincideTipo =
            tipoSeleccionado === "" ||
            normalizarTextoInventario(equipo.tipo) === tipoSeleccionado;

        const coincideUbicacion =
            ubicacionSeleccionada === "" ||
            normalizarTextoInventario(equipo.ubicacion) ===
                ubicacionSeleccionada;

        const coincideEstado =
            estadoSeleccionado === "" ||
            normalizarTextoInventario(equipo.estado) ===
                estadoSeleccionado;

        // Un equipo debe cumplir todos los criterios seleccionados.
        return coincideCodigo
            && coincideTipo
            && coincideUbicacion
            && coincideEstado;
    });

    mostrarEquipos(equiposFiltrados);
}

// ==========================================
// 6. LIMPIAR LOS FILTROS
// ==========================================

function limpiarFiltrosInventario() {
    paginaInventario = 1;
    campoBusquedaInventario.value = "";
    filtroTipoInventario.value = "";
    filtroUbicacionInventario.value = "";
    filtroEstadoInventario.value = "";

    mensajeInventario.textContent = "";

    filtrarEquipos();
}
// ==========================================
// 7. INICIALIZAR EL INVENTARIO
// ==========================================

/** Registra una sola vez los eventos del inventario y pinta el estado inicial.
 * @returns {void}
 */
function inicializarInventario() {
    if (inventarioInicializado) return;
    inventarioInicializado = true;
    // La primera instantánea puede estar vacía mientras se consulta la API.
    if (!Array.isArray(equiposInventario)) {
        mensajeInventario.textContent =
            "No fue posible cargar el inventario.";

        return;
    }

    // Único propietario de los eventos de búsqueda, filtros y paginación.
    const aplicarFiltros = () => {
        paginaInventario = 1;
        filtrarEquipos();
    };
    campoBusquedaInventario.addEventListener(
        "input",
        aplicarFiltros
    );

    filtroTipoInventario.addEventListener(
        "change",
        aplicarFiltros
    );

    filtroUbicacionInventario.addEventListener(
        "change",
        aplicarFiltros
    );

    filtroEstadoInventario.addEventListener(
        "change",
        aplicarFiltros
    );

    document.getElementById("limpiarFiltros")
        .addEventListener("click", limpiarFiltrosInventario);
    document.getElementById("pagina-anterior").addEventListener("click", () => {
        paginaInventario = Math.max(1, paginaInventario - 1);
        filtrarEquipos();
    });
    document.getElementById("pagina-siguiente").addEventListener("click", () => {
        paginaInventario++;
        filtrarEquipos();
    });

    // Primera carga.
    actualizarResumenInventario();
    filtrarEquipos();
}

/** Entrega al inventario una instantánea del adaptador API, sin modificarla.
 * @param {Array<Object>} lista Equipos validados por api.js.
 * @returns {void}
 */
function actualizarDatosInventario(lista) {
    equiposInventario = lista.slice();
    actualizarResumenInventario();
    filtrarEquipos();
}

window.TecnoTrackInventario = Object.freeze({
    actualizar: actualizarDatosInventario,
    configurarPresentacion: creadorIcono => { crearIconoTipoInventario = creadorIcono; },
    establecerBloqueo: bloqueado => {
        inventarioBloqueado = bloqueado;
        cuerpoTablaInventario.querySelectorAll("button").forEach(boton => { boton.disabled = bloqueado; });
    }
});
// Ejecuta la inicialización cuando el HTML está listo.
if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        inicializarInventario
    );
} else {
    inicializarInventario();
}
