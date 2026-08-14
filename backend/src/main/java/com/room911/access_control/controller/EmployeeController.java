package com.room911.access_control.controller;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.room911.access_control.model.Employee;
import com.room911.access_control.repository.EmployeeRepository;

@RestController
@RequestMapping("/api/employees")
@CrossOrigin(origins = "*")
public class EmployeeController {

    private final EmployeeRepository employeeRepository;

    public EmployeeController(EmployeeRepository employeeRepository) {
        this.employeeRepository = employeeRepository;
    }

    // Endpoint para validar el número de carnet
    @GetMapping("/validate/{internalId}")
    public ResponseEntity<Map<String, Object>> validateCard(@PathVariable String internalId) {
        Map<String, Object> response = new HashMap<>();
        Optional<Employee> employeeOpt = employeeRepository.findByInternalId(internalId);

        if (employeeOpt.isEmpty()) {
            response.put("valid", false);
            response.put("message", "Carnet no registrado en el sistema.");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }

        Employee employee = employeeOpt.get();

        if (Boolean.TRUE.equals(employee.getAccessGranted())) {
            response.put("valid", true);
            response.put("message", "Acceso concedido.");
            response.put("employee", employee);
            return ResponseEntity.ok(response);
        } else {
            response.put("valid", false);
            response.put("message", "Acceso denegado: El empleado no tiene permisos de entrada.");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
        }
    }
}