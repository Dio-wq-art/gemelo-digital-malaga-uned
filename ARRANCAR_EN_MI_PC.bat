@echo off
chcp 65001 >nul
title Gemelo Digital Fisico-Quimico de Malaga - Tesis Doctoral UNED
color 0B

echo ===============================================================================
echo   GEMELO DIGITAL INFORMADO POR LA FISICA - MALAGA (TESIS DOCTORAL UNED)
echo   Arranque Automatico del Servidor Local (Node.js + Express + Vite + PINN)
echo ===============================================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [AVISO] Node.js no esta instalado en este ordenador.
    echo Abriendo index.html en Modo Ejecutable Directo en tu navegador...
    start "" "%~dp0index.html"
    exit /b 0
)

cd /d "%~dp0"

if not exist "node_modules\" (
    echo [1/2] Instalando dependencias cientificas por primera vez (npm install)...
    call npm install
)

echo [2/2] Iniciando servidor del Gemelo Digital en http://localhost:3000 ...
start "" http://localhost:3000
call npm run dev
pause
