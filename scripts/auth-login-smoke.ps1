param(
  [string]$ApiBaseUrl = "http://127.0.0.1:8080",
  [string]$Username = "admin",
  [string]$Password = "admin123"
)

$ErrorActionPreference = "Stop"

$loginUri = "$($ApiBaseUrl.TrimEnd('/'))/api/auth/login"
$healthUri = "$($ApiBaseUrl.TrimEnd('/'))/api/health"
$dashboardUri = "$($ApiBaseUrl.TrimEnd('/'))/api/dashboard"

Write-Host "[1/3] health check: $healthUri"
$health = Invoke-RestMethod -Method Get -Uri $healthUri
$healthStatus = "unknown"
if ($null -ne $health -and $null -ne $health.status) {
  $healthStatus = [string]$health.status
}
Write-Host ("health.status = " + $healthStatus)

Write-Host "[2/3] login: $loginUri"
$payload = @{
  username = $Username
  password = $Password
} | ConvertTo-Json

$login = Invoke-RestMethod -Method Post -Uri $loginUri -ContentType "application/json" -Body $payload
if (-not $login.accessToken) {
  throw "Login response does not include accessToken."
}
if (-not $login.user) {
  throw "Login response does not include user."
}
Write-Host ("login.user = " + $login.user.email + " (" + $login.user.role + ")")
Write-Host ("token.expiresAt = " + $login.expiresAt)

Write-Host "[3/3] authorized dashboard call"
$headers = @{
  Authorization = "Bearer $($login.accessToken)"
  Accept = "application/json"
}
$dashboard = Invoke-RestMethod -Method Get -Uri $dashboardUri -Headers $headers
if (-not $dashboard) {
  throw "Dashboard response is empty."
}
Write-Host "dashboard call succeeded."
