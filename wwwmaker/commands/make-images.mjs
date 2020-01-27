import fse from 'fs-extra';
import sharp from 'sharp';
import wwwconfig from './wwwconfig.mjs';
import resolveHome from './resolveHome.mjs';
import path from 'path';

const outputIconFormat = 'png';
const outputFormat = 'png';


(async()=>{
  const input = resolveHome(process.argv[2]);
  const output = resolveHome(process.argv[3]);
  // オリジナル
  {
    await fse.copy(input,output + '.orignal' + path.extname(input));
  }
  
  // アイコン用
  {
  const icon = await sharp(input)
    .resize(1200,1200,{
      fit: 'cover'
    })
    .toFormat(outputIconFormat)
    .toBuffer();
  await fse.outputFile(output + '.thumb.' + outputIconFormat,icon);
  }

  // リッチスニペット用
  {
    const img1x1 = await sharp(input)
      .resize(1200,1200,{
        fit: 'cover'
      })
      .toFormat(outputFormat)
      .toBuffer();
    await fse.outputFile(output + '.1x1.' + outputFormat,img1x1);
  }

  {
    const img4x3 = await sharp(input)
      .resize(1200,900,{
        fit: 'cover'
      })
      .toFormat('webp')
      .toBuffer();
    await fse.outputFile(output + '.4x3.' + outputFormat,img4x3);
  }

  {
    const img16x9 = await sharp(input)
      .resize(1280,720,{
        fit: 'contain'
      })
      .toFormat(outputFormat)
      .toBuffer();
    await fse.outputFile(output + '.16x9.' + outputFormat,img16x9);
  }

})();