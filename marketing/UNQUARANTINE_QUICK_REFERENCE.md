# macOS Unquarantine Quick Reference

## ⚡ Quick Fix (Copy & Paste)

```bash
# 1. Unquarantine the DMG
xattr -d com.apple.quarantine ~/Downloads/C.A.P.I.T.O.L.-*.dmg

# 2. Open the DMG (or double-click it)
open ~/Downloads/C.A.P.I.T.O.L.-*.dmg

# 3. Drag app to Applications, then unquarantine the app
xattr -d com.apple.quarantine /Applications/C.A.P.I.T.O.L.app

# 4. If you still get "damaged" errors, remove all attributes:
xattr -cr /Applications/C.A.P.I.T.O.L.app
```

---

## 🎯 Method 1: Terminal (Recommended)

**Step 1:** Open Terminal (Cmd + Space, type "Terminal")

**Step 2:** Run these commands:
```bash
cd ~/Downloads
xattr -d com.apple.quarantine C.A.P.I.T.O.L.-*.dmg
open C.A.P.I.T.O.L.-*.dmg
```

**Step 3:** Drag the app to Applications

**Step 4:** Unquarantine the installed app:
```bash
xattr -d com.apple.quarantine /Applications/C.A.P.I.T.O.L.app
```

**Step 5:** Launch the app (double-click or right-click → Open)

---

## 🖱️ Method 2: Right-Click Open

1. Navigate to `/Applications/C.A.P.I.T.O.L.app`
2. **Right-click** (or Control-click) the app
3. Select **"Open"**
4. Click **"Open"** in the security dialog

This bypasses Gatekeeper for this specific launch.

---

## ⚙️ Method 3: System Settings

1. Open **System Settings** → **Privacy & Security**
2. Look for: *"C.A.P.I.T.O.L. was blocked"*
3. Click **"Open Anyway"**
4. Confirm by clicking **"Open"**

---

## 🔧 Troubleshooting

### "App is damaged and can't be opened"

```bash
xattr -cr /Applications/C.A.P.I.T.O.L.app
```

This removes ALL extended attributes (including quarantine).

### "Cannot verify developer"

This is normal for unsigned apps. Use Method 2 or Method 3 above.

### Still not working?

1. Check that you downloaded from the official GitHub releases
2. Ensure the DMG file isn't corrupted (re-download if needed)
3. Try restarting your Mac
4. Check Console.app for detailed error messages

---

## 📚 Full Instructions

For detailed explanations and all methods, see [DOWNLOAD_INSTRUCTIONS.md](./DOWNLOAD_INSTRUCTIONS.md)

---

**Need help?** Open an issue on [GitHub](https://github.com/Kneedeepnbeaver/C.A.P.I.T.O.L./issues)
