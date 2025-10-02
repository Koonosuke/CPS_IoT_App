"""
Cognito認証設定
"""
from typing import Optional
from pydantic import Field
from pydantic_settings import BaseSettings


class CognitoConfig(BaseSettings):
    """Cognito設定"""
    
    # Cognito User Pool設定
    user_pool_id: str = Field(default="", alias="COGNITO_USER_POOL_ID")
    client_id: str = Field(default="", alias="COGNITO_CLIENT_ID")
    region: str = Field(default="us-east-1", alias="COGNITO_REGION")
    domain: str = Field(default="", alias="COGNITO_DOMAIN")
    
    # JWT設定
    jwks_url: Optional[str] = None
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if self.user_pool_id:
            self.jwks_url = f"https://cognito-idp.{self.region}.amazonaws.com/{self.user_pool_id}/.well-known/jwks.json"
    
    model_config = {
        "env_file": ".env",
        "case_sensitive": False,
        "extra": "ignore",  # 追加の環境変数を無視
    }


# グローバル設定インスタンス
cognito_config = CognitoConfig()
