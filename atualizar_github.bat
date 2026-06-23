@echo off
echo =======================================================
echo     ATUALIZANDO O GITHUB E O NETLIFY...
echo =======================================================
echo.

git add .
git commit -m "update: atualizacao do sistema"
git push origin main

echo.
echo =======================================================
echo     SUCESSO! AS ALTERACOES FORAM ENVIADAS.
echo     O Netlify comecara a atualizar o site em breve.
echo =======================================================
pause
