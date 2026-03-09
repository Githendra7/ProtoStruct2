import jwt
from typing import Dict, Any

def verify_supabase_jwt(token: str) -> Dict[str, Any]:
    """
    Verify the Supabase JWT.
    In production, the signature should be verified using the Supabase JWT secret.
    For demonstration/setup, we decode it to extract user metadata if a valid token structure is provided.
    """
    try:
        # We need options={"verify_signature": False} if we don't have the secret locally.
        decoded_token = jwt.decode(token, options={"verify_signature": False})
        return decoded_token
    except jwt.InvalidTokenError:
        raise ValueError("Invalid token")
