# KTS Extension Suite Distribution

This repository contains pre-built VS Code extensions for the GSF IR KTS Agentic System.

## Available Versions

- [**0.0.1**](0.0.1/) - Latest (February 16, 2026) - Full modular architecture with offline support

## Quick Start

```powershell
# Clone this repository
git clone https://github.com/karmsud/kts_extensions.git
cd kts_extensions/0.0.1

# Install minimal configuration (Core only)
code --install-extension gsf-ir-kts-extension-0.0.1.vsix

# Or install recommended configuration (Core + CrossEncoder)
code --install-extension gsf-ir-kts-extension-0.0.1.vsix
code --install-extension kts-models-crossencoder-0.0.1.vsix
```

See version-specific README for detailed installation instructions.

## Repository Structure

```
kts_extensions/
  0.0.1/              # Version 0.0.1 extensions (Latest)
    *.vsix            # Extension files (6 total, 252.68 MB)
    versions.json     # Manifest
  CHANGELOG.md        # Version history
  README.md           # This file
```

## Extension Architecture

The KTS suite uses a modular architecture:

- **Core**: Vector database, embeddings, retrieval engine
- **Processors**: Optional document processors (Office, PDF, NLP)
- **Models**: ML models for retrieval and NLP

Users can install only the components they need.

## Documentation

Full documentation: https://github.com/karmsud/gsf_ir_kts_agentic_system/tree/main/docs

## License

See LICENSE file in the main repository.

---

**Last Updated:** 2026-02-16
