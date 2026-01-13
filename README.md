# C.A.P.I.T.O.L. Marketing Materials

This directory contains marketing and documentation materials for **C.A.P.I.T.O.L.** (Civic Artificial Programming & Intelligence for Tracking, Organizing & Lawmaking).

---

## 📄 Available Documents

### For Users

- **[DOWNLOAD_INSTRUCTIONS.md](./DOWNLOAD_INSTRUCTIONS.md)** - Complete guide for downloading, installing, and unquarantining the app on all platforms
- **[GETTING_STARTED.md](./GETTING_STARTED.md)** - Quick start guide and tutorial for new users
- **[FEATURES.md](./FEATURES.md)** - Comprehensive feature overview and use cases
- **[FAQ.md](./FAQ.md)** - Frequently asked questions and troubleshooting

### For Developers & Contributors

- **[project_description.md](./project_description.md)** - High-level project overview
- **[project_description.html](./project_description.html)** - HTML version of project description
- **[download_intro_draft.md](./download_intro_draft.md)** - Creative introduction for download pages

---

## 🎯 Quick Links

- **GitHub Repository**: [github.com/Kneedeepnbeaver/C.A.P.I.T.O.L.](https://github.com/Kneedeepnbeaver/C.A.P.I.T.O.L.)
- **Releases**: [GitHub Releases](https://github.com/Kneedeepnbeaver/C.A.P.I.T.O.L./releases)
- **License**: MIT License

---

## 📝 Document Overview

### Download Instructions
Complete step-by-step guide covering:
- Download process for all platforms
- macOS unquarantine instructions (3 methods)
- Windows and Linux installation
- Troubleshooting common issues
- System requirements

### Getting Started
User-friendly tutorial covering:
- First launch walkthrough
- Core features explained
- Quick start workflows
- Settings configuration
- Pro tips and best practices

### Features
Comprehensive feature documentation:
- Detailed feature descriptions
- Use cases and examples
- Privacy and security information
- Technical specifications
- Roadmap

### FAQ
Answers to common questions:
- General questions
- Installation and setup
- Features and usage
- Privacy and security
- Technical questions
- Troubleshooting
- Licensing

---

## 🚀 Using These Materials

### For Website/README
Copy relevant sections into your:
- GitHub README.md
- Project website
- Documentation site
- Download pages

### For Social Media
Extract key points for:
- Feature announcements
- Release notes
- Tutorial posts
- Community updates

### For Support
Reference these documents when:
- Answering user questions
- Creating support tickets
- Writing blog posts
- Giving presentations

---

## 📋 Content Guidelines

All marketing materials follow these principles:

1. **Clear and Accessible**: Written for non-technical users
2. **Privacy-Focused**: Emphasize local-first, no-cloud architecture
3. **Open Source**: Highlight MIT License and community aspects
4. **Professional**: Maintain professional tone while being approachable
5. **Accurate**: All technical information is verified

---

## 🔄 Keeping Materials Updated

When updating C.A.P.I.T.O.L.:

1. **New Features**: Update FEATURES.md and GETTING_STARTED.md
2. **Installation Changes**: Update DOWNLOAD_INSTRUCTIONS.md
3. **Common Issues**: Add to FAQ.md troubleshooting section
4. **Version Updates**: Update version numbers and release dates

---

## 📧 Contact

For questions about these materials or suggestions for improvements:
- Open an issue on GitHub
- Submit a pull request with improvements

---

**Last Updated**: January 2025  
**Version**: 1.0.1
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
# Getting Started with C.A.P.I.T.O.L.

Welcome to **C.A.P.I.T.O.L.** (Civic Artificial Programming & Intelligence for Tracking, Organizing & Lawmaking)! This guide will help you get up and running quickly.

---

## 🎯 First Launch

When you first open C.A.P.I.T.O.L., you'll see the Welcome screen. Here's what to expect:

1. **Welcome Screen**: Overview of the app's features
2. **Demo Content**: Sample legislative documents are included to help you explore
3. **Settings**: Configure your local LLM connection (if using Ollama or similar)

---

## 📚 Core Features Overview

### 1. 📄 Smart Ingestion (Import)

**What it does:** Import and process legislative documents (PDFs, text files, transcripts)

**How to use:**
1. Click **"Import"** in the sidebar
2. Drag and drop files or click to browse
3. The app will automatically:
   - Extract text from PDFs
   - Index content for search
   - Extract metadata (bill numbers, dates, etc.)
4. Documents appear in **The Vault** (Library) when ready

**Supported formats:**
- PDF files
- Plain text (.txt)
- Markdown (.md)
- WebVTT transcripts (.vtt)

---

### 2. 🗄️ The Vault (Library)

**What it does:** Your secure, searchable document database

**How to use:**
1. Click **"Library"** in the sidebar
2. Browse all imported documents
3. Click any document to view details
4. Use the search bar to find specific bills or topics
5. Filter by date, type, or keywords

**Features:**
- Full-text search across all documents
- Metadata extraction (bill numbers, sponsors, dates)
- Document organization and tagging
- Export capabilities

---

### 3. 🔮 The Oracle (AI Chat)

**What it does:** Ask questions about your documents and get AI-powered answers with citations

**How to use:**
1. Click **"Chat"** or **"Oracle"** in the sidebar
2. Type your question in natural language
3. Examples:
   - "What are the key provisions of AB-2026?"
   - "Compare the renewable energy bills in my library"
   - "Summarize the transportation legislation from last session"
4. The Oracle will:
   - Search your document library
   - Generate an answer with citations
   - Highlight relevant sections

**Tips:**
- Be specific with bill numbers or document names
- Ask follow-up questions for deeper analysis
- Use the citation links to jump to source documents

---

### 4. ✍️ Minerva's Forge (Content Generation)

**What it does:** Automatically generate professional documents from your legislative content

**Available templates:**
- **Executive Summary**: High-level overview of bills
- **Press Release**: Media-ready announcements
- **Talking Points**: Pro/con arguments for debates
- **Committee Briefing**: Detailed analysis for committees
- **Social Media Suite**: Twitter, Facebook, LinkedIn posts
- **Policy Analysis**: In-depth policy breakdowns

**How to use:**
1. Click **"Analysis"** in the sidebar
2. Select a document from your library
3. Choose a template
4. Configure options (tone, length, focus areas)
5. Click **"Generate"**
6. Review and export the generated content

**Pro tip:** Generate multiple formats from the same bill to create a complete communications package.

---

## 🚀 Quick Start Workflow

### Scenario: Analyzing a New Bill

1. **Import the bill**
   - Go to Import → Select your PDF or text file
   - Wait for indexing to complete

2. **Explore with The Oracle**
   - Ask: "What is this bill about?"
   - Ask: "Who are the sponsors?"
   - Ask: "What are the key provisions?"

3. **Generate materials**
   - Create an Executive Summary for quick reference
   - Generate Talking Points for a meeting
   - Create a Press Release if needed

4. **Store in The Vault**
   - All documents are automatically saved
   - Searchable and organized
   - Export when needed

---

## ⚙️ Settings & Configuration

### Local LLM Setup

C.A.P.I.T.O.L. uses local AI models for privacy and speed. Configure your connection:

1. Go to **Settings**
2. **LLM Provider**: Choose your local LLM service
   - Ollama (recommended)
   - LM Studio
   - Custom API endpoint
3. **Model Selection**: Choose your preferred model
   - For analysis: Larger models (7B+ parameters)
   - For speed: Smaller models (3B-7B parameters)
4. **Test Connection**: Verify your setup works

### Recommended Models

- **Llama 3.1 8B**: Balanced performance and speed
- **Mistral 7B**: Fast and efficient
- **Llama 3.1 70B**: Best quality (requires powerful hardware)

---

## 📖 Sample Workflow Examples

### Example 1: Committee Meeting Prep

1. Import all relevant bills for the meeting
2. Use The Oracle: "What are the main differences between SB-101 and AB-2026?"
3. Generate Committee Briefing for each bill
4. Create Talking Points for your position
5. Export everything to a folder

### Example 2: Media Response

1. Import the bill in question
2. Generate Executive Summary for background
3. Create Press Release with your organization's position
4. Generate Social Media Suite for coordinated messaging
5. Review and customize before publishing

### Example 3: Research Project

1. Import multiple related documents
2. Use The Oracle for comparative analysis
3. Generate Policy Analysis reports
4. Export findings for your research paper

---

## 💡 Pro Tips

- **Batch Import**: Import multiple documents at once for faster setup
- **Save Queries**: Frequently asked questions can be saved as templates
- **Export Formats**: Generated content can be exported as Markdown, PDF, or plain text
- **Keyboard Shortcuts**: Check the Help menu for time-saving shortcuts
- **Demo Content**: Explore the included sample documents to learn the interface

---

## 🆘 Need Help?

- **Help Menu**: Click "Help" in the sidebar for in-app documentation
- **GitHub Issues**: Report bugs or request features on [GitHub](https://github.com/Kneedeepnbeaver/C.A.P.I.T.O.L./issues)
- **Documentation**: Check the `/docs` folder in the repository for technical details

---

## 🎓 Next Steps

1. ✅ Import your first document
2. ✅ Ask The Oracle a question
3. ✅ Generate your first Executive Summary
4. ✅ Explore the demo content
5. ✅ Customize settings for your workflow

**Welcome to C.A.P.I.T.O.L. — Your AI-powered legislative analysis companion!**
