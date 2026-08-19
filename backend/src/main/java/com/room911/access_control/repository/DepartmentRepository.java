package com.room911.access_control.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.room911.access_control.model.Department;

public interface DepartmentRepository extends JpaRepository<Department, Long> {
    // Permite buscar un departamento por su nombre exacto para la carga del CSV
    Optional<Department> findByName(String name);
}