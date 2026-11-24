package com.slashcode.supportticket.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "kinde")
public class KindeProperties {

	private final Oauth2 oauth2 = new Oauth2();
	private final Management management = new Management();

	public Oauth2 getOauth2() {
		return oauth2;
	}

	public Management getManagement() {
		return management;
	}

	public static class Oauth2 {
		private String domain;
		private String clientId;
		private String clientSecret;
		private String scopes = "openid,email,profile";
		private String redirectUri;
		private String frontendUrl;

		public String getDomain() {
			return domain;
		}

		public void setDomain(String domain) {
			this.domain = domain;
		}

		public String getClientId() {
			return clientId;
		}

		public void setClientId(String clientId) {
			this.clientId = clientId;
		}

		public String getClientSecret() {
			return clientSecret;
		}

		public void setClientSecret(String clientSecret) {
			this.clientSecret = clientSecret;
		}

		public String getScopes() {
			return scopes;
		}

		public void setScopes(String scopes) {
			this.scopes = scopes;
		}

		public String getRedirectUri() {
			return redirectUri;
		}

		public void setRedirectUri(String redirectUri) {
			this.redirectUri = redirectUri;
		}

		public String getFrontendUrl() {
			return frontendUrl;
		}

		public void setFrontendUrl(String frontendUrl) {
			this.frontendUrl = frontendUrl;
		}
	}

	public static class Management {
		private String clientId;
		private String clientSecret;
		private String audience;

		public String getClientId() {
			return clientId;
		}

		public void setClientId(String clientId) {
			this.clientId = clientId;
		}

		public String getClientSecret() {
			return clientSecret;
		}

		public void setClientSecret(String clientSecret) {
			this.clientSecret = clientSecret;
		}

		public String getAudience() {
			return audience;
		}

		public void setAudience(String audience) {
			this.audience = audience;
		}
	}
}
