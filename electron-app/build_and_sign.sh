#!/bin/bash
set -e

# 1. Build React
echo "Building React..."
npm run build

# 2. Build Python
echo "Building Python..."
../venv/bin/python3 build_python.py

# 3. Build Electron (Unpacked)
# We use --dir to get the unpacked app, and disable signing by setting identity to null via config override
echo "Building Electron App (Unpacked)..."
npx electron-builder --dir -c.mac.identity=null

# 4. Manually Sign
echo "Applying Ad-Hoc Signature..."
# Sign the entire bundle deeply
codesign --force --deep --sign - "release/mac-arm64/C.A.P.I.T.O.L.app"

echo "Build and Sign Complete!"
echo "App location: release/mac-arm64/C.A.P.I.T.O.L.app"
