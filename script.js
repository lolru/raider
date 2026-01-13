const logEl=document.getElementById("log");
const x_super_properties='eyJvcyI6IldpbmRvd3MiLCJicm93c2VyIjoiQ2hyb21lIiwiZGV2aWNlIjoiIiwic3lzdGVtX2xvY2FsZSI6ImVuLVVTIiwiaGFzX2NsaWVudF9tb2RzIjpmYWxzZSwiYnJvd3Nlcl91c2VyX2FnZW50IjoiTW96aWxsYS81LjAgKFdpbmRvd3MgTlQgMTAuMDsgV2luNjQ7IHg2NCkgQXBwbGVXZWJLaXQvNTM3LjM2IChLSFRNTCwgbGlrZSBHZWNrbykgQ2hyb21lLzEzNC4wLjAuMCBTYWZhcmkvNTM3LjM2IiwiYnJvd3Nlcl92ZXJzaW9uIjoiMTM0LjAuMC4wIiwib3NfdmVyc2lvbiI6IjEwIiwicmVmZXJyZXIiOiJodHRwczovL2Rpc2NvcmQuY29tIiwicmVmZXJyaW5nX2RvbWFpbiI6ImRpc2NvcmQuY29tIiwicmVmZXJyZXJfY3VycmVudCI6IiIsInJlZmVycmluZ19kb21haW5fY3VycmVudCI6IiIsInJlbGVhc2VfY2hhbm5lbCI6InN0YWJsZSIsImNsaWVudF9idWlsZF9udW1iZXIiOjM4NDg4NywiY2xpZW50X2V2ZW50X3NvdXJjZSI6bnVsbH0=';
let shouldStopSpam=!1;

const tokensInput=document.getElementById('tokens'),guildInput=document.getElementById('guildId'),channelInput=document.getElementById('channelIds'),messageInput=document.getElementById('message'),randomizeCheckbox=document.getElementById('randomize'),delayInput=document.getElementById('delay'),limitInput=document.getElementById('limit'),mentionInput=document.getElementById('mentionIds'),pollTitleInput=document.getElementById('pollTitle'),pollAnswersInput=document.getElementById('pollAnswers'),forwardUrlInput=document.getElementById('forwardMessageUrl'),autoFillBtn=document.getElementById('autoFillChannels'),fetchMentionsBtn=document.getElementById('fetchMentions'),submitBtn=document.getElementById('submitBtn'),stopBtn=document.getElementById('stopSpam'),leaveBtn=document.getElementById('leaveBtn'),form=document.getElementById('form');

function appendLog(t){const n=new Date().toLocaleTimeString();logEl.textContent+=`\n${n} - ${t}`;logEl.scrollTop=logEl.scrollHeight}
function clearLog(){logEl.textContent=''}
function sleep(t){return new Promise(e=>setTimeout(e,t))}

// 改行・スペース・カンマ全部無視して綺麗に配列化
function parseList(text){
  return [...new Set(
    text.replace(/\r\n|\r|\n/g, " ")
        .split(/\s+|,/)
        .map(s=>s.trim())
        .filter(s=>s.length>0)
  )]
}

function parseMessageUrl(t){if(!t)return null;const e=t.match(/https:\/\/discord\.com\/channels\/(\d+)\/(\d+)\/(\d+)/);return e?{guildId:e[1],channelId:e[2],messageId:e[3]}:null}

async function leaveGuild(t,e){const n=await fetch(`https://discord.com/api/v9/users/@me/guilds/${e}`,{method:"DELETE",headers:{Authorization:t,"Content-Type":"application/json","x-super-properties":x_super_properties},body:JSON.stringify({lurking:!1})});n.status===204?appendLog(`Success: ${t.slice(0,10)}...`):appendLog(`Failed: ${t.slice(0,10)}...`)}

autoFillBtn.onclick=async()=>{clearLog();const t=parseList(tokensInput.value),e=guildInput.value.trim();if(!t.length)return appendLog("Warning: トークンを入力してください");if(!e)return appendLog("Warning: サーバーIDを入力してください");try{const n=await fetch(`https://discord.com/api/v9/guilds/${e}/channels`,{headers:{Authorization:t[0],"x-super-properties":x_super_properties}});if(!n.ok)throw"";const o=(await n.json()).filter(c=>c.type===0).map(c=>c.id);channelInput.value=o.join("\n");appendLog("Success: チャンネル取得完了")}catch{appendLog("Failed: チャンネル取得失敗")}}

fetchMentionsBtn.onclick=async()=>{clearLog();const t=parseList(tokensInput.value),e=guildInput.value.trim(),n=parseList(channelInput.value);if(!t.length||!e||!n.length)return appendLog("Warning: トークン・サーバーID・チャンネルIDを入力");const ws=new WebSocket("wss://gateway.discord.gg/?v=9&encoding=json");ws.onopen=()=>{ws.send(JSON.stringify({op:2,d:{token:t[0],properties:{$os:"Windows",$browser:"Chrome",$device:"pc"},intents:1<<12}}))};ws.onmessage=m=>{const d=JSON.parse(m.data);if(d.t==="READY")ws.send(JSON.stringify({op:14,d:{guild_id:e,channels:{[n[0]]:[[0,100]]}}}));if(d.t==="GUILD_MEMBER_LIST_UPDATE"){const ids=d.d.ops.flatMap(op=>op.items.filter(i=>i.member?.user?.id).map(i=>i.member.user.id));ids.length?(mentionInput.value=ids.join("\n"),appendLog("Success: メンション取得完了")):appendLog("メンションなし");ws.close()}};ws.onerror=()=>{appendLog("Error: WebSocket接続失敗");ws.close()}}

async function sendMessage(t,ch,msg,opt={}){let p={content:msg||""};opt.randomize&&(p.content+="\n"+crypto.randomUUID());if(opt.randomMentions){const id=opt.randomMentions[Math.floor(Math.random()*opt.randomMentions.length)];p.content=`<@${id}>\n`+p.content}if(opt.pollTitle&&opt.pollAnswers){p.poll={question:{text:opt.pollTitle},answers:opt.pollAnswers.map(a=>({poll_media:{text:a.trim()}})),allow_multiselect:!1,duration:1,layout_type:1}}return fetch(`https://discord.com/api/v9/channels/${ch}/messages`,{method:"POST",headers:{Authorization:t,"Content-Type":"application/json","x-super-properties":x_super_properties},body:JSON.stringify(p)})}

async function forwardMessage(t,ch,ref){return fetch(`https://discord.com/api/v9/channels/${ch}/messages`,{method:"POST",headers:{Authorization:t,"Content-Type":"application/json","x-super-properties":x_super_properties},body:JSON.stringify({content:"",message_reference:{guild_id:ref.guildId,channel_id:ref.channelId,message_id:ref.messageId,type:1}})})}

async function sendWithRetry(t,ch,msg,opt={},retry=5,wait=1500){for(let i=0;i<retry;i++)try{const r=await sendMessage(t,ch,msg,opt);if(r.ok)return appendLog(`Success: ${t.slice(0,10)}...`),!0;if(r.status===429){const j=await r.json(),d=(j.retry_after||1)*1000;appendLog(`Rate limit: ${d/1000}s`);await sleep(d)}else if(r.status===401)return appendLog(`Failed: 無効トークン`),!1}catch{await sleep(wait)}return!1}

async function forwardWithRetry(t,ch,ref,retry=5,wait=1500){for(let i=0;i<retry;i++)try{const r=await forwardMessage(t,ch,ref);if(r.ok)return appendLog(`Success: ${t.slice(0,10)}...`),!0;if(r.status===429){const j=await r.json(),d=(j.retry_after||1)*1000;appendLog(`Rate limit: ${d/1000}s`);await sleep(d)}}catch{await sleep(wait)}return!1}

function checkForm(){submitBtn.disabled=!(tokensInput.value.trim()&&guildInput.value.trim()&&(messageInput.value.trim()||forwardUrlInput.value.trim()))}
["tokens","guildId","message","forwardMessageUrl"].forEach(id=>document.getElementById(id).addEventListener("input",checkForm));checkForm();

form.onsubmit=async e=>{e.preventDefault();if(!messageInput.value.trim()&&!forwardUrlInput.value.trim())return appendLog("Warning: メッセージか転送URLを入力");submitBtn.disabled=!0;submitBtn.classList.add("loading");submitBtn.textContent="実行中...";shouldStopSpam=!1;stopBtn.disabled=!1;clearLog();const tokens=parseList(tokensInput.value),guild=guildInput.value.trim(),channels=parseList(channelInput.value),msg=messageInput.value.trim(),rand=randomizeCheckbox.checked,delay=(parseFloat(delayInput.value)||0)*1000,limit=limitInput.value?parseInt(limitInput.value):Infinity,mentions=mentionInput.value.trim()?parseList(mentionInput.value):null,pollT=pollTitleInput.value.trim()||null,pollA=pollAnswersInput.value.trim()?parseList(pollAnswersInput.value):null,fwdUrl=parseMessageUrl(forwardUrlInput.value.trim()),isFwd=!!fwdUrl;let sent=0;const tasks=[];if(isFwd)for(const tk of tokens)tasks.push((async()=>{while(!shouldStopSpam&&sent<limit)for(const ch of channels){if(await forwardWithRetry(tk,ch,fwdUrl)){sent++;if(sent>=limit)return}if(delay)await sleep(delay)}})());if(msg)for(const tk of tokens)tasks.push((async()=>{while(!shouldStopSpam&&sent<limit)for(const ch of channels){if(await sendWithRetry(tk,ch,msg,{randomize:rand,randomMentions:mentions,pollTitle:pollT,pollAnswers:pollA})){sent++;if(sent>=limit)return}if(delay)await sleep(delay)}})());await Promise.all(tasks.map(t=>t()));submitBtn.disabled=!1;submitBtn.classList.remove("loading");submitBtn.textContent="RAID START";appendLog("Success: 完了")};

stopBtn.onclick=()=>{shouldStopSpam=!0;appendLog("Stopped");submitBtn.disabled=!1;submitBtn.classList.remove("loading");submitBtn.textContent="RAID START"};
leaveBtn.onclick=async()=>{shouldStopSpam=!0;appendLog("Exiting...");const t=parseList(tokensInput.value),g=guildInput.value.trim();if(!t.length||!g)return appendLog("Warning: 入力不足");for(const tk of t)await leaveGuild(tk,g);appendLog("Success: 退出完了");submitBtn.disabled=!1;submitBtn.classList.remove("loading");submitBtn.textContent="RAID START"};
