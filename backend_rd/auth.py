import base64
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from config import SUPABASE_JWT_SECRET

security = HTTPBearer()

# Supabase JWT Secret은 base64 인코딩된 값으로 제공되므로 디코딩해서 사용
try:
    _jwt_secret = base64.b64decode(SUPABASE_JWT_SECRET)
except Exception:
    _jwt_secret = SUPABASE_JWT_SECRET.encode()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> str:
    """
    Authorization: Bearer <token> 헤더에서 Supabase JWT를 검증하고
    user_id(sub)를 반환한다.
    """
    token = credentials.credentials
    try:
        payload = jwt.decode(
            token,
            _jwt_secret,
            algorithms=["HS256"],
            options={"verify_aud": False},  # Supabase는 aud 검증 불필요
        )
        user_id: str | None = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="토큰에 사용자 정보가 없습니다.",
            )
        return user_id
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="유효하지 않은 토큰입니다.",
        )
