Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.Rate = 0
$synth.Volume = 100
$outputFile = Join-Path $PSScriptRoot "..\scratch\test_voice.wav"
if (-not (Test-Path (Split-Path $outputFile))) { New-Item -ItemType Directory -Path (Split-Path $outputFile) -Force }
$synth.SetOutputToWaveFile($outputFile)
$synth.Speak("Welcome to Class Of Learners. Today, we explore the QR Studio Matrix.")
$synth.Dispose()
Write-Output "Generated WAV size: $((Get-Item $outputFile).Length) bytes"
