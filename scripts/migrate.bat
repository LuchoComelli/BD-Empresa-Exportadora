@echo off
echo Ejecutando migraciones...
docker-compose exec backend python manage.py migrate

