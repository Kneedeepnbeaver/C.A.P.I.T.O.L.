# Ollama Installation & Setup Guide

C.A.P.I.T.O.L. requires Ollama to run local AI models. Follow these steps to get started.

## What is Ollama?

Ollama is a free, open-source tool that lets you run large language models (LLMs) locally on your computer. No internet required, no API costs, complete privacy.

## Step 1: Install Ollama

### macOS & Linux

1. **Download Ollama:**
   - Visit: https://ollama.com/download
   - Click "Download for Mac" or "Download for Linux"
   - Or use terminal:
     ```bash
     curl -fsSL https://ollama.com/install.sh | sh
     ```

2. **Verify Installation:**
   ```bash
   ollama --version
   ```

### Windows

1. **Download Ollama:**
   - Visit: https://ollama.com/download
   - Click "Download for Windows"
   - Run the installer

2. **Verify Installation:**
   - Open Command Prompt
   - Run: `ollama --version`

## Step 2: Download AI Models

C.A.P.I.T.O.L. works best with these models:

### Recommended: Llama 3.2 (3B)
Fast, efficient, great for most legislative analysis:
```bash
ollama pull llama3.2:3b
```

### Alternative: Phi-3 Mini
Smaller, faster, good for quick queries:
```bash
ollama pull phi3:mini
```

### Advanced: Llama 3.1 (8B)
More powerful, requires more RAM:
```bash
ollama pull llama3.1:8b
```

## Step 3: Start Ollama Server

Ollama needs to be running for C.A.P.I.T.O.L. to work:

### macOS & Linux
```bash
ollama serve
```

### Windows
Ollama typically starts automatically. If not:
- Open Command Prompt
- Run: `ollama serve`

**Keep this terminal window open while using C.A.P.I.T.O.L.**

## Step 4: Verify Connection

1. **Launch C.A.P.I.T.O.L.**
2. **Check Status:**
   - Look at the sidebar
   - You should see "LLM: Online" (green)
   - If red, Ollama isn't running

## Troubleshooting

### "LLM: Offline" in C.A.P.I.T.O.L.

**Solution:**
1. Open terminal
2. Run: `ollama serve`
3. Restart C.A.P.I.T.O.L.

### "Model not found" error

**Solution:**
1. Check available models: `ollama list`
2. Pull missing model: `ollama pull llama3.2:3b`
3. Restart C.A.P.I.T.O.L.

### Ollama won't start

**macOS/Linux:**
```bash
# Check if already running
ps aux | grep ollama

# Kill existing process
killall ollama

# Start fresh
ollama serve
```

**Windows:**
- Open Task Manager
- End "ollama" process
- Restart Ollama

## System Requirements

### Minimum (Phi-3 Mini)
- **RAM:** 8 GB
- **Storage:** 5 GB free
- **CPU:** Modern multi-core processor

### Recommended (Llama 3.2 3B)
- **RAM:** 16 GB
- **Storage:** 10 GB free
- **CPU:** 4+ cores

### Advanced (Llama 3.1 8B)
- **RAM:** 32 GB
- **Storage:** 20 GB free
- **CPU:** 8+ cores
- **GPU:** Optional, speeds up processing

## Model Comparison

| Model | Size | Speed | Quality | Best For |
|-------|------|-------|---------|----------|
| Phi-3 Mini | 2.3 GB | ⚡⚡⚡ | ⭐⭐ | Quick queries, low-end hardware |
| Llama 3.2 3B | 2.0 GB | ⚡⚡ | ⭐⭐⭐ | Balanced performance (recommended) |
| Llama 3.1 8B | 4.7 GB | ⚡ | ⭐⭐⭐⭐ | Complex analysis, high-end hardware |

## Auto-Start Ollama (Optional)

### macOS (LaunchAgent)

1. Create launch agent:
```bash
cat > ~/Library/LaunchAgents/com.ollama.server.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.ollama.server</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/ollama</string>
        <string>serve</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
</dict>
</plist>
EOF
```

2. Load the agent:
```bash
launchctl load ~/Library/LaunchAgents/com.ollama.server.plist
```

### Linux (systemd)

1. Create service file:
```bash
sudo nano /etc/systemd/system/ollama.service
```

2. Add content:
```ini
[Unit]
Description=Ollama Server
After=network.target

[Service]
Type=simple
User=YOUR_USERNAME
ExecStart=/usr/local/bin/ollama serve
Restart=always

[Install]
WantedBy=multi-user.target
```

3. Enable and start:
```bash
sudo systemctl enable ollama
sudo systemctl start ollama
```

### Windows (Task Scheduler)

1. Open Task Scheduler
2. Create Basic Task
3. Name: "Ollama Server"
4. Trigger: "When I log on"
5. Action: "Start a program"
6. Program: `C:\Users\YourName\AppData\Local\Programs\Ollama\ollama.exe`
7. Arguments: `serve`
8. Finish

## Next Steps

Once Ollama is running:
1. ✅ Launch C.A.P.I.T.O.L.
2. ✅ Import your first documents (Ingestion tab)
3. ✅ Try The Oracle for Q&A
4. ✅ Generate artifacts with Minerva's Forge

## Additional Resources

- **Ollama Documentation:** https://github.com/ollama/ollama
- **Model Library:** https://ollama.com/library
- **Community:** https://discord.gg/ollama

## Privacy Note

🔒 **Everything stays local:**
- Ollama runs on your computer
- Models stored locally
- No internet required after download
- Your documents never leave your machine

Perfect for sensitive legislative work!
