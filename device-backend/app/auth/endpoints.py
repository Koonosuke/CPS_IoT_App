"""
認証エンドポイント
"""
import boto3
import secrets
import os
import time
from fastapi import APIRouter, HTTPException, status, Depends, Response
from botocore.exceptions import ClientError
from typing import Dict, Any

from .models import (
    LoginRequest, LoginResponse, SignUpRequest, SignUpResponse,
    ConfirmSignUpRequest, RefreshTokenRequest, LoginResponse,
    ChangePasswordRequest, ForgotPasswordRequest, ConfirmForgotPasswordRequest
)
from .dependencies import get_current_user
from .config import cognito_config

router = APIRouter(prefix="/auth", tags=["認証"])

# Cognitoクライアント
cognito_client = boto3.client('cognito-idp', region_name=cognito_config.region)

# DynamoDB接続
dynamodb = boto3.resource("dynamodb", region_name=cognito_config.region)
USER_TBL = os.getenv("USER_TABLE", "UserRegistry")
user_tbl = dynamodb.Table(USER_TBL)

def now_utc_iso():
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


@router.post("/login", response_model=LoginResponse, summary="ログイン")
async def login(request: LoginRequest, response: Response):
    """
    ユーザーログイン
    
    - **email**: メールアドレス
    - **password**: パスワード
    """
    try:
        cognito_response = cognito_client.initiate_auth(
            ClientId=cognito_config.client_id,
            AuthFlow='USER_PASSWORD_AUTH',
            AuthParameters={
                'USERNAME': request.email,
                'PASSWORD': request.password
            }
        )
        
        auth_result = cognito_response['AuthenticationResult']
        
        # HttpOnly Cookieにトークンを設定
        response.set_cookie(
            key="access_token",
            value=auth_result['AccessToken'],
            httponly=True,
            secure=True,  # HTTPS環境でのみ送信
            samesite="strict",  # CSRF保護
            max_age=auth_result['ExpiresIn'],
            path="/"
        )
        
        response.set_cookie(
            key="id_token",
            value=auth_result['IdToken'],
            httponly=True,
            secure=True,
            samesite="strict",
            max_age=auth_result['ExpiresIn'],
            path="/"
        )
        
        response.set_cookie(
            key="refresh_token",
            value=auth_result['RefreshToken'],
            httponly=True,
            secure=True,
            samesite="strict",
            max_age=30 * 24 * 60 * 60,  # 30日
            path="/"
        )
        
        return LoginResponse(
            access_token=auth_result['AccessToken'],
            id_token=auth_result['IdToken'],
            refresh_token=auth_result['RefreshToken'],
            expires_in=auth_result['ExpiresIn']
        )
        
    except ClientError as e:
        error_code = e.response['Error']['Code']
        if error_code == 'NotAuthorizedException':
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="メールアドレスまたはパスワードが正しくありません"
            )
        elif error_code == 'UserNotConfirmedException':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="アカウントが確認されていません。確認コードを入力してください"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"ログインエラー: {e.response['Error']['Message']}"
            )


@router.post("/signup", response_model=SignUpResponse, summary="ユーザー登録")
async def signup(request: SignUpRequest):
    """
    新規ユーザー登録
    
    - **email**: メールアドレス
    - **password**: パスワード
    - **given_name**: 名
    - **family_name**: 姓
    """
    try:
        # 1. Cognitoにユーザー登録
        response = cognito_client.sign_up(
            ClientId=cognito_config.client_id,
            Username=request.email,
            Password=request.password,
            UserAttributes=[
                {'Name': 'email', 'Value': request.email},
                {'Name': 'given_name', 'Value': request.given_name},
                {'Name': 'family_name', 'Value': request.family_name}
            ]
        )
        
        # 2. UserRegistryテーブルにユーザー情報を保存
        user_item = {
            "userId": response['UserSub'],
            "email": request.email,
            "firstName": request.given_name,
            "lastName": request.family_name,
            "username": request.email.split('@')[0],  # メールの@より前をユーザー名に
            "organization": "未設定",
            "role": "user",
            "createdAt": now_utc_iso(),
            "updatedAt": now_utc_iso(),
            "isActive": True
        }
        
        try:
            user_tbl.put_item(Item=user_item)
            print(f"DEBUG: User registered in UserRegistry: {response['UserSub']}")
        except Exception as db_error:
            print(f"WARNING: Failed to write to UserRegistry: {str(db_error)}")
            # UserRegistryへの書き込みに失敗してもCognito登録は成功しているので続行
        
        return SignUpResponse(
            user_id=response['UserSub'],
            email=request.email,
            confirmation_required=not response.get('UserConfirmed', False)
        )
        
    except ClientError as e:
        error_code = e.response['Error']['Code']
        if error_code == 'UsernameExistsException':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="このメールアドレスは既に登録されています"
            )
        elif error_code == 'InvalidPasswordException':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="パスワードが要件を満たしていません"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"登録エラー: {e.response['Error']['Message']}"
            )


@router.post("/confirm-signup", summary="ユーザー登録確認")
async def confirm_signup(request: ConfirmSignUpRequest):
    """
    ユーザー登録確認（確認コード入力）
    
    - **email**: メールアドレス
    - **confirmation_code**: 確認コード
    """
    try:
        cognito_client.confirm_sign_up(
            ClientId=cognito_config.client_id,
            Username=request.email,
            ConfirmationCode=request.confirmation_code
        )
        
        return {"message": "アカウントが正常に確認されました"}
        
    except ClientError as e:
        error_code = e.response['Error']['Code']
        if error_code == 'CodeMismatchException':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="確認コードが正しくありません"
            )
        elif error_code == 'ExpiredCodeException':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="確認コードの有効期限が切れています"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"確認エラー: {e.response['Error']['Message']}"
            )


@router.post("/refresh", response_model=LoginResponse, summary="トークンリフレッシュ")
async def refresh_token(request: RefreshTokenRequest):
    """
    アクセストークンのリフレッシュ
    
    - **refresh_token**: リフレッシュトークン
    """
    try:
        response = cognito_client.initiate_auth(
            ClientId=cognito_config.client_id,
            AuthFlow='REFRESH_TOKEN_AUTH',
            AuthParameters={
                'REFRESH_TOKEN': request.refresh_token
            }
        )
        
        auth_result = response['AuthenticationResult']
        
        return LoginResponse(
            access_token=auth_result['AccessToken'],
            id_token=auth_result['IdToken'],
            refresh_token=request.refresh_token,  # リフレッシュトークンは変更されない
            expires_in=auth_result['ExpiresIn']
        )
        
    except ClientError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="リフレッシュトークンが無効です"
        )


@router.post("/change-password", summary="パスワード変更")
async def change_password(
    request: ChangePasswordRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    パスワード変更
    
    - **old_password**: 現在のパスワード
    - **new_password**: 新しいパスワード
    """
    try:
        cognito_client.change_password(
            AccessToken=current_user.get('access_token'),  # 実際の実装では適切なトークンを取得
            PreviousPassword=request.old_password,
            ProposedPassword=request.new_password
        )
        
        return {"message": "パスワードが正常に変更されました"}
        
    except ClientError as e:
        error_code = e.response['Error']['Code']
        if error_code == 'NotAuthorizedException':
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="現在のパスワードが正しくありません"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"パスワード変更エラー: {e.response['Error']['Message']}"
            )


@router.post("/forgot-password", summary="パスワードリセット")
async def forgot_password(request: ForgotPasswordRequest):
    """
    パスワードリセット（確認コード送信）
    
    - **email**: メールアドレス
    """
    try:
        cognito_client.forgot_password(
            ClientId=cognito_config.client_id,
            Username=request.email
        )
        
        return {"message": "パスワードリセット用の確認コードをメールで送信しました"}
        
    except ClientError as e:
        error_code = e.response['Error']['Code']
        if error_code == 'UserNotFoundException':
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="このメールアドレスは登録されていません"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"パスワードリセットエラー: {e.response['Error']['Message']}"
            )


@router.post("/confirm-forgot-password", summary="パスワードリセット確認")
async def confirm_forgot_password(request: ConfirmForgotPasswordRequest):
    """
    パスワードリセット確認（新しいパスワード設定）
    
    - **email**: メールアドレス
    - **confirmation_code**: 確認コード
    - **new_password**: 新しいパスワード
    """
    try:
        cognito_client.confirm_forgot_password(
            ClientId=cognito_config.client_id,
            Username=request.email,
            ConfirmationCode=request.confirmation_code,
            Password=request.new_password
        )
        
        return {"message": "パスワードが正常にリセットされました"}
        
    except ClientError as e:
        error_code = e.response['Error']['Code']
        if error_code == 'CodeMismatchException':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="確認コードが正しくありません"
            )
        elif error_code == 'ExpiredCodeException':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="確認コードの有効期限が切れています"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"パスワードリセット確認エラー: {e.response['Error']['Message']}"
            )


@router.get("/me", summary="現在のユーザー情報取得")
async def get_me(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    現在ログインしているユーザーの情報を取得
    """
    return {
        "user_id": current_user.get('sub'),
        "email": current_user.get('email'),
        "given_name": current_user.get('given_name'),
        "family_name": current_user.get('family_name'),
        "username": current_user.get('username'),
        "groups": current_user.get('groups', [])
    }


@router.post("/logout", summary="ログアウト")
async def logout(response: Response):
    """
    ユーザーログアウト（Cookieを削除）
    """
    # HttpOnly Cookieを削除
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="id_token", path="/")
    response.delete_cookie(key="refresh_token", path="/")
    response.delete_cookie(key="csrf_token", path="/")
    
    return {"message": "ログアウトしました"}


@router.get("/csrf-token", summary="CSRFトークン取得")
async def get_csrf_token(response: Response):
    """
    CSRFトークンを生成してCookieに設定
    """
    csrf_token = secrets.token_urlsafe(32)
    
    response.set_cookie(
        key="csrf_token",
        value=csrf_token,
        httponly=True,
        secure=True,
        samesite="strict",
        max_age=3600,  # 1時間
        path="/"
    )
    
    return {"csrf_token": csrf_token}





