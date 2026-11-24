export const PASSWORD_MESSAGE =
  'Паролата трябва да е поне 8 символа и да съдържа буква, цифра и специален знак.'

const PASSWORD_PATTERN = /^(?=.*\p{L})(?=.*\d)(?=.*[^\p{L}\d\s]).{8,}$/u

export function isValidPassword(value) {
  return PASSWORD_PATTERN.test(value)
}
