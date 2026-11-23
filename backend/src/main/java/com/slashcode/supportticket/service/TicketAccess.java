package com.slashcode.supportticket.service;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import com.slashcode.supportticket.enums.UserRole;
import com.slashcode.supportticket.exception.ForbiddenException;
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
		return userRepository.findByEmail(authentication.getName())
				.orElseThrow(() -> new ForbiddenException(DENIED));
	}

	public boolean isEmployee(User user) {
		return user.getRole() == UserRole.EMPLOYEE;
	}

	public void requireVisible(Ticket ticket) {
		User current = currentUser();
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

	private boolean owns(Ticket ticket, User user) {
		User creator = ticket.getCreatedBy();
		return creator != null && user.getId().equals(creator.getId());
	}
}
