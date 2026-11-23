package com.slashcode.supportticket.util;

import java.util.Map;
import java.util.function.Function;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import com.slashcode.supportticket.response.PageResponse;

public final class Paging {

	private Paging() {
	}

	public static Pageable of(int page, int size, String sort, String direction, Map<String, String> fields, String fallback) {
		int safePage = Math.max(page, 0);
		int safeSize = Math.min(Math.max(size, 1), 50);
		String property = fields.getOrDefault(sort, fallback);
		Sort.Direction dir = "asc".equalsIgnoreCase(direction) ? Sort.Direction.ASC : Sort.Direction.DESC;
		return PageRequest.of(safePage, safeSize, Sort.by(new Sort.Order(dir, property).nullsLast()));
	}

	public static Pageable of(int page, int size, Sort sort) {
		int safePage = Math.max(page, 0);
		int safeSize = Math.min(Math.max(size, 1), 50);
		return PageRequest.of(safePage, safeSize, sort);
	}

	public static <E, T> PageResponse<T> toResponse(Page<E> page, Function<E, T> mapper) {
		PageResponse<T> response = new PageResponse<>();
		response.setContent(page.getContent().stream().map(mapper).toList());
		response.setPage(page.getNumber());
		response.setSize(page.getSize());
		response.setTotalElements(page.getTotalElements());
		response.setTotalPages(page.getTotalPages());
		return response;
	}
}
