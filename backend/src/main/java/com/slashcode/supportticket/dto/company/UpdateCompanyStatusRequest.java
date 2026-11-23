package com.slashcode.supportticket.dto.company;

import com.slashcode.supportticket.enums.CompanyStatus;

import jakarta.validation.constraints.NotNull;

public class UpdateCompanyStatusRequest {

	@NotNull(message = "Status is required")
	private CompanyStatus status;

	public CompanyStatus getStatus() {
		return status;
	}

	public void setStatus(CompanyStatus status) {
		this.status = status;
	}
}
