#!/bin/bash
# download-missing-icons.sh: Download Heroicons v2.2.0 optimized SVGs from GitHub
# Fixed: Create directories before downloading

BASE_URL="https://raw.githubusercontent.com/tailwindlabs/heroicons/master/optimized"

# Create directories
mkdir -p src/assets/icons/heroicons/outline
mkdir -p src/assets/icons/heroicons/solid

# Outline icons
curl "${BASE_URL}/24/outline/arrow-long-left.svg" -o src/assets/icons/heroicons/outline/arrow-long-left.svg
curl "${BASE_URL}/24/outline/arrow-long-right.svg" -o src/assets/icons/heroicons/outline/arrow-long-right.svg
curl "${BASE_URL}/24/outline/arrow-small-right.svg" -o src/assets/icons/heroicons/outline/arrow-sm-right.svg
curl "${BASE_URL}/24/outline/arrow-small-up.svg" -o src/assets/icons/heroicons/outline/arrow-sm-up.svg
curl "${BASE_URL}/24/outline/bell.svg" -o src/assets/icons/heroicons/outline/bell.svg
curl "${BASE_URL}/24/outline/bookmark.svg" -o src/assets/icons/heroicons/outline/bookmark.svg
curl "${BASE_URL}/24/outline/chart-pie.svg" -o src/assets/icons/heroicons/outline/chart-pie.svg
curl "${BASE_URL}/24/outline/cog-6-tooth.svg" -o src/assets/icons/heroicons/outline/cog-6-tooth.svg
curl "${BASE_URL}/24/outline/cog.svg" -o src/assets/icons/heroicons/outline/cog.svg
curl "${BASE_URL}/24/outline/cube.svg" -o src/assets/icons/heroicons/outline/cube.svg
curl "${BASE_URL}/24/outline/cursor-arrow-rays.svg" -o src/assets/icons/heroicons/outline/cursor-click.svg  # Alias if needed
curl "${BASE_URL}/24/outline/ellipsis-horizontal.svg" -o src/assets/icons/heroicons/outline/dots-horizontal.svg
curl "${BASE_URL}/24/outline/arrow-down-tray.svg" -o src/assets/icons/heroicons/outline/download.svg
curl "${BASE_URL}/24/outline/ellipsis-vertical.svg" -o src/assets/icons/heroicons/outline/ellipsis-vertical.svg
curl "${BASE_URL}/24/outline/exclamation-triangle.svg" -o src/assets/icons/heroicons/outline/exclamation-triangle.svg
curl "${BASE_URL}/24/outline/eye-slash.svg" -o src/assets/icons/heroicons/outline/eye-off.svg
curl "${BASE_URL}/24/outline/eye.svg" -o src/assets/icons/heroicons/outline/eye.svg
curl "${BASE_URL}/24/outline/folder.svg" -o src/assets/icons/heroicons/outline/folder.svg
curl "${BASE_URL}/24/outline/gift.svg" -o src/assets/icons/heroicons/outline/gift.svg
curl "${BASE_URL}/24/outline/information-circle.svg" -o src/assets/icons/heroicons/outline/information-circle.svg
curl "${BASE_URL}/24/outline/lock-closed.svg" -o src/assets/icons/heroicons/outline/lock-closed.svg
curl "${BASE_URL}/24/outline/arrow-right-start-on-rectangle.svg" -o src/assets/icons/heroicons/outline/logout.svg  # Alias
curl "${BASE_URL}/24/outline/magnifying-glass.svg" -o src/assets/icons/heroicons/outline/magnifying-glass.svg
curl "${BASE_URL}/24/outline/bars-3.svg" -o src/assets/icons/heroicons/outline/menu.svg
curl "${BASE_URL}/24/outline/minus.svg" -o src/assets/icons/heroicons/outline/minus.svg
curl "${BASE_URL}/24/outline/moon.svg" -o src/assets/icons/heroicons/outline/moon.svg
curl "${BASE_URL}/24/outline/plus.svg" -o src/assets/icons/heroicons/outline/plus.svg
curl "${BASE_URL}/24/outline/arrow-path.svg" -o src/assets/icons/heroicons/outline/refresh.svg
curl "${BASE_URL}/24/outline/shield-check.svg" -o src/assets/icons/heroicons/outline/shield-check.svg
curl "${BASE_URL}/24/outline/shield-exclamation.svg" -o src/assets/icons/heroicons/outline/shield-exclamation.svg
curl "${BASE_URL}/24/outline/sun.svg" -o src/assets/icons/heroicons/outline/sun.svg
curl "${BASE_URL}/24/outline/user-circle.svg" -o src/assets/icons/heroicons/outline/user-circle.svg
curl "${BASE_URL}/24/outline/users.svg" -o src/assets/icons/heroicons/outline/users.svg
curl "${BASE_URL}/24/outline/view-columns.svg" -o src/assets/icons/heroicons/outline/view-grid.svg  # Alias
curl "${BASE_URL}/24/outline/x-mark.svg" -o src/assets/icons/heroicons/outline/x.svg

# Solid icons
curl "${BASE_URL}/24/solid/chevron-double-left.svg" -o src/assets/icons/heroicons/solid/chevron-double-left.svg
curl "${BASE_URL}/24/solid/chevron-right.svg" -o src/assets/icons/heroicons/solid/chevron-right.svg
curl "${BASE_URL}/24/solid/play.svg" -o src/assets/icons/heroicons/solid/play.svg

echo "Heroicons downloaded."
