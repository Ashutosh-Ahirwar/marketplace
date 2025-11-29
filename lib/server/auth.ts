import { createClient, Errors } from '@farcaster/quick-auth';

// Initialize the Quick Auth client
const client = createClient();

export async function verifyUserAuth(payload: { token: string, fid: number }) {
  if (!payload.token) {
    throw new Error("Missing authentication token");
  }

  try {
    // Verify the JWT against Farcaster's public keys
    const result = await client.verifyJwt({
      token: payload.token,
      // CRITICAL FIX: 'domain' is required by the SDK.
      // It should match the domain where your app is hosted.
      // For local development, this might differ, but in production, it's your app's URL.
      // If you are using Vercel, you can often use process.env.VERCEL_URL or hardcode your production domain.
      domain: "marketplace-lovat-zeta.vercel.app" 
    });

    // Security Check: Does the token belong to the user claiming to perform the action?
    if (result.sub !== payload.fid) {
      throw new Error(`Token FID (${result.sub}) does not match request FID (${payload.fid})`);
    }

    // Return true if valid
    return true;

  } catch (e) {
    if (e instanceof Errors.InvalidTokenError) {
      throw new Error("Invalid or expired authentication token");
    }
    // Re-throw other errors
    throw e;
  }
}