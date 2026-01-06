import streamlit as st
import pandas as pd
import json
import subprocess
import re
import sys
import base64
import pdfplumber
from pathlib import Path
from datetime import datetime

# --- CONFIGURATION ---
METADATA_CSV = "Legislative_Analysis/legislative_metadata.csv"
TEXT_DIR = Path("Legislative_Analysis/legislative_documents")
OUTPUT_DIR = Path("generated_content")
MODEL = "llama3.2:latest"
VOICE_PRESETS_FILE = "Legislative_Analysis/legislative_voice_presets.json"

# Ensure output directory exists
OUTPUT_DIR.mkdir(exist_ok=True)

# Load voice presets
try:
    with open(VOICE_PRESETS_FILE, 'r') as f:
        VOICE_PRESETS = json.load(f)['voice_presets']
except:
    VOICE_PRESETS = []

st.set_page_config(
    page_title="Legislative Analysis Tool",
    page_icon="⚖️",
    layout="wide",
)

# --- STYLING ---
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;800&family=Outfit:wght@500;700;800&display=swap');
    
    /* Root Variables */
    :root {
        --bg-main: #0e1014;
        --bg-sidebar: #161a20;
        --accent: #4a90e2; /* Blue for Legislative */
        --text-primary: #ffffff;
        --text-secondary: #a0aec0;
        --card-bg: #1a1f26;
    }

    .main {
        background-color: var(--bg-main);
        color: var(--text-primary);
        font-family: 'Inter', sans-serif;
    }
    .stApp {
        background-color: var(--bg-main);
    }
    
    /* Sidebar Styling */
    section[data-testid="stSidebar"] {
        background-color: var(--bg-sidebar);
        border-right: 1px solid #2d3748;
    }
    section[data-testid="stSidebar"] .stMarkdown h2, 
    section[data-testid="stSidebar"] .stMarkdown h3 {
        color: var(--accent) !important;
    }
    
    /* Labels & Inputs Visibility */
    label, .stMarkdown p {
        color: #f7fafc !important;
        font-weight: 500 !important;
    }
    .stSlider label, .stMultiSelect label {
        color: var(--accent) !important;
        letter-spacing: 0.5px;
        text-transform: uppercase;
        font-size: 0.8rem !important;
    }

    .stButton>button {
        width: 100%;
        border-radius: 8px;
        height: 3.5em;
        background-color: var(--accent);
        color: #ffffff;
        font-weight: 800;
        font-family: 'Outfit', sans-serif;
        border: none;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        text-transform: uppercase;
        letter-spacing: 1px;
    }
    .stButton>button:hover {
        background-color: #357abd;
        transform: translateY(-2px);
        box-shadow: 0 5px 20px rgba(74, 144, 226, 0.4);
    }
    
    /* Result Box - High Contrast Paper Style */
    .result-box {
        background-color: #ffffff;
        color: #111111;
        padding: 45px;
        border-radius: 12px;
        border-top: 5px solid var(--accent);
        box-shadow: 0 20px 40px rgba(0,0,0,0.6);
        line-height: 1.7;
        font-size: 1.15rem;
        margin-top: 25px;
    }
    .result-box h1, .result-box h2, .result-box h3 {
        color: #000000 !important;
        font-family: 'Outfit', sans-serif;
        border-bottom: 2px solid #e2e8f0;
        padding-bottom: 12px;
        margin-top: 1.5em;
    }
    
    /* Expander & Container Styling */
    .stExpander {
        background-color: var(--card-bg);
        border: 1px solid #2d3748 !important;
        border-radius: 10px !important;
    }
    .stExpander:hover {
        border-color: var(--accent) !important;
    }
    
    h1, h2, h3 {
        color: var(--accent) !important;
        font-family: 'Outfit', sans-serif;
        font-weight: 700;
    }
    
    /* Divider Visibility */
    hr {
        border-color: #2d3748 !important;
    }

    /* Tooltips and select boxes */
    .stSelectbox div[data-baseweb="select"] {
        background-color: #2d3748;
    }
</style>
""", unsafe_allow_html=True)

# --- FUNCTIONS ---
def call_ollama(prompt):
    try:
        result = subprocess.run(
            ["ollama", "run", MODEL, prompt],
            capture_output=True,
            text=True,
            timeout=300
        )
        return result.stdout.strip()
    except Exception as e:
        return f"Error: {str(e)}"


def get_full_text(filename):
    """Reads the full text of a document from the text directory."""
    path = TEXT_DIR / filename
    if not path.exists():
        return ""
        
    try:
        # Check extension
        if path.suffix.lower() == '.pdf':
            text = ""
            try:
                with pdfplumber.open(path) as pdf:
                    for page in pdf.pages:
                        extracted = page.extract_text()
                        if extracted:
                            text += extracted + "\n"
                return text
            except Exception as e:
                return f"[Error reading PDF: {e}]"
        else:
            # Assume Text file - try UTF-8 then Latin-1
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    return f.read()
            except UnicodeDecodeError:
                with open(path, 'r', encoding='latin-1') as f:
                    return f.read()
    except Exception as e:
        return f"[Error reading file: {e}]"

def generate_legislative_artifact(selected_docs, artifact_type, tone, additional_instructions):
    """Generates legislative artifacts (summaries, memos, etc) based on selected docs."""
    
    context = ""
    for i, doc in enumerate(selected_docs):
        # Use full text if available, otherwise summary
        full_text = get_full_text(doc['Filename'])
        content = full_text[:4000] if full_text else doc['Summary']
        
        context += f"DOCUMENT {i+1}: {doc['Document Title']}\n"
        context += f"Sender: {doc.get('Sender/Organization', 'Unknown')}\n"
        context += f"Position: {doc.get('Position', 'Neutral')}\n"
        context += f"Bill: {doc.get('Bill Number', 'N/A')}\n"
        context += f"Key Arguments: {doc.get('Key Arguments', '')}\n"
        context += f"Content Snippet: {content}\n\n"
    
    prompts = {
        "Executive Summary": "Create a clear, balanced Executive Summary of the selected documents. Identify the core issue, the range of positions (Support vs Oppose), and the key stakeholders involved. Conclude with a 'Legislative Landscape' assessment.",
        "Talking Points (Pro)": "Draft a set of persuasive Talking Points in SUPPORT of the issue/bill. Focus on the strongest arguments found in the documents. Use bullet points designed for a speech or media interview.",
        "Talking Points (Con)": "Draft a set of persuasive Talking Points in OPPOSITION to the issue/bill. Highlight risks, costs, and negative impacts identified in the documents. Use bullet points.",
        "Vote Recommendation": "Write an internal Vote Recommendation Memo. Analyze the arguments, weigh the stakeholder positions, and recommend a 'AYE' or 'NO' vote. Justify the recommendation based on policy merit and political considerations.",
        "Coalition Letter": "Draft a Coalition Letter to be signed by the supporting organizations. The letter should urge a specific action (Vote Yes/No) and synthesize the collective arguments into a unified voice.",
        "Opposition Research": "Analyze the documents for contradictions, weak arguments, or controversial statements. Create an Opposition Research Report highlighting vulnerabilities in the opposing side's case."
    }
    
    base_instruction = prompts.get(artifact_type, "Analyze the documents and provide a synthesis.")
    
    final_prompt = f"""You are a senior legislative analyst and political strategist.
    
TASK: Write a {artifact_type} based on the provided legislative documents.

INSTRUCTIONS:
{base_instruction}

ADDITIONAL INSTRUCTIONS:
{additional_instructions}

TONE/VOICE: {tone}

SOURCE DOCUMENTS:
{context}

REQUIREMENTS:
1. Be precise and professional.
2. Cite specific organizations/senders where appropriate (e.g., "As the Teachers Association argues...").
3. Format clearly with headers and bullet points.
4. Output in Markdown.

Start immediately with the title."""

    return call_ollama(final_prompt)

def save_to_local(content, prefix="leg_artifact"):
    """Saves content to the local generated_content folder."""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{prefix}_{timestamp}.md"
    filepath = OUTPUT_DIR / filename
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
    return filepath

def export_as_html(markdown_content, title="Legislative Analysis"):
    """Convert markdown to styled HTML."""
    # Simple markdown to HTML conversion
    html_content = markdown_content.replace('\n\n', '</p><p>')
    html_content = html_content.replace('\n', '<br>')
    html_content = re.sub(r'### (.*?)<br>', r'<h3>\1</h3>', html_content)
    html_content = re.sub(r'## (.*?)<br>', r'<h2>\1</h2>', html_content)
    html_content = re.sub(r'# (.*?)<br>', r'<h1>\1</h1>', html_content)
    html_content = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', html_content)
    html_content = re.sub(r'\*(.*?)\*', r'<em>\1</em>', html_content)
    
    html_template = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>{title}</title>
    <style>
        body {{
            font-family: 'Georgia', serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 40px auto;
            padding: 20px;
            color: #333;
        }}
        h1 {{ color: #2c3e50; border-bottom: 3px solid #4a90e2; padding-bottom: 10px; }}
        h2 {{ color: #34495e; margin-top: 30px; }}
        h3 {{ color: #7f8c8d; }}
        p {{ margin: 15px 0; }}
        strong {{ color: #2c3e50; }}
    </style>
</head>
<body>
    <p>{html_content}</p>
</body>
</html>"""
    return html_template

# --- UI ---
st.title("⚖️ Legislative Analysis Tool")
st.markdown("synthesize legislative letters, analyze positions, and generate political artifacts.")

if not Path(METADATA_CSV).exists():
    st.warning("⚠️ Legislative Metadata CSV not found. Please sync your library to begin.")
else:
    # Load Data
    df = pd.read_csv(METADATA_CSV)
    
    # --- SIDEBAR FILTERS ---
    st.sidebar.header("🔍 Filter Archive")
    
    # 1. Bill Number Filter
    if 'Bill Number' in df.columns:
        bills = sorted([str(x) for x in df['Bill Number'].dropna().unique().tolist()])
        selected_bills = st.sidebar.multiselect("Filter by Bill Number", options=bills)
    else:
        selected_bills = []
        
    # 2. Position Filter
    if 'Position' in df.columns:
        positions = sorted([str(x) for x in df['Position'].dropna().unique().tolist()])
        selected_positions = st.sidebar.multiselect("Filter by Position", options=positions)
    else:
        selected_positions = []
        
    st.sidebar.divider()
    
    # 3. Stakeholder/Text Search
    search_query = st.sidebar.text_input("Search Stakeholders/Keywords", placeholder="e.g. Unions, Environment...")
    
    # Apply Filters
    mask = pd.Series([True] * len(df))
    
    if selected_bills:
        mask &= df['Bill Number'].astype(str).isin(selected_bills)
        
    if selected_positions:
        mask &= df['Position'].astype(str).isin(selected_positions)
        
    if search_query:
        # Search across multiple relevant columns
        q_mask = df['Document Title'].str.contains(search_query, case=False, na=False)
        for col in ['Sender/Organization', 'Stakeholders', 'Summary', 'Key Arguments', 'Keywords']:
            if col in df.columns:
                q_mask |= df[col].astype(str).str.contains(search_query, case=False, na=False)
        mask &= q_mask
        
    filtered_df = df[mask]
    
    # --- LIBRARY MANAGEMENT ---
    st.sidebar.header("📚 Library Management")
    
    # Create tabs for different ingestion methods
    tab_lib, tab_paste, tab_import = st.sidebar.tabs(["Upload", "Direct Input", "Import Folder"])
    
    with tab_lib:
        uploaded_files = st.file_uploader("Upload Legislative Docs (.txt, .pdf)", type=["txt", "pdf"], accept_multiple_files=True)
        if uploaded_files:
            if st.button("📂 Save Uploads"):
                for f in uploaded_files:
                    with open(TEXT_DIR / f.name, "wb") as dest:
                        dest.write(f.getbuffer())
                st.success(f"Saved {len(uploaded_files)} files.")
    
    with tab_paste:
        st.markdown("**Paste Text Directly**")
        paste_title = st.text_input("Document Title", placeholder="e.g. Letter from Chamber of Commerce")
        paste_content = st.text_area("Content", height=150, placeholder="Paste the full text of the letter here...")
        if st.button("💾 Save Text"):
            if paste_title and paste_content:
                safe_filename = re.sub(r'[^a-zA-Z0-9]', '_', paste_title) + ".txt"
                content_to_save = f"Title: {paste_title}\n--- BODY ---\n{paste_content}"
                with open(TEXT_DIR / safe_filename, "w", encoding="utf-8") as f:
                    f.write(content_to_save)
                st.success(f"Saved as `{safe_filename}`")
            else:
                st.warning("Please provide both a title and content.")

    with tab_import:
        st.markdown("**Copy from External Folder**")
        import_path = st.text_input("Folder Path", placeholder="/Volumes/MyDrive/Legislative/Letters")
        if st.button("📥 Import Files"):
            if import_path and Path(import_path).exists():
                src_path = Path(import_path)
                # Find all txt and pdfs
                files_found = list(src_path.glob("*.txt")) + list(src_path.glob("*.pdf"))
                if files_found:
                    count = 0
                    with st.status(f"Importing {len(files_found)} files...") as status:
                        for f in files_found:
                            dest_path = TEXT_DIR / f.name
                            # Simple copy
                            with open(f, "rb") as src, open(dest_path, "wb") as dst:
                                dst.write(src.read())
                            count += 1
                            status.update(label=f"Copied {f.name}")
                    st.success(f"Successfully imported {count} documents.")
                else:
                    st.warning("No .txt or .pdf files found in that folder.")
            else:
                st.error("Invalid path or directory does not exist.")

    if st.sidebar.button("🔄 Sync Metadata"):
        st.sidebar.info("Extracting legislative metadata...")
        process = subprocess.Popen([sys.executable, "Legislative_Analysis/extract_legislative_metadata.py"], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, cwd=str(Path(".").resolve()))
        st.sidebar.code(process.stdout.read())
        st.rerun()

    # --- MAIN CONTENT ---
    st.subheader(f"📂 Document Archive ({len(filtered_df)} found)")
    
    # Selection Interface
    all_titles = df['Document Title'].tolist()
    
    # Manual Selection
    if "selected_docs" not in st.session_state:
        st.session_state["selected_docs"] = []

    # Get previously selected valid titles
    default_selections = [t for t in st.session_state["selected_docs"] if t in all_titles]
    
    selected_titles = st.multiselect(
        "Select documents to analyze:",
        options=filtered_df['Document Title'].tolist(),
        default=default_selections,
        key="doc_selector"
    )
    st.session_state["selected_docs"] = selected_titles

    if selected_titles:
        selected_data = df[df['Document Title'].isin(selected_titles)].to_dict('records')
        
        with st.expander(f"👁️ View Details for {len(selected_titles)} Documents"):
            for d in selected_data:
                st.markdown(f"#### {d['Document Title']}")
                c1, c2 = st.columns(2)
                with c1:
                    st.write(f"**Sender:** {d.get('Sender/Organization', 'N/A')}")
                    st.write(f"**Position:** {d.get('Position', 'N/A')}")
                    st.write(f"**Bill:** {d.get('Bill Number', 'N/A')}")
                with c2:
                    st.write(f"**Stakeholders:** {d.get('Stakeholders', 'N/A')}")
                    st.write(f"**Arguments:** {d.get('Key Arguments', 'N/A')}")
                st.divider()

        st.divider()
        st.header("📝 Generate Legislative Artifact")
        
        c_art1, c_art2 = st.columns(2)
        with c_art1:
            artifact_type = st.selectbox(
                "Artifact Type", 
                ["Executive Summary", "Talking Points (Pro)", "Talking Points (Con)", "Vote Recommendation", "Coalition Letter", "Opposition Research"]
            )
        with c_art2:
            # Tone Selector
            if VOICE_PRESETS:
                preset_names = ["Custom"] + [p['name'] for p in VOICE_PRESETS]
                selected_preset = st.selectbox("Voice/Tone", preset_names)
                if selected_preset != "Custom":
                    preset = next(p for p in VOICE_PRESETS if p['name'] == selected_preset)
                    st.caption(f"*{preset['description']}*")
                    tone = preset['name']
                else:
                    tone = st.text_input("Custom Tone")
            else:
                tone = st.text_input("Tone", value="Professional and Objective")
        
        instructions = st.text_area("Additional Instructions", placeholder="e.g. Focus specifically on the fiscal impact...")

        if st.button("🚀 Generate Analysis", type="primary"):
            with st.spinner("Analyzing documents and generating artifact..."):
                result = generate_legislative_artifact(selected_data, artifact_type, tone, instructions)
                st.session_state["gen_result"] = result
                st.rerun()

    if "gen_result" in st.session_state:
        st.markdown("---")
        st.markdown("### 📄 Generated Artifact")
        st.markdown(f"<div class='result-box'>{st.session_state['gen_result']}</div>", unsafe_allow_html=True)
        
        c_dl1, c_dl2, c_dl3 = st.columns(3)
        with c_dl1:
            st.download_button("📥 Download Markdown", st.session_state["gen_result"], "analysis.md", mime="text/markdown")
        with c_dl2:
            html = export_as_html(st.session_state["gen_result"])
            st.download_button("🌐 Download HTML", html, "analysis.html", mime="text/html")
        with c_dl3:
            if st.button("💾 Save to Archive"):
                p = save_to_local(st.session_state["gen_result"])
                st.success(f"Saved: {p}")

st.markdown("---")
st.caption(f"Legislative Analysis Tool | Powered by {MODEL}")

# Footer
st.markdown("---")
st.caption(f"Powered by Ollama ({MODEL}) | Connected to: {METADATA_CSV}")
