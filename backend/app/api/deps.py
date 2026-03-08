from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.security import verify_supabase_jwt

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        
        # --- LOCAL TESTING BYPASS ---
        # If the token is "test-token", we bypass Supabase validation and return a dummy user.
        # DO NOT USE IN PRODUCTION
        if token == "test-token":
            return {"user_id": "00000000-0000-0000-0000-000000000000"}
        # ----------------------------

        payload = verify_supabase_jwt(token)
        # Check if sub (user_id) exists in payload
        if "sub" not in payload:
            raise HTTPException(status_code=401, detail="Invalid token: missing subject")
        return {"user_id": payload["sub"]}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
