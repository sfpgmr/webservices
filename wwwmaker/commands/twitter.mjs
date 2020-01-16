import Twitter from 'twitter';
import fs from 'fs';
import util from 'util';

import sqlite3 from 'sqlite3';
let Sqlite3 = sqlite3.verbose();

try {
  const client = new Twitter({
    consumer_key: process.env.TWCKEY,
    consumer_secret: process.env.TWCSECRET,
    access_token_key: process.env.TWAKEY,
    access_token_secret: process.env.TWASECRET
  });



  
  const getTweets = util.promisify(client.get.bind(client));
  const tweetData = [];
  const params = {
    id:'1186045839552049153'
  };

  (async ()=>{
    
    const db = new Sqlite3.Database("./data/data.db");

    db.serialize(()=>{
      db.run("create table if not exists tweets(id text primary key ,value json)");
    });

    const dbGet = util.promisify(db.get).bind(db);
    const dbRun = util.promisify(db.run).bind(db);
    const dbExec = util.promisify(db.exec).bind(db);

    function getData(status){
      db.serialize(()=>{
        db.get(`select * from tweets wher id = `)

      });
    }

    while(true){
      
      const tweet = await getTweets('statuses/show', params);
      tweetData.push(tweet);
      if(tweet.in_reply_to_status_id_str){
        params.id = tweet.in_reply_to_status_id_str
      } else {
        break;
      }
    }

    db.close();
    await fs.promises.writeFile('./data/tweets.json', JSON.stringify(tweetData, null, 2), 'utf8');
  })();
} catch (error){
  console.error(error);
}
