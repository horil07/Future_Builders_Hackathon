const $ = id => document.getElementById(id);
async function activeTab(){ const [tab]=await chrome.tabs.query({active:true,currentWindow:true}); return tab; }
(async()=>{
  const tab=await activeTab();
  try{
    const url=new URL(tab.url); $("site").textContent=url.hostname.replace(/^www\./,"");
    chrome.tabs.sendMessage(tab.id,{type:"SCAN_ONLY"},res=>{
      if(chrome.runtime.lastError){ $("count").textContent="This page cannot be scanned"; return; }
      $("dot").style.background="#2db36f"; $("count").textContent=`${res?.count||0} profile matches detected`;
    });
  }catch{ $("site").textContent="Unsupported page"; }
})();
$("fill").onclick=async()=>{ const tab=await activeTab(); chrome.tabs.sendMessage(tab.id,{type:"SCAN_AND_REVIEW"},()=>window.close()); };
$("profile").onclick=()=>chrome.runtime.openOptionsPage();
