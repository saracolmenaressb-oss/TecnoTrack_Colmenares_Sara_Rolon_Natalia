/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.mycompany.tecnotrack.Modelo.Persistencia;

import com.mycompany.tecnotrack.Controlador.TecnoTrackService;
import com.mycompany.tecnotrack.Modelo.Clases.Equipo;
import com.mycompany.tecnotrack.Modelo.Clases.EstadoEquipo;
import com.mycompany.tecnotrack.Modelo.Clases.TipoEquipo;

/**
 *
 * @author camper
 */
public class DatosIniciales {
    
    public static void cargar(TecnoTrackService servicio){
        
        servicio.agregarEquipo(new Equipo("PC-APO-001", TipoEquipo.COMPUTADOR_ESCRITORIO, "Compumax", "Ubuntu Linux", "Apolo", EstadoEquipo.DISPONIBLE, true));
        
        servicio.agregarEquipo(new Equipo("MOU-APO-001", TipoEquipo.MOUSE, "Compumax", "", "Apolo", EstadoEquipo.DISPONIBLE, true));
        
        servicio.agregarEquipo(new Equipo("TEC-SPU-001", TipoEquipo.TECLADO, "Compumax", "", "Sputnik", EstadoEquipo.DISPONIBLE, true));
        
        servicio.agregarEquipo(new Equipo("MON-ART-001", TipoEquipo.MONITOR, "Compumax", "", "Artemis", EstadoEquipo.DISPONIBLE, true));
        
        servicio.agregarEquipo(new Equipo("PC-HOU-001", TipoEquipo.COMPUTADOR_ESCRITORIO, "Compumax", "Ubuntu Linux", "Houston", EstadoEquipo.INHABILITADO, false));
        
        
    }
    
}
