# Terra3D - Simple HTTP Server for Windows PowerShell
# Serves the current directory on http://localhost:8080
# No Node.js, Python, or any other runtime required!

$port = 8080
$root = $PSScriptRoot

$mimeTypes = @{
    '.html' = 'text/html'
    '.css'  = 'text/css'
    '.js'   = 'application/javascript'
    '.json' = 'application/json'
    '.png'  = 'image/png'
    '.jpg'  = 'image/jpeg'
    '.svg'  = 'image/svg+xml'
    '.ico'  = 'image/x-icon'
    '.woff' = 'font/woff'
    '.woff2'= 'font/woff2'
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")

try {
    $listener.Start()
} catch {
    Write-Host "Port $port is in use. Trying port 8888..." -ForegroundColor Yellow
    $port = 8888
    $listener = New-Object System.Net.HttpListener
    $listener.Prefixes.Add("http://localhost:$port/")
    $listener.Start()
}

Write-Host ""
Write-Host "  ================================================" -ForegroundColor Cyan
Write-Host "    Terra3D - Interactive World Atlas" -ForegroundColor Cyan
Write-Host "  ================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Server running at: " -NoNewline
Write-Host "http://localhost:$port" -ForegroundColor Green
Write-Host "  Serving from:      $root" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Auto-open browser
Start-Process "http://localhost:$port"

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $urlPath = $request.Url.LocalPath
        if ($urlPath -eq '/') { $urlPath = '/index.html' }

        $filePath = Join-Path $root ($urlPath -replace '/', '\')

        if (Test-Path $filePath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $contentType = if ($mimeTypes.ContainsKey($ext)) { $mimeTypes[$ext] } else { 'application/octet-stream' }
            
            $response.ContentType = "$contentType; charset=utf-8"
            $response.StatusCode = 200
            
            # Add CORS headers for ES module imports
            $response.Headers.Add("Access-Control-Allow-Origin", "*")
            
            $fileBytes = [System.IO.File]::ReadAllBytes($filePath)
            $response.ContentLength64 = $fileBytes.Length
            $response.OutputStream.Write($fileBytes, 0, $fileBytes.Length)
            
            $statusColor = "Green"
        } else {
            $response.StatusCode = 404
            $notFoundBytes = [System.Text.Encoding]::UTF8.GetBytes("404 - File Not Found: $urlPath")
            $response.ContentType = "text/plain"
            $response.ContentLength64 = $notFoundBytes.Length
            $response.OutputStream.Write($notFoundBytes, 0, $notFoundBytes.Length)
            $statusColor = "Red"
        }
        
        $response.OutputStream.Close()
        
        $timestamp = Get-Date -Format "HH:mm:ss"
        Write-Host "  [$timestamp] $($response.StatusCode) " -NoNewline -ForegroundColor $statusColor
        Write-Host "$($request.HttpMethod) $urlPath" -ForegroundColor Gray
        
    } catch [System.Net.HttpListenerException] {
        # Listener was closed (Ctrl+C)
        break
    } catch {
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

$listener.Stop()
Write-Host "`n  Server stopped." -ForegroundColor Yellow
