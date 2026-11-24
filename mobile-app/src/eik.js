function checkDigit(digits, offset, length, weights, fallbackWeights) {
  let sum = 0
  for (let index = 0; index < length; index += 1) {
    sum += digits[offset + index] * weights[index]
  }
  let remainder = sum % 11
  if (remainder === 10) {
    sum = 0
    for (let index = 0; index < length; index += 1) {
      sum += digits[offset + index] * fallbackWeights[index]
    }
    remainder = sum % 11
    if (remainder === 10) {
      remainder = 0
    }
  }
  return remainder
}

export function isValidEik(value) {
  if (!/^\d{9}(\d{4})?$/.test(value)) {
    return false
  }
  const digits = value.split('').map(Number)
  const ninth = checkDigit(digits, 0, 8, [1, 2, 3, 4, 5, 6, 7, 8], [3, 4, 5, 6, 7, 8, 9, 10])
  if (digits[8] !== ninth) {
    return false
  }
  if (digits.length === 9) {
    return true
  }
  const thirteenth = checkDigit(digits, 8, 4, [2, 7, 3, 5], [4, 9, 5, 7])
  return digits[12] === thirteenth
}
