package com.slashcode.supportticket.dto.notification;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class PushTokenRequest {

	@NotBlank(message = "Липсва токенът на телефона")
	@Size(max = 255)
	private String token;

	public String getToken() {
		return token;
	}

	public void setToken(String token) {
		this.token = token;
	}
}
