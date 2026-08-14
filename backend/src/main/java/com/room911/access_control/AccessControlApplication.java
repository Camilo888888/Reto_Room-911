package com.room911.access_control;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import com.room911.access_control.model.Department;
import com.room911.access_control.model.Employee;
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
            if (employeeRepository.count() == 0) {
                // 1. Crear Departamentos
                Department pharma = new Department();
                pharma.setName("Pharmaceuticals");
                pharma = departmentRepository.save(pharma);

                Department calidad = new Department();
                calidad.setName("Control de Calidad");
                calidad = departmentRepository.save(calidad);

                // 2. Crear Empleados
                crearEmpleado(employeeRepository, "Laura", "Martínez", "1099887766", true, pharma);
                crearEmpleado(employeeRepository, "Carlos", "Mendoza", "1018456789", true, calidad);
                crearEmpleado(employeeRepository, "Ana", "Gómez", "1098765432", true, pharma);
                crearEmpleado(employeeRepository, "Luis", "Fernando", "1022334455", false, calidad);

                System.out.println("✅ Base de datos inicializada correctamente con empleados de prueba.");
            }
        };
    }

    // Método auxiliar con setters para no chocar con los constructores existentes
    private void crearEmpleado(EmployeeRepository repo, String nombre, String apellido, String carnet, boolean acceso, Department dep) {
        Employee emp = new Employee();
        emp.setFirstName(nombre);
        emp.setLastName(apellido);
        emp.setInternalId(carnet);
        emp.setAccessGranted(acceso);
        emp.setDepartment(dep);
        repo.save(emp);
    }
}