package com.slashcode.supportticket;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

import com.slashcode.supportticket.config.KindeProperties;

@SpringBootApplication
@EnableConfigurationProperties(KindeProperties.class)
public class SupportTicketManagementSystemApplication {

	public static void main(String[] args) {
		SpringApplication.run(SupportTicketManagementSystemApplication.class, args);
	}

}
