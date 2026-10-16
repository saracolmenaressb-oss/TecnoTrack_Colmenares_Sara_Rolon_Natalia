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
 * Comprueba si un equipo puede solicitarse en préstamo.
 */
function equipoPuedePrestarse(equipo) {
    return equipo.estado === "DISPONIBLE"
        && equipo.prestable === true;
}

// ==========================================
// 3. ACTUALIZAR CONTADORES DEL INVENTARIO
// ==========================================

function actualizarResumenInventario() {
    const total = equipos.length;

    const disponibles = equipos.filter(
        equipo => equipo.estado === "DISPONIBLE"
    ).length;

    const prestados = equipos.filter(
        equipo => equipo.estado === "PRESTADO"
    ).length;

    const danados = equipos.filter(
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

function mostrarEquipos(listaEquipos) {
    // Elimina las filas anteriores para evitar duplicados.
    cuerpoTablaInventario.replaceChildren();

    // Muestra la cantidad de coincidencias.
    cantidadResultadosInventario.textContent =
        `Se encontraron ${listaEquipos.length} equipo(s).`;

    // Muestra el mensaje vacío cuando no hay coincidencias.
    mensajeSinResultadosInventario.hidden =
        listaEquipos.length !== 0;

    // Construye una fila por cada equipo.
    listaEquipos.forEach(equipo => {
        const fila = document.createElement("tr");

        // Código
        const celdaCodigo = document.createElement("td");
        celdaCodigo.textContent = equipo.id;

        // Tipo
        const celdaTipo = document.createElement("td");
        celdaTipo.textContent = equipo.tipo;

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

    const equiposFiltrados = equipos.filter(equipo => {
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

function inicializarInventario() {
    // Comprueba que los datos de prueba existan.
    if (!Array.isArray(equipos)) {
        mensajeInventario.textContent =
            "No fue posible cargar el inventario.";

        return;
    }

    // Eventos de búsqueda y filtros.
    campoBusquedaInventario.addEventListener(
        "input",
        filtrarEquipos
    );

    filtroTipoInventario.addEventListener(
        "change",
        filtrarEquipos
    );

    filtroUbicacionInventario.addEventListener(
        "change",
        filtrarEquipos
    );

    filtroEstadoInventario.addEventListener(
        "change",
        filtrarEquipos
    );

    document.getElementById("limpiarFiltros")
        .addEventListener("click", limpiarFiltrosInventario);

    // Primera carga.
    actualizarResumenInventario();
    filtrarEquipos();
}
// Ejecuta la inicialización cuando el HTML está listo.
if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        inicializarInventario
    );
} else {
    inicializarInventario();
}