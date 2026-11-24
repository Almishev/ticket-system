package com.slashcode.supportticket.service;

import java.util.List;

import com.slashcode.supportticket.dto.company.CompanyResponse;
import com.slashcode.supportticket.dto.company.UpdateCompanyStatusRequest;
import com.slashcode.supportticket.dto.user.RegisterRequest;
import com.slashcode.supportticket.dto.user.UserResponse;

public interface CompanyService {

	UserResponse register(RegisterRequest request);

	UserResponse registerCompany(String email, String firstName, String lastName, String companyName, String eik,
			String activity);

	List<CompanyResponse> getAllCompanies();

	CompanyResponse updateStatus(Long id, UpdateCompanyStatusRequest request);

	void deleteCompany(Long id);
}
