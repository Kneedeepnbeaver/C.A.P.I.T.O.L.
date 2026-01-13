# Download & Installation Guide

## 🚀 Quick Start

### Step 1: Download the App

1. Visit the [GitHub Releases page](https://github.com/Kneedeepnbeaver/C.A.P.I.T.O.L./releases)
2. Download the latest release for your operating system:
   - **macOS**: `C.A.P.I.T.O.L.-[version]-mac-arm64.dmg` (Apple Silicon) or `C.A.P.I.T.O.L.-[version]-mac-x64.dmg` (Intel)
   - **Windows**: `C.A.P.I.T.O.L.-[version]-win-x64.exe`
   - **Linux**: `C.A.P.I.T.O.L.-[version]-x86_64.AppImage`

---

## 🍎 macOS Installation & Unquarantine

### Why Unquarantine?

macOS Gatekeeper may quarantine downloaded applications from unidentified developers. This is a security feature that prevents unsigned apps from running. Since C.A.P.I.T.O.L. is distributed under the MIT License and may not be code-signed by Apple, you'll need to unquarantine it.

### Method 1: Terminal (Recommended)

1. **Open Terminal** (Applications → Utilities → Terminal, or press `Cmd + Space` and type "Terminal")

2. **Navigate to your Downloads folder:**
   ```bash
   cd ~/Downloads
   ```

3. **Unquarantine the DMG file:**
   ```bash
   xattr -d com.apple.quarantine C.A.P.I.T.O.L.-*.dmg
   ```
   *(Replace `*` with the actual version number if needed, or use Tab completion)*

4. **Open the DMG:**
   ```bash
   open C.A.P.I.T.O.L.-*.dmg
   ```
   Or simply double-click the DMG file in Finder.

5. **Drag the app to Applications:**
   - Drag `C.A.P.I.T.O.L.app` from the DMG window to your Applications folder
   - If you see a warning about an unidentified developer, proceed to Method 2

6. **Unquarantine the installed app:**
   ```bash
   xattr -d com.apple.quarantine /Applications/C.A.P.I.T.O.L.app
   ```

7. **Launch the app:**
   - Open Applications folder
   - Double-click `C.A.P.I.T.O.L.app`
   - If you see a security warning, right-click the app and select "Open", then click "Open" in the dialog

### Method 2: System Settings (Alternative)

If you encounter security warnings:

1. **Open System Settings** (or System Preferences on older macOS)
2. Go to **Privacy & Security** (or **Security & Privacy**)
3. Scroll down to find a message about "C.A.P.I.T.O.L. was blocked"
4. Click **"Open Anyway"** or **"Allow"**
5. Confirm by clicking **"Open"** in the dialog

### Method 3: Right-Click Open

1. Navigate to `/Applications/C.A.P.I.T.O.L.app`
2. **Right-click** (or Control-click) the app
3. Select **"Open"** from the context menu
4. Click **"Open"** in the security dialog
5. This bypasses Gatekeeper for this specific app launch

---

## 🪟 Windows Installation

1. **Download the installer** from GitHub Releases
2. **Run the installer** (`C.A.P.I.T.O.L.-[version]-win-x64.exe`)
3. Follow the installation wizard
4. Launch C.A.P.I.T.O.L. from the Start menu or desktop shortcut

**Note:** Windows Defender or antivirus software may flag the app. This is common for unsigned applications. You may need to:
- Click "More info" on the warning screen
- Select "Run anyway"
- Or add an exception in Windows Defender settings

---

## 🐧 Linux Installation

1. **Download the AppImage** from GitHub Releases
2. **Make it executable:**
   ```bash
   chmod +x C.A.P.I.T.O.L.-[version]-x86_64.AppImage
   ```
3. **Run the app:**
   ```bash
   ./C.A.P.I.T.O.L.-[version]-x86_64.AppImage
   ```

**Optional:** To integrate with your system:
- Move the AppImage to `~/Applications` or `/opt`
- Create a desktop entry for easier launching

---

## ✅ Verification

After installation, verify everything works:

1. Launch C.A.P.I.T.O.L.
2. You should see the welcome screen
3. Check that the Oracle (AI chat) is accessible
4. Try importing a sample document from the demo content

---

## 🆘 Troubleshooting

### macOS: "App is damaged and can't be opened"

**Solution:**
```bash
xattr -cr /Applications/C.A.P.I.T.O.L.app
```

This removes all extended attributes (including quarantine) from the app.

### macOS: "Cannot verify developer"

This is expected for unsigned apps. Use Method 2 or Method 3 above to bypass.

### App won't launch / Crashes on startup

1. Check that you have the required Python runtime (if using local LLM)
2. Ensure you have sufficient disk space
3. Check the console logs:
   - **macOS**: Open Console.app and filter for "C.A.P.I.T.O.L"
   - **Windows**: Check Event Viewer
   - **Linux**: Check `~/.config/C.A.P.I.T.O.L/logs/`

### Python backend not found

The app includes a bundled Python backend. If you see errors about missing Python:
1. Ensure the app was installed correctly (not just copied)
2. Re-download and reinstall from the DMG/installer
3. Check that the app bundle is intact

---

## 📋 System Requirements

### macOS
- macOS 10.15 (Catalina) or later
- Apple Silicon (M1/M2/M3) or Intel processor
- 4GB RAM minimum (8GB recommended)
- 500MB free disk space

### Windows
- Windows 10 or later
- 64-bit processor
- 4GB RAM minimum (8GB recommended)
- 500MB free disk space

### Linux
- Modern Linux distribution (Ubuntu 20.04+, Fedora 34+, etc.)
- 64-bit processor
- 4GB RAM minimum (8GB recommended)
- 500MB free disk space

---

## 🔄 Updating

To update to a newer version:

1. Download the latest release from GitHub
2. Follow the installation steps above
3. The new version will replace the old one
4. Your documents and settings are preserved in the app's data directory

---

## 📝 License

C.A.P.I.T.O.L. is released under the **MIT License**. You are free to use, modify, and distribute this software.

**Hack the Planet.** 🌍
