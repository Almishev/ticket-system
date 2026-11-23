package com.slashcode.supportticket.respository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.slashcode.supportticket.model.Comment;

public interface CommentRepository extends JpaRepository<Comment, Long>{

	List<Comment> findByTicketIdOrderByCreatedAtAsc(Long ticketId);

	@Modifying(clearAutomatically = true, flushAutomatically = true)
	@Query("delete from Comment c where c.ticket.id = :ticketId")
	void deleteByTicketId(@Param("ticketId") Long ticketId);

	@Modifying(clearAutomatically = true, flushAutomatically = true)
	@Query("delete from Comment c where c.ticket.createdBy.id = :userId")
	void deleteByTicketCreatedById(@Param("userId") Long userId);

	@Modifying(clearAutomatically = true, flushAutomatically = true)
	@Query("delete from Comment c where c.commentedBy.id = :userId")
	void deleteByCommentedById(@Param("userId") Long userId);

	@Modifying(clearAutomatically = true, flushAutomatically = true)
	@Query("delete from Comment c where c.ticket.company.id = :companyId")
	void deleteByTicketCompanyId(@Param("companyId") Long companyId);
}
