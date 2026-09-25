$wikiUrl = "https://github.com/NeelAniGamer/Vercel.wiki.git"
$tempDir = Join-Path $env:TEMP "vercel_wiki_clone"
$rootDir = (Get-Item $PSScriptRoot).Parent.FullName

if (Test-Path $tempDir) { 
    Remove-Item -Recurse -Force $tempDir 
}

Write-Host "Cloning wiki repository: $wikiUrl..."
git clone $wikiUrl $tempDir

if ($LASTEXITCODE -eq 0) {
    Write-Host "Copying all wiki pages from docs/wiki/..."
    Copy-Item -Path (Join-Path $rootDir "docs\wiki\*") -Destination $tempDir -Force
    
    Set-Location $tempDir
    git config user.name "NeelAniGamer"
    git add -A
    git commit -m "Populate complete Class Of Learners Wiki catalogue [Co-Authored-By: Claude <noreply@opencode.ai>]"
    git push origin master
    Write-Host "`n✅ All 13 Wiki pages and navigation sidebars successfully pushed to GitHub!"
} else {
    Write-Host "`n⚠️ Wiki repository is not yet initialized by GitHub."
    Write-Host "Please paste the 'Home' page content into your browser and click 'Save Page' first."
}
