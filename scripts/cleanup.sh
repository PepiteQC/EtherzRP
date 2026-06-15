#!/usr/bin/env bash
# ============================================================
#  EtherzRP — Script de MÉNAGE STRUCTUREL (sûr & réversible)
# ------------------------------------------------------------
#  Ce script NE SUPPRIME RIEN définitivement.
#  Il déplace le code mort / les doublons dans  _attic/<date>/
#  Tu peux tout récupérer, ou supprimer _attic plus tard.
#
#  Usage :
#    cd /chemin/vers/EtherzRP
#    bash cleanup.sh            # exécution réelle
#    bash cleanup.sh --dry-run  # simulation (n'agit pas)
# ============================================================
set -euo pipefail

DRY=0
[[ "${1:-}" == "--dry-run" ]] && DRY=1

STAMP=$(date +%Y%m%d-%H%M%S)
ATTIC="_attic/$STAMP"

say(){ printf '\033[36m%s\033[0m\n' "$*"; }
warn(){ printf '\033[33m%s\033[0m\n' "$*"; }

run(){
  if [[ $DRY -eq 1 ]]; then
    echo "  [dry] $*"
  else
    eval "$*"
  fi
}

# Sécurité : on doit être à la racine du repo (présence de package.json + src/)
if [[ ! -f package.json || ! -d src ]]; then
  warn "❌ Lance ce script depuis la RACINE du repo EtherzRP (où se trouve package.json)."
  exit 1
fi

say "🧹 EtherzRP cleanup — $([[ $DRY -eq 1 ]] && echo 'DRY-RUN' || echo 'RÉEL')"
say "   Cible de récupération : $ATTIC/"
echo

[[ $DRY -eq 0 ]] && mkdir -p "$ATTIC"

# ── 1) CODE MORT confirmé (0 import depuis src/) ────────────
say "1) Déplacement du code mort (jamais importé par src/) :"
DEAD=(".archive" "artifacts" "build" "etherworld" "EtherWorld-Agent" "src/legacy" "src/game/hotel" "src/hotel3d")
for d in "${DEAD[@]}"; do
  if [[ -e "$d" ]]; then
    echo "   → $d"
    run "mkdir -p \"$ATTIC/$(dirname "$d")\""
    run "git mv \"$d\" \"$ATTIC/$d\" 2>/dev/null || mv \"$d\" \"$ATTIC/$d\""
  fi
done
echo

# ── 2) RAPPORTS de structure (dossiers à 1 seul fichier) ────
say "2) Audit : dossiers ne contenant qu'UN seul fichier (à plat / à fusionner) :"
THIN_REPORT="$ATTIC/THIN_DIRS.txt"
[[ $DRY -eq 0 ]] && : > "$THIN_REPORT"
while IFS= read -r dir; do
  cnt=$(find "$dir" -type f 2>/dev/null | wc -l | tr -d ' ')
  sub=$(find "$dir" -mindepth 1 -type d 2>/dev/null | wc -l | tr -d ' ')
  if [[ "$cnt" -le 1 && "$sub" -eq 0 ]]; then
    echo "   • $dir ($cnt fichier)"
    [[ $DRY -eq 0 ]] && echo "$dir" >> "$THIN_REPORT"
  fi
done < <(find src -type d | sort)
echo
warn "   ⚠ Les dossiers ci-dessus ne sont PAS déplacés automatiquement"
warn "     (un fichier peut être importé ailleurs). La liste est dans :"
warn "     $THIN_REPORT — à plat/fusionner manuellement si tu le souhaites."
echo

# ── 3) Récap ────────────────────────────────────────────────
say "✅ Terminé."
if [[ $DRY -eq 0 ]]; then
  echo "   Code mort déplacé dans : $ATTIC/"
  echo "   Pour annuler :   mv $ATTIC/* . 2>/dev/null"
  echo "   Pour confirmer la suppression définitive plus tard :  rm -rf _attic"
  echo
  echo "   👉 Ajoute '_attic/' à ton .gitignore si tu ne veux pas le committer."
fi
