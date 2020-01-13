import fse from 'fs-extra';
import sharp from 'sharp';
import wwwconfig from './wwwconfig.mjs';
import resolveHome from './resolveHome.mjs';
import path from 'path';

const outputIconFormat = 'jpg';
const outputFormat = 'jpg';


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
    .resize(512,512,{
      fit: 'cover'
    })
    .toFormat(outputIconFormat)
    .toBuffer();
  await fse.outputFile(output + '.thumb.' + outputIconFormat,icon);
  }

  // リッチスニペット用
  {
    const img1x1 = await sharp(input)
      .resize(768,768,{
        fit: 'contain'
      })
      .toFormat(outputFormat)
      .toBuffer();
    await fse.outputFile(output + '.1x1.' + outputFormat,img1x1);
  }

  {
    const img4x3 = await sharp(input)
      .resize(1024,768,{
        fit: 'contain'
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