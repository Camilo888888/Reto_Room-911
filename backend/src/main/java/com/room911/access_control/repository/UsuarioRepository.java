package com.room911.access_control.repository;

import com.room911.access_control.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    
    // Buscar por username (que sirve como identificador/documento)
    Optional<Usuario> findByUsername(String username);
}
