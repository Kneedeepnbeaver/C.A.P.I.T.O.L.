import PyInstaller.__main__
import os
import shutil
from pathlib import Path

# Define paths
ELECTRON_APP_DIR = Path(__file__).parent.resolve()
PROJECT_ROOT = ELECTRON_APP_DIR.parent
API_SCRIPT = ELECTRON_APP_DIR / "api" / "server_rag.py"
DIST_DIR = ELECTRON_APP_DIR / "dist-python"
RAG_DIR = PROJECT_ROOT / "rag"
BACKEND_CORE_DIR = PROJECT_ROOT / "backend_core"

# Clean previous build
if DIST_DIR.exists():
    shutil.rmtree(DIST_DIR)

# Ensure internal modules (rag, backend) are importable
# We add the PROJECT_ROOT to the path so that 'import legislative_backend' and 'from rag import ...' works
# However, PyInstaller needs to be told about these paths.

print("Building Python backend with PyInstaller...")
print(f"Project root: {PROJECT_ROOT}")
print(f"RAG dir exists: {RAG_DIR.exists()}")
print(f"Backend core dir exists: {BACKEND_CORE_DIR.exists()}")

# Verify that rag package can be imported before building
# This ensures PyInstaller can find it during analysis
import sys
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

try:
    import rag
    print(f"✅ Successfully imported rag package from: {rag.__file__ if hasattr(rag, '__file__') else 'unknown'}")
except ImportError as e:
    print(f"⚠️  WARNING: Could not import rag package: {e}")
    print(f"   This might cause PyInstaller to fail to include it")
    print(f"   Make sure the rag directory exists at: {RAG_DIR}")
else:
    # Test importing submodules too
    try:
        from rag import LegislativeChunker, DocumentIndexer, HybridRetriever, LegislativeRAGAgent
        print("✅ Successfully imported all RAG components")
    except ImportError as e:
        print(f"⚠️  WARNING: Could not import some RAG components: {e}")

# Build arguments
build_args = [
    str(API_SCRIPT),
    '--name=server_rag',
    '--distpath', str(DIST_DIR),
    '--workpath', str(ELECTRON_APP_DIR / "build" / "python-temp"),
    '--specpath', str(ELECTRON_APP_DIR / "build"),
    '--onefile',
    '--clean',
    '--paths', str(PROJECT_ROOT),  # Add project root to search path for modules
    
    # Hidden imports - ensure all modules are included
    '--hidden-import=backend_core',
    '--hidden-import=backend_core.__init__',
    '--hidden-import=backend_core.config',
    '--hidden-import=backend_core.extractor',
    '--hidden-import=backend_core.normalizer',
    '--hidden-import=rag',
    '--hidden-import=rag.__init__',
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
    
    # Collect all data from packages that need it
    '--collect-all', 'sentence_transformers',
    '--collect-all', 'tiktoken',
    '--collect-all', 'pandas',
    '--collect-all', 'chromadb',  # Just in case future updates use it
]

print("Running PyInstaller with args:")
print(" ".join(build_args))
print(f"RAG directory exists: {RAG_DIR.exists()}")
if RAG_DIR.exists():
    print(f"RAG __init__.py exists: {(RAG_DIR / '__init__.py').exists()}")

PyInstaller.__main__.run(build_args)

print(f"Build complete. Executable is at: {DIST_DIR / 'server_rag'}")
