// One bounded allocation, rather than retained chunks plus a second full copy.
export async function readVoiceAsset(response,expectedBytes,onChunk=()=>{}){
 if(!Number.isSafeInteger(expectedBytes)||expectedBytes<=0||expectedBytes>410_000_000||!response.body)throw Error('Invalid voice file size');
 const reader=response.body.getReader(),bytes=new Uint8Array(expectedBytes);let offset=0;
 try{
  while(true){const {done,value}=await reader.read();if(done)break;if(offset+value.length>expectedBytes)throw Error('Voice file size did not match');bytes.set(value,offset);offset+=value.length;onChunk(value.length);}
  if(offset!==expectedBytes)throw Error('The voice download was interrupted');
  return bytes.buffer;
 }catch(error){await reader.cancel().catch(()=>{});throw error;}
 finally{reader.releaseLock();}
}
