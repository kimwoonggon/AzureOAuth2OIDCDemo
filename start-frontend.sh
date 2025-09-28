#!/bin/bash

# Frontend 실행 스크립트

echo "🚀 Starting Azure Auth Demo Frontend..."

# Frontend 디렉토리로 이동
cd Frontend

# Python HTTP 서버 실행
echo "🌐 Starting web server on http://localhost:3000"
echo "📝 Please make sure to update auth.js with your Azure AD credentials"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Python 3 서버 실행
python3 -m http.server 3000
