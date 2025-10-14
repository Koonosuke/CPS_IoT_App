"""
認証関連のPydanticモデル
"""
from pydantic import BaseModel, EmailStr
from typing import Optional


class UserInfo(BaseModel):
    """ユーザー情報"""
    user_id: str
    email: str
    given_name: Optional[str] = None
    family_name: Optional[str] = None
    username: Optional[str] = None
    groups: list[str] = []


class LoginRequest(BaseModel):
    """ログインリクエスト"""
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    """ログインレスポンス"""
    access_token: str
    id_token: str
    refresh_token: str
    expires_in: int


class SignUpRequest(BaseModel):
    """ユーザー登録リクエスト"""
    email: EmailStr
    password: str
    given_name: str
    family_name: str


class SignUpResponse(BaseModel):
    """ユーザー登録レスポンス"""
    user_id: str
    email: str
    confirmation_required: bool


class ConfirmSignUpRequest(BaseModel):
    """ユーザー登録確認リクエスト"""
    email: EmailStr
    confirmation_code: str


class RefreshTokenRequest(BaseModel):
    """トークンリフレッシュリクエスト"""
    refresh_token: str


class ChangePasswordRequest(BaseModel):
    """パスワード変更リクエスト"""
    old_password: str
    new_password: str


class ForgotPasswordRequest(BaseModel):
    """パスワードリセットリクエスト"""
    email: EmailStr


class ConfirmForgotPasswordRequest(BaseModel):
    """パスワードリセット確認リクエスト"""
    email: EmailStr
    confirmation_code: str
    new_password: str

