# KTS Extensions Repository

**Download location for GSF IR KTS Agentic System extensions**

## Current Version: 0.0.1

Released: 2026-02-16

---

## ?? Available Extensions

### Installation Order

Install extensions in this order for full functionality:

1. **Core** (REQUIRED)
   - \gsf-ir-kts-extension-0.0.1.vsix\
   - Size: 237.78 MB
   - Provides: Vector DB, embeddings, base converters (HTML, JSON, YAML, CSV)
   - Works offline - no internet required

2. **Office Processor** (Optional - for DOCX/PPTX)
   - \kts-processors-office-0.0.1.vsix\
   - Size: 22.12 MB
   - Enables: .docx, .pptx file processing

3. **PDF Processor** (Optional - for PDF)
   - \kts-processors-pdf-0.0.1.vsix\
   - Size: 27.14 MB
   - Enables: .pdf file processing

4. **NLP Processor** (Optional - for Named Entity Recognition)
   - \kts-processors-nlp-0.0.1.vsix\
   - Size: 40.71 MB
   - Requires: spaCy Models extension (below)
   - Enables: Entity extraction, keyphrase extraction

5. **spaCy Models** (Required if using NLP Processor)
   - \kts-models-spacy-0.0.1.vsix\
   - Size: 24.41 MB
   - Provides: en_core_web_sm language model

6. **CrossEncoder Models** (Optional - for high-precision ranking)
   - \kts-models-crossencoder-0.0.1.vsix\
   - Size: 79.7 MB
   - Provides: ONNX re-ranker for improved search accuracy

---

## ?? Installation

### From VS Code

1. Open VS Code
2. Press \Ctrl+Shift+P\
3. Type "Extensions: Install from VSIX"
4. Select the VSIX file
5. Restart VS Code
6. Repeat for each extension you want

### From Command Line

\\\ash
# Install all extensions
code --install-extension 0.0.1/gsf-ir-kts-extension-0.0.1.vsix
code --install-extension 0.0.1/kts-processors-office-0.0.1.vsix
code --install-extension 0.0.1/kts-processors-pdf-0.0.1.vsix
code --install-extension 0.0.1/kts-processors-nlp-0.0.1.vsix
code --install-extension 0.0.1/kts-models-spacy-0.0.1.vsix
code --install-extension 0.0.1/kts-models-crossencoder-0.0.1.vsix
\\\

---

## ?? Feature Combinations

### Minimal (Core + CrossEncoder)
- Size: ~68 MB
- File types: .txt, .md, .json, .yaml, .csv, .html
- Features: Semantic search, re-ranking

### Standard (+ Office + PDF)
- Size: ~145 MB
- File types: + .docx, .pptx, .pdf
- Features: Full document processing

### Complete (All 6)
- Size: ~230 MB
- File types: All supported
- Features: + Named Entity Recognition, keyphrase extraction

---

## ?? Release Notes

### Version 0.0.1 (2026-02-16)

- ? Modular architecture - install only what you need
- ? Full offline support - ChromaDB model bundled
- ? No runtime errors - all dependencies validated
- ? Size optimized - all extensions < 100MB
- ? Processor isolation - no dependency conflicts

---

## ?? System Requirements

- VS Code 1.95.0 or later
- Windows 10/11 (x64)
- No Python installation required
- No internet required (after installation)

---

## ?? Documentation

- [User Guide](https://github.com/karmsud/gsf_ir_kts_agentic_system/docs/USER_GUIDE.md)
- [Architecture](https://github.com/karmsud/gsf_ir_kts_agentic_system/docs/ARCHITECTURE.md)
- [Configuration](https://github.com/karmsud/gsf_ir_kts_agentic_system/docs/CONFIGURATION.md)

---

## ?? Issues & Support

Report issues at: https://github.com/karmsud/gsf_ir_kts_agentic_system/issues

---

**Note:** All extensions are self-contained. No additional Python or Node.js installations required.
