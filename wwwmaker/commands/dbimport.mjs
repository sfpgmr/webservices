import sqlite from 'sqlite';
import fs from 'fs';

(async ()=>{
  const db = await sqlite.open("./data/blog.db");
  await db.run('create table if not exists entries (mdPath text,blogPosting json,blogId text,contentPath text,tokens json,needUpdate int,no int,hash text);')
  const blogData = JSON.parse(await fs.promises.readFile('./data/blog/entries.json','utf-8'));
  const prepStmt = await db.prepare(`replace into entries (mdPath,blogPosting,blogId,contentPath,tokens,needUpdate,no) values(?,?,?,?,?,?,?);`);
  for(const d of blogData){
    await prepStmt.run([d.mdPath,d.blogPosting,d.blogId,d.contentPath,d.tokens,d.needUpdate,d.index]);
  }
  prepStmt.finalize();
  await db.close();
})();
