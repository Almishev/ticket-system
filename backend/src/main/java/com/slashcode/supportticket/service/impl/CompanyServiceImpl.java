package com.slashcode.supportticket.service.impl;

import java.util.List;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.slashcode.supportticket.dto.company.CompanyResponse;
import com.slashcode.supportticket.dto.company.UpdateCompanyStatusRequest;
import com.slashcode.supportticket.dto.user.RegisterRequest;
import com.slashcode.supportticket.dto.user.UserResponse;
import com.slashcode.supportticket.enums.CompanyStatus;
import com.slashcode.supportticket.enums.UserRole;
import com.slashcode.supportticket.enums.UserStatus;
import com.slashcode.supportticket.exception.CompanyAlreadyExistsException;
import com.slashcode.supportticket.exception.ResourceNotFoundException;
import com.slashcode.supportticket.exception.UserAlreadyExistException;
import com.slashcode.supportticket.mapper.UserMapper;
import com.slashcode.supportticket.model.Company;
import com.slashcode.supportticket.model.User;
import com.slashcode.supportticket.respository.CategoryRepository;
import com.slashcode.supportticket.respository.CommentRepository;
import com.slashcode.supportticket.respository.CompanyRepository;
import com.slashcode.supportticket.respository.TicketRepository;
import com.slashcode.supportticket.respository.UserRepository;
import com.slashcode.supportticket.service.CompanyService;
import com.slashcode.supportticket.service.KindeService;
import com.slashcode.supportticket.util.Eik;

@Service
public class CompanyServiceImpl implements CompanyService {

	private final CompanyRepository companyRepository;
	private final UserRepository userRepository;
	private final TicketRepository ticketRepository;
	private final CommentRepository commentRepository;
	private final CategoryRepository categoryRepository;
	private final UserMapper userMapper;
	private final PasswordEncoder passwordEncoder;
	private final KindeService kindeService;

	public CompanyServiceImpl(CompanyRepository companyRepository, UserRepository userRepository,
			TicketRepository ticketRepository, CommentRepository commentRepository, CategoryRepository categoryRepository,
			UserMapper userMapper, PasswordEncoder passwordEncoder, KindeService kindeService) {
		this.companyRepository = companyRepository;
		this.userRepository = userRepository;
		this.ticketRepository = ticketRepository;
		this.commentRepository = commentRepository;
		this.categoryRepository = categoryRepository;
		this.userMapper = userMapper;
		this.passwordEncoder = passwordEncoder;
		this.kindeService = kindeService;
	}

	@Override
	@Transactional
	public UserResponse register(RegisterRequest request) {
		if (!Eik.isValid(request.getEik())) {
			throw new IllegalArgumentException("Невалиден ЕИК.");
		}
		if (companyRepository.existsByEik(request.getEik())) {
			throw new CompanyAlreadyExistsException("Фирма с този ЕИК вече е регистрирана.");
		}
		if (userRepository.existsByEmail(request.getEmail())) {
			throw new UserAlreadyExistException("Потребител с този имейл вече съществува.");
		}

		Company company = new Company();
		company.setName(request.getCompanyName().trim());
		company.setEik(request.getEik());
		company.setActivity(request.getActivity().trim());
		company.setStatus(CompanyStatus.ACTIVE);
		Company savedCompany = companyRepository.save(company);

		User user = new User();
		user.setFirstName(request.getFirstName().trim());
		user.setLastName(request.getLastName().trim());
		user.setEmail(request.getEmail().trim());
		String passwordHash = passwordEncoder.encode(request.getPassword());
		user.setPassword(passwordHash);
		user.setDepartment("Администрация");
		user.setRole(UserRole.ADMIN);
		user.setStatus(UserStatus.ACTIVE);
		user.setCompany(savedCompany);
		User savedUser = userRepository.save(user);
		kindeService.createUser(savedUser.getEmail(), savedUser.getFirstName(), savedUser.getLastName(), passwordHash);
		return userMapper.toResponse(savedUser);
	}

	@Override
	@Transactional
	public UserResponse registerCompany(String email, String firstName, String lastName, String companyName, String eik,
			String activity) {
		if (!Eik.isValid(eik)) {
			throw new IllegalArgumentException("Невалиден ЕИК.");
		}
		if (companyRepository.existsByEik(eik)) {
			throw new CompanyAlreadyExistsException("Фирма с този ЕИК вече е регистрирана.");
		}
		if (userRepository.findByEmailWithCompany(email).isPresent()) {
			throw new UserAlreadyExistException("Потребител с този имейл вече съществува.");
		}

		Company company = new Company();
		company.setName(companyName.trim());
		company.setEik(eik);
		company.setActivity(activity.trim());
		company.setStatus(CompanyStatus.ACTIVE);
		Company savedCompany = companyRepository.save(company);

		User user = new User();
		user.setFirstName(firstName);
		user.setLastName(lastName);
		user.setEmail(email);
		user.setPassword(passwordEncoder.encode(kindeService.randomSecret()));
		user.setDepartment("Администрация");
		user.setRole(UserRole.ADMIN);
		user.setStatus(UserStatus.ACTIVE);
		user.setCompany(savedCompany);
		return userMapper.toResponse(userRepository.save(user));
	}

	@Override
	public List<CompanyResponse> getAllCompanies() {
		return companyRepository.findAll().stream()
				.sorted((left, right) -> right.getCreatedAt().compareTo(left.getCreatedAt()))
				.map(this::toResponse)
				.toList();
	}

	@Override
	@Transactional
	public CompanyResponse updateStatus(Long id, UpdateCompanyStatusRequest request) {
		Company company = findOrThrow(id);
		company.setStatus(request.getStatus());
		return toResponse(companyRepository.save(company));
	}

	@Override
	@Transactional
	public void deleteCompany(Long id) {
		findOrThrow(id);
		commentRepository.deleteByTicketCompanyId(id);
		ticketRepository.deleteByCompanyId(id);
		categoryRepository.deleteByCompanyId(id);
		userRepository.deleteByCompanyId(id);
		companyRepository.deleteById(id);
	}

	private Company findOrThrow(Long id) {
		return companyRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Company not found with id " + id));
	}

	private CompanyResponse toResponse(Company company) {
		CompanyResponse response = new CompanyResponse();
		response.setId(company.getId());
		response.setName(company.getName());
		response.setEik(company.getEik());
		response.setActivity(company.getActivity());
		response.setStatus(company.getStatus());
		response.setCreatedAt(company.getCreatedAt());
		return response;
	}
}
