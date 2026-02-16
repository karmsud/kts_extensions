# KTS Extension Suite - Version 1.1.1

**Release Date:** February 16, 2026
**Total Size:** 252.68 MB

This folder contains 6 VS Code extensions for the GSF IR KTS Agentic System.

---

## Extensions Included

| Extension | File | Size | Purpose |
|-----------|------|------|---------|
| **gsf-ir-kts-extension** | [gsf-ir-kts-extension-1.1.1.vsix](gsf-ir-kts-extension-1.1.1.vsix) | 58.6 MB | Core extension (vector DB, embeddings, retrieval) |
| **kts-models-crossencoder** | [kts-models-crossencoder-0.1.2.vsix](kts-models-crossencoder-0.1.2.vsix) | 79.7 MB | Cross-encoder model (required for retrieval) |
| **kts-models-spacy** | [kts-models-spacy-0.1.2.vsix](kts-models-spacy-0.1.2.vsix) | 24.41 MB | spaCy language model (required for NLP) |
| **kts-processors-nlp** | [kts-processors-nlp-0.1.1.vsix](kts-processors-nlp-0.1.1.vsix) | 40.71 MB | NLP features (NER, keyphrase extraction) |
| **kts-processors-office** | [kts-processors-office-0.1.1.vsix](kts-processors-office-0.1.1.vsix) | 22.12 MB | Office document processing (DOCX, PPTX, PNG) |
| **kts-processors-pdf** | [kts-processors-pdf-0.1.1.vsix](kts-processors-pdf-0.1.1.vsix) | 27.14 MB | PDF document processing |

---

## Installation

### Option 1: Minimal (Retrieval Only)
Supports: txt, md, json, yaml, csv, html files

```powershell
code --install-extension gsf-ir-kts-extension-1.1.1.vsix
code --install-extension kts-models-crossencoder-0.1.0.vsix
```

**Total:** ~138 MB

### Option 2: Standard (All Document Types)
Supports: All minimal + DOCX, PPTX, PDF, PNG

```powershell
code --install-extension gsf-ir-kts-extension-1.1.1.vsix
code --install-extension kts-models-crossencoder-0.1.0.vsix
code --install-extension kts-processors-office-0.1.0.vsix
code --install-extension kts-processors-pdf-0.1.0.vsix
```

**Total:** ~188 MB

### Option 3: Full (All Features)
Supports: All standard + NER/keyphrase extraction

```powershell
code --install-extension gsf-ir-kts-extension-1.1.1.vsix
code --install-extension kts-models-crossencoder-0.1.0.vsix
code --install-extension kts-processors-office-0.1.0.vsix
code --install-extension kts-processors-pdf-0.1.0.vsix
code --install-extension kts-processors-nlp-0.1.0.vsix
code --install-extension kts-models-spacy-0.1.0.vsix
```

**Total:** ~241 MB

---

## Download Instructions

### Using Git
```bash
git clone https://github.com/karmsud/kts_extensions.git
cd kts_extensions/1.1.1
code --install-extension gsf-ir-kts-extension-1.1.1.vsix
# ... install other extensions as needed
```

### Manual Download
1. Click on each .vsix file above
2. Click 'Download' button
3. Install using VS Code:
   - Method 1: Drag .vsix file into VS Code
   - Method 2: Extensions view - more menu - 'Install from VSIX...'
   - Method 3: Command line: code --install-extension file.vsix

---

## Upgrading from Previous Version

1. Uninstall old versions from Extensions view
2. Reload VS Code window
3. Install new versions using commands above
4. Reload VS Code window again

---

## Release Notes

See [../../CHANGELOG.md](../../CHANGELOG.md) for detailed changes in this release.

---

## Issues and Support

Report issues at: https://github.com/karmsud/gsf_ir_kts_agentic_system/issues

---

**Built on:** 2026-02-16 15:11:55
