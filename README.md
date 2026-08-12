# Insti Attend

[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![Svelte](https://img.shields.io/badge/Svelte-v5-orange.svg)](https://svelte.dev/)
[![Rust](https://img.shields.io/badge/Rust-WASM-blue.svg)](https://www.rust-lang.org/)
[![License](https://img.shields.io/badge/license-AGPLv3-blue.svg)](LICENSE)

An attendance recording application built for **[IIT Bombay](https://www.cse.iitb.ac.in)** using camera barcode scanning.

🌐 **Live App**: [iattend.arghyac.com](https://iattend.arghyac.com)

---

## ✨ Features

- **Barcode Scanning**: Camera barcode scanning powered by a Rust WebAssembly module (`rxing-wasm`)
- **Attendance Logging**: Log roll numbers automatically via camera scan or manually with comments
- **Webhook Integration**: Push attendance data to a custom webhook
- **Data Export**: Export attendance entries as CSV or JSON
- **Roll Number Filtering**: Filter scanned roll numbers using regex patterns, allowlists, and blocklists
- **Camera & App Settings**: Configure camera inputs, scanner FPS, autofocus, entry overwriting, and UI theme

---

## 🛠️ Tech Stack

- **Frontend**: [Svelte 5](https://svelte.dev), TypeScript, [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/), [DaisyUI](https://daisyui.com/)
- **Barcode Engine**: Rust [`rxing`](https://crates.io/crates/rxing) crate compiled to WebAssembly (`rxing-wasm`)
- **Deployment**: `pnpm`, Docker (Nginx Alpine)

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v20+)
- [pnpm](https://pnpm.io/) (v9+)
- [Rust & Cargo](https://www.rust-lang.org/tools/install)
- [wasm-pack](https://rustwasm.github.io/wasm-pack/installer/)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/arghyadipchak/insti-attend.git
   cd insti-attend
   ```

2. **Install dependencies** (automatically builds `rxing-wasm` via `preinstall`):
   ```bash
   pnpm install
   ```

3. **Start the development server**:
   ```bash
   pnpm dev
   ```
   Open `http://localhost:5173` in your browser

---

## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `pnpm install` | Builds `rxing-wasm` via `preinstall` hook and installs dependencies |
| `pnpm dev` | Starts Vite local development server |
| `pnpm build` | Builds the Vite production bundle in `dist/` |
| `pnpm preview` | Previews the production build locally |
| `pnpm format` | Formats code with Prettier and `rustfmt` |
| `pnpm check` | Runs Svelte type checking (`svelte-check`) |

---

## 🐳 Docker Deployment

Build and run with Docker:

```bash
docker build -t insti-attend .
docker run -d -p 8080:80 --name insti-attend insti-attend
```

Access the app at `http://localhost:8080`

---

## 📖 Usage

1. **Scan**: Point camera at student ID barcodes to record attendance
2. **Manage**: Edit comments or remove selected roll numbers
3. **Webhook**: Push attendance data to a configured webhook endpoint
4. **Export**: Download attendance records as CSV or JSON

---

## 📄 License

Distributed under the GNU AGPLv3 License (see [LICENSE](LICENSE))
