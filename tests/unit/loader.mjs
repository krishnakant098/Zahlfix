export async function resolve(specifier,context,nextResolve){
  if(specifier==='@netlify/blobs')return {url:new URL('./memory-store.mjs',import.meta.url).href,shortCircuit:true};
  return nextResolve(specifier,context);
}
