#!/bin/bash
# Instala a skill Digisac no Claude Code local
# Uso: bash install-skill.sh

DEST="$HOME/.claude/skills/digisac"

echo "Instalando skill Digisac em $DEST ..."
mkdir -p "$DEST/references"
cp .claude/skills/digisac/SKILL.md "$DEST/SKILL.md"
cp .claude/skills/digisac/references/* "$DEST/references/"
echo "Skill instalada com sucesso!"
echo "Reinicie o Claude Code e a skill 'digisac' estará disponível."
