# Contributing to agentvisa-fastapi

Thank you for your interest in contributing to the AgentVisa FastAPI middleware!

## How to Contribute

1. **Fork** the repository and clone it locally.
2. Create a virtual environment and install dependencies:
   ```bash
   python -m venv .venv
   source .venv/bin/activate
   pip install -e ".[dev]"
   ```
3. Create a feature branch: `git checkout -b feature/your-feature-name`
4. Make your changes.
5. Run the tests:
   ```bash
   pytest
   ```
6. Submit a **Pull Request** with a clear description of the change.

## Code Guidelines

- Keep the package dependency-free beyond `fastapi`, `httpx`, and `starlette`.
- `AgentVisaConfig.api_key` must never be logged or appear in error messages.
- `get_agentvisa` must never raise — soft failures return `AgentVisaResult.error()`.
- `require_agentvisa` must raise `HTTP 401` with `X-AgentVisa-Required` header on failure.
- Update `README.md` when changing the public API.
- All contributions must be licensed under the MIT License.

## Reporting Issues

Please open an issue on GitHub with:
- A description of the problem
- Your Python and FastAPI versions
- A minimal reproducer if possible

Thank you for helping improve AgentVisa!
