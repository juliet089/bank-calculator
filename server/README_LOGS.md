# Полезные команды для анализа логов:

## Просмотр медленных запросов
type server\logs\slow-requests-*.log

## Подсчет количества ошибок
findstr "statusCode\":500" server\logs\all-requests-*.log | find /c /v ""

## Просмотр последних записей
powershell "Get-Content server\logs\all-requests-*.log -Tail 20"