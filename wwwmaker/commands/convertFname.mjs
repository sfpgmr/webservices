import fs from 'fs';

const path = '/var/www/html/contents/blog';


async function convertFname(path){
    
    const dirs = await fs.promises.readdir(path);
    for(const entry of dirs){
        const p = path + '/' + entry;
        const stat = await fs.promises.stat(p);
        if(stat.isDirectory()){
            await convertFname(p);
        } else if(stat.isFile()){
            console.log(p,decodeURI(entry));
            //await fs.promises.rename(p,
        }
    }


}

convertFname(path);
