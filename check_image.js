
import Jimp from 'jimp';

const PNG_PATH = 'public/sprites/boss_cappuccino.png';

async function check() {
    try {
        const image = await Jimp.read(PNG_PATH);
        console.log(`Dimensions: ${image.bitmap.width}x${image.bitmap.height}`);
    } catch (e) {
        console.error(e);
    }
}

check();
