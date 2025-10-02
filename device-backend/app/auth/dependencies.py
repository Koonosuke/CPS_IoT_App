"""
認証依存関係
"""
from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Dict, Any, Optional

from .jwt_handler import jwt_validator, CognitoJWTError


# HTTP Bearer認証スキーム
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Dict[str, Any]:
    """
    現在のユーザー情報を取得
    
    Args:
        credentials: HTTP Bearer認証情報
        
    Returns:
        ユーザー情報辞書
        
    Raises:
        HTTPException: 認証エラー時
    """
    try:
        token = credentials.credentials
        user_info = jwt_validator.get_user_info(token)
        
        # トークンの種類をチェック（IDトークンまたはアクセストークン）
        token_use = user_info.get('token_use')
        if token_use not in ['id', 'access']:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="無効なトークンタイプです"
            )
        
        return user_info
        
    except CognitoJWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"認証エラー: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="認証に失敗しました"
        )


async def get_current_user_id(
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> str:
    """
    現在のユーザーIDを取得
    
    Args:
        current_user: 現在のユーザー情報
        
    Returns:
        ユーザーID（sub）
        
    Raises:
        HTTPException: ユーザーIDが取得できない場合
    """
    user_id = current_user.get('sub')
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="ユーザーIDを取得できません"
        )
    return user_id


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))
) -> Optional[Dict[str, Any]]:
    """
    オプショナルなユーザー認証（認証が不要なエンドポイント用）
    
    Args:
        credentials: HTTP Bearer認証情報（オプショナル）
        
    Returns:
        ユーザー情報辞書（認証されていない場合はNone）
    """
    if not credentials:
        return None
    
    try:
        token = credentials.credentials
        user_info = jwt_validator.get_user_info(token)
        return user_info
    except (CognitoJWTError, Exception):
        return None


