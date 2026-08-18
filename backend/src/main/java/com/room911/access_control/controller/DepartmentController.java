package com.room911.access_control.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.room911.access_control.model.Department;
import com.room911.access_control.repository.DepartmentRepository;

@RestController
@RequestMapping("/api/departments")
@CrossOrigin(origins = "*") // 👈 Permite la conexión directa desde React
public class DepartmentController {

    private final DepartmentRepository departmentRepository;

    public DepartmentController(DepartmentRepository departmentRepository) {
        this.departmentRepository = departmentRepository;
    }

    @GetMapping
    public List<Department> getAllDepartments() {
        return departmentRepository.findAll();
    }

    @PostMapping
    public ResponseEntity<?> createDepartment(@RequestBody Department department) {
        if (department.getName() == null || department.getName().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("El nombre no puede estar vacío.");
        }
        
        // Asignamos el ID en null para forzar un registro nuevo en PostgreSQL
        department.setId(null); 
        Department saved = departmentRepository.save(department);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }
}