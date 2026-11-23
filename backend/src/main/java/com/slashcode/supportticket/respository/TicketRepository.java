package com.slashcode.supportticket.respository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.slashcode.supportticket.model.Ticket;
import java.util.List;


public interface TicketRepository extends JpaRepository<Ticket, Long>{

	List<Ticket> findByCreatedById(Long userId);

	Page<Ticket> findByCreatedById(Long userId, Pageable pageable);

	@Modifying(clearAutomatically = true, flushAutomatically = true)
	@Query("delete from Ticket t where t.createdBy.id = :userId")
	void deleteByCreatedById(@Param("userId") Long userId);

	@Modifying(clearAutomatically = true, flushAutomatically = true)
	@Query("""
			update Ticket t
			set t.assignedTo = null,
			    t.status = case
			        when t.status = com.slashcode.supportticket.enums.TicketStatus.ASSIGNED
			        then com.slashcode.supportticket.enums.TicketStatus.OPEN
			        else t.status
			    end
			where t.assignedTo.id = :userId
			""")
	void clearAssignee(@Param("userId") Long userId);
}
