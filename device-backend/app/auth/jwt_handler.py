"""
JWT認証ハンドラー
"""
import json
import requests
from typing import Dict, Optional, Any
from jose import jwt, JWTError
from jose.backends import RSAKey
from jose.utils import base64url_decode
import time

from .config import cognito_config


class CognitoJWTError(Exception):
    """Cognito JWT認証エラー"""
    pass


class CognitoJWTValidator:
    """Cognito JWT検証クラス"""
    
    def __init__(self):
        self.jwks_cache = {}
        self.jwks_cache_time = 0
        self.cache_duration = 3600  # 1時間
    
    def _get_jwks(self) -> Dict[str, Any]:
        """JWKS（JSON Web Key Set）を取得"""
        current_time = time.time()
        
        # キャッシュが有効な場合はそれを使用
        if (current_time - self.jwks_cache_time) < self.cache_duration and self.jwks_cache:
            return self.jwks_cache
        
        try:
            response = requests.get(cognito_config.jwks_url, timeout=10)
            response.raise_for_status()
            self.jwks_cache = response.json()
            self.jwks_cache_time = current_time
            return self.jwks_cache
        except Exception as e:
            raise CognitoJWTError(f"JWKS取得エラー: {str(e)}")
    
    def _get_public_key(self, token: str) -> RSAKey:
        """JWTトークンから公開鍵を取得"""
        try:
            # JWTヘッダーをデコード
            header = jwt.get_unverified_header(token)
            kid = header.get('kid')
            
            if not kid:
                raise CognitoJWTError("JWTヘッダーにkidがありません")
            
            # JWKSから対応する鍵を取得
            jwks = self._get_jwks()
            for key in jwks.get('keys', []):
                if key.get('kid') == kid:
                    return RSAKey(key, algorithm='RS256')
            
            raise CognitoJWTError(f"kid {kid} に対応する公開鍵が見つかりません")
            
        except JWTError as e:
            raise CognitoJWTError(f"JWT解析エラー: {str(e)}")
    
    def verify_token(self, token: str) -> Dict[str, Any]:
        """JWTトークンを検証してペイロードを返す"""
        try:
            # 公開鍵を取得
            public_key = self._get_public_key(token)
            
            # JWTを検証
            payload = jwt.decode(
                token,
                public_key,
                algorithms=['RS256'],
                audience=cognito_config.client_id,
                issuer=f"https://cognito-idp.{cognito_config.region}.amazonaws.com/{cognito_config.user_pool_id}"
            )
            
            # トークンの有効期限をチェック
            current_time = time.time()
            if payload.get('exp', 0) < current_time:
                raise CognitoJWTError("トークンの有効期限が切れています")
            
            return payload
            
        except JWTError as e:
            raise CognitoJWTError(f"JWT検証エラー: {str(e)}")
    
    def get_user_info(self, token: str) -> Dict[str, Any]:
        """トークンからユーザー情報を取得"""
        payload = self.verify_token(token)
        
        return {
            'sub': payload.get('sub'),  # Cognito User ID
            'email': payload.get('email'),
            'given_name': payload.get('given_name'),
            'family_name': payload.get('family_name'),
            'username': payload.get('cognito:username'),
            'groups': payload.get('cognito:groups', []),
            'token_use': payload.get('token_use'),
            'client_id': payload.get('client_id')
        }


# グローバルインスタンス
jwt_validator = CognitoJWTValidator()


