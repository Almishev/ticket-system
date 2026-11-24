package com.slashcode.supportticket.controller;

import java.security.MessageDigest;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.slashcode.supportticket.enums.CompanyStatus;
import com.slashcode.supportticket.enums.UserStatus;
import com.slashcode.supportticket.model.User;
import com.slashcode.supportticket.service.KindeService;
import com.slashcode.supportticket.service.KindeService.KindeProfile;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import com.slashcode.supportticket.dto.user.RegisterCompanyRequest;
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

	private static final String STATE_COOKIE = "kinde_state";
	private static final String VERIFIER_COOKIE = "kinde_verifier";

	private final UserRepository userRepository;
	private final UserMapper userMapper;
	private final CompanyService companyService;
	private final KindeService kindeService;

	public AuthController(UserRepository userRepository, UserMapper userMapper, CompanyService companyService,
			KindeService kindeService) {
		this.userRepository = userRepository;
		this.userMapper = userMapper;
		this.companyService = companyService;
		this.kindeService = kindeService;
	}

	@GetMapping("/kinde/login")
	public void kindeLogin(@RequestParam(required = false) String email,
			@RequestParam(required = false) String screen, HttpServletResponse response) throws java.io.IOException {
		String state = kindeService.randomSecret();
		String verifier = kindeService.randomSecret();
		addCookie(response, STATE_COOKIE, state);
		addCookie(response, VERIFIER_COOKIE, verifier);
		response.sendRedirect(kindeService.authorizationUrl(state, verifier, email, "register".equals(screen)));
	}

	@GetMapping("/kinde/callback")
	public void kindeCallback(
			@RequestParam(required = false) String code,
			@RequestParam(required = false) String state,
			HttpServletRequest request,
			HttpServletResponse response) throws java.io.IOException {
		String expectedState = cookie(request, STATE_COOKIE);
		String verifier = cookie(request, VERIFIER_COOKIE);
		clearCookie(response, STATE_COOKIE);
		clearCookie(response, VERIFIER_COOKIE);
		if (code == null || code.isBlank() || !same(state, expectedState) || verifier == null) {
			response.sendRedirect(kindeService.frontendUrl() + "/login?error=state");
			return;
		}

		String email;
		String idToken;
		try {
			idToken = kindeService.exchangeIdToken(code, verifier);
			email = kindeService.emailFromIdToken(idToken);
		} catch (RuntimeException exception) {
			response.sendRedirect(kindeService.frontendUrl() + "/login?error=state");
			return;
		}

		User user = userRepository.findByEmailWithCompany(email).orElse(null);
		if (user == null) {
			response.sendRedirect(kindeService.frontendUrl() + "/register#token=" + idToken);
			return;
		}
		boolean companyBlocked = user.getCompany() != null && user.getCompany().getStatus() != CompanyStatus.ACTIVE;
		if (user.getStatus() != UserStatus.ACTIVE || companyBlocked) {
			response.sendRedirect(kindeService.frontendUrl() + "/login?error=blocked");
			return;
		}
		response.sendRedirect(kindeService.frontendUrl() + "/auth/callback#token=" + idToken);
	}

	@PostMapping("/register/company")
	public ResponseEntity<ApiResponse<UserResponse>> registerCompany(@Valid @RequestBody RegisterCompanyRequest request) {
		KindeProfile profile;
		try {
			profile = kindeService.profile(request.getToken());
		} catch (RuntimeException exception) {
			throw new IllegalArgumentException("Входът от Kinde е невалиден.");
		}
		UserResponse response = companyService.registerCompany(profile.email(), profile.firstName(), profile.lastName(),
				request.getCompanyName(), request.getEik(), request.getActivity());
		return ResponseUtils.getResponse(HttpStatus.CREATED, "User registered successfully", response);
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

	private static void addCookie(HttpServletResponse response, String name, String value) {
		ResponseCookie cookie = ResponseCookie.from(name, value)
				.httpOnly(true)
				.path("/api")
				.maxAge(600)
				.sameSite("Lax")
				.build();
		response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
	}

	private static void clearCookie(HttpServletResponse response, String name) {
		ResponseCookie cookie = ResponseCookie.from(name, "")
				.httpOnly(true)
				.path("/api")
				.maxAge(0)
				.sameSite("Lax")
				.build();
		response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
	}

	private static String cookie(HttpServletRequest request, String name) {
		Cookie[] cookies = request.getCookies();
		if (cookies == null) {
			return null;
		}
		for (Cookie cookie : cookies) {
			if (name.equals(cookie.getName())) {
				return cookie.getValue();
			}
		}
		return null;
	}

	private static boolean same(String left, String right) {
		if (left == null || right == null) {
			return false;
		}
		return MessageDigest.isEqual(left.getBytes(java.nio.charset.StandardCharsets.UTF_8),
				right.getBytes(java.nio.charset.StandardCharsets.UTF_8));
	}
}
