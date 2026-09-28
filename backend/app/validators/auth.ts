import vine from '@vinejs/vine'

/**
 * Validator to use before validating user credentials
 * during login
 */
export const loginValidator = vine.create({
  usuario: vine.string().maxLength(60),
  password: vine.string(),
})
