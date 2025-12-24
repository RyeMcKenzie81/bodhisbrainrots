import { Jimp } from "jimp";

async function process(filename, outSheet, outFront, outBack) {
    console.log(`Reading ${filename}...`);
    const image = await Jimp.read(filename);

    // Replace magenta with transparent
    const width = image.bitmap.width;
    const height = image.bitmap.height;

    console.log(`Dimensions: ${width}x${height}`);

    image.scan(0, 0, width, height, function (x, y, idx) {
        const r = this.bitmap.data[idx + 0];
        const g = this.bitmap.data[idx + 1];
        const b = this.bitmap.data[idx + 2];

        // Magenta Target: 255, 0, 255
        // Distance function
        const dist = Math.sqrt(
            Math.pow(r - 255, 2) +
            Math.pow(g - 0, 2) +
            Math.pow(b - 255, 2)
        );

        // Threshold: 150 allows mostly magenta hues
        // If dist < 150, transparent.
        if (dist < 150) {
            this.bitmap.data[idx + 3] = 0; // Alpha 0
        }
    });

    console.log(`Saving sheet to ${outSheet}...`);
    await image.write(outSheet);

    // Crop Front (Top Left - Frame 0)
    const cellW = width / 4;
    const cellH = height / 4;

    console.log("Cropping front...");
    const front = image.clone().crop({ x: 0, y: 0, w: cellW, h: cellH });
    await front.write(outFront);

    console.log("Cropping back...");
    // Back is usually "Idle Up", which is Frame 4 (Row 1, Col 0)
    const back = image.clone().crop({ x: 0, y: cellH, w: cellW, h: cellH });
    await back.write(outBack);

    console.log("Done!");
}

// Example usage:
// process("public/sprites/raw_sprite.jpg", "public/sprites/final_sheet.png", "public/sprites/front.png", "public/sprites/back.png").catch(console.error);

if (process.argv.length > 5) {
    process(process.argv[2], process.argv[3], process.argv[4], process.argv[5]).catch(console.error);
} else {
    console.log("Usage: node process_sprites.js <input> <outSheet> <outFront> <outBack>");
}
