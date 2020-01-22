
import tw from 'twitter';
import util from 'util';
import sqlite from 'sqlite';
import makeEmbededInfo from './make-embeded-info.mjs';

export default class Twitter {
  constructor(){
    this.initPromiss = this.init();
  }

  async init(){
    this.client = new tw({
      consumer_key: process.env.TWCKEY,
      consumer_secret: process.env.TWCSECRET,
      access_token_key: process.env.TWAKEY,
      access_token_secret: process.env.TWASECRET
    });
    this.pastMs = 1000 * 3600 * 24 * 7; // 1 week
    this.getTweet_ = (util.promisify(this.client.get)).bind(this.client);
    this.db = await sqlite.open("./data/tweets.db");
  }

  async dispose(){
    await this.db.close();
  }
  
  async getTweetThread (statusId) {
    const currentTime = (new Date()).getTime();
    const db = this.db;
    const pastMs = this.pastMs;
    const getTweet_ = this.getTweet_;

    await this.db.run("create table if not exists tweets (id text primary key ,value json,created int,updated int);");
    //await db.run("create table if not exists tweets (id int primary key ,value json,create_date int,update_date int);");

    let tweetData = [];
    const tweetStmt = await db.prepare('select * from tweets where id = ?');
    const tweetReplaceStmt =  await db.prepare('replace into tweets(id,value,created,updated) values(?,?,?,?);');


    // ツィートを取得する
    // dbにあれば取得し、なければAPIでデータを取得しDBに格納する
    // dbのデータは7日間以上経過していれば再取得する
    async function getTweet(id){
      
      let tweet = await tweetStmt.get(id);
      let dbExists = !!tweet;

      if(!dbExists){
        tweet = await getTweet_('statuses/show', {id:id});
      } else {
        const dbCreatedTime = tweet.created;
        console.log(currentTime - dbCreatedTime,pastMs);
        if((currentTime - dbCreatedTime) > pastMs){
          // DBのキャッシュが古ければ再取得する
          tweet = await getTweet_('statuses/show', {id:id});
          dbExists = false;
        } else {
          tweet = JSON.parse(tweet.value);
        }
      }
      return {tweet:tweet,dbExists:dbExists};
    }

    let {tweet,dbExists} = await getTweet(statusId);

    while(true){
     
      tweetData.push(tweet);
      const date = (new Date()).getTime();

      if(!dbExists){
        await tweetReplaceStmt.run([tweet.id_str,JSON.stringify(tweet),date,date]);
      }

      //console.log(tweet.id_str,tweet.in_reply_to_status_id_str);

      if(tweet.in_reply_to_status_id_str){
        const id = tweet.in_reply_to_status_id_str;
        ({tweet,dbExists} = await getTweet(id));
        if(!tweet) {
          break;
        }
      } else {
        break;
      }
    }

    tweetData.sort((a,b)=>{
      const ad = Date.parse(a.created_at);
      const bd = Date.parse(b.created_at);
      if (ad < bd) {
        return -1;
      }
      if (ad > bd) {
          return 1;
      }
      return 0;
    });

    tweetStmt.finalize();
    tweetReplaceStmt.finalize();
    tweetData = await makeEmbededInfo(tweetData);
    console.log(tweetData);
    return tweetData;
  }
}  
