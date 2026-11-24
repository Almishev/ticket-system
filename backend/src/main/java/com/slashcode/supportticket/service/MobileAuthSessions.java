package com.slashcode.supportticket.service;

import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;

import com.slashcode.supportticket.dto.auth.MobileLoginResponse;

@Component
public class MobileAuthSessions {

	private static final Duration TTL = Duration.ofMinutes(10);

	private final ConcurrentHashMap<String, Pending> sessions = new ConcurrentHashMap<>();

	public void save(String state, String verifier, String redirectUri) {
		Instant now = Instant.now();
		sessions.entrySet().removeIf(entry -> entry.getValue().expiresAt.isBefore(now));
		sessions.put(state, new Pending(verifier, redirectUri, now.plus(TTL)));
	}

	public MobileLoginResponse complete(String state, String code, Exchanger exchanger) {
		Pending pending = sessions.get(state);
		if (pending == null || pending.expiresAt.isBefore(Instant.now())) {
			sessions.remove(state);
			throw new IllegalArgumentException("Входът изтече. Опитай отново.");
		}
		synchronized (pending) {
			if (pending.result == null) {
				pending.result = exchanger.exchange(code, pending.verifier, pending.redirectUri);
			}
			return pending.result;
		}
	}

	@FunctionalInterface
	public interface Exchanger {
		MobileLoginResponse exchange(String code, String verifier, String redirectUri);
	}

	private static final class Pending {
		private final String verifier;
		private final String redirectUri;
		private final Instant expiresAt;
		private MobileLoginResponse result;

		private Pending(String verifier, String redirectUri, Instant expiresAt) {
			this.verifier = verifier;
			this.redirectUri = redirectUri;
			this.expiresAt = expiresAt;
		}
	}
}
