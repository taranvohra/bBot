import { loadFont } from 'jimp';
import fontkit from 'fontkit';

const FONTS = (async () => {
  const ubuntuTTF = fontkit.openSync('assets/Ubuntu-Medium.ttf');
  const ubuntuFNT = await loadFont('assets/ubuntu.fnt');
  const arialFNT = await loadFont('assets/arial.fnt');
  const obelixFNT = await loadFont('assets/obelix.fnt');

  return {
    arialFNT,
    obelixFNT,
    ubuntuFNT,
    ubuntuTTF
  };
})();

export { FONTS };
