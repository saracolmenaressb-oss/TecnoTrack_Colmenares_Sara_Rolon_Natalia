/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.mycompany.tecnotrack.Modelo.Clases;

import java.time.LocalDateTime;

/**
 *
 * @author camper
 */
public class Movimiento {
    
    private String id;
    private TipoMovimiento tipo;
    private String equipoId;
    private String responsable;
    private LocalDateTime fecha;
    private String observacion;

    public Movimiento(String id, TipoMovimiento tipo, String equipoId, String responsable, LocalDateTime fecha, String observacion) {
        this.id = id;
        this.tipo = tipo;
        this.equipoId = equipoId;
        this.responsable = responsable;
        this.fecha = fecha;
        this.observacion = observacion;
    }

    public Movimiento(String id, TipoMovimiento tipo, String equipoId, String responsable, String observacion) {
        this.id = id;
        this.tipo = tipo;
        this.equipoId = equipoId;
        this.responsable = responsable;
        this.observacion = observacion;
    }
    
    

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public TipoMovimiento getTipo() {
        return tipo;
    }

    public void setTipo(TipoMovimiento tipo) {
        this.tipo = tipo;
    }

    public String getEquipoId() {
        return equipoId;
    }

    public void setEquipoId(String equipoId) {
        this.equipoId = equipoId;
    }

    public String getResponsable() {
        return responsable;
    }

    public void setResponsable(String responsable) {
        this.responsable = responsable;
    }

    public LocalDateTime getFecha() {
        return fecha;
    }

    public void setFecha(LocalDateTime fecha) {
        this.fecha = fecha;
    }

    public String getObservacion() {
        return observacion;
    }

    public void setObservacion(String observacion) {
        this.observacion = observacion;
    }

    
    
    
}
