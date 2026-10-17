#!/usr/bin/env bash
set -euo pipefail
project_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd -P)
command -v git >/dev/null || { printf 'На хостинге не найден git\n' >&2; exit 1; }
[[ "$(git -C "$project_dir" branch --show-current)" = main ]] || { printf 'Переключите репозиторий на main\n' >&2; exit 1; }
if [[ -n "$(git -C "$project_dir" status --porcelain)" ]]; then
  printf 'В рабочей копии есть изменения. Сначала сохраните их в Git или разберите вручную.\n' >&2
  exit 1
fi
git -C "$project_dir" pull --ff-only origin main
bash "$project_dir/scripts/deploy.sh" "$@"
