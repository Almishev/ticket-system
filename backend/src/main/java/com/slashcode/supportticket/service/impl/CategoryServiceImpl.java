package com.slashcode.supportticket.service.impl;

import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.slashcode.supportticket.dto.category.CategoryResponse;
import com.slashcode.supportticket.dto.category.CreateCategoryRequest;
import com.slashcode.supportticket.dto.category.UpdateCategoryRequest;
import com.slashcode.supportticket.dto.category.UpdateCategoryStatusRequest;
import com.slashcode.supportticket.exception.CategoryAlreadyExistsException;
import com.slashcode.supportticket.exception.ResourceNotFoundException;
import com.slashcode.supportticket.mapper.CategoryMapper;
import com.slashcode.supportticket.model.Category;
import com.slashcode.supportticket.model.Company;
import com.slashcode.supportticket.respository.CategoryRepository;
import com.slashcode.supportticket.response.PageResponse;
import com.slashcode.supportticket.service.CategoryService;
import com.slashcode.supportticket.service.TicketAccess;
import com.slashcode.supportticket.util.Paging;

@Service
public class CategoryServiceImpl implements CategoryService{

	private final CategoryRepository categoryRepository;
	private final CategoryMapper categoryMapper;
	private final TicketAccess ticketAccess;
	
	public CategoryServiceImpl(CategoryRepository categoryRepository, CategoryMapper categoryMapper, TicketAccess ticketAccess) {
		this.categoryRepository = categoryRepository;
		this.categoryMapper = categoryMapper;
		this.ticketAccess = ticketAccess;
	}
	
	private Category findCategoryOrThrow(Long id) {
		Category category = categoryRepository.findById(id)
		.orElseThrow(
				() -> new ResourceNotFoundException("Category not found with id : "+id)
				);
		ticketAccess.requireSameCompany(category.getCompany(), "Category not found with id : " + id);
		return category;
	}

	@Override
	public CategoryResponse createCategory(CreateCategoryRequest request) {
		Company company = ticketAccess.requireCompany();
		if(categoryRepository.existsByCompanyIdAndNameIgnoreCase(company.getId(), request.getName())) {
			throw new CategoryAlreadyExistsException("Category already exists with name "+ request.getName());
		}
		
		Category category = categoryMapper.toEntity(request);
		category.setCompany(company);
		Category savedCategory = categoryRepository.save(category);
		
		return categoryMapper.toResponse(savedCategory);
	}
	
	@Override
	public PageResponse<CategoryResponse> getCategoryPage(int page, int size, String sort, String direction) {
		Long companyId = ticketAccess.requireCompany().getId();
		Pageable pageable = Paging.of(page, size, sort, direction, Map.of("name", "name", "active", "active"), "name");
		return Paging.toResponse(categoryRepository.findByCompanyId(companyId, pageable), categoryMapper::toResponse);
	}

	@Override
	public List<CategoryResponse> getAllCategories() {
		Long companyId = ticketAccess.requireCompany().getId();
		return 
		categoryRepository.findByCompanyId(companyId)
			.stream()
			.map(category -> categoryMapper.toResponse(category))
			.toList();
		
	}

	@Override
	public CategoryResponse getCatgeoryById(Long id) {
		
		Category category = findCategoryOrThrow(id);
		return categoryMapper.toResponse(category);
	}
	
	@Override
	public CategoryResponse updateCategoryById(Long id, UpdateCategoryRequest request) {
		Category category = findCategoryOrThrow(id);
		
		if(!category.getName().equals(request.getName())
				&& categoryRepository.existsByCompanyIdAndNameIgnoreCase(category.getCompany().getId(), request.getName())) {
			throw new CategoryAlreadyExistsException("Category already exists with name "+ request.getName());
		}
		
		categoryMapper.toEntity(category, request);
		
		Category updatedCategory = categoryRepository.save(category);
		return categoryMapper.toResponse(updatedCategory);
	}


	@Override
	public CategoryResponse updateCategoryStatusById(Long id, UpdateCategoryStatusRequest request) {
		Category category = findCategoryOrThrow(id);
		
		categoryMapper.toEntity(category, request);
		
		Category updatedCategory = categoryRepository.save(category);
		return categoryMapper.toResponse(updatedCategory);
	}



}
