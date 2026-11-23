package com.slashcode.supportticket.service;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import com.slashcode.supportticket.enums.UserRole;
import com.slashcode.supportticket.exception.ForbiddenException;
import com.slashcode.supportticket.exception.ResourceNotFoundException;
import com.slashcode.supportticket.model.Company;
import com.slashcode.supportticket.model.Ticket;
import com.slashcode.supportticket.model.User;
import com.slashcode.supportticket.respository.UserRepository;

@Component
public class TicketAccess {

	public static final String DENIED = "Нямаш достъп до тази заявка.";

	private final UserRepository userRepository;

	public TicketAccess(UserRepository userRepository) {
		this.userRepository = userRepository;
	}

	public User currentUser() {
		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
		if (authentication == null || !authentication.isAuthenticated() || authentication.getName() == null) {
			throw new ForbiddenException(DENIED);
		}
		return userRepository.findByEmailWithCompany(authentication.getName())
				.orElseThrow(() -> new ForbiddenException(DENIED));
	}

	public boolean isEmployee(User user) {
		return user.getRole() == UserRole.EMPLOYEE;
	}

	public Company requireCompany() {
		User current = currentUser();
		if (current.getRole() == UserRole.SUPER_ADMIN || current.getCompany() == null) {
			throw new ForbiddenException("Нямаш фирма.");
		}
		return current.getCompany();
	}

	public void requireSameCompany(Company company, String missingMessage) {
		Company current = requireCompany();
		if (company == null || !current.getId().equals(company.getId())) {
			throw new ResourceNotFoundException(missingMessage);
		}
	}

	public void requireVisible(Ticket ticket) {
		User current = currentUser();
		if (!sameCompany(current, ticket.getCompany())) {
			throw new ResourceNotFoundException("Ticket not found with id: " + ticket.getId());
		}
		if (isEmployee(current) && !owns(ticket, current)) {
			throw new ForbiddenException(DENIED);
		}
	}

	public void requireOwnQuery(Long userId) {
		User current = currentUser();
		if (isEmployee(current) && !current.getId().equals(userId)) {
			throw new ForbiddenException(DENIED);
		}
	}

	private boolean sameCompany(User user, Company company) {
		return user.getCompany() != null && company != null && user.getCompany().getId().equals(company.getId());
	}

	private boolean owns(Ticket ticket, User user) {
		User creator = ticket.getCreatedBy();
		return creator != null && user.getId().equals(creator.getId());
	}
}
