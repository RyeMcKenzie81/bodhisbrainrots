import { Jimp } from "jimp";

async function processSprite(filename, outSheet, outFront, outBack) {
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

        // Threshold: 180 allows mostly magenta hues
        // Also check for dark magenta/purple artifacts where Green is low and Red/Blue are dominant and similar
        // e.g. (100, 0, 100) -> dist to (255,0,255) is large, but for standard magenta masking we want broad coverage.
        // For artifacts (blending with black):

        // Strict Magenta
        const isMagenta = dist < 180;

        // Dark Purple Artifacts (e.g. hair edges)
        // Green < 90 (Dark/Color)
        // R > G+20, B > G+20 (Clearly purple/magenta tone)
        // |R-B| < 60 (Balanced R/B)
        const isPurpleArtifact = (g < 90) && (r > g + 20) && (b > g + 20) && (Math.abs(r - b) < 60);

        if (isMagenta || isPurpleArtifact) {
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

if (process.argv.length > 5) {
    processSprite(process.argv[2], process.argv[3], process.argv[4], process.argv[5]).catch(console.error);
} else {
    console.log("Usage: node process_sprites.js <input> <outSheet> <outFront> <outBack>");
}
