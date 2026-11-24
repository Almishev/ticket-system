package com.slashcode.supportticket.service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import com.slashcode.supportticket.config.KindeProperties;
import com.slashcode.supportticket.exception.KindeException;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@Service
public class KindeService {

	private static final SecureRandom RANDOM = new SecureRandom();

	private final KindeProperties properties;
	private final JwtDecoder jwtDecoder;
	private final ObjectMapper objectMapper;
	private final RestClient restClient = RestClient.create();

	private String managementToken;
	private Instant managementExpiry = Instant.EPOCH;

	public KindeService(KindeProperties properties, JwtDecoder jwtDecoder, ObjectMapper objectMapper) {
		this.properties = properties;
		this.jwtDecoder = jwtDecoder;
		this.objectMapper = objectMapper;
	}

	public String randomSecret() {
		byte[] bytes = new byte[32];
		RANDOM.nextBytes(bytes);
		return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
	}

	public String authorizationUrl(String state, String verifier, String loginHint, boolean register, boolean mobile) {
		return authorizationUrl(state, verifier, loginHint, register, redirectUri(mobile));
	}

	public String authorizationUrl(String state, String verifier, String loginHint, boolean register, String redirectUri) {
		KindeProperties.Oauth2 oauth = properties.getOauth2();
		String scope = oauth.getScopes().replace(',', ' ');
		String url = trim(oauth.getDomain()) + "/oauth2/auth"
				+ "?response_type=code"
				+ "&client_id=" + encode(oauth.getClientId())
				+ "&redirect_uri=" + encode(redirectUri)
				+ "&scope=" + encode(scope)
				+ "&state=" + encode(state)
				+ "&code_challenge=" + encode(challenge(verifier))
				+ "&code_challenge_method=S256"
				+ "&prompt=" + (register ? "create" : "login");
		if (loginHint != null && !loginHint.isBlank()) {
			url += "&login_hint=" + encode(loginHint.trim());
		}
		return url;
	}

	public String redirectUri(boolean mobile) {
		KindeProperties.Oauth2 oauth = properties.getOauth2();
		if (mobile && oauth.getMobileRedirectUri() != null && !oauth.getMobileRedirectUri().isBlank()) {
			return oauth.getMobileRedirectUri().trim();
		}
		return oauth.getRedirectUri();
	}

	public String defaultReturnBase() {
		String scheme = properties.getOauth2().getMobileScheme();
		if (scheme == null || scheme.isBlank()) {
			scheme = "helpdesk";
		}
		return scheme.trim() + "://";
	}

	public boolean allowedReturnBase(String value) {
		if (value == null || value.isBlank() || value.length() > 180 || value.indexOf(' ') >= 0 || value.indexOf('@') >= 0) {
			return false;
		}
		String base = value.trim();
		return base.startsWith(defaultReturnBase()) || base.startsWith("exp://") || base.startsWith("exps://")
				|| base.startsWith("http://localhost:") || base.startsWith("http://127.0.0.1:");
	}

	public String appReturn(String base, String route) {
		String prefix = allowedReturnBase(base) ? base.trim() : defaultReturnBase();
		if (!prefix.endsWith("/")) {
			prefix = prefix + "/";
		}
		return prefix + route;
	}

	public String exchangeIdToken(String code, String verifier, boolean mobile) {
		return exchangeIdToken(code, verifier, redirectUri(mobile));
	}

	public String exchangeIdToken(String code, String verifier, String redirectUri) {
		KindeProperties.Oauth2 oauth = properties.getOauth2();
		MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
		form.add("grant_type", "authorization_code");
		form.add("code", code);
		form.add("redirect_uri", redirectUri);
		form.add("client_id", oauth.getClientId());
		form.add("client_secret", oauth.getClientSecret());
		form.add("code_verifier", verifier);
		JsonNode body = postForm(trim(oauth.getDomain()) + "/oauth2/token", form, null);
		String idToken = body.path("id_token").asString("");
		if (idToken.isBlank()) {
			throw new KindeException("Kinde не върна данни за входа.");
		}
		return idToken;
	}

	public String emailFromIdToken(String idToken) {
		return profile(idToken).email();
	}

	public KindeProfile profile(String idToken) {
		Jwt jwt = jwtDecoder.decode(idToken);
		String email = jwt.getClaimAsString("email");
		if (email == null || email.isBlank()) {
			throw new KindeException("Kinde не върна имейл.");
		}
		return new KindeProfile(email.trim(), name(jwt, "given_name"), name(jwt, "family_name"));
	}

	private static String name(Jwt jwt, String claim) {
		String value = jwt.getClaimAsString(claim);
		if (value == null || value.isBlank()) {
			return "Потребител";
		}
		return value.trim();
	}

	public record KindeProfile(String email, String firstName, String lastName) {
	}

	public void createUser(String email, String firstName, String lastName, String bcryptHash) {
		Map<String, Object> identity = new LinkedHashMap<>();
		identity.put("type", "email");
		identity.put("is_verified", true);
		identity.put("details", Map.of("email", email));

		Map<String, Object> body = new LinkedHashMap<>();
		body.put("profile", Map.of("given_name", firstName, "family_name", lastName));
		body.put("identities", List.of(identity));

		String userId;
		try {
			JsonNode created = postJson("/api/v1/user", body);
			userId = created.path("id").asString("");
			if (userId.isBlank()) {
				throw new KindeException("Kinde не създаде потребителя.");
			}
		} catch (KindeException exception) {
			if (!alreadyExists(exception)) {
				throw exception;
			}
			userId = findUserId(email);
		}

		if (userId.isBlank()) {
			return;
		}

		Map<String, Object> password = new LinkedHashMap<>();
		password.put("hashed_password", bcryptHash);
		password.put("hashing_method", "bcrypt");
		password.put("is_temporary_password", false);
		putJson("/api/v1/users/" + encodePath(userId) + "/password", password);
	}

	private String findUserId(String email) {
		try {
			String raw = restClient.get()
					.uri(trim(properties.getOauth2().getDomain()) + "/api/v1/users?email=" + encode(email))
					.header("Authorization", "Bearer " + managementAccessToken())
					.retrieve()
					.body(String.class);
			JsonNode users = objectMapper.readTree(raw).path("users");
			if (users.isArray() && !users.isEmpty()) {
				return users.get(0).path("id").asString("");
			}
		} catch (RestClientResponseException exception) {
			return "";
		}
		return "";
	}

	private static boolean alreadyExists(KindeException exception) {
		String message = exception.getMessage().toLowerCase();
		return message.contains("exist") || message.contains("already");
	}

	public String frontendUrl() {
		return trim(properties.getOauth2().getFrontendUrl());
	}

	private JsonNode postJson(String path, Map<String, Object> body) {
		return send("POST", path, body);
	}

	private JsonNode putJson(String path, Map<String, Object> body) {
		return send("PUT", path, body);
	}

	private JsonNode send(String method, String path, Map<String, Object> body) {
		try {
			String raw = restClient.method(org.springframework.http.HttpMethod.valueOf(method))
					.uri(trim(properties.getOauth2().getDomain()) + path)
					.contentType(MediaType.APPLICATION_JSON)
					.header("Authorization", "Bearer " + managementAccessToken())
					.body(body)
					.retrieve()
					.body(String.class);
			if (raw == null || raw.isBlank()) {
				return objectMapper.createObjectNode();
			}
			return objectMapper.readTree(raw);
		} catch (RestClientResponseException exception) {
			throw new KindeException(kindeMessage(exception));
		}
	}

	private synchronized String managementAccessToken() {
		if (managementToken != null && Instant.now().isBefore(managementExpiry)) {
			return managementToken;
		}
		KindeProperties.Oauth2 oauth = properties.getOauth2();
		KindeProperties.Management management = properties.getManagement();
		String clientId = blank(management.getClientId()) ? oauth.getClientId() : management.getClientId();
		String clientSecret = blank(management.getClientSecret()) ? oauth.getClientSecret() : management.getClientSecret();
		MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
		form.add("grant_type", "client_credentials");
		form.add("client_id", clientId);
		form.add("client_secret", clientSecret);
		form.add("audience", management.getAudience());
		form.add("scope", "create:users update:user_passwords");
		JsonNode body = postForm(trim(oauth.getDomain()) + "/oauth2/token", form, null);
		managementToken = body.path("access_token").asString("");
		if (managementToken.isBlank()) {
			throw new KindeException("Kinde не даде достъп за създаване на потребители.");
		}
		long seconds = body.path("expires_in").asLong(3600);
		managementExpiry = Instant.now().plusSeconds(Math.max(60, seconds - 60));
		return managementToken;
	}

	private JsonNode postForm(String url, MultiValueMap<String, String> form, String bearer) {
		try {
			RestClient.RequestBodySpec request = restClient.post()
					.uri(url)
					.contentType(MediaType.APPLICATION_FORM_URLENCODED);
			if (bearer != null) {
				request = request.header("Authorization", "Bearer " + bearer);
			}
			String raw = request.body(form).retrieve().body(String.class);
			return objectMapper.readTree(raw);
		} catch (RestClientResponseException exception) {
			throw new KindeException(kindeMessage(exception));
		}
	}

	private String kindeMessage(RestClientResponseException exception) {
		String raw = exception.getResponseBodyAsString();
		try {
			JsonNode node = objectMapper.readTree(raw);
			String message = node.path("errors").path(0).path("message").asString("");
			if (message.isBlank()) {
				message = node.path("error_description").asString("");
			}
			if (!message.isBlank()) {
				return "Kinde отказа: " + message;
			}
		} catch (RuntimeException ignored) {
			return "Kinde отказа заявката.";
		}
		return "Kinde отказа заявката.";
	}

	private static String challenge(String verifier) {
		try {
			byte[] hash = MessageDigest.getInstance("SHA-256").digest(verifier.getBytes(StandardCharsets.US_ASCII));
			return Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
		} catch (java.security.NoSuchAlgorithmException exception) {
			throw new IllegalStateException(exception);
		}
	}

	private static String encode(String value) {
		return URLEncoder.encode(value, StandardCharsets.UTF_8);
	}

	private static String encodePath(String value) {
		return URLEncoder.encode(value, StandardCharsets.UTF_8).replace("+", "%20");
	}

	private static String trim(String value) {
		if (value == null) {
			return "";
		}
		return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
	}

	private static boolean blank(String value) {
		return value == null || value.isBlank();
	}
}
