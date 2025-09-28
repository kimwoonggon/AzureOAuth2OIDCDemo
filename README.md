# Azure OAuth 데모 - 직접 토큰 인증

Azure AD 토큰을 커스텀 JWT 토큰 교환 없이 API 호출에 직접 사용하는 깔끔한 Azure AD 인증 구현입니다.


## 아키텍처

```
Frontend (MSAL.js) → Azure AD → Access Token → Backend API (Microsoft.Identity.Web)
```

이 구현은 API 인증에 Azure AD 토큰을 직접 사용합니다:
- **커스텀 JWT 생성 없음** - 전체적으로 Azure AD 토큰 사용
- **리프레시 토큰 관리 불필요** - MSAL.js가 토큰 갱신을 자동 처리
- **간소화된 백엔드** - Azure AD 토큰 검증만 수행
- **내장 보안 기능** - 모든 Azure AD 보안 기능 활용

## 프로젝트 구조

```
AzureOAuthDemo/
├── Backend/
│   └── AzureOAuthAPI/        # ASP.NET Core Web API
│       ├── Controllers/      # API 엔드포인트
│       ├── Program.cs        # 앱 구성
│       └── appsettings.json  # Azure AD 설정
├── Frontend/
│   ├── index.html            # 메인 UI
│   ├── config.js             # Azure AD 구성
│   ├── auth.js               # MSAL 인증 로직 (팝업 감지 포함)
│   ├── app.js                # 애플리케이션 로직
│   └── styles.css            # 스타일링
├── AZURE_SETUP_GUIDE.md      # Azure Portal 설정 가이드
├── code_explanation.md       # 상세 코드 설명
├── start-backend.sh          # 백엔드 시작 스크립트
└── start-frontend.sh         # 프론트엔드 시작 스크립트
```

## 사전 요구사항

- .NET 9.0+ SDK (또는 .NET 8.0+)
- Python 3 또는 Node.js (프론트엔드 서버 실행용)
- Azure AD 앱 등록
- Azure Portal 접근 권한

## 빠른 시작 (현재 구성으로 실행)

현재 설정된 값으로 바로 실행하려면:

```bash
# 터미널 1
./start-backend.sh

# 터미널 2
./start-frontend.sh
```

브라우저에서 `http://localhost:3000` 접속

**참고**: Microsoft Graph 스코프를 사용하므로 완전한 API 기능은 제한될 수 있습니다.

## 설정 방법 (새로운 Azure AD 앱 등록)

### 1. Azure AD 구성

1. [Azure Portal](https://portal.azure.com) 접속
2. Azure Active Directory → 앱 등록으로 이동
3. "새 등록" 클릭
4. 앱 구성:
   - **이름**: AzureOAuthDemo
   - **지원되는 계정 유형**: 단일 테넌트 (또는 원하는 옵션)
   - **리디렉션 URI**: 
     - 플랫폼: 단일 페이지 애플리케이션
     - URI: `http://localhost:3000`
5. 생성 후 다음 정보 기록:
   - **애플리케이션(클라이언트) ID**
   - **디렉터리(테넌트) ID**

### 2. API 노출 설정 (중요!)

> **현재 이 단계가 누락되어 있어 임시 해결책 사용 중입니다**

1. 앱 등록에서 "API 노출"로 이동
2. 애플리케이션 ID URI 옆의 "설정" 클릭
3. 기본값 `api://{client-id}` 수락 또는 사용자 지정
4. 범위 추가:
   - **범위 이름**: `access_as_user`
   - **동의할 수 있는 사용자**: 관리자 및 사용자
   - **관리자 동의 표시 이름**: API 액세스
   - **관리자 동의 설명**: 앱이 API에 액세스할 수 있도록 허용
   - **사용자 동의 표시 이름**: 사용자 대신 API 액세스
   - **사용자 동의 설명**: 사용자 대신 API에 액세스할 수 있도록 허용
   - **상태**: 사용

### 3. API 권한 설정

1. "API 권한"으로 이동
2. 권한 추가:
   - Microsoft Graph → 위임된 권한 → User.Read (현재 사용 중)
   - 사용자 API → 위임된 권한 → access_as_user (API 노출 후 추가)
3. 관리자 동의 부여 (필요한 경우)

### 4. 구성 파일 업데이트

#### 백엔드 구성
`Backend/AzureOAuthAPI/appsettings.json` 편집:

```json
{
  "AzureAd": {
    "Instance": "https://login.microsoftonline.com/",
    "Domain": "your-tenant-name.onmicrosoft.com",
    "TenantId": "YOUR-TENANT-ID",
    "ClientId": "YOUR-CLIENT-ID",
    "Audience": "api://YOUR-CLIENT-ID"
  }
}
```

#### 프론트엔드 구성 (현재 혼합 구성)
`Frontend/config.js` 편집:

```javascript
const msalConfig = {
    auth: {
        clientId: "YOUR-CLIENT-ID",
        authority: "https://login.microsoftonline.com/YOUR-TENANT-ID",
        redirectUri: "http://localhost:3000",
        navigateToLoginRequestUrl: false  // 팝업 내 탐색 문제 방지
    },
    cache: {
        cacheLocation: "sessionStorage",
        storeAuthStateInCookie: false
    },
    system: {
        asyncPopups: false  // 중첩 팝업 문제 방지
    }
};

// API 구성
const apiConfig = {
    baseUrl: "http://localhost:5000/api",
    scopes: ["User.Read"]  // 임시: Microsoft Graph 스코프
};

// 로그인 요청 (현재 Microsoft Graph 사용)
const loginRequest = {
    scopes: ["openid", "profile", "email", "User.Read"]
};

// API 토큰 요청 (목표 구성)
const tokenRequest = {
    scopes: ["api://YOUR-CLIENT-ID/access_as_user"]
};
```

## 애플리케이션 실행

### 방법 1: 편의 스크립트 사용 (권장)

```bash
# 백엔드 시작
./start-backend.sh

# 새 터미널에서 프론트엔드 시작
./start-frontend.sh
```

### 방법 2: 수동 실행

#### 백엔드 시작
```bash
cd Backend/AzureOAuthAPI
dotnet restore
dotnet run
```

API는 `http://localhost:5000`에서 시작되며, Swagger UI는 `http://localhost:5000/swagger`에서 사용 가능합니다.

#### 프론트엔드 시작
```bash
cd Frontend

# 옵션 1: Python
python3 -m http.server 3000

# 옵션 2: Node.js
npx http-server -p 3000

# 옵션 3: VS Code Live Server
# index.html 우클릭 → "Open with Live Server"
```

프론트엔드는 `http://localhost:3000`에서 사용 가능합니다.

## 작동 원리

### 인증 플로우 (지능형 팝업/리다이렉트)

1. **사용자가 "로그인" 클릭** 
   - 팝업 감지 로직이 실행 환경 확인
   - 팝업이 가능하면 팝업 방식 시도
   - 팝업이 차단되면 자동으로 리다이렉트 방식 전환
2. **Azure AD 인증** → 사용자가 자격 증명으로 로그인
3. **Azure AD가 토큰 반환** → MSAL.js가 토큰 수신 및 캐싱
4. **프론트엔드가 API 호출** → Authorization 헤더에 Azure 토큰 포함
5. **백엔드가 토큰 검증** → Microsoft.Identity.Web이 Azure AD로 검증
6. **API가 데이터 반환** → 보호된 리소스를 프론트엔드로 전송

### 토큰 관리

- **액세스 토큰**: 약 1시간 수명, MSAL.js가 자동 갱신
- **자동 갱신**: MSAL이 만료 전 자동 갱신 시도
- **대화형 갱신**: 자동 갱신 실패 시 팝업/리다이렉션으로 전환
- **캐싱**: sessionStorage에 토큰 캐시 (localStorage로 변경 가능)

### 팝업 감지 메커니즘

`auth.js`의 `isRunningInPopup()` 함수가 현재 실행 환경을 감지:
- 팝업/iframe 내부에서 실행 중인지 확인
- 중첩된 팝업 방지
- 감지되면 자동으로 리다이렉트 방식 사용

## API 엔드포인트

모든 엔드포인트는 유효한 Azure AD 인증이 필요합니다:

- `GET /api/user/profile` - 현재 사용자 프로필 조회
- `GET /api/user/validate` - 토큰 검증
- `GET /api/data` - 모든 데이터 항목 조회
- `GET /api/data?search={query}` - 데이터 검색
- `GET /api/data/{id}` - 특정 항목 조회
- `POST /api/data` - 새 항목 생성 (요청 본문에 title 필수)
- `DELETE /api/data/{id}` - 항목 삭제

## 주요 기능

### 프론트엔드
- 순수 JavaScript (프레임워크 의존성 없음)
- Azure AD 인증을 위한 MSAL.js 2.x
- 지능형 팝업/리다이렉트 전환
- 자동 토큰 갱신
- 토큰 디코딩 및 표시

### 백엔드
- ASP.NET Core Web API (.NET 9.0)
- Azure AD 검증을 위한 Microsoft.Identity.Web
- localhost:3000에 대한 CORS 구성
- API 테스트를 위한 Swagger UI (개발 모드)
- 샘플 인메모리 데이터 저장소

## 보안 기능

- **Azure AD 보호**: 모든 API 엔드포인트가 Azure AD로 보호됨
- **토큰 검증**: 발급자, 대상, 서명 자동 검증
- **CORS 정책**: 프론트엔드 오리진으로 제한
- **HTTPS 준비**: 프로덕션 HTTPS 구성 가능
- **코드에 비밀 없음**: 모든 민감한 설정은 환경/설정에 위치

## 애플리케이션 테스트

1. `http://localhost:3000` 열기
2. "Azure AD로 로그인" 클릭
3. Azure AD 계정으로 인증
4. 프로필 정보 확인
5. 데이터 항목 검색 및 관리
6. 액세스 토큰 보기 및 디코딩
7. 토큰 만료 및 갱신 테스트

## 일반적인 문제 해결

### AADSTS500011 오류
- **문제**: "The resource principal named api://... was not found"
- **원인**: Azure Portal에서 API가 노출되지 않음
- **해결**: `AZURE_SETUP_GUIDE.md`의 "API 노출 설정" 섹션 참조

### CORS 오류
- 백엔드가 `http://localhost:5000`에서 실행 중인지 확인
- 프론트엔드가 `http://localhost:3000`에서 실행 중인지 확인
- `Program.cs`의 CORS 정책 확인

### 인증 실패
- 프론트엔드와 백엔드의 Azure AD 구성이 일치하는지 확인
- 리디렉션 URI가 정확히 `http://localhost:3000`인지 확인
- API 권한이 부여되었는지 확인 (관리자 동의 필요할 수 있음)

### 토큰 검증 오류
- 백엔드의 Audience가 API URI와 일치하는지 확인
- 테넌트 ID가 올바른지 확인
- 프론트엔드와 백엔드의 클라이언트 ID가 일치하는지 확인

### 팝업 차단
- 브라우저가 팝업을 차단하면 자동으로 리다이렉트 방식으로 전환됨
- 브라우저 팝업 차단 설정에서 localhost:3000을 허용 목록에 추가 가능

## 토큰 교환 패턴과의 차이점

### 이 구현 (직접 Azure 토큰)
✅ 더 간단한 아키텍처  
✅ 커스텀 토큰 관리 불필요  
✅ MSAL에 의한 자동 갱신  
✅ Azure AD 기능 완전 지원  

### 토큰 교환 패턴 (기존 방식)
✅ 토큰에 커스텀 클레임 추가 가능  
✅ 토큰 수명 제어 가능  
✅ 백엔드 세션 관리  
✅ 다중 프로바이더 지원 가능성  
✅ 오프라인 토큰 검증  

## 기술 스택

- **백엔드**: ASP.NET Core 9.0 Web API
- **인증**: Microsoft.Identity.Web
- **프론트엔드**: 순수 JavaScript + MSAL.js 2.x
- **토큰 형식**: Azure AD JWT (직접 사용)
- **데이터 저장소**: 인메모리 (데모용)

## 프로덕션 전환 시 필수 사항

1. **Azure Portal 구성 완료**
   - API 노출 설정 완료
   - 올바른 스코프 구성 (Microsoft Graph → API 스코프)
   - 프로덕션 리디렉션 URI 등록

2. **보안 강화**
   - HTTPS 적용
   - 프로덕션 환경에 맞는 CORS 정책 설정
   - Rate limiting 구현

3. **데이터 영속성**
   - SQL Server 또는 PostgreSQL 도입
   - Entity Framework Core 구현

4. **구성 관리**
   - Azure Key Vault 사용
   - 환경 변수로 민감한 정보 관리

## 참고 자료

- [MSAL.js 문서](https://docs.microsoft.com/ko-kr/azure/active-directory/develop/msal-js-initializing-client-applications)
- [Microsoft.Identity.Web 문서](https://docs.microsoft.com/ko-kr/azure/active-directory/develop/microsoft-identity-web)
- [Azure AD 인증 플로우](https://docs.microsoft.com/ko-kr/azure/active-directory/develop/authentication-flows-app-scenarios)
- [ASP.NET Core Web API 보호](https://docs.microsoft.com/ko-kr/azure/active-directory/develop/scenario-protected-web-api-overview)



**참고**: 이 프로젝트는 .NET 9.0으로 구성되어 있으며, .NET 8.0 이상에서도 작동합니다. 더 낮은 버전이 필요한 경우 `AzureOAuthAPI.csproj`의 `TargetFramework`를 수정하세요.
