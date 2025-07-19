all: build

clean:
	rm -rf dist node_modules rxing-wasm/{pkg,target}

format:
	rustfmt rxing-wasm/**/*.rs
	pnpm format

rxing-wasm:
	cd rxing-wasm && wasm-pack build --release

install: rxing-wasm
	pnpm install

build: rxing-wasm
	pnpm build

.PHONY: rxing-wasm
