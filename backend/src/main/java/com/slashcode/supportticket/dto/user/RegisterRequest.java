package com.slashcode.supportticket.dto.user;

import com.slashcode.supportticket.util.PasswordPolicy;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class RegisterRequest {

	@NotBlank(message = "First Name is required")
	@Size(max = 100, message = "First name cannot exceed 100 chars")
	private String firstName;

	@NotBlank(message = "Last Name is required")
	@Size(max = 100, message = "Last name cannot exceed 100 chars")
	private String lastName;

	@NotBlank(message = "Email is required")
	@Email(message = "Invalid Email Format")
	private String email;

	@NotBlank(message = "Password is required")
	@Pattern(regexp = PasswordPolicy.PATTERN, message = PasswordPolicy.MESSAGE)
	private String password;

	@NotBlank(message = "Сферата на дейност е задължителна")
	@Size(max = 200, message = "Сферата на дейност е твърде дълга")
	private String activity;

	@NotBlank(message = "Името на фирмата е задължително")
	@Size(max = 200, message = "Името на фирмата е твърде дълго")
	private String companyName;

	@NotBlank(message = "ЕИК е задължителен")
	@Pattern(regexp = "\\d{9}|\\d{13}", message = "ЕИК трябва да е 9 или 13 цифри")
	private String eik;

	public String getFirstName() {
		return firstName;
	}

	public void setFirstName(String firstName) {
		this.firstName = firstName;
	}

	public String getLastName() {
		return lastName;
	}

	public void setLastName(String lastName) {
		this.lastName = lastName;
	}

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = email;
	}

	public String getPassword() {
		return password;
	}

	public void setPassword(String password) {
		this.password = password;
	}

	public String getActivity() {
		return activity;
	}

	public void setActivity(String activity) {
		this.activity = activity;
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
}
