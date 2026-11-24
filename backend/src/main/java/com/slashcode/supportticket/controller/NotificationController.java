package com.slashcode.supportticket.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.slashcode.supportticket.dto.notification.PushTokenRequest;
import com.slashcode.supportticket.exception.ResourceNotFoundException;
import com.slashcode.supportticket.model.User;
import com.slashcode.supportticket.respository.UserRepository;
import com.slashcode.supportticket.response.ApiResponse;
import com.slashcode.supportticket.service.PushNotifier;
import com.slashcode.supportticket.util.ResponseUtils;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/notifications")
public class NotificationController {

	private final UserRepository userRepository;
	private final PushNotifier pushNotifier;

	public NotificationController(UserRepository userRepository, PushNotifier pushNotifier) {
		this.userRepository = userRepository;
		this.pushNotifier = pushNotifier;
	}

	@PostMapping("/token")
	public ResponseEntity<ApiResponse<Void>> register(@Valid @RequestBody PushTokenRequest request, Authentication authentication) {
		pushNotifier.register(currentUser(authentication), request.getToken());
		return ResponseUtils.getResponse(HttpStatus.OK, "Телефонът е записан", null);
	}

	@DeleteMapping("/token")
	public ResponseEntity<ApiResponse<Void>> remove(@Valid @RequestBody PushTokenRequest request, Authentication authentication) {
		pushNotifier.remove(currentUser(authentication), request.getToken());
		return ResponseUtils.getResponse(HttpStatus.OK, "Телефонът е премахнат", null);
	}

	private User currentUser(Authentication authentication) {
		if (authentication == null || authentication.getName() == null) {
			throw new ResourceNotFoundException("User not found");
		}
		return userRepository.findByEmailWithCompany(authentication.getName())
				.orElseThrow(() -> new ResourceNotFoundException("User not found"));
	}
}
