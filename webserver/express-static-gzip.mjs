import {serveStatic} from "./serve-static.mjs";
import mime from 'mime';
import fs from 'fs';

/**
 * Generates a middleware function to serve static files. It is build on top of the express.static middleware.
 * It extends the express.static middleware with the capability to serve (previously) gziped files. For this
 * it asumes, the gziped files are next to the original files.
 * @param {string} rootFolder: folder to staticly serve files from
 * @param {{enableBrotli:boolean, customCompressions:[{encodingName:string,fileExtension:string}], indexFromEmptyFile:boolean}} options: options to change module behaviour  
 * @returns express middleware function
 */
export default function expressStaticGzip(rootFolder,options = {indexFromEmptyFile:true}) {

    //create a express.static middleware to handle serving files 
    const defaultStatic = serveStatic(rootFolder, options);


    return function middleware(req, res, next) {

      (async ()=>{

        changeUrlFromEmptyToIndexHtml(req);

        //get browser's' supported encodings
        const acceptEncoding = req.header("accept-encoding");

        //test if any compression is available 
        try {
          await fs.promises.stat(rootFolder + req.path + '.gz');
          convertToCompressedRequest(req,res);
        } catch (e) {
          ;
        }

        //allways call the default static file provider
        defaultStatic(req, res, next);

      })();

    };

    /**
     * Changes the url and adds required headers to serve a compressed file.
     * @param {Object} req
     * @param {Object} res
     */
    function convertToCompressedRequest(req, res) {
        const type = mime.lookup(req.path);
        const charset = mime.charsets.lookup(type);
        let search = req.url.split('?').splice(1).join('?');

        if (search !== "") {
            search = "?" + search;
        }

        req.url = req.path + '.gz' + search;
        res.setHeader("Content-Encoding", "gzip");
        res.setHeader("Content-Type", type + (charset ? "; charset=" + charset : ""));
    }

    /**
     * In case it's enabled in the options and the requested url does not request a specific file, "index.html" will be appended.
     * @param {Object} req
     */
    function changeUrlFromEmptyToIndexHtml(req) {
        if (options.indexFromEmptyFile && req.url.endsWith("/")) {
            req.url += "index.html";
        }
    }
}
