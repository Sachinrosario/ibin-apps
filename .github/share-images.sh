#!/bin/bash
# An app whose web/img/SHARED_FROM names another app reuses that app's picture folders
# (photos, host, life, season) instead of keeping a second copy in the repository.
set -e
for f in apps/*/web/img/SHARED_FROM; do
  [ -f "$f" ] || continue
  dst=$(dirname "$f"); src="apps/$(tr -d '[:space:]' < "$f")/web/img"
  for d in photos host life season; do [ -d "$src/$d" ] && [ ! -e "$dst/$d" ] && cp -r "$src/$d" "$dst/$d"; done
  echo "shared pictures: $src -> $dst"
done
# An app whose web/img/SHARED_MEDIA_FROM names another app reuses that app's numbered pictures (img/<n>.webp, img/t/) and audio/
# in its desktop and offline builds. The web page keeps one copy only (the app falls back to the other app's folder), so the
# web publishing step sets SKIP_MEDIA_SHARE=1.
if [ -z "$SKIP_MEDIA_SHARE" ]; then
  for f in apps/*/web/img/SHARED_MEDIA_FROM; do
    [ -f "$f" ] || continue
    dst=$(dirname "$(dirname "$f")"); src="apps/$(tr -d '[:space:]' < "$f")/web"
    cp -n "$src"/img/*.webp "$dst/img/" 2>/dev/null || true
    [ -d "$src/img/t" ] && cp -rn "$src/img/t" "$dst/img/"
    [ -d "$src/audio" ] && cp -rn "$src/audio" "$dst/"
    echo "shared media: $src -> $dst"
  done
fi
