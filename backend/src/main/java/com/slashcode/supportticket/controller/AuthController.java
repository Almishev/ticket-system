package com.slashcode.supportticket.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.slashcode.supportticket.dto.user.RegisterRequest;
import com.slashcode.supportticket.dto.user.UserResponse;
import com.slashcode.supportticket.exception.ResourceNotFoundException;
import com.slashcode.supportticket.service.CompanyService;
import com.slashcode.supportticket.mapper.UserMapper;
import com.slashcode.supportticket.respository.UserRepository;
import com.slashcode.supportticket.response.ApiResponse;
import com.slashcode.supportticket.util.ResponseUtils;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/auth")
public class AuthController {

	private final UserRepository userRepository;
	private final UserMapper userMapper;
	private final CompanyService companyService;

	public AuthController(UserRepository userRepository, UserMapper userMapper, CompanyService companyService) {
		this.userRepository = userRepository;
		this.userMapper = userMapper;
		this.companyService = companyService;
	}

	@PostMapping("/register")
	public ResponseEntity<ApiResponse<UserResponse>> register(@Valid @RequestBody RegisterRequest request) {
		UserResponse response = companyService.register(request);
		return ResponseUtils.getResponse(HttpStatus.CREATED, "User registered successfully", response);
	}

	@GetMapping("/me")
	public ResponseEntity<ApiResponse<UserResponse>> me(Authentication authentication) {
		if (authentication == null || !authentication.isAuthenticated()
				|| "anonymousUser".equals(String.valueOf(authentication.getPrincipal()))) {
			return ResponseUtils.getResponse(HttpStatus.UNAUTHORIZED,
					"Authentication is required to access this resource", null);
		}

		UserResponse response = userRepository.findByEmailWithCompany(authentication.getName())
				.map(userMapper::toResponse)
				.orElseThrow(() -> new ResourceNotFoundException("User not found"));

		return ResponseUtils.getResponse(HttpStatus.OK, "User fetched successfully", response);
	}
}
