@echo off
REM Script para desarrollo con Docker en Windows

setlocal enabledelayedexpansion

REM Función para mostrar ayuda
:show_help
echo Uso: %0 [COMANDO]
echo.
echo Comandos disponibles:
echo   build     - Construir las imágenes de Docker
echo   up        - Levantar los servicios
echo   down      - Detener los servicios
echo   logs      - Ver logs de los servicios
echo   shell     - Abrir shell en el contenedor web
echo   migrate   - Ejecutar migraciones
echo   test      - Ejecutar tests
echo   clean     - Limpiar contenedores y volúmenes
echo   help      - Mostrar esta ayuda
goto :eof

REM Función para construir imágenes
:build_images
echo Construyendo imágenes de Docker...
docker-compose build
goto :eof

REM Función para levantar servicios
:start_services
echo Levantando servicios...
docker-compose up -d
echo Servicios iniciados. Accede a http://localhost:8000
goto :eof

REM Función para detener servicios
:stop_services
echo Deteniendo servicios...
docker-compose down
goto :eof

REM Función para ver logs
:show_logs
docker-compose logs -f
goto :eof

REM Función para abrir shell
:open_shell
echo Abriendo shell en el contenedor web...
docker-compose exec web bash
goto :eof

REM Función para ejecutar migraciones
:run_migrations
echo Ejecutando migraciones...
docker-compose exec web python manage.py migrate
goto :eof

REM Función para ejecutar tests
:run_tests
echo Ejecutando tests...
docker-compose exec web python manage.py test
goto :eof

REM Función para limpiar
:clean_all
echo Limpiando contenedores y volúmenes...
docker-compose down -v
docker system prune -f
goto :eof

REM Procesar comando
if "%1"=="build" (
    call :build_images
) else if "%1"=="up" (
    call :start_services
) else if "%1"=="down" (
    call :stop_services
) else if "%1"=="logs" (
    call :show_logs
) else if "%1"=="shell" (
    call :open_shell
) else if "%1"=="migrate" (
    call :run_migrations
) else if "%1"=="test" (
    call :run_tests
) else if "%1"=="clean" (
    call :clean_all
) else (
    call :show_help
)

endlocal
