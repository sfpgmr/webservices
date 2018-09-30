// rollup.config.js
import commonjs from 'rollup-plugin-commonjs';
export default [
  {
    input: './webserver/bin/www.mjs',
    output: {
      file: './webserver/bin/www.js',
      format: 'cjs',
      plugins:[commonjs()]
    }

  },
  {
    input: './metrop/node/getTrainInfo.mjs',
    output: {
      file: './metrop/node/getTrainInfo.js',
      format: 'cjs',
      plugins:[commonjs()]
    }

  }];