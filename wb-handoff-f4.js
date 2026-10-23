Get-Clipboard | Set-Content -Encoding UTF8 wb-handoff-f4.js
$p="wb-handoff-f4.js"; $c=[IO.File]::ReadAllText($p); $c=$c -replace '^\uFEFF?#![^\r\n]*\r?\n',''; [IO.File]::WriteAllText($p,$c,(New-Object System.Text.UTF8Encoding($false))); node wb-handoff-f4.js
git add -A
git commit -m "docs: HANDOFF — Ф4 готов, ловушка с локацией"
git push
