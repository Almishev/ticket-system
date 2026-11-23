package com.slashcode.supportticket.service;

import java.util.List;

import com.slashcode.supportticket.dto.ticket.AssignTicketRequest;
import com.slashcode.supportticket.dto.ticket.CreateTicketRequest;
import com.slashcode.supportticket.dto.ticket.TicketResponse;
import com.slashcode.supportticket.dto.ticket.UpdateTicketStatusRequest;
import com.slashcode.supportticket.response.PageResponse;

public interface TicketService {

	TicketResponse createTicket(CreateTicketRequest request);

	List<TicketResponse> getAllTickets();

	PageResponse<TicketResponse> getTicketPage(int page, int size, String sort, String direction);

	TicketResponse getTicketById(Long id);

	List<TicketResponse> getMyTickets(Long userId);

	PageResponse<TicketResponse> getMyTicketPage(Long userId, int page, int size, String sort, String direction);

	TicketResponse updateStatus(Long id, UpdateTicketStatusRequest request);

	TicketResponse assignTicket(Long id, AssignTicketRequest request);

	void deleteTicket(Long id);
	
}
