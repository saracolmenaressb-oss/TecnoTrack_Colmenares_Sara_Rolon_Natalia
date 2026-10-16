const equipos = [
    // COMPUTADORES - SALÓN APOLO
    {
        id: "PC-APO-001",
        tipo: "Computador",
        marca: "Compumax",
        ubicacion: "Apolo",
        estado: "DISPONIBLE",
        prestable: true
    },
    {
        id: "PC-APO-002",
        tipo: "Computador",
        marca: "Compumax",
        ubicacion: "Apolo",
        estado: "PRESTADO",
        prestable: true
    },
    {
        id: "PC-APO-003",
        tipo: "Computador",
        marca: "Compumax",
        ubicacion: "Apolo",
        estado: "DAÑADO",
        prestable: true
    },

    // MONITORES - SALÓN APOLO
    {
        id: "MON-APO-001",
        tipo: "Monitor",
        marca: "Sin especificar",
        ubicacion: "Apolo",
        estado: "DISPONIBLE",
        prestable: true
    },

    // TECLADOS - SALÓN APOLO
    {
        id: "TEC-APO-001",
        tipo: "Teclado",
        marca: "Sin especificar",
        ubicacion: "Apolo",
        estado: "DISPONIBLE",
        prestable: true
    },

    // MOUSE - SALÓN APOLO
    {
        id: "MOU-APO-001",
        tipo: "Mouse",
        marca: "Sin especificar",
        ubicacion: "Apolo",
        estado: "INHABILITADO",
        prestable: true
    },

    // COMPUTADORES - SALÓN SPUTNIK
    {
        id: "PC-SPU-001",
        tipo: "Computador",
        marca: "Compumax",
        ubicacion: "Sputnik",
        estado: "DISPONIBLE",
        prestable: true
    },
    {
        id: "PC-SPU-002",
        tipo: "Computador",
        marca: "Compumax",
        ubicacion: "Sputnik",
        estado: "DISPONIBLE",
        prestable: true
    },

    // MONITORES - SALÓN SPUTNIK
    {
        id: "MON-SPU-001",
        tipo: "Monitor",
        marca: "Sin especificar",
        ubicacion: "Sputnik",
        estado: "PRESTADO",
        prestable: true
    },

    // TECLADOS - SALÓN SPUTNIK
    {
        id: "TEC-SPU-001",
        tipo: "Teclado",
        marca: "Sin especificar",
        ubicacion: "Sputnik",
        estado: "DAÑADO",
        prestable: true
    },

    // MOUSE - SALÓN SPUTNIK
    {
        id: "MOU-SPU-001",
        tipo: "Mouse",
        marca: "Sin especificar",
        ubicacion: "Sputnik",
        estado: "DISPONIBLE",
        prestable: true
    },

    // COMPUTADORES - SALÓN ARTEMIS
    {
        id: "PC-ART-001",
        tipo: "Computador",
        marca: "Compumax",
        ubicacion: "Artemis",
        estado: "DISPONIBLE",
        prestable: true
    },
    {
        id: "PC-ART-002",
        tipo: "Computador",
        marca: "Compumax",
        ubicacion: "Artemis",
        estado: "DAÑADO",
        prestable: true
    },

    // MONITORES - SALÓN ARTEMIS
    {
        id: "MON-ART-001",
        tipo: "Monitor",
        marca: "Sin especificar",
        ubicacion: "Artemis",
        estado: "DISPONIBLE",
        prestable: true
    },

    // TECLADOS - SALÓN ARTEMIS
    {
        id: "TEC-ART-001",
        tipo: "Teclado",
        marca: "Sin especificar",
        ubicacion: "Artemis",
        estado: "DISPONIBLE",
        prestable: true
    },

    // MOUSE - SALÓN ARTEMIS
    {
        id: "MOU-ART-001",
        tipo: "Mouse",
        marca: "Sin especificar",
        ubicacion: "Artemis",
        estado: "PRESTADO",
        prestable: true
    },

    // COMPUTADORES - SALA HOUSTON
    {
        id: "PC-HOU-001",
        tipo: "Computador",
        marca: "Compumax",
        ubicacion: "Houston",
        estado: "DISPONIBLE",
        prestable: true
    },
    {
        id: "PC-HOU-002",
        tipo: "Computador",
        marca: "Compumax",
        ubicacion: "Houston",
        estado: "PRESTADO",
        prestable: true
    },

    // MONITORES - SALA HOUSTON
    {
        id: "MON-HOU-001",
        tipo: "Monitor",
        marca: "Sin especificar",
        ubicacion: "Houston",
        estado: "DISPONIBLE",
        prestable: true
    },

    // TECLADOS - SALA HOUSTON
    {
        id: "TEC-HOU-001",
        tipo: "Teclado",
        marca: "Sin especificar",
        ubicacion: "Houston",
        estado: "DISPONIBLE",
        prestable: true
    },

    // MOUSE - SALA HOUSTON
    {
        id: "MOU-HOU-001",
        tipo: "Mouse",
        marca: "Sin especificar",
        ubicacion: "Houston",
        estado: "DAÑADO",
        prestable: true
    },

    // COMPUTADORES - CORREDOR (USO LIBRE)
    {
        id: "PC-COR-001",
        tipo: "Computador",
        marca: "Compumax",
        ubicacion: "Corredor",
        estado: "DISPONIBLE",
        prestable: false
    },
    {
        id: "PC-COR-002",
        tipo: "Computador",
        marca: "Compumax",
        ubicacion: "Corredor",
        estado: "DISPONIBLE",
        prestable: false
    },
    {
        id: "PC-COR-003",
        tipo: "Computador",
        marca: "Compumax",
        ubicacion: "Corredor",
        estado: "DAÑADO",
        prestable: false
    }
];


// ==========================================
// 2. PRÉSTAMOS DE PRUEBA
// ==========================================

const prestamos = [
    {
        id: 1,
        equipoId: "PC-APO-002",
        responsable: "Laura Gómez",
        identificacion: "10901001",
        fechaPrestamo: "2026-10-15",
        estado: "ACTIVO",
        fechaDevolucion: null
    },
    {
        id: 2,
        equipoId: "MON-SPU-001",
        responsable: "Carlos Ramírez",
        identificacion: "10901002",
        fechaPrestamo: "2026-10-14",
        estado: "ACTIVO",
        fechaDevolucion: null
    },
    {
        id: 3,
        equipoId: "MOU-ART-001",
        responsable: "Ana Torres",
        identificacion: "10901003",
        fechaPrestamo: "2026-10-13",
        estado: "ACTIVO",
        fechaDevolucion: null
    },
    {
        id: 4,
        equipoId: "PC-HOU-002",
        responsable: "Juan Pérez",
        identificacion: "10901004",
        fechaPrestamo: "2026-10-12",
        estado: "ACTIVO",
        fechaDevolucion: null
    }
];


// ==========================================
// 3. HISTORIAL DE MOVIMIENTOS DE PRUEBA
// ==========================================

const movimientos = [
    {
        id: 1,
        equipoId: "PC-APO-002",
        tipo: "PRESTAMO",
        responsable: "Laura Gómez",
        fecha: "2026-10-15",
        descripcion: "Préstamo registrado"
    },
    {
        id: 2,
        equipoId: "MON-SPU-001",
        tipo: "PRESTAMO",
        responsable: "Carlos Ramírez",
        fecha: "2026-10-14",
        descripcion: "Préstamo registrado"
    },
    {
        id: 3,
        equipoId: "MOU-ART-001",
        tipo: "PRESTAMO",
        responsable: "Ana Torres",
        fecha: "2026-10-13",
        descripcion: "Préstamo registrado"
    },
    {
        id: 4,
        equipoId: "PC-HOU-002",
        tipo: "PRESTAMO",
        responsable: "Juan Pérez",
        fecha: "2026-10-12",
        descripcion: "Préstamo registrado"
    },
    {
        id: 5,
        equipoId: "PC-SPU-001",
        tipo: "DEVOLUCION",
        responsable: "María López",
        fecha: "2026-10-11",
        descripcion: "Equipo devuelto correctamente"
    }
];
