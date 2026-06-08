$files = Get-ChildItem -Filter *.html
foreach ($file in $files) {
    if ($file.Name -ne 'admin.html') {
        $content = [System.IO.File]::ReadAllText($file.FullName)
        if (-not $content.Contains('col-router.js')) {
            $content = $content.Replace('</head>', "<script src=`"col-router.js`"></script>`r`n</head>")
            [System.IO.File]::WriteAllText($file.FullName, $content)
        }
    }
}
