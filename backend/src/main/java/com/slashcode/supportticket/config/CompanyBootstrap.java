package com.slashcode.supportticket.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.slashcode.supportticket.enums.CompanyStatus;
import com.slashcode.supportticket.enums.UserRole;
import com.slashcode.supportticket.enums.UserStatus;
import com.slashcode.supportticket.model.Category;
import com.slashcode.supportticket.model.Company;
import com.slashcode.supportticket.model.Ticket;
import com.slashcode.supportticket.model.User;
import com.slashcode.supportticket.respository.CategoryRepository;
import com.slashcode.supportticket.respository.CompanyRepository;
import com.slashcode.supportticket.respository.TicketRepository;
import com.slashcode.supportticket.respository.UserRepository;

@Component
public class CompanyBootstrap implements ApplicationRunner {

	static final String FIRST_COMPANY_NAME = "Текуща фирма";
	static final String FIRST_COMPANY_EIK = "123456789";
	static final String SUPER_ADMIN_EMAIL = "superadmin@localhost";
	static final String SUPER_ADMIN_PASSWORD = "0000";

	private final JdbcTemplate jdbcTemplate;
	private final CompanyRepository companyRepository;
	private final UserRepository userRepository;
	private final CategoryRepository categoryRepository;
	private final TicketRepository ticketRepository;
	private final PasswordEncoder passwordEncoder;

	public CompanyBootstrap(JdbcTemplate jdbcTemplate, CompanyRepository companyRepository, UserRepository userRepository,
			CategoryRepository categoryRepository, TicketRepository ticketRepository, PasswordEncoder passwordEncoder) {
		this.jdbcTemplate = jdbcTemplate;
		this.companyRepository = companyRepository;
		this.userRepository = userRepository;
		this.categoryRepository = categoryRepository;
		this.ticketRepository = ticketRepository;
		this.passwordEncoder = passwordEncoder;
	}

	private void dropUniqueConstraintsOutsideCompany(String table) {
		jdbcTemplate.execute("""
				DO $$
				DECLARE constraint_name text;
				BEGIN
					FOR constraint_name IN
						SELECT con.conname
						FROM pg_constraint con
						JOIN pg_class rel ON rel.oid = con.conrelid
						JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
						WHERE nsp.nspname = 'support_ticket'
							AND rel.relname = '%s'
							AND con.contype = 'u'
							AND pg_get_constraintdef(con.oid) NOT ILIKE '%%company_id%%'
					LOOP
						EXECUTE format('ALTER TABLE support_ticket.%s DROP CONSTRAINT %%I', constraint_name);
					END LOOP;
				END $$
				""".formatted(table, table));
	}

	@Override
	@Transactional
	public void run(ApplicationArguments args) {
		jdbcTemplate.execute("ALTER TABLE support_ticket.companies ALTER COLUMN eik TYPE varchar(13)");
		jdbcTemplate.execute("ALTER TABLE support_ticket.tickets ALTER COLUMN description DROP NOT NULL");
		jdbcTemplate.execute("ALTER TABLE support_ticket.users DROP CONSTRAINT IF EXISTS users_role_check");
		jdbcTemplate.execute("""
				ALTER TABLE support_ticket.users
				ADD CONSTRAINT users_role_check
				CHECK (role IN ('EMPLOYEE', 'SUPPORT', 'ADMIN', 'SUPER_ADMIN'))
				""");
		dropUniqueConstraintsOutsideCompany("categories");
		dropUniqueConstraintsOutsideCompany("tickets");
		jdbcTemplate.execute("""
				CREATE UNIQUE INDEX IF NOT EXISTS categories_company_name_key
				ON support_ticket.categories (company_id, name)
				""");
		jdbcTemplate.execute("""
				CREATE UNIQUE INDEX IF NOT EXISTS tickets_company_number_key
				ON support_ticket.tickets (company_id, ticket_number)
				""");

		if (companyRepository.count() == 0 && (userRepository.count() > 0 || categoryRepository.count() > 0 || ticketRepository.count() > 0)) {
			Company company = new Company();
			company.setName(FIRST_COMPANY_NAME);
			company.setEik(FIRST_COMPANY_EIK);
			company.setStatus(CompanyStatus.ACTIVE);
			Company saved = companyRepository.save(company);

			for (User user : userRepository.findAll()) {
				if (user.getCompany() == null && user.getRole() != UserRole.SUPER_ADMIN) {
					user.setCompany(saved);
				}
			}
			userRepository.saveAll(userRepository.findAll());

			for (Category category : categoryRepository.findAll()) {
				if (category.getCompany() == null) {
					category.setCompany(saved);
				}
			}
			categoryRepository.saveAll(categoryRepository.findAll());

			for (Ticket ticket : ticketRepository.findAll()) {
				if (ticket.getCompany() == null) {
					ticket.setCompany(saved);
				}
			}
			ticketRepository.saveAll(ticketRepository.findAll());
		}

		if (!userRepository.existsByEmail(SUPER_ADMIN_EMAIL)) {
			User superAdmin = new User();
			superAdmin.setFirstName("Супер");
			superAdmin.setLastName("Админ");
			superAdmin.setEmail(SUPER_ADMIN_EMAIL);
			superAdmin.setPassword(passwordEncoder.encode(SUPER_ADMIN_PASSWORD));
			superAdmin.setDepartment("Платформа");
			superAdmin.setRole(UserRole.SUPER_ADMIN);
			superAdmin.setStatus(UserStatus.ACTIVE);
			userRepository.save(superAdmin);
		}
	}
}
