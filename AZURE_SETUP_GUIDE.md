# Azure AD 설정 가이드

## 현재 상황
이 프로젝트는 Azure AD 토큰을 직접 사용하여 API를 인증합니다. 하지만 현재 Azure Portal에서 API가 노출되지 않아 오류가 발생하고 있습니다.

## 오류 메시지
```
AADSTS500011: The resource principal named api://b932f9cd-e8d5-46ce-bd37-8a0f3aca4373 was not found
```

## 해결 방법

### 옵션 1: Azure Portal에서 API 노출 설정 (권장)

1. **Azure Portal 접속**
   - https://portal.azure.com 으로 이동

2. **앱 등록 찾기**
   - Azure Active Directory → 앱 등록
   - Client ID가 `b932f9cd-e8d5-46ce-bd37-8a0f3aca4373`인 앱 선택

3. **API 노출 설정**
   - 왼쪽 메뉴에서 **"Expose an API"** 클릭
   
4. **Application ID URI 설정**
   - "Set" 버튼 클릭
   - 기본값 `api://b932f9cd-e8d5-46ce-bd37-8a0f3aca4373` 수락
   - Save 클릭

5. **스코프 추가**
   - "Add a scope" 버튼 클릭
   - 다음 정보 입력:
     - **Scope name**: `access_as_user`
     - **Who can consent**: "Admins and users" 선택
     - **Admin consent display name**: Access API as user
     - **Admin consent description**: Allows the app to access the API as the signed-in user
     - **User consent display name**: Access API on your behalf
     - **User consent description**: Allows the app to access the API on your behalf
     - **State**: Enabled
   - Save 클릭

6. **구성 파일 업데이트**
   
   Frontend의 `config.js`:
   ```javascript
   const apiConfig = {
       baseUrl: "http://localhost:5000/api",
       scopes: ["api://b932f9cd-e8d5-46ce-bd37-8a0f3aca4373/access_as_user"]
   };
   
   const loginRequest = {
       scopes: ["openid", "profile", "email", "api://b932f9cd-e8d5-46ce-bd37-8a0f3aca4373/access_as_user"]
   };
   
   const tokenRequest = {
       scopes: ["api://b932f9cd-e8d5-46ce-bd37-8a0f3aca4373/access_as_user"],
       forceRefresh: false
   };
   ```

   Backend의 `appsettings.json`:
   ```json
   "AzureAd": {
       "Instance": "https://login.microsoftonline.com/",
       "Domain": "your-domain.onmicrosoft.com",
       "TenantId": "6c01af9b-e68a-4616-bcc6-4685d9acd910",
       "ClientId": "b932f9cd-e8d5-46ce-bd37-8a0f3aca4373",
       "Audience": "api://b932f9cd-e8d5-46ce-bd37-8a0f3aca4373",
       "SignedOutCallbackPath": "/signout-callback-oidc"
   }
   ```

### 옵션 2: Microsoft Graph 스코프 사용 (현재 임시 설정)

현재 파일들은 Microsoft Graph의 User.Read 스코프를 사용하도록 수정되어 있습니다. 이렇게 하면 로그인은 가능하지만, API 호출 시 토큰 검증이 실패할 수 있습니다.

**현재 설정 (임시)**:
- Frontend: `User.Read` 스코프 사용
- Backend: Audience 설정 제거

이 설정으로 기본적인 테스트는 가능하지만, 프로덕션에서는 옵션 1을 사용해야 합니다.

## API 권한 확인

Azure Portal에서 다음도 확인하세요:

1. **API permissions** 메뉴
2. 다음 권한이 있는지 확인:
   - Microsoft Graph → User.Read (Delegated)
   - Your API → access_as_user (Delegated) - API 노출 후 추가

3. **Grant admin consent** 버튼 클릭 (관리자인 경우)

## 테스트

1. 브라우저 캐시 및 쿠키 삭제
2. Backend 서버 재시작: `./start-backend.sh`
3. Frontend 서버 재시작: `./start-frontend.sh`
4. 로그인 테스트

## 참고사항

- **Token Exchange Pattern** (AzureAuthDemo): Azure 토큰을 받아서 자체 JWT로 교환. API 노출 설정 불필요.
- **Direct Token Pattern** (AzureOAuthDemo): Azure 토큰을 직접 사용. API 노출 설정 필요.

원래 프로젝트(AzureAuthDemo)는 Token Exchange 패턴을 사용해서 이 설정이 필요 없었지만, 새 프로젝트는 Direct Token 패턴을 사용하므로 반드시 API를 노출해야 합니다.