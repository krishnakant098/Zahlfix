/** In-memory SDK contract double. Does NOT test the live Netlify service. */
export class MemoryStore {
  data=new Map();revision=0;writes=0;fail=false;
  async get(key,options={}){
    if(this.fail)throw new Error('Injected storage outage');
    const entry=this.data.get(key);if(!entry)return null;
    return options.type==='json'?JSON.parse(entry.value):entry.value;
  }
  async getWithMetadata(key,options={}){
    if(this.fail)throw new Error('Injected storage outage');
    const entry=this.data.get(key);await Promise.resolve();
    if(!entry)return null;
    return {data:options.type==='json'?JSON.parse(entry.value):entry.value,etag:entry.etag,metadata:{}};
  }
  async set(key,value,options={}){
    if(this.fail)throw new Error('Injected storage outage');
    const old=this.data.get(key);
    if((options.onlyIfNew&&old)||(options.onlyIfMatch&&old?.etag!==options.onlyIfMatch))return {modified:false};
    const etag=`"${++this.revision}"`;this.data.set(key,{value,etag});this.writes++;return {modified:true,etag};
  }
  async delete(key){this.data.delete(key);}
}
export function getStore(){
  if(!globalThis.__TEST_BLOB_STORE__)throw new Error('Test store has not been configured. No network fallback.');
  return globalThis.__TEST_BLOB_STORE__;
}
