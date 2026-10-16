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
public class Prestamo {
    
    private String id;
    private String equipoId;
    private String responsable;
    private LocalDateTime fechaPrestamo;
    private LocalDateTime fechaDevolucion;
    private EstadoPrestamo estado;

    public Prestamo(String id, String equipoId, String responsable) {
        this.id = id;
        this.equipoId = equipoId;
        this.responsable = responsable;
        this.fechaPrestamo = LocalDateTime.now();
        this.fechaDevolucion = null;
        this.estado = EstadoPrestamo.ACTIVO;
    }

    public String getId() {
        return id;
    }

    public String getEquipoId() {
        return equipoId;
    }

    public String getResponsable() {
        return responsable;
    }

    public LocalDateTime getFechaPrestamo() {
        return fechaPrestamo;
    }

    public LocalDateTime getFechaDevolucion() {
        return fechaDevolucion;
    }

    public EstadoPrestamo getEstado() {
        return estado;
    }
    
    public void registrarDevolucion(){
        this.fechaDevolucion = LocalDateTime.now();
        this.estado = EstadoPrestamo.DEVUELTO;
    }
    
}
