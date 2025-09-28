#!/bin/bash

# Backend 실행 스크립트

echo "🚀 Starting Azure OAuth Demo Backend..."

# Backend 디렉토리로 이동
cd Backend/AzureOAuthAPI

# 패키지 복원
echo "📦 Restoring packages..."
dotnet restore

# 서버 실행
echo "🌐 Starting server on http://localhost:5000"
echo "📖 Swagger UI available at http://localhost:5000/swagger"
echo "📝 Using in-memory data storage (no database required)"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""
dotnet run
