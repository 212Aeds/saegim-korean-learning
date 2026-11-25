const {test}=require('node:test');
const assert=require('node:assert/strict');
const net=require('node:net');
const path=require('node:path');
const {spawn}=require('node:child_process');

// GHSA-xjj6-f33q-929c: catching fetch's rejection must not leave an
// orphan response stream that later terminates the whole Node process.
test('HTTP client rejects excessive encodings without crashing its caller', {timeout:10000}, async()=>{
 const server=net.createServer(socket=>{
  socket.on('error',()=>{});
  socket.once('data',request=>{
   const response=request.toString().startsWith('GET /ok ')
    ? 'HTTP/1.1 200 OK\r\nContent-Length: 2\r\nConnection: close\r\n\r\nok'
    : 'HTTP/1.1 200 OK\r\nContent-Length: 1\r\nContent-Encoding: gzip, gzip, gzip, gzip, gzip, gzip\r\nConnection: close\r\n\r\n';
   socket.end(response);
  });
 });
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
 const endpoint=`http://127.0.0.1:${server.address().port}`;
 const program=`
  const assert=require('node:assert/strict');
  const {fetch}=require('undici');
  (async()=>{
   assert.equal(await (await fetch(${JSON.stringify(endpoint+'/ok')})).text(),'ok');
   await assert.rejects(fetch(${JSON.stringify(endpoint+'/bad')}),{name:'TypeError'});
   await new Promise(resolve=>setTimeout(resolve,250));
   console.log('handled rejection without process failure');
  })().catch(error=>{console.error(error);process.exitCode=1;});
 `;
 const child=spawn(process.execPath,['-e',program],{cwd:path.resolve(__dirname,'..'),stdio:['ignore','pipe','pipe']});
 let output='',errors='';
 child.stdout.on('data',data=>output+=data);
 child.stderr.on('data',data=>errors+=data);
 const timer=setTimeout(()=>child.kill(),7000);
 try {
  const result=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('exit',(code,signal)=>resolve({code,signal}));});
  assert.equal(result.signal,null,'synthetic client must finish without being killed');
  assert.equal(result.code,0,errors);
  assert.match(output,/handled rejection without process failure/);
 } finally {
  clearTimeout(timer);
  if(child.exitCode===null&&child.signalCode===null)child.kill();
  await new Promise(resolve=>server.close(resolve));
 }
});
