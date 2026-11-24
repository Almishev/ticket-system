package com.slashcode.supportticket.respository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.slashcode.supportticket.model.User;

public interface UserRepository extends JpaRepository<User, Long>{

	boolean existsByEmail(String email);

	Optional<User> findByEmail(String email);

	@Query("select u from User u left join fetch u.company where lower(u.email) = lower(:email)")
	Optional<User> findByEmailWithCompany(@Param("email") String email);

	List<User> findByCompanyId(Long companyId);

	Page<User> findByCompanyId(Long companyId, Pageable pageable);

	@Modifying(clearAutomatically = true, flushAutomatically = true)
	@Query("delete from User u where u.company.id = :companyId")
	void deleteByCompanyId(@Param("companyId") Long companyId);
}