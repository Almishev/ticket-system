package com.slashcode.supportticket.respository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.slashcode.supportticket.model.Company;

public interface CompanyRepository extends JpaRepository<Company, Long> {

	boolean existsByEik(String eik);

	Optional<Company> findByEik(String eik);
}
