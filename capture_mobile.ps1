param(
    [string]$Url = "http://localhost:8080/pages/dashboard/dashboard.html",
    [string]$OutFile = "D:\Teamden\dashboard_mobile.png",
    [int]$Width = 390,
    [int]$Height = 844
)

# 1. Login via curl to get fresh session cookie
$null = curl.exe -s -X POST "http://localhost:8080/api/dev/login-as/d48d83ef-7bb4-44a5-a918-7a122ebf283e" -c "D:\Teamden\cookies.txt"
$sessionCookie = ""
if (Test-Path "D:\Teamden\cookies.txt") {
    Get-Content "D:\Teamden\cookies.txt" | ForEach-Object {
        if ($_ -match "TEAMDEN_SESSION\s+([A-Za-z0-9]+)") {
            $sessionCookie = $matches[1]
        }
    }
}
Write-Host "Using session cookie: $sessionCookie"

# 2. Launch headless Chrome with debugging port
$tempProfile = "C:\Users\admin\AppData\Local\Temp\cdp_profile_$(Get-Random)"
$chromeProc = Start-Process "C:\Program Files\Google\Chrome\Application\chrome.exe" -ArgumentList @(
    "--headless=new",
    "--remote-debugging-port=9222",
    "--user-data-dir=$tempProfile",
    "--disable-gpu",
    "--no-first-run",
    "--window-size=$Width,$Height"
) -PassThru

Start-Sleep -Milliseconds 2000

try {
    # 3. Get websocket debugger URL for the page target
    $pages = Invoke-RestMethod -Uri "http://localhost:9222/json"
    $page = $pages | Where-Object { $_.type -eq "page" } | Select-Object -First 1
    $wsUrl = $page.webSocketDebuggerUrl
    Write-Host "Connecting to Page CDP WebSocket: $wsUrl"

    $ws = New-Object System.Net.WebSockets.ClientWebSocket
    $ct = [System.Threading.CancellationToken]::None
    $ws.ConnectAsync([uri]$wsUrl, $ct).Wait()

    $global:cdpId = 0
    function Send-CDP([string]$method, $params) {
        $global:cdpId++
        $thisId = $global:cdpId
        $payloadObj = @{ id = $thisId; method = $method; params = $params }
        $payload = $payloadObj | ConvertTo-Json -Compress -Depth 10
        $bytes = [System.Text.Encoding]::UTF8.GetBytes($payload)
        $segment = [System.ArraySegment[byte]]::new($bytes)
        $ws.SendAsync($segment, [System.Net.WebSockets.WebSocketMessageType]::Text, $true, $ct).Wait()
        
        while ($true) {
            $buf = [byte[]]::new(4194304)
            $seg = [System.ArraySegment[byte]]::new($buf)
            $res = $ws.ReceiveAsync($seg, $ct).Result
            $ms = New-Object System.IO.MemoryStream
            $ms.Write($buf, 0, $res.Count)
            while (-not $res.EndOfMessage) {
                $res = $ws.ReceiveAsync($seg, $ct).Result
                $ms.Write($buf, 0, $res.Count)
            }
            $jsonStr = [System.Text.Encoding]::UTF8.GetString($ms.ToArray())
            $parsed = $jsonStr | ConvertFrom-Json
            if ($parsed.id -eq $thisId) {
                return $parsed
            }
        }
    }

    # Enable Network & Set Cookie
    $null = Send-CDP "Network.enable" @{}
    $null = Send-CDP "Network.setCookie" @{
        name = "TEAMDEN_SESSION"
        value = $sessionCookie
        domain = "localhost"
        path = "/"
    }

    # Set Mobile Viewport Override
    $null = Send-CDP "Emulation.setDeviceMetricsOverride" @{
        width = $Width
        height = $Height
        deviceScaleFactor = 2
        mobile = $true
    }

    # Navigate to page
    Write-Host "Navigating to $Url..."
    $null = Send-CDP "Page.navigate" @{ url = $Url }
    Start-Sleep -Seconds 3

    # Capture Screenshot
    Write-Host "Capturing screenshot..."
    $ssRes = Send-CDP "Page.captureScreenshot" @{ format = "png" }
    if ($ssRes.result -and $ssRes.result.data) {
        $imageBytes = [System.Convert]::FromBase64String($ssRes.result.data)
        [System.IO.File]::WriteAllBytes($OutFile, $imageBytes)
        Write-Host "SUCCESS: Screenshot saved to $OutFile ($($imageBytes.Length) bytes)"
    } else {
        Write-Host "Failed to capture screenshot: $($ssRes | ConvertTo-Json)"
    }

    $ws.CloseAsync([System.Net.WebSockets.WebSocketCloseStatus]::NormalClosure, "Done", $ct).Wait()
} finally {
    if ($chromeProc -and -not $chromeProc.HasExited) {
        Stop-Process -Id $chromeProc.Id -Force -ErrorAction SilentlyContinue
    }
    Remove-Item -Path $tempProfile -Recurse -Force -ErrorAction SilentlyContinue
}
