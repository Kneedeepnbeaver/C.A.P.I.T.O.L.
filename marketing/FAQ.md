# Frequently Asked Questions (FAQ)

## General Questions

### What is C.A.P.I.T.O.L.?

**C.A.P.I.T.O.L.** stands for **Civic Artificial Programming & Intelligence for Tracking, Organizing & Lawmaking**. It's a desktop application that helps legislative professionals analyze documents, track bills, and generate insights using AI technology.

### Who is C.A.P.I.T.O.L. for?

C.A.P.I.T.O.L. is designed for:
- Legislative staff
- Policy analysts
- Advocacy organizations
- Journalists covering legislation
- Lobbyists
- Researchers
- Anyone who works with legislative documents

### Is C.A.P.I.T.O.L. free?

Yes! C.A.P.I.T.O.L. is released under the **MIT License**, which means it's free to use, modify, and distribute.

### What operating systems are supported?

C.A.P.I.T.O.L. runs on:
- **macOS** (10.15+)
- **Windows** (10+)
- **Linux** (most modern distributions)

---

## Installation & Setup

### Why do I need to "unquarantine" the app on macOS?

macOS Gatekeeper quarantines apps downloaded from the internet that aren't signed by Apple. Since C.A.P.I.T.O.L. is distributed under the MIT License and may not be code-signed, you need to remove the quarantine attribute. See [DOWNLOAD_INSTRUCTIONS.md](./DOWNLOAD_INSTRUCTIONS.md) for detailed steps.

### Is C.A.P.I.T.O.L. safe to install?

Yes. C.A.P.I.T.O.L. is open source, so you can review the code yourself. The app runs entirely on your computer—no data is transmitted to external servers. However, as with any software, only download from the official GitHub releases page.

### Do I need to install Python separately?

No. C.A.P.I.T.O.L. includes a bundled Python backend. You don't need to install Python separately.

### Do I need an internet connection?

For basic document management and search, no internet is required. However, if you're using a cloud-based LLM (instead of a local one), you'll need internet for The Oracle and content generation features.

---

## Features & Usage

### What file formats does C.A.P.I.T.O.L. support?

C.A.P.I.T.O.L. can import:
- PDF files
- Plain text files (.txt)
- Markdown files (.md)
- WebVTT transcripts (.vtt)

### How does The Oracle work?

The Oracle uses **RAG (Retrieval-Augmented Generation)** technology:
1. Your documents are indexed and stored locally
2. When you ask a question, it searches your document library
3. Relevant sections are retrieved
4. A local AI model generates an answer based on those sections
5. Citations are provided for every answer

### Can I use my own AI model?

Yes! C.A.P.I.T.O.L. supports:
- **Ollama** (recommended for local models)
- **LM Studio**
- Custom API endpoints

Configure your LLM in Settings.

### How accurate are the AI-generated answers?

The accuracy depends on:
- The quality of your source documents
- The AI model you're using
- The specificity of your question

Always verify important information by checking the citations and source documents. The Oracle is a tool to help you find information faster, not a replacement for careful review.

### Can I export generated content?

Yes! Generated content can be exported as:
- Markdown (.md)
- Plain text (.txt)
- PDF (coming soon)

### Where are my documents stored?

Documents are stored locally on your computer in the app's data directory:
- **macOS**: `~/Library/Application Support/C.A.P.I.T.O.L./`
- **Windows**: `%APPDATA%/C.A.P.I.T.O.L./`
- **Linux**: `~/.config/C.A.P.I.T.O.L./`

Your data never leaves your machine.

---

## Privacy & Security

### Does C.A.P.I.T.O.L. send my documents to the cloud?

**No.** When using a local LLM (like Ollama), all processing happens on your computer. Your documents never leave your machine.

### What if I use a cloud-based LLM?

If you configure C.A.P.I.T.O.L. to use a cloud-based LLM API, your queries and document excerpts may be sent to that service. Check your LLM provider's privacy policy. For maximum privacy, use a local LLM.

### Is my data encrypted?

Documents are stored in plain text in the app's data directory. If you need encryption, use disk encryption (FileVault on macOS, BitLocker on Windows) or store documents in an encrypted folder.

### Can I delete my data?

Yes. You can:
- Delete individual documents from within the app
- Delete the entire data directory to remove all documents
- Uninstall the app (your data directory will remain unless manually deleted)

---

## Technical Questions

### What is RAG?

**RAG** stands for **Retrieval-Augmented Generation**. It's a technique that:
1. Stores your documents in a searchable format
2. Retrieves relevant sections when you ask questions
3. Uses those sections to generate accurate, cited answers

This is more accurate than asking an AI model directly because it's grounded in your actual documents.

### What programming languages is C.A.P.I.T.O.L. built with?

- **Frontend**: React, TypeScript, Electron
- **Backend**: Python
- **UI**: Tailwind CSS

### Can I contribute to the project?

Yes! C.A.P.I.T.O.L. is open source. You can:
- Report bugs on GitHub
- Request features
- Submit pull requests
- Improve documentation

Visit the [GitHub repository](https://github.com/Kneedeepnbeaver/C.A.P.I.T.O.L.) to get started.

### How do I report a bug?

Open an issue on GitHub with:
- Description of the problem
- Steps to reproduce
- Your operating system and version
- Any error messages
- Screenshots if applicable

---

## Troubleshooting

### The app won't launch on macOS

Try these steps:
1. Unquarantine the app (see [DOWNLOAD_INSTRUCTIONS.md](./DOWNLOAD_INSTRUCTIONS.md))
2. Right-click and select "Open" instead of double-clicking
3. Check System Settings → Privacy & Security for blocked apps
4. Remove extended attributes: `xattr -cr /Applications/C.A.P.I.T.O.L.app`

### The Oracle isn't responding

1. Check your LLM connection in Settings
2. Verify your local LLM is running (if using Ollama)
3. Check the console for error messages
4. Try restarting the app

### Documents aren't importing

1. Check that the file format is supported
2. Ensure the file isn't corrupted
3. Try a smaller file first
4. Check available disk space
5. Review the console logs for errors

### Search isn't finding my documents

1. Wait for indexing to complete (check the status in Library)
2. Try different keywords
3. Use The Oracle for semantic search instead
4. Re-import the document if needed

### Generated content seems inaccurate

1. Verify your source documents are complete and accurate
2. Try a more specific question or prompt
3. Check the citations to see what the AI based its answer on
4. Consider using a larger/more capable AI model
5. Always review and fact-check generated content

---

## Licensing & Legal

### Can I use C.A.P.I.T.O.L. commercially?

Yes. The MIT License allows commercial use.

### Can I modify C.A.P.I.T.O.L.?

Yes. The MIT License allows modification. You must include the original license and copyright notice.

### Can I redistribute C.A.P.I.T.O.L.?

Yes, as long as you include the original license and copyright notice.

### Who created C.A.P.I.T.O.L.?

C.A.P.I.T.O.L. was created by Dylan Carpowich (artsbydylan.com) and is released under the MIT License.

---

## Getting Help

### Where can I get support?

- **GitHub Issues**: Report bugs and request features
- **Documentation**: Check the `/docs` folder in the repository
- **Help Menu**: In-app documentation and guides

### Is there a user community?

The GitHub repository is the primary community hub. You can:
- Ask questions in Issues
- Share tips and workflows
- Contribute improvements

---

## Future Features

### What's coming next?

Planned features include:
- Collaboration tools
- Advanced analytics and visualizations
- Calendar integration
- Email import
- More content templates
- Plugin system

Check the GitHub repository for the latest roadmap and updates.

---

**Still have questions?** Open an issue on [GitHub](https://github.com/Kneedeepnbeaver/C.A.P.I.T.O.L./issues) or check the documentation in the `/docs` folder.
