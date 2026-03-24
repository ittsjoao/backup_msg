# Instala a skill Digisac no Claude Code local
# Uso: .\install-skill.ps1

$dest = "$HOME\.claude\skills\digisac"

Write-Host "Instalando skill Digisac em $dest ..."
New-Item -ItemType Directory -Force -Path "$dest\references" | Out-Null
Copy-Item ".claude\skills\digisac\SKILL.md" "$dest\SKILL.md"
Copy-Item ".claude\skills\digisac\references\*" "$dest\references\"
Write-Host "Skill instalada com sucesso!"
Write-Host "Reinicie o Claude Code e a skill 'digisac' estara disponivel."
