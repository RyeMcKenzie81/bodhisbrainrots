import { Jimp } from "jimp";

async function process() {
    console.log("Reading sprite...");
    const image = await Jimp.read("public/sprites/zippysprite.png");

    // Replace magenta with transparent
    const width = image.bitmap.width;
    const height = image.bitmap.height;

    console.log(`Dimensions: ${width}x${height}`);

    image.scan(0, 0, width, height, function (x, y, idx) {
        const r = this.bitmap.data[idx + 0];
        const g = this.bitmap.data[idx + 1];
        const b = this.bitmap.data[idx + 2];

        // Magenta check (tolerant)
        // RGB(255, 0, 255) target
        // Allow variance: R>150, B>150, G<100
        if (r > 150 && g < 100 && b > 150) {
            this.bitmap.data[idx + 3] = 0; // Alpha 0
        }
    });

    console.log("Saving sheet...");
    await image.write("public/sprites/zippysprite_sheet.png");

    // Crop Front (Top Left)
    const cellW = width / 4;
    const cellH = height / 4;

    console.log("Cropping front...");
    const front = image.clone().crop({ x: 0, y: 0, w: cellW, h: cellH });
    await front.write("public/sprites/zippy_front.png");

    console.log("Cropping back...");
    // Row 1 (Index 4 is first in row 1?? 0,1,2,3 is row 0. 4,5,6,7 is row 1)
    // Row 1 starts at y = cellH.
    const back = image.clone().crop({ x: 0, y: cellH, w: cellW, h: cellH });
    await back.write("public/sprites/zippy_back.png");

    console.log("Done!");
}

process().catch(console.error);
