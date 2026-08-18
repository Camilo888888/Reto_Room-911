package com.room911.access_control.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "employees")
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "internal_id", nullable = false, unique = true)
    private String internalId;

    @Column(name = "first_name", nullable = false)
    private String firstName;

    @Column(name = "last_name", nullable = false)
    private String lastName;

    // 🔑 NUEVO CAMPO DE CONTRASEÑA EN LA TABLA
    @Column(name = "password")
    private String password;

    @ManyToOne
    @JoinColumn(name = "department_id")
    private Department department;

    @Column(name = "access_granted")
    private Boolean accessGranted = true;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getInternalId() { return internalId; }
    public void setInternalId(String internalId) { this.internalId = internalId; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    // 🔑 GETTER Y SETTER PARA LA CONTRASEÑA
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public Department getDepartment() { return department; }
    public void setDepartment(Department department) { this.department = department; }

    public Boolean getAccessGranted() { return accessGranted; }
    public void setAccessGranted(Boolean accessGranted) { this.accessGranted = accessGranted; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}