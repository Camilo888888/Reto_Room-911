package com.room911.access_control;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import com.room911.access_control.model.Department;
import com.room911.access_control.repository.DepartmentRepository;
import com.room911.access_control.repository.EmployeeRepository;

@SpringBootApplication
public class AccessControlApplication {

    public static void main(String[] args) {
        SpringApplication.run(AccessControlApplication.class, args);
    }

    @Bean
    CommandLineRunner initDatabase(
            EmployeeRepository employeeRepository, 
            DepartmentRepository departmentRepository) {
        return args -> {
            // Limpia registros previos para iniciar desde cero
            employeeRepository.deleteAll();
            departmentRepository.deleteAll();

            // Crea únicamente el Departamento de Administración para asociar al Admin
            if (departmentRepository.count() == 0) {
                Department adminDep = new Department();
                adminDep.setName("Administración");
                departmentRepository.save(adminDep);
            }

            System.out.println();
        };
    }
}