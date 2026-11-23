package com.slashcode.supportticket.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.slashcode.supportticket.dto.user.CreateUserRequest;
import com.slashcode.supportticket.dto.user.UserResponse;
import com.slashcode.supportticket.enums.UserRole;
import com.slashcode.supportticket.exception.ResourceNotFoundException;
import com.slashcode.supportticket.mapper.UserMapper;
import com.slashcode.supportticket.respository.UserRepository;
import com.slashcode.supportticket.response.ApiResponse;
import com.slashcode.supportticket.service.UserService;
import com.slashcode.supportticket.util.ResponseUtils;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/auth")
public class AuthController {

	private final UserRepository userRepository;
	private final UserMapper userMapper;
	private final UserService userService;

	public AuthController(UserRepository userRepository, UserMapper userMapper, UserService userService) {
		this.userRepository = userRepository;
		this.userMapper = userMapper;
		this.userService = userService;
	}

	@PostMapping("/register")
	public ResponseEntity<ApiResponse<UserResponse>> register(@Valid @RequestBody CreateUserRequest request) {
		request.setRole(UserRole.ADMIN);
		UserResponse response = userService.createUser(request);
		return ResponseUtils.getResponse(HttpStatus.CREATED, "User registered successfully", response);
	}

	@GetMapping("/me")
	public ResponseEntity<ApiResponse<UserResponse>> me(Authentication authentication) {
		if (authentication == null || !authentication.isAuthenticated()
				|| "anonymousUser".equals(String.valueOf(authentication.getPrincipal()))) {
			return ResponseUtils.getResponse(HttpStatus.UNAUTHORIZED,
					"Authentication is required to access this resource", null);
		}

		UserResponse response = userRepository.findByEmail(authentication.getName())
				.map(userMapper::toResponse)
				.orElseThrow(() -> new ResourceNotFoundException("User not found"));

		return ResponseUtils.getResponse(HttpStatus.OK, "User fetched successfully", response);
	}
}
