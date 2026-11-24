package com.slashcode.supportticket.config;

import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.InvalidBearerTokenException;
import org.springframework.stereotype.Component;

@Component
public class KindeJwtConverter implements Converter<Jwt, AbstractAuthenticationToken> {

	private final AppUserDetailsService userDetailsService;

	public KindeJwtConverter(AppUserDetailsService userDetailsService) {
		this.userDetailsService = userDetailsService;
	}

	@Override
	public AbstractAuthenticationToken convert(Jwt jwt) {
		String email = jwt.getClaimAsString("email");
		if (email == null || email.isBlank()) {
			throw new InvalidBearerTokenException("Missing email");
		}
		UserDetails details;
		try {
			details = userDetailsService.loadUserByUsername(email);
		} catch (UsernameNotFoundException exception) {
			throw new InvalidBearerTokenException("Unknown user");
		}
		if (!details.isEnabled()) {
			throw new InvalidBearerTokenException("Inactive user");
		}
		return new UsernamePasswordAuthenticationToken(details, jwt, details.getAuthorities());
	}
}
