package com.slashcode.supportticket.respository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.slashcode.supportticket.model.DeviceToken;

public interface DeviceTokenRepository extends JpaRepository<DeviceToken, Long> {

	Optional<DeviceToken> findByToken(String token);

	List<DeviceToken> findByUserIdIn(Collection<Long> userIds);

	void deleteByTokenAndUserId(String token, Long userId);
}
