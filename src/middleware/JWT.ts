import { Context, Next } from 'hono'
import { sign, verify } from 'hono/jwt'
import env from '../config/env'
import { UNAUTHORIZED } from '../utils/Response'
import { JWTPayload } from 'hono/utils/jwt/types'

// JWT middleware to validate the token
const secret = env.JWT_SECRET
export async function validateJWT(c: Context, next: Next): Promise<void> {
  try {
    // Fetch the JWT from the Authorization header (Bearer token)
    const token = c.req.header('Authorization')?.split(' ')[1]
    if (!token) return c.json(UNAUTHORIZED('Authorization token is missing'), 401)

    // Verify the JWT with the secret
    const { admin } = await verify(token, secret)
    console.log("USER: ",admin)

    // Attach the decoded payload to the request context for use in route handlers
    c.set('admin', admin)

    // Continue to the next middleware or route handler
    await next()
  } catch (err) {
    console.log(err)
    return c.json(UNAUTHORIZED(err.name), 401)
  }
}

// Function to generate a JWT token
// Function to generate a JWT token
export async function generateJWT(payload: JWTPayload): Promise<string> {
  try {
    
    // Sign the payload with the secret to generate the token
    const token = await sign({...payload, exp: Math.floor(Date.now() / 1000) + (10*60)}, secret)
    console.log('Generated token:', token)
    
    return token
  } catch (err) {
    console.error('JWT Generation Error:', err)
    throw new Error('Error generating JWT: ' + err.message)
  }
}
