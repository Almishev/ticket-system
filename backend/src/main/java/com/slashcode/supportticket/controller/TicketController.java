package com.slashcode.supportticket.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.annotation.Secured;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.slashcode.supportticket.dto.ticket.AssignTicketRequest;
import com.slashcode.supportticket.dto.ticket.CreateTicketRequest;
import com.slashcode.supportticket.dto.ticket.TicketResponse;
import com.slashcode.supportticket.dto.ticket.UpdateTicketStatusRequest;
import com.slashcode.supportticket.response.ApiResponse;
import com.slashcode.supportticket.service.TicketService;
import com.slashcode.supportticket.util.ResponseUtils;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/tickets")
public class TicketController {

	private final TicketService ticketService;
	
	public TicketController(TicketService ticketService) {
		this.ticketService = ticketService;
	}

	@PostMapping
	public ResponseEntity<ApiResponse<TicketResponse>> createTicket(@Valid @RequestBody CreateTicketRequest request){
		TicketResponse response = ticketService.createTicket(request);
		return ResponseUtils.getResponse(HttpStatus.CREATED, "Ticket created successfully", response);
	}
	
	@GetMapping
	public ResponseEntity<?> getAllTickets(
			@RequestParam(required = false) Integer page,
			@RequestParam(defaultValue = "20") int size,
			@RequestParam(defaultValue = "createdAt") String sort,
			@RequestParam(defaultValue = "desc") String direction) {
		if (page == null) {
			return ResponseUtils.getResponse(HttpStatus.OK, "Tickets fecthed successfully", ticketService.getAllTickets());
		}
		return ResponseUtils.getResponse(HttpStatus.OK, "Tickets fecthed successfully",
				ticketService.getTicketPage(page, size, sort, direction));
	}
	
	@GetMapping("/{id}")
	public ResponseEntity<ApiResponse<TicketResponse>> getTicketById(@PathVariable Long id){
		TicketResponse response = ticketService.getTicketById(id);
		return ResponseUtils.getResponse(HttpStatus.OK, "Ticket fecthed successfully", response);
		
	}
	
	@GetMapping("/my")
	public ResponseEntity<?> getMyTickets(
			@RequestParam Long userId,
			@RequestParam(required = false) Integer page,
			@RequestParam(defaultValue = "20") int size,
			@RequestParam(defaultValue = "createdAt") String sort,
			@RequestParam(defaultValue = "desc") String direction) {
		if (page == null) {
			return ResponseUtils.getResponse(HttpStatus.OK, "Tickets fecthed successfully", ticketService.getMyTickets(userId));
		}
		return ResponseUtils.getResponse(HttpStatus.OK, "Tickets fecthed successfully",
				ticketService.getMyTicketPage(userId, page, size, sort, direction));
	}
	
	@PutMapping("/{id}/status")
	public ResponseEntity<ApiResponse<TicketResponse>> updateStatus(@PathVariable Long id, @Valid @RequestBody UpdateTicketStatusRequest request){
		
		TicketResponse response = ticketService.updateStatus(id, request);
		return ResponseUtils.getResponse(HttpStatus.OK, "Ticket updated successfully", response);
	}
	
	@PutMapping("/{id}/assign")
	public ResponseEntity<ApiResponse<TicketResponse>> assignTicket(@PathVariable Long id, @Valid @RequestBody AssignTicketRequest request){
		
		TicketResponse response = ticketService.assignTicket(id, request);
		return ResponseUtils.getResponse(HttpStatus.OK, "Ticket assigned successfully", response);
	}

	@Secured("ROLE_ADMIN")
	@DeleteMapping("/{id}")
	public ResponseEntity<ApiResponse<Void>> deleteTicket(@PathVariable Long id) {
		ticketService.deleteTicket(id);
		return ResponseUtils.getResponse(HttpStatus.OK, "Ticket deleted successfully", null);
	}
}
