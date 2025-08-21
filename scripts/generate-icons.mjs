import sharp from 'sharp';
import { readFile } from 'fs/promises';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const svgPath = resolve(__dirname, '..', 'icons', 'icon.svg');
const outDir = resolve(__dirname, '..', 'icons');

const sizes = [16, 48, 128];

async function generate() {
	try {
		const svg = await readFile(svgPath);
		for (const size of sizes) {
			const outPath = resolve(outDir, `icon${size}.png`);
			await sharp(svg, { density: size * 8 })
				.resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } })
				.png({ compressionLevel: 9, adaptiveFiltering: true })
				.toFile(outPath);
			console.log(`Generated ${outPath}`);
		}
		console.log('All icons generated successfully.');
	} catch (err) {
		console.error('Failed to generate icons:', err);
		process.exit(1);
	}
}

generate(); 