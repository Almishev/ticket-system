package com.slashcode.supportticket.dto.auth;

import jakarta.validation.constraints.NotBlank;

public class MobileCodeRequest {

	@NotBlank
	private String code;

	@NotBlank
	private String state;

	public String getCode() {
		return code;
	}

	public void setCode(String code) {
		this.code = code;
	}

	public String getState() {
		return state;
	}

	public void setState(String state) {
		this.state = state;
	}
}
