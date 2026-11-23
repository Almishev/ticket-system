package com.slashcode.supportticket.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.annotation.Secured;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.slashcode.supportticket.dto.company.CompanyResponse;
import com.slashcode.supportticket.dto.company.UpdateCompanyStatusRequest;
import com.slashcode.supportticket.response.ApiResponse;
import com.slashcode.supportticket.service.CompanyService;
import com.slashcode.supportticket.util.ResponseUtils;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/companies")
@Secured("ROLE_SUPER_ADMIN")
public class CompanyController {

	private final CompanyService companyService;

	public CompanyController(CompanyService companyService) {
		this.companyService = companyService;
	}

	@GetMapping
	public ResponseEntity<ApiResponse<List<CompanyResponse>>> getCompanies() {
		return ResponseUtils.getResponse(HttpStatus.OK, "Companies fetched successfully", companyService.getAllCompanies());
	}

	@PatchMapping("/{id}/status")
	public ResponseEntity<ApiResponse<CompanyResponse>> updateStatus(@PathVariable Long id,
			@Valid @RequestBody UpdateCompanyStatusRequest request) {
		return ResponseUtils.getResponse(HttpStatus.OK, "Company status updated successfully",
				companyService.updateStatus(id, request));
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<ApiResponse<Void>> deleteCompany(@PathVariable Long id) {
		companyService.deleteCompany(id);
		return ResponseUtils.getResponse(HttpStatus.OK, "Company deleted successfully", null);
	}
}
