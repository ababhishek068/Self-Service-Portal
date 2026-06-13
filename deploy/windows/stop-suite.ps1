$ports = @(4000, 4001)

foreach ($port in $ports) {
    $connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    foreach ($connection in $connections) {
        Stop-Process -Id $connection.OwningProcess -Force
        Write-Host "Stopped process $($connection.OwningProcess) on port $port"
    }
}
