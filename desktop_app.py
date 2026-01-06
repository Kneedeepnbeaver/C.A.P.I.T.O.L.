import flet as ft
import csv
import pandas as pd
import shutil
import datetime
from pathlib import Path
import sys
import os

# Add parent dir to path so we can import backend
sys.path.append(str(Path(__file__).parent.parent))
from Legislative_Analysis import legislative_backend as backend

def main(page: ft.Page):
    page.title = "Legislative Analysis Tool"
    page.theme_mode = ft.ThemeMode.DARK
    page.padding = 20
    page.window_width = 1200
    page.window_height = 800

    # --- STATE ---
    selected_docs_hashes = set() # Track selected files

    # --- UI COMPONENTS ---
    
    # 1. Library View
    
    # Search and File Management
    search_box = ft.TextField(label="Search documents...", expand=True, prefix_icon=ft.Icons.SEARCH)
    
    def open_library_folder(e):
        path = backend.TEXT_DIR.resolve()
        try:
            if sys.platform == "darwin":
                subprocess.run(["open", str(path)])
            elif sys.platform == "win32":
                os.startfile(path)
            else:
                subprocess.run(["xdg-open", str(path)])
        except Exception as ex:
             page.snack_bar = ft.SnackBar(ft.Text(f"Could not open folder: {ex}"))
             page.snack_bar.open = True
             page.update()

    open_lib_btn = ft.IconButton(icon=ft.Icons.FOLDER_OPEN, tooltip="Open Documents Folder", on_click=open_library_folder)

    library_data_table = ft.DataTable(
        columns=[
            ft.DataColumn(ft.Text("Select")),
            ft.DataColumn(ft.Text("Title")),
            ft.DataColumn(ft.Text("Position")),
            ft.DataColumn(ft.Text("Bill")),
            ft.DataColumn(ft.Text("Sender")),
        ],
        rows=[],
        border=ft.Border.all(1, "outline"),
        vertical_lines=ft.border.BorderSide(1, "outline"),
        horizontal_lines=ft.border.BorderSide(1, "outline"),
    )

    def load_library(e=None):
        query = search_box.value.lower() if search_box.value else ""
        
        library_data_table.rows.clear()
        if backend.METADATA_CSV.exists():
            try:
                # Read CSV manual to avoid pandas dep if needed, but we have pandas
                df = pd.read_csv(backend.METADATA_CSV)
                for index, row in df.iterrows():
                    # Filter logic
                    title = str(row['Document Title']).lower()
                    sender = str(row['Sender/Organization']).lower()
                    bill = str(row['Bill Number']).lower()
                    
                    if query and (query not in title and query not in sender and query not in bill):
                        continue
                        
                    is_selected = row['Filename'] in selected_docs_hashes
                    
                    def on_select(e, filename=row['Filename']):
                        if e.control.value:
                            selected_docs_hashes.add(filename)
                        else:
                            selected_docs_hashes.discard(filename)
                    
                    library_data_table.rows.append(
                        ft.DataRow(
                            cells=[
                                ft.DataCell(ft.Checkbox(value=is_selected, on_change=on_select)),
                                ft.DataCell(ft.Text(str(row['Document Title'])[:50])),
                                ft.DataCell(ft.Text(str(row['Position']))),
                                ft.DataCell(ft.Text(str(row['Bill Number']))),
                                ft.DataCell(ft.Text(str(row['Sender/Organization'])[:30])),
                            ],
                        )
                    )
            except Exception as e:
                page.snack_bar = ft.SnackBar(ft.Text(f"Error loading library: {e}"))
                page.snack_bar.open = True
        page.update()

    search_box.on_change = load_library # Bind search to load

    import threading

    def sync_metadata(e):
        def run_sync_thread():
            progress_ring.visible = True
            page.update()
            
            script_path = Path("Legislative_Analysis/extract_legislative_metadata.py")
            try:
                # Capture output to show logs? For now just check=True
                subprocess.run([sys.executable, str(script_path)], cwd=str(Path(".").resolve()), check=True)
                page.snack_bar = ft.SnackBar(ft.Text("Sync complete! Refreshed library."))
                page.snack_bar.open = True
                load_library()
            except Exception as ex:
                page.snack_bar = ft.SnackBar(ft.Text(f"Sync failed: {ex}"))
                page.snack_bar.open = True
            
            progress_ring.visible = False
            page.update()

        threading.Thread(target=run_sync_thread, daemon=True).start()

    refresh_btn = ft.FilledButton("Sync Metadata", icon=ft.Icons.REFRESH, on_click=sync_metadata)
    progress_ring = ft.ProgressRing(visible=False, width=20, height=20)
    
    library_tab = ft.Column([
        ft.Row([
            ft.Text("Document Library", size=20, weight=ft.FontWeight.BOLD), 
            refresh_btn, 
            progress_ring,
            ft.Container(expand=True), # Spacer
            open_lib_btn
        ]),
        ft.Row([search_box]),
        ft.Divider(),
        ft.ListView(expand=1, spacing=10, padding=20, controls=[library_data_table]),
    ], expand=True)

    # 2. Analysis View
    artifact_dropdown = ft.Dropdown(
        label="Artifact Type",
        options=[
            ft.dropdown.Option("Executive Summary"),
            ft.dropdown.Option("Talking Points (Pro)"),
            ft.dropdown.Option("Talking Points (Con)"),
            ft.dropdown.Option("Vote Recommendation"),
            ft.dropdown.Option("Coalition Letter"),
            ft.dropdown.Option("Opposition Research"),
        ],
        width=300
    )
    
    tone_input = ft.TextField(label="Tone/Voice", value="Professional", width=300)
    instructions_input = ft.TextField(label="Additional Instructions", multiline=True, min_lines=3)
    result_markdown = ft.Markdown(selectable=True, extension_set=ft.MarkdownExtensionSet.GITHUB_WEB)
    
    # Export Controls
    format_dropdown = ft.Dropdown(
        label="Export Format",
        options=[
            ft.dropdown.Option("Markdown"),
            ft.dropdown.Option("HTML"),
            ft.dropdown.Option("DOCX"),
            ft.dropdown.Option("TXT"),
        ],
        value="Markdown",
        width=150
    )
    
    style_dropdown = ft.Dropdown(
        label="Style Style",
        options=[
            ft.dropdown.Option("Professional"),
            ft.dropdown.Option("Academic"),
            ft.dropdown.Option("Draft"),
        ],
        value="Professional",
        width=150
    )

    def generate_analysis(e):
        if not selected_docs_hashes:
            page.snack_bar = ft.SnackBar(ft.Text("Please select at least one document in the Library tab."))
            page.snack_bar.open = True
            page.update()
            return
            
        loading_bar.visible = True
        page.update()
        
        # Get selected rows data
        df = pd.read_csv(backend.METADATA_CSV)
        selected_data = df[df['Filename'].isin(selected_docs_hashes)].to_dict('records')
        
        # Call backend
        result = backend.generate_legislative_artifact(
            selected_data, 
            artifact_dropdown.value, 
            tone_input.value, 
            instructions_input.value
        )
        
        result_markdown.value = result
        loading_bar.visible = False
        page.update()

    def save_result(e):
        content = result_markdown.value
        if not content:
            page.snack_bar = ft.SnackBar(ft.Text("No content to save. Generate artifact first."))
            page.snack_bar.open = True
            page.update()
            return
            
        path = backend.export_to_file(
            content, 
            format_dropdown.value, 
            style_dropdown.value, 
            "legislative_analysis"
        )
        
        if path:
            page.snack_bar = ft.SnackBar(ft.Text(f"Saved to: {Path(path).name}"))
            # Button to open file?
            # We can just show snackbar
        else:
             page.snack_bar = ft.SnackBar(ft.Text("Error saving file."))
        
        page.snack_bar.open = True
        page.update()

    def open_results_folder(e):
        path = backend.OUTPUT_DIR.resolve()
        try:
            if sys.platform == "darwin":
                subprocess.run(["open", str(path)])
            elif sys.platform == "win32":
                os.startfile(path)
            else:
                subprocess.run(["xdg-open", str(path)])
        except Exception as ex:
             page.snack_bar = ft.SnackBar(ft.Text(f"Could not open folder: {ex}"))
             page.snack_bar.open = True
             page.update()

    generate_btn = ft.FilledButton("Generate Artifact", icon=ft.Icons.AUTO_AWESOME, on_click=generate_analysis)
    save_btn = ft.FilledButton("Save Result", icon=ft.Icons.SAVE, on_click=save_result)
    open_results_btn = ft.IconButton(icon=ft.Icons.FOLDER_OPEN, tooltip="Open Results Folder", on_click=open_results_folder)
    
    loading_bar = ft.ProgressBar(visible=False)

    analysis_tab = ft.Row([
        ft.Column([
            ft.Text("Configuration", size=20, weight=ft.FontWeight.BOLD),
            artifact_dropdown,
            tone_input,
            instructions_input,
            generate_btn,
            ft.Divider(),
            ft.Text("Export", size=16, weight=ft.FontWeight.BOLD),
            ft.Row([format_dropdown, style_dropdown]),
            ft.Row([save_btn, open_results_btn]),
            loading_bar
        ], width=350, scroll=ft.ScrollMode.AUTO),
        ft.VerticalDivider(),
        ft.Column([
            ft.Text("Result", size=20, weight=ft.FontWeight.BOLD),
            ft.Container(
                content=ft.Column([result_markdown], scroll=ft.ScrollMode.AUTO),
                expand=True,
                bgcolor="surfaceVariant",
                border_radius=10,
                padding=20,
            )
        ], expand=True)
    ], expand=True)

    # 3. Import View
    
    # Ingestion Logic
    def log_import(msg):
        page.snack_bar = ft.SnackBar(ft.Text(msg))
        page.snack_bar.open = True
        page.update()

    def run_auto_sync():
        log_import("Import successful. Syncing metadata...")
        sync_metadata(None)

    def process_import_path(path_val):
        if not path_val:
            return

        # Clean path (remove quotes if user pasted them)
        clean_path = path_val.strip().strip('"').strip("'")
        source_path = Path(clean_path)
        
        if not source_path.exists():
            log_import(f"Path not found: {clean_path}")
            return

        count = 0
        
        # Case 1: Single File
        if source_path.is_file():
            if source_path.suffix.lower() in [".txt", ".pdf"]:
                try:
                    shutil.copy(source_path, backend.TEXT_DIR / source_path.name)
                    count = 1
                except Exception as ex:
                    print(f"Error copying {source_path.name}: {ex}")
            else:
                log_import("Selected file must be .txt or .pdf")
                return

        # Case 2: Directory
        elif source_path.is_dir():
            for item in source_path.glob("*"):
                if item.suffix.lower() in [".txt", ".pdf"]:
                    try:
                        shutil.copy(item, backend.TEXT_DIR / item.name)
                        count += 1
                    except Exception as ex:
                        print(f"Error copying {item.name}: {ex}")
        
        if count > 0:
            run_auto_sync()
        else:
            log_import("No .txt or .pdf files imported.")

    def process_file_import(e: ft.FilePickerResultEvent):
        if not e.files:
            return
            
        count = 0
        for f in e.files:
            item = Path(f.path)
            try:
                shutil.copy(item, backend.TEXT_DIR / item.name)
                count += 1
            except Exception as ex:
                print(f"Error copying {item.name}: {ex}")
        
        if count > 0:
            run_auto_sync()

    def save_direct_paste(e):
        if not paste_content.value:
            log_import("Please provide content to save.")
            return
            
        title = paste_title.value.strip() or "Untitled_Paste"
        # Sanitize filename
        safe_title = "".join([c for c in title if c.isalpha() or c.isdigit() or c==' ']).rstrip().replace(' ', '_')
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{safe_title}_{timestamp}.txt"
        
        try:
            with open(backend.TEXT_DIR / filename, "w", encoding="utf-8") as f:
                f.write(paste_content.value)
            
            paste_content.value = ""
            paste_title.value = ""
            run_auto_sync()
        except Exception as ex:
            log_import(f"Error saving paste: {ex}")

    # File Pickers - DISABLED due to Flet "Unknown Control" error on user's system
    # folder_picker = ft.FilePicker()
    # folder_picker.on_result = process_folder_import
    # file_picker = ft.FilePicker()
    # file_picker.on_result = process_file_import
    # page.overlay.extend([folder_picker, file_picker])

    # UI Elements
    import_path_input = ft.TextField(label="File or Folder Path (Paste Here)", expand=True)
    paste_title = ft.TextField(label="Document Title (Optional)", width=400)
    paste_content = ft.TextField(label="Paste Text Here", multiline=True, min_lines=10, expand=True)
    
    def manual_import(e):
        path_str = import_path_input.value
        if not path_str:
            log_import("Please enter a path.")
            return
        process_import_path(path_str)

    import_tab = ft.Column([
        ft.Text("Import Documents", size=20, weight=ft.FontWeight.BOLD),
        ft.Text("Add legislative letters or transcripts to your library."),
        ft.Divider(),
        
        ft.Text("Option 1: Import from Disk", weight=ft.FontWeight.BOLD),
        ft.Text("Paste the full path to a .pdf/.txt file or a folder containing them:"),
        ft.Row([
            import_path_input,
            ft.FilledButton("Import", icon=ft.Icons.DRIVE_FOLDER_UPLOAD, on_click=manual_import)
        ]),
        
        ft.Divider(),
        
        ft.Text("Option 2: Direct Input", weight=ft.FontWeight.BOLD),
        paste_title,
        paste_content,
        ft.FilledButton("Save & Sync", icon=ft.Icons.SAVE, on_click=save_direct_paste),
    ], expand=True, scroll=ft.ScrollMode.AUTO)

    # 4. Settings View
    theme_dropdown = ft.Dropdown(
        label="Theme",
        options=[
            ft.dropdown.Option("Dark"),
            ft.dropdown.Option("Light"),
            ft.dropdown.Option("High Contrast Dark"),
            ft.dropdown.Option("High Contrast Light"),
        ],
        value="Dark",
        width=300
    )

    def change_theme(e):
        val = theme_dropdown.value
        print(f"DEBUG: Changing theme to {val}")
        if val == "Dark":
            page.theme_mode = ft.ThemeMode.DARK
            page.theme = None
        elif val == "Light":
            page.theme_mode = ft.ThemeMode.LIGHT
            page.theme = None
        elif val == "High Contrast Dark":
            page.theme_mode = ft.ThemeMode.DARK
            page.theme = ft.Theme(
                color_scheme=ft.ColorScheme(
                    primary="yellow",
                    on_primary="black",
                    surface="black",
                    on_surface="white",
                    background="black",
                    on_background="white",
                )
            )
        elif val == "High Contrast Light":
            page.theme_mode = ft.ThemeMode.LIGHT
            page.theme = ft.Theme(
                color_scheme=ft.ColorScheme(
                    primary="blue",
                    on_primary="white",
                    surface="white",
                    on_surface="black",
                    background="white",
                    on_background="black",
                )
            )
        page.update()
        print(f"DEBUG: Page updated. Mode: {page.theme_mode}")

    theme_dropdown.on_change = change_theme
    
    settings_tab = ft.Column([
        ft.Text("Settings", size=20, weight=ft.FontWeight.BOLD),
        ft.Divider(),
        ft.Text("Appearance", size=16),
        theme_dropdown,
    ])

    # --- LAYOUT ---
    
    # Define views list for easy access
    views = [library_tab, analysis_tab, import_tab, settings_tab]
    
    # Container to hold the current view
    body = ft.Container(content=library_tab, expand=True)

    def switch_tab(idx):
        body.content = views[idx]
        body.update()

    rail = ft.NavigationRail(
        selected_index=0,
        label_type=ft.NavigationRailLabelType.ALL,
        min_width=100,
        min_extended_width=400,
        group_alignment=-0.9,
        destinations=[
            ft.NavigationRailDestination(
                icon=ft.Icons.LIBRARY_BOOKS, selected_icon=ft.Icons.LIBRARY_BOOKS_OUTLINED, label="Library"
            ),
            ft.NavigationRailDestination(
                icon=ft.Icons.ANALYTICS, selected_icon=ft.Icons.ANALYTICS_OUTLINED, label="Analysis"
            ),
            ft.NavigationRailDestination(
                icon=ft.Icons.UPLOAD_FILE, selected_icon=ft.Icons.UPLOAD_FILE_OUTLINED, label="Import"
            ),
            ft.NavigationRailDestination(
                icon=ft.Icons.SETTINGS, selected_icon=ft.Icons.SETTINGS_OUTLINED, label="Settings"
            ),
        ],
        on_change=lambda e: switch_tab(e.control.selected_index),
    )

    page.add(
        ft.Row(
            [
                rail,
                ft.VerticalDivider(width=1),
                body
            ],
            expand=True,
        )
    )
    
    # Load initial data
    load_library()

if __name__ == "__main__":
    ft.app(main)
