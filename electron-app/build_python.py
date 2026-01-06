import PyInstaller.__main__
import os
import shutil
from pathlib import Path

# Define paths
ELECTRON_APP_DIR = Path(__file__).parent.resolve()
PROJECT_ROOT = ELECTRON_APP_DIR.parent
API_SCRIPT = ELECTRON_APP_DIR / "api" / "server_rag.py"
DIST_DIR = ELECTRON_APP_DIR / "dist-python"

# Clean previous build
if DIST_DIR.exists():
    shutil.rmtree(DIST_DIR)

# Ensure internal modules (rag, backend) are importable
# We add the PROJECT_ROOT to the path so that 'import legislative_backend' and 'from rag import ...' works
# However, PyInstaller needs to be told about these paths.

print("Building Python backend with PyInstaller...")

PyInstaller.__main__.run([
    str(API_SCRIPT),
    '--name=server_rag',
    '--distpath', str(DIST_DIR),
    '--workpath', str(ELECTRON_APP_DIR / "build" / "python-temp"),
    '--specpath', str(ELECTRON_APP_DIR / "build"),
    '--onefile',
    '--clean',
    '--paths', str(PROJECT_ROOT),  # Add project root to search path for modules
    
    # Hidden imports that might be missed by static analysis
    '--hidden-import=legislative_backend',
    '--hidden-import=rag',
    '--hidden-import=rag.indexer',
    '--hidden-import=rag.retriever',
    '--hidden-import=rag.chunker',
    '--hidden-import=rag.agent',
    '--hidden-import=tiktoken_ext.openai_public',
    '--hidden-import=tiktoken_ext',
    '--hidden-import=sklearn.utils._cython_blas',
    '--hidden-import=sklearn.neighbors.typedefs',
    '--hidden-import=sklearn.neighbors.quad_tree',
    '--hidden-import=sklearn.tree',
    '--hidden-import=sklearn.tree._utils',
    
    # Collect all data from 'rag' package if needed (though code is usually enough)
    # '--collect-all', 'rag',
    # Sentence transformers often needs data files
    '--collect-all', 'sentence_transformers',
])

print(f"Build complete. Executable is at: {DIST_DIR / 'server_rag'}")
