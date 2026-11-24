package com.slashcode.supportticket.config;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableMethodSecurity(securedEnabled = true)
public class SecurityConfig {

	private final SecurityExceptionHandler securityExceptionHandler;
	private final KindeJwtConverter kindeJwtConverter;
	
	public SecurityConfig(SecurityExceptionHandler securityExceptionHandler, KindeJwtConverter kindeJwtConverter) {
		this.securityExceptionHandler = securityExceptionHandler;
		this.kindeJwtConverter = kindeJwtConverter;
	}

	@Bean
	public SecurityFilterChain securityFilterChain(HttpSecurity http) {
		
		http
			.csrf(AbstractHttpConfigurer::disable)
			.cors(Customizer.withDefaults())
			.httpBasic(AbstractHttpConfigurer::disable)
			.formLogin(AbstractHttpConfigurer::disable)
			.oauth2ResourceServer(oauth2 -> oauth2
					.authenticationEntryPoint(securityExceptionHandler)
					.jwt(jwt -> jwt.jwtAuthenticationConverter(kindeJwtConverter)))
			
			.sessionManagement(session ->
					session.sessionCreationPolicy(
							SessionCreationPolicy.STATELESS))
			
			.exceptionHandling(exception -> exception
					.authenticationEntryPoint(securityExceptionHandler)
					.accessDeniedHandler(securityExceptionHandler))
			
			.authorizeHttpRequests(auth -> auth
					.requestMatchers("/auth/**").permitAll()
					.anyRequest().authenticated());
		
		return http.build();
	}

	@Bean
	public CorsConfigurationSource corsConfigurationSource() {
		CorsConfiguration configuration = new CorsConfiguration();
		configuration.setAllowedOriginPatterns(List.of(
				"http://localhost:*",
				"http://127.0.0.1:*",
				"http://192.168.*:*",
				"http://10.*:*",
				"http://172.*:*"
		));
		configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
		configuration.setAllowedHeaders(List.of("*"));
		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/**", configuration);
		return source;
	}
	
}
