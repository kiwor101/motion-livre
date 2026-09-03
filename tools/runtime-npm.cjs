const args=process.argv.slice(2);
if(args.includes('--version')||args.includes('-v')){
  process.stdout.write('10.0.0\n');
}else{
  process.stdout.write(JSON.stringify({name:'motion-livre-runtime',version:'0.3.0',dependencies:{}}));
}
