import parser from '../commands/doc-syntax.mjs';
import fs from 'fs';

(async()=>{
  try {
    const data = parser.parse(await fs.promises.readFile('./tests/test-page.md','utf-8'));
    await fs.promises.writeFile('./tests/test-page.json',JSON.stringify(data,null,1),'utf-8');
  } catch (e) {
    console.log(e);
  }
})();
