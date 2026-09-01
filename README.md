# 📋 Insti Attend

[![CI](https://img.shields.io/github/actions/workflow/status/arghyadipchak/insti-attend/ci.yml?logo=github-actions&logoColor=white)](https://github.com/arghyadipchak/insti-attend/actions/workflows/ci.yml)
[![GitHub Release](https://img.shields.io/github/v/release/arghyadipchak/insti-attend?logo=github&logoColor=white&color=0969da)](https://github.com/arghyadipchak/insti-attend/releases/latest)
[![Svelte 5](https://img.shields.io/badge/Svelte-v5-ff3e00?logo=svelte&logoColor=white)](https://svelte.dev/)
[![Rust WebAssembly](https://img.shields.io/badge/Rust-WASM-654ff0?logo=webassembly&logoColor=white)](https://webassembly.org/)
[![Commitizen Friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen?logo=git&logoColor=white)](https://commitizen.github.io/cz-cli/)
[![License](https://img.shields.io/github/license/arghyadipchak/insti-attend?color=8250df)](LICENSE)

A high-performance, privacy-first attendance recording web application built for **[IIT Bombay](https://www.cse.iitb.ac.in)** powered by real-time barcode scanning in Rust WebAssembly

🌐 **Live Application**: [iattend.arghyac.com](https://iattend.arghyac.com)

---

## ✨ Highlights & Features

- ⚡ **High-Speed Barcode Scanning**: Powered by a custom Rust WebAssembly module ([`rxing-wasm`](rxing-wasm/)) for instant, client-side barcode decoding directly from your camera stream
- 📝 **Attendance & Comment Logging**: Automatically record scanned roll numbers, add custom notes/comments per entry, and handle entry overwriting
- 🔍 **Smart Roll Number Filtering**: Filter scanned barcodes dynamically using custom regex patterns, allowlists, and blocklists
- 📡 **Webhook Integration**: Push attendance records in real time to your custom API or backend webhook endpoint
- 📊 **Export Options**: Export attendance datasets to **CSV** or **JSON** with a single click
- ⚙️ **Camera & Scanner Controls**: Fine-tune camera input selection, scanner frame rate (FPS), autofocus, and dark/light UI themes
- 🔒 **100% Client-Side Processing**: No image data leaves your device—all barcode processing happens locally inside WASM in your browser

---

## 🛠️ Tech Stack

| Layer                    | Technologies                                                                                |
| :----------------------- | :------------------------------------------------------------------------------------------ |
| **Frontend Framework**   | [Svelte 5](https://svelte.dev), TypeScript                                                  |
| **Build Tool & Bundler** | [Vite 8](https://vite.dev/)                                                                 |
| **Styling & UI**         | [Tailwind CSS v4](https://tailwindcss.com/), [DaisyUI 5](https://daisyui.com/)              |
| **Barcode Engine**       | Rust [`rxing`](https://crates.io/crates/rxing) crate compiled to WebAssembly (`rxing-wasm`) |
| **Package Manager**      | [pnpm](https://pnpm.io/)                                                                    |
| **Container & Proxy**    | Docker, Nginx Alpine                                                                        |
| **CI/CD & Hosting**      | GitHub Actions, Cloudflare Pages                                                            |

---

## 🚀 Deployment

### Pre-built Release Archive (No Node.js / Rust Required)

Download and serve pre-compiled production web assets (`.tar.gz` or `.zip`) directly from [GitHub Releases](https://github.com/arghyadipchak/insti-attend/releases):

```bash
# 1. Download release archive
VERSION="v0.1.0"
curl -LO "https://github.com/arghyadipchak/insti-attend/releases/download/${VERSION}/insti-attend-${VERSION}.tar.gz"

# 2. Extract into dist folder
mkdir -p dist
tar -xzf "insti-attend-${VERSION}.tar.gz" -C dist/

# 3. Serve static bundle with any web server (Python, Node, Caddy, etc.)
python3 -m http.server 8080 -d dist/
# or: npx serve dist/
# or: caddy file-server --root dist/ --listen :8080
```

Access the application at `http://localhost:8080`

### Docker Container

Build and run using the optimized multi-stage Docker container:

```bash
# 1. Clone the repository
git clone https://github.com/arghyadipchak/insti-attend.git
cd insti-attend

# 2. Build Docker image
docker build -t insti-attend:latest .

# 3. Run container on port 8080
docker run -d -p 8080:80 --name insti-attend insti-attend:latest
```

Access the application at `http://localhost:8080`

---

## 💻 Local Development

### Prerequisites

- [Node.js](https://nodejs.org/) (v20+)
- [pnpm](https://pnpm.io/) (v9+)
- [Rust & Cargo](https://www.rust-lang.org/tools/install)
- [wasm-pack](https://rustwasm.github.io/wasm-pack/installer/)

### Setup Instructions

1. **Clone the Repository**:

   ```bash
   git clone https://github.com/arghyadipchak/insti-attend.git
   cd insti-attend
   ```

2. **Install Dependencies** (Automatically builds `rxing-wasm` via `preinstall`):

   ```bash
   pnpm install
   ```

3. **Start Development Server**:

   ```bash
   pnpm dev
   ```

   Open `http://localhost:5173` in your web browser

---

## 📜 Available Scripts

| Script              | Description                                                             |
| :------------------ | :---------------------------------------------------------------------- |
| `pnpm install`      | Installs Node dependencies and builds `rxing-wasm` WebAssembly package  |
| `pnpm dev`          | Starts Vite local development server with hot module replacement        |
| `pnpm build`        | Compiles the production web bundle into `dist/`                         |
| `pnpm build:wasm`   | Compiles `rxing-wasm` WebAssembly package directly via `wasm-pack`      |
| `pnpm preview`      | Previews the local production build                                     |
| `pnpm check`        | Runs Svelte type-checking (`svelte-check`)                              |
| `pnpm lint`         | Runs all lint and type checks (`svelte-check` and `markdownlint-cli2`)  |
| `pnpm lint:md`      | Checks Markdown files for style and lint violations                     |
| `pnpm format`       | Formats the entire codebase using Prettier, markdownlint, and `rustfmt` |
| `pnpm format:check` | Checks code formatting without writing files                            |
| `pnpm format:md`    | Formats and auto-fixes Markdown files with Prettier and markdownlint    |

---

## 📄 License

This project is licensed under the **GNU Affero General Public License v3.0** ([AGPL-3.0](LICENSE))
