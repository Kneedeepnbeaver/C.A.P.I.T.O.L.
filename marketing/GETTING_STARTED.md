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
