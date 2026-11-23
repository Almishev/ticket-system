package com.slashcode.supportticket.service;

import java.util.List;

import com.slashcode.supportticket.dto.category.CategoryResponse;
import com.slashcode.supportticket.response.PageResponse;
import com.slashcode.supportticket.dto.category.CreateCategoryRequest;
import com.slashcode.supportticket.dto.category.UpdateCategoryRequest;
import com.slashcode.supportticket.dto.category.UpdateCategoryStatusRequest;

public interface CategoryService {

	CategoryResponse createCategory(CreateCategoryRequest request);

	List<CategoryResponse> getAllCategories();

	PageResponse<CategoryResponse> getCategoryPage(int page, int size, String sort, String direction);

	CategoryResponse getCatgeoryById(Long id);

	CategoryResponse updateCategoryById(Long id, UpdateCategoryRequest request);

	CategoryResponse updateCategoryStatusById(Long id, UpdateCategoryStatusRequest request);

}
