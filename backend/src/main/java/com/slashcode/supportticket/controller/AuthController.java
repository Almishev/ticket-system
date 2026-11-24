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
import com.slashcode.supportticket.service.MobileAuthSessions;
import com.slashcode.supportticket.service.KindeService.KindeProfile;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import com.slashcode.supportticket.dto.auth.MobileCodeRequest;
import com.slashcode.supportticket.dto.auth.MobileLoginResponse;
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
	private static final String CLIENT_COOKIE = "kinde_client";
	private static final String RETURN_COOKIE = "kinde_return";

	private final UserRepository userRepository;
	private final UserMapper userMapper;
	private final CompanyService companyService;
	private final KindeService kindeService;
	private final MobileAuthSessions mobileAuthSessions;

	public AuthController(UserRepository userRepository, UserMapper userMapper, CompanyService companyService,
			KindeService kindeService, MobileAuthSessions mobileAuthSessions) {
		this.userRepository = userRepository;
		this.userMapper = userMapper;
		this.companyService = companyService;
		this.kindeService = kindeService;
		this.mobileAuthSessions = mobileAuthSessions;
	}

	@GetMapping("/kinde/login")
	public void kindeLogin(@RequestParam(required = false) String email,
			@RequestParam(required = false) String screen, @RequestParam(required = false) String client,
			@RequestParam(required = false) String returnTo, HttpServletResponse response) throws java.io.IOException {
		boolean mobile = "mobile".equals(client);
		String state = kindeService.randomSecret();
		String verifier = kindeService.randomSecret();
		if (mobile) {
			if (!kindeService.allowedReturnBase(returnTo)) {
				response.sendError(HttpServletResponse.SC_BAD_REQUEST);
				return;
			}
			String redirectUri = returnTo.trim();
			mobileAuthSessions.save(state, verifier, redirectUri);
			response.sendRedirect(kindeService.authorizationUrl(state, verifier, email, "register".equals(screen), redirectUri));
			return;
		}
		addCookie(response, STATE_COOKIE, state);
		addCookie(response, VERIFIER_COOKIE, verifier);
		addCookie(response, CLIENT_COOKIE, "web");
		clearCookie(response, RETURN_COOKIE);
		response.sendRedirect(kindeService.authorizationUrl(state, verifier, email, "register".equals(screen), false));
	}

	@GetMapping("/kinde/callback")
	public void kindeCallback(
			@RequestParam(required = false) String code,
			@RequestParam(required = false) String state,
			HttpServletRequest request,
			HttpServletResponse response) throws java.io.IOException {
		boolean mobile = "mobile".equals(cookie(request, CLIENT_COOKIE));
		String returnBase = decode(cookie(request, RETURN_COOKIE));
		String expectedState = cookie(request, STATE_COOKIE);
		String verifier = cookie(request, VERIFIER_COOKIE);
		clearCookie(response, STATE_COOKIE);
		clearCookie(response, VERIFIER_COOKIE);
		clearCookie(response, CLIENT_COOKIE);
		clearCookie(response, RETURN_COOKIE);
		if (code == null || code.isBlank() || !same(state, expectedState) || verifier == null) {
			sendApp(response, mobile, returnBase, "/login?error=state", "login?error=state");
			return;
		}

		String email;
		String idToken;
		try {
			idToken = kindeService.exchangeIdToken(code, verifier, mobile);
			email = kindeService.emailFromIdToken(idToken);
		} catch (RuntimeException exception) {
			sendApp(response, mobile, returnBase, "/login?error=state", "login?error=state");
			return;
		}

		User user = userRepository.findByEmailWithCompany(email).orElse(null);
		String token = java.net.URLEncoder.encode(idToken, java.nio.charset.StandardCharsets.UTF_8);
		if (user == null) {
			sendApp(response, mobile, returnBase, "/register#token=" + token, "register?token=" + token);
			return;
		}
		boolean companyBlocked = user.getCompany() != null && user.getCompany().getStatus() != CompanyStatus.ACTIVE;
		if (user.getStatus() != UserStatus.ACTIVE || companyBlocked) {
			sendApp(response, mobile, returnBase, "/login?error=blocked", "login?error=blocked");
			return;
		}
		sendApp(response, mobile, returnBase, "/auth/callback#token=" + token, "auth?token=" + token);
	}

	private void sendApp(HttpServletResponse response, boolean mobile, String returnBase, String webPath, String mobilePath)
			throws java.io.IOException {
		if (mobile) {
			response.sendRedirect(kindeService.appReturn(returnBase, mobilePath));
			return;
		}
		response.sendRedirect(kindeService.frontendUrl() + webPath);
	}

	@PostMapping("/kinde/mobile/exchange")
	public ResponseEntity<ApiResponse<MobileLoginResponse>> exchangeMobile(@Valid @RequestBody MobileCodeRequest request) {
		MobileLoginResponse body = mobileAuthSessions.complete(request.getState(), request.getCode(),
				(code, verifier, redirectUri) -> loginResult(kindeService.exchangeIdToken(code, verifier, redirectUri)));
		return ResponseUtils.getResponse(HttpStatus.OK, "Login completed", body);
	}

	private MobileLoginResponse loginResult(String idToken) {
		User user = userRepository.findByEmailWithCompany(kindeService.emailFromIdToken(idToken)).orElse(null);
		MobileLoginResponse body = new MobileLoginResponse();
		if (user == null) {
			body.setScreen("register");
			body.setToken(idToken);
			return body;
		}
		boolean companyBlocked = user.getCompany() != null && user.getCompany().getStatus() != CompanyStatus.ACTIVE;
		if (user.getStatus() != UserStatus.ACTIVE || companyBlocked) {
			body.setScreen("login");
			body.setError("blocked");
			return body;
		}
		body.setScreen("auth");
		body.setToken(idToken);
		return body;
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

	private static String decode(String value) {
		if (value == null || value.isBlank()) {
			return null;
		}
		return java.net.URLDecoder.decode(value, java.nio.charset.StandardCharsets.UTF_8);
	}

	private static boolean same(String left, String right) {
		if (left == null || right == null) {
			return false;
		}
		return MessageDigest.isEqual(left.getBytes(java.nio.charset.StandardCharsets.UTF_8),
				right.getBytes(java.nio.charset.StandardCharsets.UTF_8));
	}
}
