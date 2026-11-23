package com.slashcode.supportticket.service.impl;

import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.slashcode.supportticket.dto.ticket.AssignTicketRequest;
import com.slashcode.supportticket.dto.ticket.CreateTicketRequest;
import com.slashcode.supportticket.dto.ticket.TicketResponse;
import com.slashcode.supportticket.dto.ticket.UpdateTicketStatusRequest;
import com.slashcode.supportticket.enums.TicketStatus;
import com.slashcode.supportticket.enums.UserRole;
import com.slashcode.supportticket.exception.InvalidTicketAssignmentException;
import com.slashcode.supportticket.exception.ResourceNotFoundException;
import com.slashcode.supportticket.mapper.TicketMapper;
import com.slashcode.supportticket.model.Category;
import com.slashcode.supportticket.model.Ticket;
import com.slashcode.supportticket.model.User;
import com.slashcode.supportticket.respository.CategoryRepository;
import com.slashcode.supportticket.respository.CommentRepository;
import com.slashcode.supportticket.respository.TicketRepository;
import com.slashcode.supportticket.respository.UserRepository;
import com.slashcode.supportticket.response.PageResponse;
import com.slashcode.supportticket.service.TicketAccess;
import com.slashcode.supportticket.service.TicketService;
import com.slashcode.supportticket.util.Paging;

@Service
public class TicketServiceImpl implements TicketService{
	
	private final TicketRepository ticketRepository;
	private final UserRepository userRepository;
	private final CategoryRepository categoryRepository;
	private final CommentRepository commentRepository;
	private final TicketMapper ticketMapper;
	private final TicketAccess ticketAccess;
	
	public TicketServiceImpl(TicketRepository ticketRepository, UserRepository userRepository,
			CategoryRepository categoryRepository, CommentRepository commentRepository, TicketMapper ticketMapper,
			TicketAccess ticketAccess) {
		this.ticketRepository = ticketRepository;
		this.userRepository = userRepository;
		this.categoryRepository = categoryRepository;
		this.commentRepository = commentRepository;
		this.ticketMapper = ticketMapper;
		this.ticketAccess = ticketAccess;
	}
	
	private User findUserOrThrow(Long id) {
		return userRepository.findById(id)
        .orElseThrow(
                () -> new ResourceNotFoundException(
                        "User not found with id " + id
                )
        );
	}
	
	private Category findCategoryOrThrow(Long id) {
		return categoryRepository.findById(id)
		.orElseThrow(
				() -> new ResourceNotFoundException("Category not found with id : "+id)
				);
	}
	
	private Ticket findTicketOrThrow(Long id) {
		 return ticketRepository.findById(id)
			.orElseThrow(
					() -> new ResourceNotFoundException("Ticket not found with id: "+id));
	}

	@Override
	public TicketResponse createTicket(CreateTicketRequest request) {
		User current = ticketAccess.currentUser();
		Long creatorId = ticketAccess.isEmployee(current) ? current.getId() : request.getCreatedById();
		User user = findUserOrThrow(creatorId);
		ticketAccess.requireSameCompany(user.getCompany(), "User not found with id " + creatorId);
		Category category = findCategoryOrThrow(request.getCategoryId());
		ticketAccess.requireSameCompany(category.getCompany(), "Category not found with id : " + request.getCategoryId());
		
		if(!category.getActive()) {
			throw new IllegalArgumentException("Category is inactive");
		}
		
		Ticket ticket = ticketMapper.toEntity(request, category, user);
		ticket.setCompany(user.getCompany());
		ticket.setTicketNumber(generateTicketNumber(user.getCompany().getId()));
		Ticket savedTicket = ticketRepository.save(ticket);
		return ticketMapper.toResponse(savedTicket);
	}

	private static final Map<String, String> TICKET_SORT = Map.of(
			"ticketNumber", "ticketNumber",
			"title", "title",
			"priority", "priority",
			"status", "status",
			"categoryName", "category.name",
			"createdByName", "createdBy.firstName",
			"assignedToName", "assignedTo.firstName",
			"createdAt", "createdAt"
	);

	@Override
	public List<TicketResponse> getAllTickets() {
		User current = ticketAccess.currentUser();
		Long companyId = ticketAccess.requireCompany().getId();
		if (ticketAccess.isEmployee(current)) {
			return ticketRepository.findByCreatedByIdAndCompanyId(current.getId(), companyId)
					.stream()
					.map(ticketMapper::toResponse)
					.toList();
		}
		return ticketRepository.findByCompanyId(companyId)
			.stream()
			.map(ticketMapper::toResponse)
			.toList();			
	}

	@Override
	public PageResponse<TicketResponse> getTicketPage(int page, int size, String sort, String direction) {
		Pageable pageable = Paging.of(page, size, sort, direction, TICKET_SORT, "createdAt");
		User current = ticketAccess.currentUser();
		Long companyId = ticketAccess.requireCompany().getId();
		if (ticketAccess.isEmployee(current)) {
			return Paging.toResponse(
					ticketRepository.findByCreatedByIdAndCompanyId(current.getId(), companyId, pageable),
					ticketMapper::toResponse);
		}
		return Paging.toResponse(ticketRepository.findByCompanyId(companyId, pageable), ticketMapper::toResponse);
	}
	
	@Override
	public TicketResponse getTicketById(Long id) {
		Ticket ticket = findTicketOrThrow(id);
		ticketAccess.requireVisible(ticket);
		return ticketMapper.toResponse(ticket);
	}
	
	
	@Override
	public List<TicketResponse> getMyTickets(Long userId) {
		ticketAccess.requireOwnQuery(userId);
		User owner = findUserOrThrow(userId);
		ticketAccess.requireSameCompany(owner.getCompany(), "User not found with id " + userId);
		Long companyId = owner.getCompany().getId();
		return ticketRepository.findByCreatedByIdAndCompanyId(userId, companyId)
				.stream()
				.map(ticketMapper::toResponse)
				.toList();
	}

	@Override
	public PageResponse<TicketResponse> getMyTicketPage(Long userId, int page, int size, String sort, String direction) {
		ticketAccess.requireOwnQuery(userId);
		User owner = findUserOrThrow(userId);
		ticketAccess.requireSameCompany(owner.getCompany(), "User not found with id " + userId);
		Pageable pageable = Paging.of(page, size, sort, direction, TICKET_SORT, "createdAt");
		return Paging.toResponse(
				ticketRepository.findByCreatedByIdAndCompanyId(userId, owner.getCompany().getId(), pageable),
				ticketMapper::toResponse);
	}
	
	@Override
	public TicketResponse updateStatus(Long id, UpdateTicketStatusRequest request) {
		
		Ticket ticket = findTicketOrThrow(id);
		ticketAccess.requireVisible(ticket);
		
		request.validateStatusTransition(ticket.getStatus());
		
		ticket.setStatus(request.getStatus());
		Ticket updatedTicket = ticketRepository.save(ticket);
		return ticketMapper.toResponse(updatedTicket);
	}
	

	@Override
	public TicketResponse assignTicket(Long id, AssignTicketRequest request) {
		Ticket ticket = findTicketOrThrow(id);
		ticketAccess.requireVisible(ticket);
		
		User supportUser = findUserOrThrow(request.getSupportUserId());
		ticketAccess.requireSameCompany(supportUser.getCompany(), "User not found with id " + request.getSupportUserId());
		
		if(supportUser.getRole() != UserRole.SUPPORT) {
			throw new InvalidTicketAssignmentException("Ticket can only be assigned to a support user");
		}
		
		if(supportUser.getStatus().name().equals("INACTIVE")) {
			throw new InvalidTicketAssignmentException("Ticket cannot be assigned to inactive user");
		}
		
		if(ticket.getStatus() == TicketStatus.CLOSED || 
				ticket.getStatus() == TicketStatus.CANCELLED) {
			throw new InvalidTicketAssignmentException("Closed or cancelled ticket cannot be assigned");
		}
		
		ticket.setAssignedTo(supportUser);
		
		if(ticket.getStatus() == TicketStatus.OPEN) {
			ticket.setStatus(TicketStatus.ASSIGNED);
		}
		
		Ticket updatedTicket = ticketRepository.save(ticket);
		
		return ticketMapper.toResponse(updatedTicket);
	}

	@Override
	@Transactional
	public void deleteTicket(Long id) {
		findTicketOrThrow(id);
		commentRepository.deleteByTicketId(id);
		ticketRepository.deleteById(id);
	}

	private String generateTicketNumber(Long companyId) {
		long count = ticketRepository.countByCompanyId(companyId);
		return "INC-"+(1000001+count);
	}


}
