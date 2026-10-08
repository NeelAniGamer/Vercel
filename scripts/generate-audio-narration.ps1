# generate-audio-narration.ps1
Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.Rate = 0
$synth.Volume = 100

$outputDir = Join-Path $PSScriptRoot "..\output"
if (-not (Test-Path $outputDir)) { New-Item -ItemType Directory -Path $outputDir -Force }

$lines = @(
    @{ file = "voice_scene1.wav"; text = "Welcome to Class Of Learners. Today, we enter the QR Studio Matrix, built for ultra fast, high precision code generation." },
    @{ file = "voice_scene2.wav"; text = "Navigating directly into the QR suite, where every pixel module is rendered in real time with custom geometry." },
    @{ file = "voice_scene3.wav"; text = "We fine tune the corner eye markers, apply cybernetic emerald gradients, and generate a flawless high contrast matrix." },
    @{ file = "voice_scene4.wav"; text = "Now, launching the built in optical scanner. The laser beam sweeps the matrix, decrypting the verified payload instantly." },
    @{ file = "voice_scene5.wav"; text = "Next, we generate an official vCard for Neel Badri, embedding phone, email, and Class Of Learners credentials into an enterprise ready contact card." },
    @{ file = "voice_scene6.wav"; text = "Flawlessly rendered and ready for instant sharing. Engineered by Class Of Learners." }
)

foreach ($item in $lines) {
    $filePath = Join-Path $outputDir $item.file
    $synth.SetOutputToWaveFile($filePath)
    $synth.Speak($item.text)
    Write-Output "Generated $($item.file): $((Get-Item $filePath).Length) bytes"
}

$synth.Dispose()
Write-Output "All narration audio tracks synthesized successfully!"
