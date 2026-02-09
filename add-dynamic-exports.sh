#!/bin/bash
# Script to add dynamic export to all API routes

cd /workspaces/nexus-platform/apps/admin

for file in $(find src/app/api -name "route.ts" -type f); do
    # Check if file already has "export const dynamic"
    if ! grep -q "export const dynamic" "$file"; then
        echo "Adding dynamic export to $file"
        # Create a temp file with the new content
        echo "export const dynamic = 'force-dynamic';" > "$file.tmp"
        echo "" >> "$file.tmp"
        cat "$file" >> "$file.tmp"
        mv "$file.tmp" "$file"
    else
        echo "Skipping $file (already has dynamic export)"
    fi
done

echo "Done! All API routes now have dynamic export."
