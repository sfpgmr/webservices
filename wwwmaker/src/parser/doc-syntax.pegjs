{

  class Node {
    constructor(name,attributes,content){
      name && (this.name = name);
      attributes && (this.attributes = attributes);
      content && (this.content = content);
    }
  }

  class HtmlNode extends Node {
    constructor(name,attributes,content){
      super(name,attributes,content);
    }
  }
 
  function reduceToObj (xs)
  {
    let attr = {};
    for(const x of xs){
      if(x && x.name){
        attr[x.name] = x.text;
      }
    }
    return attr;
  }
}

start = title:Title __ metadata:MetaData aditionalStyle:(__ s:AditionalStyle {return s})? body:Body {
  return {
    title:title.content,
    metadata:metadata,
    aditionalStyle:aditionalStyle,
    body:body
  };
}

// ブログのタイトル
Title "title" = "#" _ title:$([^\r\n]*) [\r]?[\n] { return new Node('title',null,title)}

// 更新日などのメタデータが入る
MetaData "metadata" = metastart:('<script'i _ 'type="application/json"'i _ 'id="sfblog"'i _ ">")? __ json:(ch:(!('</script'i  __ '>') c:. { return c })* { return ch.join('') }) __ metaend:('</script'i  __ '>')? {
  if(!!metastart != !!metaend) {
    error('<script> tag unmatch');
  }
  return new Node('meta-data',JSON.parse(json));
}

AditionalStyle = start:"<style>" __ style:(ch:(!('</style'i  __ '>') c:. { return c })* { return ch.join('') }) __ end:'</style>' 
{
  return new Node('AddtionalStyle',style);
}

Body = $.* { return new Node('Body',text()); }

/**
 * String - single, double, w/o quotes
 */
String "string"
  = '"'  ch:[^"]*      '"'  __ { return ch.join(''); }
  / '\'' ch:[^']*      '\'' __ { return ch.join(''); }
  /      ch:[^"'<>` ]+      __ { return ch.join(''); }

/**
 * Tag name, attribute name
 */
Symbol = h:[a-zA-Z0-9_\-] t:[a-zA-Z0-9:_\-]* { return h + t.join('') }

__ "space characters"
  = [\r\n \t\u000C]*

_ "space characters without cr,lf"
  = [ \t\u000c]*