const canvas=document.getElementById("game"),ctx=canvas.getContext("2d");
const scoreEl=document.getElementById("score"),coinsEl=document.getElementById("coins"),timeEl=document.getElementById("time"),highEl=document.getElementById("highScore");
const msg=document.getElementById("message"),startBtn=document.getElementById("startBtn"),restartBtn=document.getElementById("restartBtn"),musicBtn=document.getElementById("musicBtn"),music=document.getElementById("music");

let running=false,score=0,coins=0,timeLeft=200,last=0,spawn=0,speed=390,ground=470;
let player={x:130,y:400,w:52,h:70,vy:0,jump:false,duck:false};
let obstacles=[],rings=[],particles=[];
let high=Number(localStorage.getItem("speedDashHigh")||0);highEl.textContent=high;
let musicOn=true;

function reset(){
 score=0;coins=0;timeLeft=200;speed=390;spawn=0;obstacles=[];rings=[];particles=[];
 player={x:130,y:400,w:52,h:70,vy:0,jump:false,duck:false};
 updateHUD();
}
function updateHUD(){scoreEl.textContent=Math.floor(score);coinsEl.textContent=coins;timeEl.textContent=Math.ceil(timeLeft);highEl.textContent=high}
function start(){
 reset();running=true;msg.classList.add("hidden");last=performance.now();
 if(musicOn)music.play().catch(()=>{});
 requestAnimationFrame(loop);
}
function gameOver(){
 running=false;
 if(Math.floor(score)>high){high=Math.floor(score);localStorage.setItem("speedDashHigh",high)}
 updateHUD();msg.innerHTML=`<h1>💥 GAME OVER</h1><p>Skor kamu: <b>${Math.floor(score)}</b> • Koin: <b>${coins}</b></p><p>Tekan <b>ULANG</b> atau <b>SPACE</b> untuk bermain lagi.</p>`;msg.classList.remove("hidden");music.pause();
}
function jump(){
 if(!running)return start();
 if(!player.jump){player.vy=-790;player.jump=true}
}
function key(e){
 if(["Space","ArrowUp"].includes(e.code)){e.preventDefault();jump()}
 if(e.code==="ArrowDown"){player.duck=true; if(player.jump)player.vy+=450}
}
function keyup(e){if(e.code==="ArrowDown")player.duck=false}
addEventListener("keydown",key);addEventListener("keyup",keyup);

startBtn.onclick=start;restartBtn.onclick=start;
musicBtn.onclick=()=>{musicOn=!musicOn;if(musicOn){musicBtn.textContent="🔊 MUSIK ON";if(running)music.play().catch(()=>{})}else{musicBtn.textContent="🔇 MUSIK OFF";music.pause()}};

function rectHit(a,b){return a.x<a.x+a.w && a.x+a.w>b.x && a.y<a.y+a.h && a.y+a.h>b.y}
function collide(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y}

function spawnObjects(dt){
 spawn-=dt;
 if(spawn<=0){
   const type=Math.random()<.72?"rock":"barrier";
   const h=type==="rock"?38:72,w=type==="rock"?42:34;
   obstacles.push({x:1030,y:ground-h,w,h,type});
   spawn=Math.max(.55,1.35-Math.min(0.65,(speed-390)/900))+Math.random()*.45;
   if(Math.random()<.8) rings.push({x:1060,y:250+Math.random()*150,r:13,collected:false});
 }
}
function update(dt){
 timeLeft-=dt;
 if(timeLeft<=0){timeLeft=0;gameOver();return}
 speed+=dt*2.1;score+=dt*12;
 player.vy+=1900*dt;player.y+=player.vy*dt;
 const ph=player.duck&&!player.jump?42:70;
 if(player.y+ph>=ground){player.y=ground-ph;player.vy=0;player.jump=false}
 obstacles.forEach(o=>o.x-=speed*dt);
 rings.forEach(r=>r.x-=speed*dt);
 obstacles=obstacles.filter(o=>o.x>-80);
 rings=rings.filter(r=>r.x>-50&&!r.collected);

 const ph2=player.duck&&!player.jump?42:70;
 const pb={x:player.x+7,y:player.y+8,w:player.w-14,h:ph2-12};
 for(const o of obstacles){if(collide(pb,o)){gameOver();return}}
 for(const r of rings){
   const dx=(player.x+player.w/2)-r.x,dy=(player.y+ph2/2)-r.y;
   if(Math.hypot(dx,dy)<r.r+28){r.collected=true;coins++;score+=100;burst(r.x,r.y)}
 }
 particles.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=500*dt;p.life-=dt});
 particles=particles.filter(p=>p.life>0);
 updateHUD();
}
function burst(x,y){for(let i=0;i<12;i++)particles.push({x,y,vx:(Math.random()-.5)*260,vy:-Math.random()*260,life:.7})}

function draw(){
 // sky
 let g=ctx.createLinearGradient(0,0,0,560);g.addColorStop(0,"#48b9ff");g.addColorStop(.65,"#a8edff");g.addColorStop(.66,"#48b85b");g.addColorStop(1,"#16763c");ctx.fillStyle=g;ctx.fillRect(0,0,1000,560);
 // clouds
 ctx.fillStyle="rgba(255,255,255,.8)";for(let x=80;x<1000;x+=260){ctx.beginPath();ctx.arc(x,95,27,0,7);ctx.arc(x+30,90,36,0,7);ctx.arc(x+70,100,23,0,7);ctx.fill()}
 // distant hills
 ctx.fillStyle="#27894b";ctx.beginPath();ctx.moveTo(0,430);for(let x=0;x<=1000;x+=80)ctx.lineTo(x,380+Math.sin(x*.012)*45);ctx.lineTo(1000,500);ctx.lineTo(0,500);ctx.fill();
 // track
 ctx.fillStyle="#6e6e6e";ctx.fillRect(0,ground,1000,90);
 ctx.fillStyle="#ddd";for(let x=0;x<1000;x+=100){ctx.fillRect(x,ground+12,55,6)}
 // objects
 rings.forEach(r=>{ctx.strokeStyle="#ffd83d";ctx.lineWidth=7;ctx.beginPath();ctx.arc(r.x,r.y,r.r,0,7);ctx.stroke();ctx.strokeStyle="#fff5a0";ctx.lineWidth=2;ctx.stroke()});
 obstacles.forEach(o=>{ctx.fillStyle=o.type==="rock"?"#553c2c":"#9b2525";ctx.fillRect(o.x,o.y,o.w,o.h);ctx.fillStyle="rgba(255,255,255,.25)";ctx.fillRect(o.x+5,o.y+5,o.w-10,8)});
 // player stylized blue runner
 let ph=player.duck&&!player.jump?42:70;let px=player.x,py=player.y;
 ctx.save();ctx.translate(px+26,py+ph/2);
 ctx.fillStyle="#0877e8";ctx.beginPath();ctx.arc(0,-10,24,0,7);ctx.fill();
 // spikes
 ctx.fillStyle="#075bc0";for(let i=-1;i<=1;i++){ctx.beginPath();ctx.moveTo(-18+i*12,-28);ctx.lineTo(-34+i*12,-47);ctx.lineTo(-6+i*12,-35);ctx.fill()}
 ctx.fillStyle="#fff";ctx.beginPath();ctx.ellipse(8,-10,11,15,0,0,7);ctx.fill();ctx.fillStyle="#111";ctx.beginPath();ctx.arc(11,-11,4,0,7);ctx.fill();
 ctx.fillStyle="#0877e8";ctx.fillRect(-19,12,38,24);
 ctx.fillStyle="#fff";ctx.fillRect(-25,31,20,9);ctx.fillRect(8,31,20,9);
 ctx.restore();
 particles.forEach(p=>{ctx.globalAlpha=Math.max(0,p.life);ctx.fillStyle="#fff09a";ctx.fillRect(p.x,p.y,5,5);ctx.globalAlpha=1});
 // speed lines
 ctx.strokeStyle="rgba(255,255,255,.35)";for(let i=0;i<8;i++){let y=60+i*48;ctx.beginPath();ctx.moveTo((i*137+(performance.now()/5))%1000,y);ctx.lineTo(((i*137+(performance.now()/5))%1000)+45,y);ctx.stroke()}
}
function loop(t){
 if(!running){draw();return}
 const dt=Math.min(.033,(t-last)/1000);last=t;spawnObjects(dt);update(dt);draw();if(running)requestAnimationFrame(loop)
}
draw();
