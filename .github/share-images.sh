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
