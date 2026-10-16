/* Vistas independientes con enlaces directos y soporte Atrás/Adelante. */
(function () {
    "use strict";
    const paginas = {
        dashboard: ["Resumen general", "Una vista clara de la disponibilidad y los préstamos de tu inventario."],
        inventario: ["Inventario de equipos", "Encuentra el equipo que necesitas y consulta su disponibilidad."],
        prestamos: ["Registrar préstamo", "Selecciona un equipo disponible y completa los datos del responsable."],
        devoluciones: ["Registrar devolución", "Selecciona un préstamo activo y confirma la devolución del equipo."],
        historial: ["Historial de movimientos", "Consulta los préstamos y devoluciones registrados."],
        recomendaciones: ["Alternativas de equipos", "Consulta las opciones sugeridas para un equipo no disponible."]
    };
    /**
     * Muestra la ruta del hash y notifica al formulario compartido.
     * Préstamos y devoluciones usan la misma sección, sin duplicar controladores.
     * @returns {void}
     */
    function mostrarPagina() {
        const hash = location.hash.slice(1);
        const pagina = Object.hasOwn(paginas, hash) ? hash : "dashboard";
        if (hash !== pagina) history.replaceState(null, "", "#" + pagina);
        const seccionVisible = pagina === "devoluciones" ? "prestamos" : pagina;
        document.querySelectorAll("main > .section").forEach(seccion => { seccion.hidden = seccion.id !== seccionVisible; });
        document.querySelectorAll(".navbar a").forEach(enlace => {
            const activo = enlace.hash === "#" + pagina;
            enlace.classList.toggle("active", activo);
            if (activo) {
                enlace.setAttribute("aria-current", "page");
                // Mantiene visible la opción activa en la navegación horizontal móvil.
                enlace.scrollIntoView?.({ block: "nearest", inline: "nearest" });
            }
            else enlace.removeAttribute("aria-current");
        });
        document.getElementById("titulo-pagina").textContent = paginas[pagina][0];
        document.getElementById("descripcion-pagina").textContent = paginas[pagina][1];
        document.title = `${paginas[pagina][0]} · TecnoTrack`;
        window.dispatchEvent(new CustomEvent("tecnotrack:navegacion", { detail: { pagina } }));
        document.getElementById("contenido").focus({ preventScroll: true });
        window.scrollTo(0, 0);
    }
    window.addEventListener("hashchange", mostrarPagina);
    mostrarPagina();
})();
