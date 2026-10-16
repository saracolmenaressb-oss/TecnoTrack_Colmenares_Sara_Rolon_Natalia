/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.mycompany.tecnotrack.Controlador;

import com.mycompany.tecnotrack.Modelo.Clases.Equipo;
import com.mycompany.tecnotrack.Modelo.Clases.EstadoEquipo;
import com.mycompany.tecnotrack.Modelo.Clases.EstadoPrestamo;
import com.mycompany.tecnotrack.Modelo.Clases.Movimiento;
import com.mycompany.tecnotrack.Modelo.Clases.Prestamo;
import com.mycompany.tecnotrack.Modelo.Clases.TipoMovimiento;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 *
 * @author camper
 */
public class TecnoTrackService {
    
    private final Map<String, Equipo> equipos = new LinkedHashMap<>();
    private final List<Prestamo> prestamos = new ArrayList<>();
    private final List<Movimiento> movimientos = new ArrayList<>();
    
    private int contadorPrestamos = 1;
    private int contadorMovimientos = 1;
    
    // Metodo para registrar un equipo y evitar IDs duplicados
    public void agregarEquipo(Equipo equipo){
        if(equipo == null || equipo.getId() == null || equipo.getId().trim().isEmpty()){
            throw new IllegalArgumentException("El equipo y su ID son obligatorios.");
        }
        
        if(equipos.containsKey(equipo.getId())){
            throw new IllegalArgumentException("Ya existe un equipo con ese ID.");
        }
        
        equipos.put(equipo.getId(), equipo);
    }
    
    public List<Equipo> listarEquipos(){
        return new ArrayList<>(equipos.values());
    }
    
    public Equipo buscarEquipo(String id){
        return equipos.get(id);
    }
    
    public Prestamo prestarEquipo(String equipoId, String responsable){
        
        if(equipoId == null || equipoId.trim().isEmpty()){
            throw new IllegalArgumentException("Debes indicar el ID del equipo");
        }
        
        if(responsable == null || responsable.trim().isEmpty()){
            throw new IllegalArgumentException("Debes indicar quien recibe el equipo");
        }
        
        Equipo equipo = equipos.get(equipoId);
        
        if(equipo == null){
            throw new IllegalArgumentException("El equipo no existe");
        }
        
        if(!equipo.isPrestable()){
            throw new IllegalArgumentException("Este equipo no está habilitado para prestamo formal");
        }
        
        if(equipo.getEstado() != EstadoEquipo.DISPONIBLE){
            throw new IllegalArgumentException("El equipo no esta disponible para prestamo");
        }
        
        String idPrestamo = "PRE-" + contadorPrestamos++;
        
        Prestamo prestamo = new Prestamo(idPrestamo, equipoId, responsable.trim());
        
        equipo.setEstado(EstadoEquipo.PRESTADO);
        prestamos.add(prestamo);
        
        registrarMovimiento(TipoMovimiento.PRESTAMO, equipoId, responsable.trim(), "Prestamo registrado: " + idPrestamo);
        
        return prestamo;
        
        
        
    }
    
    public Prestamo devolverEquipo(String equipoId, String observacion){
        
        if(equipoId == null || equipoId.trim().isEmpty()){
            throw new IllegalArgumentException("Debes indicar el ID del equipo");
        }
        
        Equipo equipo = equipos.get(equipoId);
        
        if(equipo == null){
            throw new IllegalArgumentException("El equipo no existe");
        }
        
        Prestamo prestamoActivo = null;
        
        for (Prestamo prestamo : prestamos) {
            if(prestamo.getEquipoId().equals(equipoId) && prestamo.getEstado() == EstadoPrestamo.ACTIVO){
                prestamoActivo = prestamo;
                break;
            }
        }
        
        if(prestamoActivo == null){
            throw new IllegalArgumentException("No existe un prestamo activo para este equipo");
        }
        
        prestamoActivo.registrarDevolucion();
        
        if(observacion != null && observacion.toLowerCase().contains("dañado")){
            equipo.setEstado(EstadoEquipo.DANADO);
        } else{
            equipo.setEstado(EstadoEquipo.DISPONIBLE);
        }
        
        registrarMovimiento(TipoMovimiento.DEVOLUCION, equipoId, prestamoActivo.getResponsable(), observacion == null ? "Devolucion registrada" : observacion);
        
        return prestamoActivo;
    }
    
    public List<Prestamo> listarPrestamos(){
        return new ArrayList<>(prestamos);
    }
    
    public List<Movimiento> listarMovimientos(){
        return new ArrayList<>(movimientos);
    }
    
    public List<Equipo> recomendarAlternativas(String equipoId){
        
        Equipo solicitado = equipos.get(equipoId);
        
        if(solicitado == null){
            throw new IllegalArgumentException("El equipo solicitado no existe");
        }
        
        List<Equipo> alternativas = new ArrayList<>();
        
        for (Equipo equipo : equipos.values()) {
            boolean esOtroEquipo = !equipo.getId().equals(equipoId);
            boolean mismoTipo = equipo.getTipo() == solicitado.getTipo();
            boolean disponible = equipo.getEstado() == EstadoEquipo.DISPONIBLE;
            boolean prestable = equipo.isPrestable();
            
            if(esOtroEquipo && mismoTipo && disponible && prestable){
                alternativas.add(equipo);
            }
        }
        
        return alternativas;
        
    }
    
    
    public void marcarDanado(String equipoId){
        Equipo equipo = equipos.get(equipoId);
        
        if(equipo == null){
            throw new IllegalArgumentException("El equipo no existe");
        }
        
        if(equipo.getEstado() == EstadoEquipo.PRESTADO){
            throw new IllegalArgumentException("Primero registra la devolucion del equipo");
        }
        
        equipo.setEstado(EstadoEquipo.DANADO);
        
        registrarMovimiento(TipoMovimiento.DEVOLUCION, equipoId, "Sistema", "Equipo marcado como dañado");
    }
    
    
    private void registrarMovimiento(TipoMovimiento tipo, String equipoId, String responsable, String observacion){
        
        String id = "MOV-" + contadorMovimientos++;
        
        movimientos.add(new Movimiento(id, tipo, equipoId, responsable, observacion));
    }
    
    
    
    
    
    
    
}
