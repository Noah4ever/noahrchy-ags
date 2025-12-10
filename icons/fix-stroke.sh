#!/usr/bin/env bash

# directory to process (default: current directory)
DIR="${1:-.}"

# loop over all svg files
find "$DIR" -type f -name "*.svg" | while read -r file; do
    # replace stroke="currentColor" with stroke="#ffffff"
    sed -i 's/stroke="currentColor"/stroke="#ffffff"/g' "$file"

    echo "Fixed: $file"
done

