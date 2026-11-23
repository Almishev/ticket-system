package com.slashcode.supportticket.util;

public final class Eik {

	private Eik() {
	}

	public static boolean isValid(String value) {
		if (value == null || !value.matches("\\d{9}(\\d{4})?")) {
			return false;
		}
		int[] digits = value.chars().map(character -> character - '0').toArray();
		if (digits[8] != checkDigit(digits, 0, 8, new int[] { 1, 2, 3, 4, 5, 6, 7, 8 }, new int[] { 3, 4, 5, 6, 7, 8, 9, 10 })) {
			return false;
		}
		if (digits.length == 9) {
			return true;
		}
		return digits[12] == checkDigit(digits, 8, 4, new int[] { 2, 7, 3, 5 }, new int[] { 4, 9, 5, 7 });
	}

	private static int checkDigit(int[] digits, int offset, int length, int[] weights, int[] fallbackWeights) {
		int remainder = weightedRemainder(digits, offset, length, weights);
		if (remainder != 10) {
			return remainder;
		}
		remainder = weightedRemainder(digits, offset, length, fallbackWeights);
		return remainder == 10 ? 0 : remainder;
	}

	private static int weightedRemainder(int[] digits, int offset, int length, int[] weights) {
		int sum = 0;
		for (int index = 0; index < length; index++) {
			sum += digits[offset + index] * weights[index];
		}
		return sum % 11;
	}
}
