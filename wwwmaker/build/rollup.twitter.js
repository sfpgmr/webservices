import resolve from "rollup-plugin-node-resolve"; 
import commonjs from "rollup-plugin-commonjs";

// --- ES5/ES6/CommonJS/ESModules -> ES6 bundle ---
export default {
  format: "cjs",
  entry: "./commands/twitter.mjs",
  dest: "./commands/twitter.js",
  plugins: [
    resolve({ jsnext: true }),
    commonjs()
  ]
}