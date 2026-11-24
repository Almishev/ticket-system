package com.slashcode.supportticket.util;

public final class PasswordPolicy {

	public static final String MESSAGE =
			"Паролата трябва да е поне 8 символа и да съдържа буква, цифра и специален знак.";

	public static final String PATTERN = "^(?=.*\\p{L})(?=.*\\d)(?=.*[^\\p{L}\\d\\s]).{8,}$";

	private PasswordPolicy() {
	}
}
