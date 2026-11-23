package com.slashcode.supportticket.respository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.slashcode.supportticket.model.Category;

public interface CategoryRepository extends JpaRepository<Category, Long>{

	boolean existsByCompanyIdAndNameIgnoreCase(Long companyId, String name);

	List<Category> findByCompanyId(Long companyId);

	Page<Category> findByCompanyId(Long companyId, Pageable pageable);

	@Modifying(clearAutomatically = true, flushAutomatically = true)
	@Query("delete from Category c where c.company.id = :companyId")
	void deleteByCompanyId(@Param("companyId") Long companyId);
}
