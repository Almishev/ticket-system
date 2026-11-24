package com.slashcode.supportticket.service;

import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import com.slashcode.supportticket.enums.CommentVisiblity;
import com.slashcode.supportticket.enums.TicketStatus;
import com.slashcode.supportticket.enums.UserRole;
import com.slashcode.supportticket.enums.UserStatus;
import com.slashcode.supportticket.model.Comment;
import com.slashcode.supportticket.model.DeviceToken;
import com.slashcode.supportticket.model.Ticket;
import com.slashcode.supportticket.model.User;
import com.slashcode.supportticket.respository.DeviceTokenRepository;
import com.slashcode.supportticket.respository.UserRepository;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@Service
public class PushNotifier {

	private static final Logger log = LoggerFactory.getLogger(PushNotifier.class);
	private static final String EXPO_PUSH = "https://exp.host/--/api/v2/push/send";
	private static final Map<TicketStatus, String> STATUS_NAMES = Map.of(
			TicketStatus.NEW, "Нов",
			TicketStatus.OPEN, "Отворен",
			TicketStatus.ASSIGNED, "Възложен",
			TicketStatus.IN_PROGRESS, "В процес",
			TicketStatus.WAITING_FOR_USER, "Чака потребител",
			TicketStatus.RESOLVED, "Решен",
			TicketStatus.CLOSED, "Затворен",
			TicketStatus.CANCELLED, "Отменен");

	private final DeviceTokenRepository deviceTokenRepository;
	private final UserRepository userRepository;
	private final ObjectMapper objectMapper;
	private final RestClient restClient = RestClient.create();

	public PushNotifier(DeviceTokenRepository deviceTokenRepository, UserRepository userRepository, ObjectMapper objectMapper) {
		this.deviceTokenRepository = deviceTokenRepository;
		this.userRepository = userRepository;
		this.objectMapper = objectMapper;
	}

	@Transactional
	public void register(User user, String rawToken) {
		String token = rawToken.trim();
		DeviceToken row = deviceTokenRepository.findByToken(token).orElseGet(DeviceToken::new);
		row.setToken(token);
		row.setUser(user);
		deviceTokenRepository.save(row);
	}

	@Transactional
	public void remove(User user, String rawToken) {
		deviceTokenRepository.deleteByTokenAndUserId(rawToken.trim(), user.getId());
	}

	public void ticketCreated(Ticket ticket, User actor) {
		if (ticket.getCompany() == null) {
			return;
		}
		List<Long> recipients = userRepository.findByCompanyId(ticket.getCompany().getId()).stream()
				.filter(this::isActiveStaff)
				.map(User::getId)
				.filter(id -> !id.equals(actor.getId()))
				.toList();
		send(recipients, "Нова заявка", ticket.getTicketNumber() + " " + ticket.getTitle(), ticket.getId());
	}

	public void ticketAssigned(Ticket ticket, User assignee, User actor) {
		if (assignee.getId().equals(actor.getId())) {
			return;
		}
		send(List.of(assignee.getId()), "Възлагане", ticket.getTicketNumber() + " е възложена на теб", ticket.getId());
	}

	public void statusChanged(Ticket ticket, User actor) {
		Set<Long> recipients = new LinkedHashSet<>();
		addUser(recipients, ticket.getCreatedBy());
		addUser(recipients, ticket.getAssignedTo());
		recipients.remove(actor.getId());
		String label = STATUS_NAMES.getOrDefault(ticket.getStatus(), ticket.getStatus().name());
		send(recipients, "Статус", ticket.getTicketNumber() + " вече е " + label, ticket.getId());
	}

	public void commentAdded(Ticket ticket, Comment comment, User actor) {
		Set<Long> recipients = new LinkedHashSet<>();
		if (comment.getCommentVisiblity() == CommentVisiblity.INTERNAL) {
			if (ticket.getCompany() == null) {
				return;
			}
			userRepository.findByCompanyId(ticket.getCompany().getId()).stream()
					.filter(this::isActiveStaff)
					.map(User::getId)
					.forEach(recipients::add);
		} else {
			addUser(recipients, ticket.getCreatedBy());
			addUser(recipients, ticket.getAssignedTo());
		}
		recipients.remove(actor.getId());
		String title = comment.getCommentVisiblity() == CommentVisiblity.INTERNAL ? "Вътрешен коментар" : "Нов коментар";
		send(recipients, title, "Коментар по " + ticket.getTicketNumber(), ticket.getId());
	}

	private boolean isActiveStaff(User user) {
		return user.getStatus() == UserStatus.ACTIVE
				&& (user.getRole() == UserRole.ADMIN || user.getRole() == UserRole.SUPPORT);
	}

	private static void addUser(Set<Long> recipients, User user) {
		if (user != null && user.getId() != null) {
			recipients.add(user.getId());
		}
	}

	@Transactional
	public void send(Collection<Long> userIds, String title, String body, Long ticketId) {
		try {
			if (userIds == null || userIds.isEmpty()) {
				return;
			}
			List<DeviceToken> rows = deviceTokenRepository.findByUserIdIn(userIds);
			if (rows.isEmpty()) {
				return;
			}
			List<Map<String, Object>> messages = new ArrayList<>();
			for (DeviceToken row : rows) {
				Map<String, Object> message = new LinkedHashMap<>();
				message.put("to", row.getToken());
				message.put("title", title);
				message.put("body", body);
				message.put("sound", "default");
				message.put("data", Map.of("ticketId", String.valueOf(ticketId)));
				messages.add(message);
			}
			String payload = objectMapper.writeValueAsString(messages);
			String response = restClient.post()
					.uri(EXPO_PUSH)
					.contentType(MediaType.APPLICATION_JSON)
					.accept(MediaType.APPLICATION_JSON)
					.body(payload)
					.retrieve()
					.body(String.class);
			forgetRejected(rows, response);
		} catch (RuntimeException exception) {
			log.warn("Известието не беше изпратено: {}", exception.getMessage());
		}
	}

	private void forgetRejected(List<DeviceToken> rows, String response) {
		if (response == null || response.isBlank()) {
			return;
		}
		JsonNode data = objectMapper.readTree(response).path("data");
		if (!data.isArray()) {
			return;
		}
		for (int index = 0; index < data.size() && index < rows.size(); index += 1) {
			String error = data.get(index).path("details").path("error").asString("");
			if ("DeviceNotRegistered".equals(error)) {
				deviceTokenRepository.delete(rows.get(index));
			}
		}
	}
}
