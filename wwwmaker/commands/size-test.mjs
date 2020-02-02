import request from 'request-promise-native';
import sizeOf from 'image-size';

(async()=>{
  const o = await request('https://github.sfpgmr.net/images/2019/webservices-after.svg',{encoding: null});
  const s = sizeOf(o);
  console.log(s);

})();