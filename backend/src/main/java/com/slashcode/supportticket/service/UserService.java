package com.slashcode.supportticket.service;

import java.util.List;

import com.slashcode.supportticket.dto.user.CreateUserRequest;
import com.slashcode.supportticket.response.PageResponse;
import com.slashcode.supportticket.dto.user.UpdateUserRequest;
import com.slashcode.supportticket.dto.user.UpdateUserStatusRequest;
import com.slashcode.supportticket.dto.user.UserResponse;

public interface UserService {

	public UserResponse createUser(CreateUserRequest request);

	public List<UserResponse> getAllUsers();

	public PageResponse<UserResponse> getUserPage(int page, int size, String sort, String direction);

	public UserResponse getUserById(Long id);

	public UserResponse updateUser(Long id, UpdateUserRequest request);

	public UserResponse updateUserStatus(Long id, UpdateUserStatusRequest request);

	void deleteUser(Long id);
}
