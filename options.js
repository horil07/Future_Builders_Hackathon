const DOC_TYPES = {
  resume: "Resume / CV", photo: "Photo", signature: "Signature", marksheet10: "10th marksheet / certificate",
  marksheet12: "12th marksheet / certificate", degreeCertificate: "Degree / graduation certificate", disabilityCertificate: "Disability / PwD certificate"
};
let profile = null;
const getPath=(obj,path)=>path.split('.').reduce((o,k)=>o?.[k],obj);
const setPath=(obj,path,value)=>{const ks=path.split('.');let o=obj;ks.slice(0,-1).forEach(k=>o=o[k]??=( {} ));o[ks.at(-1)]=value;};
function toast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1800)}
function renderDocs(){const box=document.getElementById('docs');box.innerHTML='';for(const [key,label] of Object.entries(DOC_TYPES)){const doc=profile.documents?.[key];const wrap=document.createElement('div');wrap.className='doc';wrap.innerHTML=`<strong>${label}</strong><small>${doc?.name||'No file saved'}</small><input type="file" data-doc="${key}">${doc ? `<button type="button" class="remove-doc" data-remove-doc="${key}">Remove saved file</button>` : ''}`;box.appendChild(wrap);}}
async function init(){const {profile:p}=await chrome.storage.local.get('profile');profile=p;document.querySelectorAll('[data-path]').forEach(el=>{const path=el.dataset.path;const v=path==='skills'?(profile.skills||[]).join(', '):getPath(profile,path);el.value=v??'';});renderDocs();}
document.addEventListener('change',async e=>{const input=e.target.closest('[data-doc]');if(!input||!input.files?.[0])return;const file=input.files[0];const reader=new FileReader();reader.onload=()=>{profile.documents??={};profile.documents[input.dataset.doc]={name:file.name,type:file.type,size:file.size,dataUrl:reader.result};renderDocs();toast('Document staged — click Save profile');};reader.readAsDataURL(file);});
document.getElementById('save').onclick=async()=>{document.querySelectorAll('[data-path]').forEach(el=>{const path=el.dataset.path;const value=el.value.trim();if(path==='skills')profile.skills=value?value.split(',').map(s=>s.trim()).filter(Boolean):[];else setPath(profile,path,value);});await chrome.storage.local.set({profile});toast('Profile saved locally');};
init();

document.addEventListener('click',e=>{const btn=e.target.closest('[data-remove-doc]');if(!btn)return;delete profile.documents[btn.dataset.removeDoc];renderDocs();toast('Document removed — click Save profile');});
