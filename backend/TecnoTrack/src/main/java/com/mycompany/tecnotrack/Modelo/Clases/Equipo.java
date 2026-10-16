/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.mycompany.tecnotrack.Modelo.Clases;

/**
 *
 * @author camper
 */
public class Equipo {
    
    private String id;
    private TipoEquipo tipo;
    private String marca;
    private String sistemaOperativo;
    private String ubicacion;
    private EstadoEquipo estado;
    private boolean prestable;

    public Equipo(String id, TipoEquipo tipo, String marca, String sistemaOperativo, String ubicacion, EstadoEquipo estado, boolean prestable) {
        this.id = id;
        this.tipo = tipo;
        this.marca = marca;
        this.sistemaOperativo = sistemaOperativo;
        this.ubicacion = ubicacion;
        this.estado = estado;
        this.prestable = prestable;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public TipoEquipo getTipo() {
        return tipo;
    }

    public void setTipo(TipoEquipo tipo) {
        this.tipo = tipo;
    }

    public String getMarca() {
        return marca;
    }

    public void setMarca(String marca) {
        this.marca = marca;
    }

    public String getSistemaOperativo() {
        return sistemaOperativo;
    }

    public void setSistemaOperativo(String sistemaOperativo) {
        this.sistemaOperativo = sistemaOperativo;
    }

    public String getUbicacion() {
        return ubicacion;
    }

    public void setUbicacion(String ubicacion) {
        this.ubicacion = ubicacion;
    }

    public EstadoEquipo getEstado() {
        return estado;
    }

    public void setEstado(EstadoEquipo estado) {
        this.estado = estado;
    }

    public boolean isPrestable() {
        return prestable;
    }

    public void setPrestable(boolean prestable) {
        this.prestable = prestable;
    }
    
    
    
    
    
    
}
