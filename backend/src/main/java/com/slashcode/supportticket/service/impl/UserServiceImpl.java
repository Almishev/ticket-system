package com.slashcode.supportticket.service.impl;

import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.slashcode.supportticket.dto.user.CreateUserRequest;
import com.slashcode.supportticket.dto.user.UpdateUserRequest;
import com.slashcode.supportticket.dto.user.UpdateUserStatusRequest;
import com.slashcode.supportticket.dto.user.UserResponse;
import com.slashcode.supportticket.enums.UserRole;
import com.slashcode.supportticket.exception.ForbiddenException;
import com.slashcode.supportticket.exception.ResourceNotFoundException;
import com.slashcode.supportticket.exception.UserAlreadyExistException;
import com.slashcode.supportticket.mapper.UserMapper;
import com.slashcode.supportticket.model.Company;
import com.slashcode.supportticket.model.User;
import com.slashcode.supportticket.respository.CommentRepository;
import com.slashcode.supportticket.respository.TicketRepository;
import com.slashcode.supportticket.respository.UserRepository;
import com.slashcode.supportticket.response.PageResponse;
import com.slashcode.supportticket.service.KindeService;
import com.slashcode.supportticket.service.TicketAccess;
import com.slashcode.supportticket.service.UserService;
import com.slashcode.supportticket.util.Paging;

@Service
public class UserServiceImpl implements UserService{

	private final UserRepository userRepository;
	private final UserMapper userMapper;
	private final PasswordEncoder passwordEncoder;
	private final TicketRepository ticketRepository;
	private final CommentRepository commentRepository;
	private final TicketAccess ticketAccess;
	private final KindeService kindeService;
	
	public UserServiceImpl(UserRepository userRepository, UserMapper userMapper, PasswordEncoder passwordEncoder,
			TicketRepository ticketRepository, CommentRepository commentRepository, TicketAccess ticketAccess,
			KindeService kindeService) {
		this.userRepository = userRepository;
		this.userMapper = userMapper;
		this.passwordEncoder = passwordEncoder;
		this.ticketRepository = ticketRepository;
		this.commentRepository = commentRepository;
		this.ticketAccess = ticketAccess;
		this.kindeService = kindeService;
	}
	
	private User findUserOrThrow(Long id) {
		User user = userRepository.findById(id)
        .orElseThrow(
                () -> new ResourceNotFoundException(
                        "User not found with id " + id
                )
        );
		ticketAccess.requireSameCompany(user.getCompany(), "User not found with id " + id);
		return user;
	}
	

	@Override
	@Transactional
	public UserResponse createUser(CreateUserRequest request) {
		
		if (request.getRole() == UserRole.SUPER_ADMIN) {
			throw new ForbiddenException("Нямаш достъп до тази роля.");
		}
		Company company = ticketAccess.requireCompany();
		if(userRepository.existsByEmail(request.getEmail())) {
			throw new UserAlreadyExistException("User is already exist with this email "+request.getEmail());
		}
		
		User user = userMapper.toEntity(request);
		user.setCompany(company);
		user.setEmail(request.getEmail().trim());
		String passwordHash = passwordEncoder.encode(request.getPassword());
		user.setPassword(passwordHash);
		User savedUser = userRepository.save(user);
		kindeService.createUser(savedUser.getEmail(), savedUser.getFirstName(), savedUser.getLastName(), passwordHash);
		return userMapper.toResponse(savedUser);
	}


	@Override
	public PageResponse<UserResponse> getUserPage(int page, int size, String sort, String direction) {
		Sort.Direction dir = "asc".equalsIgnoreCase(direction) ? Sort.Direction.ASC : Sort.Direction.DESC;
		Pageable pageable;
		if ("name".equals(sort)) {
			pageable = Paging.of(page, size, Sort.by(new Sort.Order(dir, "firstName"), new Sort.Order(dir, "lastName")));
		} else {
			pageable = Paging.of(page, size, sort, direction,
					Map.of("email", "email", "role", "role", "department", "department", "status", "status", "createdAt", "createdAt"),
					"createdAt");
		}
		Long companyId = ticketAccess.requireCompany().getId();
		return Paging.toResponse(userRepository.findByCompanyId(companyId, pageable), userMapper::toResponse);
	}

	@Override
	public List<UserResponse> getAllUsers() {
		Long companyId = ticketAccess.requireCompany().getId();
		return userRepository.findByCompanyId(companyId)
			.stream()
			.map(user -> userMapper.toResponse(user))
			.toList();
	}
	
	@Override
	public UserResponse getUserById(Long id) {
		User user = findUserOrThrow(id);
		return userMapper.toResponse(user);
	}
	
	@Override
	public UserResponse updateUser(Long id, UpdateUserRequest request) {
		
		User user = findUserOrThrow(id);
		if (request.getRole() == UserRole.SUPER_ADMIN) {
			throw new ForbiddenException("Нямаш достъп до тази роля.");
		}
		
		userMapper.toEntity(user, request);
		
		User updatedUser = userRepository.save(user);
		return userMapper.toResponse(updatedUser);
	}
	
	@Override
	public UserResponse updateUserStatus(Long id, UpdateUserStatusRequest request) {
		
		User user = findUserOrThrow(id);
		userMapper.toEntity(user, request);
		
		User updatedUser = userRepository.save(user);
		return userMapper.toResponse(updatedUser);
	}

	@Override
	@Transactional
	public void deleteUser(Long id) {
		User current = ticketAccess.currentUser();
		if (current.getId().equals(id)) {
			throw new ForbiddenException("Не можеш да изтриеш собствения си профил.");
		}
		findUserOrThrow(id);
		commentRepository.deleteByTicketCreatedById(id);
		commentRepository.deleteByCommentedById(id);
		ticketRepository.deleteByCreatedById(id);
		ticketRepository.clearAssignee(id);
		userRepository.deleteById(id);
	}
}
