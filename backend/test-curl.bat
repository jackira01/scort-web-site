@echo off
echo Probando peticion POST con curl...
echo.

curl -X POST http://localhost:5000/api/filters/profiles ^
  -H "Content-Type: application/json" ^
  -d "{\"page\": 1, \"limit\": 3}" ^
  -v

echo.
echo Prueba completada.
pause