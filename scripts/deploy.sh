#!/usr/bin/env bash
set -euo pipefail

fail() { printf 'Ошибка: %s\n' "$*" >&2; exit 1; }
project_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd -P)
source_dir="$project_dir/public"
state_dir="${SVET_KP_STATE_DIR:-$HOME/.config/svet-kp}"
backup_dir="${SVET_KP_BACKUP_DIR:-$HOME/svet-kp-backups}"
for program in tar find cp chmod; do command -v "$program" >/dev/null || fail "Не найдена команда $program"; done
[[ -f "$source_dir/index.html" && -f "$source_dir/booking-v3.js" ]] || fail 'В public/ нет готового сайта'
[[ -z "$(find "$source_dir" -type l -print -quit)" ]] || fail 'В public/ обнаружены символические ссылки'

# Confirmed REG.RU document root. An explicit argument may override it.
target_dir="${1:-/www/svet-kp.ru}"
[[ "$target_dir" = /* && -d "$target_dir" ]] || fail "Папка сайта не найдена: $target_dir. Проверьте полный путь в Shell REG.RU."
target_dir=$(cd -- "$target_dir" && pwd -P)
[[ "$target_dir" != / && "$target_dir" != "$HOME" ]] || fail 'Корнем сайта не может быть / или домашняя папка'
case "$project_dir/" in "$target_dir/"*) fail 'Репозиторий должен находиться вне корня сайта';; esac
case "$target_dir/" in "$project_dir/"*) fail 'Корень сайта должен находиться вне репозитория';; esac
[[ ! -e "$target_dir/.git" ]] || fail 'В корне сайта обнаружена .git; перенесите репозиторий за пределы публичной папки'
mkdir -p -- "$state_dir" "$backup_dir"
state_dir=$(cd -- "$state_dir" && pwd -P)
backup_dir=$(cd -- "$backup_dir" && pwd -P)
case "$state_dir/" in "$target_dir/"*) fail 'Папка состояния должна быть вне корня сайта';; esac
case "$backup_dir/" in "$target_dir/"*) fail 'Резервные копии должны храниться вне корня сайта';; esac
if [[ -f "$state_dir/docroot" ]]; then
  IFS= read -r previous_target < "$state_dir/docroot"
  [[ "$previous_target" = "$target_dir" ]] || fail 'Сохранён другой корень сайта; используйте отдельный SVET_KP_STATE_DIR'
fi

stamp=$(date +%Y%m%d-%H%M%S)
backup="$backup_dir/site-$stamp-$$.tar.gz"
printf 'Резервная копия текущего сайта: %s\n' "$backup"
tar -czf "$backup" -C "$target_dir" .
tar -tzf "$backup" >/dev/null

# Never mirror the repository itself into the web root: only public/ is served.
if command -v rsync >/dev/null; then
  rsync -rlt --chmod=D755,F644 -- "$source_dir/" "$target_dir/"
else
  cp -R -- "$source_dir/." "$target_dir/"
fi

# Remove only files previously installed by this script and since deleted in Git.
# Existing unrelated hosting files are never deleted on the initial deployment.
if [[ -f "$state_dir/owned-files" ]]; then
  while IFS= read -r relative; do
    case "$relative" in ''|/*|../*|*/../*|*/..|.git|.git/*|.well-known|.well-known/*|.user.ini) continue;; esac
    if [[ ! -e "$source_dir/$relative" && -f "$target_dir/$relative" ]]; then
      unlink -- "$target_dir/$relative"
    fi
  done < "$state_dir/owned-files"
fi
while IFS= read -r relative; do
  chmod 644 -- "$target_dir/$relative"
done < <(cd -- "$source_dir" && find . -type f -print | sed 's|^./||')
while IFS= read -r relative; do
  chmod 755 -- "$target_dir/$relative"
done < <(cd -- "$source_dir" && find . -type d -print)
(cd -- "$source_dir" && find . -type f -print | sed 's|^./||' | LC_ALL=C sort) > "$state_dir/owned-files"
printf '%s\n' "$target_dir" > "$state_dir/docroot"
if command -v git >/dev/null && git -C "$project_dir" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git -C "$project_dir" rev-parse HEAD > "$state_dir/deployed-commit"
fi
printf 'Готово. Проверьте https://svet-kp.ru/ в приватном окне.\n'
printf 'Следующее обновление: bash "%s/scripts/update.sh"\n' "$project_dir"
