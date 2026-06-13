$ErrorActionPreference = "Stop"

$rules = @(
    @{ Name = "Self Service Portal and BC API"; Port = 4000 },
    @{ Name = "Self Service Application API"; Port = 4001 }
)

foreach ($rule in $rules) {
    $existing = Get-NetFirewallRule -DisplayName $rule.Name -ErrorAction SilentlyContinue
    if (-not $existing) {
        New-NetFirewallRule `
            -DisplayName $rule.Name `
            -Direction Inbound `
            -Protocol TCP `
            -LocalPort $rule.Port `
            -RemoteAddress LocalSubnet `
            -Action Allow
        Write-Host "Created firewall rule for TCP $($rule.Port)"
    } else {
        Write-Host "Firewall rule already exists: $($rule.Name)"
    }
}
