package com.slashcode.supportticket.dto.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class RegisterCompanyRequest {

	@NotBlank(message = "Липсва входът от Kinde")
	private String token;

	@NotBlank(message = "Името на фирмата е задължително")
	@Size(max = 200, message = "Името на фирмата е твърде дълго")
	private String companyName;

	@NotBlank(message = "ЕИК е задължителен")
	@Pattern(regexp = "\\d{9}|\\d{13}", message = "ЕИК трябва да е 9 или 13 цифри")
	private String eik;

	@NotBlank(message = "Сферата на дейност е задължителна")
	@Size(max = 200, message = "Сферата на дейност е твърде дълга")
	private String activity;

	public String getToken() {
		return token;
	}

	public void setToken(String token) {
		this.token = token;
	}

	public String getCompanyName() {
		return companyName;
	}

	public void setCompanyName(String companyName) {
		this.companyName = companyName;
	}

	public String getEik() {
		return eik;
	}

	public void setEik(String eik) {
		this.eik = eik;
	}

	public String getActivity() {
		return activity;
	}

	public void setActivity(String activity) {
		this.activity = activity;
	}
}
