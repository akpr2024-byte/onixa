(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))o(a);new MutationObserver(a=>{for(const i of a)if(i.type==="childList")for(const s of i.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&o(s)}).observe(document,{childList:!0,subtree:!0});function n(a){const i={};return a.integrity&&(i.integrity=a.integrity),a.referrerPolicy&&(i.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?i.credentials="include":a.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function o(a){if(a.ep)return;a.ep=!0;const i=n(a);fetch(a.href,i)}})();const st="/assets/images",Y=`${st}/ui/unknown.png`;function g(t,e){if(!e)return Y;const n=String(e).trim().toLowerCase();let o;switch(t){case"item":o="items";break;case"skill":o="skill";break;case"stage":o="stage";break;case"station":o="station";break;case"tool":o="tools";break;case"ui":o="ui";break;case"land":o="lands";break;case"social":o="social";break;case"logo":o="logo";break;default:return Y}return`${st}/${o}/${n}.png`}window.ITEM_BY_ID={};window.SKILL_DATA={};window.GLOBAL_ITEM_INDEX=[];window.USED_IN_INDEX={};window.MARKET_PRICE_INDEX||={};function z(t){return t?String(t).replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"})[e]):""}document.addEventListener("DOMContentLoaded",()=>{R("header","/components/header.html").then(()=>Et()),R("navbar","/components/navbar.html").then(()=>{vt(),"requestIdleCallback"in window?requestIdleCallback(()=>{J(),Z()}):setTimeout(()=>{J(),Z()},200)}),R("footer","/components/footer.html"),document.getElementById("popup-overlay")||It(),document.getElementById("auth-overlay")||bt()});async function R(t,e){const n=document.getElementById(t);if(n)try{const o=await fetch(e);if(!o.ok)return;n.innerHTML=await o.text()}catch{console.warn("Failed loading:",e)}}function Et(){const t=document.getElementById("profileBtn"),e=document.getElementById("auth-overlay");if(!t||!e){console.warn("Profile/Auth elements not found");return}t.addEventListener("click",n=>{n.stopPropagation(),e.classList.remove("hidden")}),e.addEventListener("click",n=>{n.target===e&&e.classList.add("hidden")}),document.addEventListener("keydown",n=>{n.key==="Escape"&&e.classList.add("hidden")}),console.log("Profile auth bound ✅")}function It(){document.body.insertAdjacentHTML("beforeend",`
    <div id="popup-overlay" class="hidden">
      <div class="popup">
        <button class="close-btn" id="popup-close-btn">✖</button>
        <h3 id="popup-title"></h3>
        <div id="popup-variant-selectors"></div>
        <div id="popup-content"></div>
      </div>
    </div>
  `),document.addEventListener("click",e=>{e.target.id==="popup-close-btn"&&V()})}function bt(){document.body.insertAdjacentHTML("beforeend",`
  <div id="auth-overlay" class="auth-overlay hidden">
    <div class="auth-modal">

      <h2 class="auth-title">Sign up</h2>
      <h2 class="auth-title">Coming soon</h2>

      <button class="auth-btn google">
        Connect Pixel Account
      </button>

      <button class="auth-btn apple">
        Install Extension
      </button>

      <button class="auth-btn email">
        Sign up with Email
      </button>

    </div>
  </div>
  `)}async function J(){const t=document.querySelectorAll(".nav-item.dropdown");await Promise.all([...t].map(async e=>{const n=e.dataset.skill,o=e.querySelector(".dropdown-menu");if(o)try{const a=await rt(n);if(!a.length)return;[...new Set(a.map(s=>s.station).filter(Boolean))].sort().forEach(s=>{const c=document.createElement("a");c.href=`/pages/station.html?skill=${encodeURIComponent(n)}&station=${encodeURIComponent(s)}`;const r=document.createElement("img");r.src=g("station",s);const d=document.createElement("span");d.textContent=s,c.appendChild(r),c.appendChild(d),o.appendChild(c)})}catch{}}))}function vt(){document.querySelectorAll(".nav-item").forEach(e=>{if(!e.querySelector(".dropdown-menu"))return;e.querySelector("a").addEventListener("click",a=>{e.classList.contains("open")||(a.preventDefault(),t(),e.classList.add("open"))})}),document.addEventListener("click",e=>{e.target.closest(".nav-item.dropdown")||t()}),document.addEventListener("keydown",e=>{e.key==="Escape"&&t()});function t(){document.querySelectorAll(".nav-item.dropdown").forEach(e=>e.classList.remove("open"))}}async function Tt(){try{((await(await fetch("https://script.google.com/macros/s/AKfycbw2BJxdEjBooLKIyNVFNwm7-T2tEOuuedj638MUTgPqiZ7qGvAz2NnEMY6bEUfGxCR-7A/exec?action=market")).json()).items||[]).forEach(o=>{if(o.id&&o.price!=null){const a=Number(o.price);if(!Number.isFinite(a))return;window.MARKET_PRICE_INDEX[o.id]=a}}),localStorage.setItem("MARKET_PRICE_CACHE",JSON.stringify({time:Date.now(),prices:window.MARKET_PRICE_INDEX})),document.dispatchEvent(new Event("market-ready"))}catch{document.dispatchEvent(new Event("market-ready"))}}const W=localStorage.getItem("MARKET_PRICE_CACHE");if(W)try{const t=JSON.parse(W);window.MARKET_PRICE_INDEX=t.prices||{}}catch{}Tt();window.formatValue=function(t,e){if(e==null||e==="-")return"-";const n=Number(e),o=Number.isInteger(n)?n.toLocaleString():n.toLocaleString(void 0,{minimumFractionDigits:1,maximumFractionDigits:2});switch(t){case"coin":return`${o} <img src="${g("ui","coin")}" class="ui-icon">`;case"energy":return`${o} <img src="${g("ui","energy")}" class="ui-icon">`;case"xp":return`+ ${o}`;default:return o}};async function Z(){window.GLOBAL_ITEM_INDEX=[],window.ITEM_BY_ID={},window.USED_IN_INDEX={};const t=["farming","cooking","animal_care","mining","forestry","exploration","business","metalworking","stoneshaping","woodwork"];for(const e of t)try{const n=await rt(e);_t(e,n),await new Promise(requestAnimationFrame)}catch{console.warn("Index failed:",e)}document.dispatchEvent(new Event("global-index-ready")),console.log("Global index ready ✅")}function _t(t,e){e.forEach(n=>{if(!n.id)return;window.ITEM_BY_ID[n.id]??=[],window.ITEM_BY_ID[n.id].push({id:n.id,recipe_id:n.recipe_id,skill:n.skill,station:n.station,multi_recipe:n.multi_recipe===!0});const o={id:n.id,name:n.name,skill:t,station:n.station||t,output:n.output||1,ingredients:n.ingredients||[],recipeKey:`${n.id}__${n.output||1}`};window.GLOBAL_ITEM_INDEX.push(o),Array.isArray(n.ingredients)&&n.ingredients.forEach(a=>{window.USED_IN_INDEX[a.id]||=[],window.USED_IN_INDEX[a.id].push({id:n.id,name:n.name,qty:a.qty})})})}window.openItemPopup=function(t,e=null){if(!document.getElementById("popup-overlay")){console.warn("Popup not ready yet");return}if(window.ITEM_BY_ID?.[t]){window.openItemPopupById(t);return}if(e){openMarketOnlyPopup(e);return}console.warn("No popup available for item:",t)};window.openMarketOnlyPopup=function(t){if(!t)return;const e=document.getElementById("popup-overlay"),n=document.getElementById("popup-title"),o=document.getElementById("popup-content");if(!e||!n||!o){console.warn("Popup DOM not ready");return}n.innerHTML=`
    <span class="popup-title-wrap">
      <img src="${t.icon||g("ui","unknown")}"
     class="popup-title-icon">
      <span>${z(t.displayName||t.name||t.id)}</span>
    </span>
  `,o.innerHTML=`
    <div class="market-only-popup">
      <div class="market-only-main">
        <img src="${t.icon||g("ui","unknown")}"
        class="market-only-icon">
        <div class="market-only-info">
          <div class="info-row">
            <span>Price</span>
            <b>${formatValue("coin",t.price)}</b>
          </div>

          <div class="info-row">
            <span>Supply</span>
            <b>${t.supply??"-"}</b>
          </div>
        </div>
      </div>

      <div class="market-only-desc">
        <div class="desc-title">Description</div>
        <div class="desc-box">
          ${z(t.description||"This item is a market-only item.")}
        </div>
      </div>
    </div>
  `,e.classList.remove("hidden")};function V(){const t=document.getElementById("popup-overlay");if(!t)return;t.classList.add("hidden");const e=document.getElementById("popup-content");e&&(e.innerHTML="")}document.addEventListener("click",t=>{const e=document.getElementById("popup-overlay");!e||e.classList.contains("hidden")||t.target===e&&V()});document.addEventListener("keydown",t=>{if(t.key!=="Escape")return;const e=document.getElementById("popup-overlay");!e||e.classList.contains("hidden")||V()});window.SKILL_PROMISES||={};async function rt(t){const e="SKILL_CACHE_"+t,n=localStorage.getItem(e);if(n)try{const i=JSON.parse(n);return window.SKILL_DATA[t]=i,i}catch{}const o=await fetch(`/data/skill/${t}/${t}.json`),a=o.ok?await o.json():[];return window.SKILL_DATA[t]=a,localStorage.setItem(e,JSON.stringify(a)),a}const Ct=50;function Lt(t){return Number(t||0).toLocaleString()}function kt(t,e){if(!t||!Array.isArray(t.ingredients))return 0;let n=0;for(const o of t.ingredients){if(!o||!o.id||!o.qty)continue;if(!e||e[o.id]==null)return null;const a=Number(e[o.id]);n+=a*o.qty}return n}function Mt(t){return!t||typeof t.energy!="number"?0:t.energy*Ct}function At(t,e){if(!t||!Array.isArray(t.ingredients))return{ingredientsCost:0,energyCost:0,total:0};const n=kt(t,e);if(n==null)return{ingredientsCost:null,energyCost:null,total:null};const o=Mt(t);return{ingredientsCost:n,energyCost:o,total:n+o}}function St(t,e){if(!t||!t.id||!e||e[t.id]==null)return null;const n=Number(e[t.id]),o=Number(t.output||1);return n*o}function ct(t,e){if(!t||!t.id)return{craft:{total:0},netProfit:null};const n=At(t,e),o=St(t,e);return{craft:n,netProfit:o!=null&&n.total!=null?o-n.total:null}}const O={},D={};function Nt(){return window.ITEM_BY_ID?Promise.resolve():new Promise(t=>{document.addEventListener("global-index-ready",t,{once:!0})})}async function k(t,e={}){await Nt();const n=window.ITEM_BY_ID?.[t]||[];if(!n.length)return null;let o=null;e.recipe_id&&(o=n.find(l=>l.recipe_id===e.recipe_id)),!o&&e.station&&(o=n.find(l=>l.station===e.station)),!o&&e.skill&&(o=n.find(l=>l.skill===e.skill)),o||(o=n[0]);const a=o.skill.toLowerCase(),i=`/data/skill/${a}/${a}.json`;O[a]||(D[a]||(D[a]=fetch(i).then(async l=>{if(!l.ok)throw new Error("Skill JSON failed");return l.json()})),O[a]=await D[a]);const c=O[a].filter(l=>o.multi_recipe===!0?l.recipe_id===o.recipe_id:l.id===t&&l.station===o.station);if(!c.length)return null;let r=null;e.output!=null&&(r=c.find(l=>Number(l.output??1)===Number(e.output))),r||(r=c.find(l=>Number(l.output??1)===1)),r||(r=c[0]);const d=structuredClone(r);return d.outputVariants=c.map(l=>({count:Number(l.output??1)})),d._is_multi=o.multi_recipe===!0,d._recipe_id=o.recipe_id||null,d.skill=o.skill,d.station=o.station,d}let u=null,lt="buy",v=[];async function $(t){const n=` (x${Number(t.output||1)})`,o=g("item",t.id);document.getElementById("popup-title").innerHTML=`
  <div class="popup-title-row">
    <button id="popup-back-btn" class="popup-back-box" title="Back">
      <span class="back-icon">←</span>
      <span class="back-text">Back</span>
    </button>

    <div class="popup-title-text">
      <img src="${o}" class="popup-title-icon" draggable="false">
      <span class="popup-title-name">${t.name}${n}</span>
    </div>
  </div>
`;const a=document.getElementById("popup-variant-selectors");a&&(a.innerHTML="");const i=ut(t.id)||[],s=[...new Set(i.map(p=>Number(p.output||1)))];[...new Set(i.map(p=>p.skill))];const c=[...new Set(i.map(p=>p.station))];if(a.innerHTML="",s.length>1){const p=document.createElement("div");p.className="output-selector",s.sort((y,m)=>y-m).forEach(y=>{const m=document.createElement("button");m.textContent=`x${y}`,Number(t.output||1)===y&&m.classList.add("active"),m.onclick=async()=>{u&&v.push({id:u.id,output:u.output,station:u.station});const f=await k(t.id,{output:y,station:t.station});f&&(u=structuredClone(f),$(u))},p.appendChild(m)}),a.appendChild(p)}if(c.length>1){const p=document.createElement("div");p.className="recipe-selector",c.forEach(y=>{const m=document.createElement("button");m.textContent=y,y===t.station&&m.classList.add("active"),m.onclick=async()=>{u&&v.push({id:u.id,output:u.output,station:u.station});const f=await k(t.id,{station:y,output:1});f&&(u=structuredClone(f),$(u))},p.appendChild(m)}),a.appendChild(p)}document.getElementById("popup-back-btn").disabled=v.length===0,document.getElementById("popup-content").innerHTML=`
  
    <div class="popup-top-grid">
      <div class="popup-top-left"></div>

      <div class="popup-top-middle">
        <div class="popup-tool-label">You get it using this tool</div>
        <div class="popup-tool"></div>
      </div>

      <div class="popup-top-right">
        <div class="popup-market-label">Market price</div>
        <div id="popup-market-price" class="popup-market-price"></div>
      </div>
    </div>


    <div class="popup-item-stats">
      <div><span>Skill</span><b id="p-skill"></b></div>
      <div><span>Level</span><b id="p-level"></b></div>
      <div><span>Tier</span><b id="p-tier"></b></div>
      <div><span>Energy</span><b id="p-energy"></b></div>
      <div><span>XP</span><b id="p-xp"></b></div>
      <div><span>Time</span><b id="p-time"></b></div>
    </div>

    <div class="mode-switch">
      <button data-mode="buy" class="active">Buy from Market</button>
      <button data-mode="craft">Craft in Game</button>
      <button data-mode="hybrid">Smart Hybrid</button>
    </div>

    <div class="popup-tables">
      <div class="popup-table-box">
        <div class="popup-table-title">Used In</div>
        <table class="popup-table" id="used-in-table">
          <thead>
            <tr><th>Item</th><th>Market Price</th></tr>
          </thead>
          <tbody></tbody>
        </table>
      </div>

      <div class="popup-table-box">
        <div class="popup-table-title">Ingredients</div>
        <table class="popup-table" id="ingredients-table">
          <thead>
            <tr><th>Item</th><th>Qty</th><th>Market Price</th><th>Total Cost</th></tr>
          </thead>
          <tbody></tbody>
        </table>
      </div>
    </div>
  `;const r=document.querySelector(".popup-top-left"),d=Pt(t);if(r&&d.length>0){const p=d[0];let y="";const m={grass:!1,water:!1,space:!1};t.station==="Soil"&&Array.isArray(t["planted in"])&&t["planted in"].forEach(f=>{f.grass&&(m.grass=!0),f.water&&(m.water=!0),f.space&&(m.space=!0)}),t.station==="Mine"&&(t.grass&&(m.grass=!0),t.water&&(m.water=!0),t.space&&(m.space=!0)),Object.keys(m).forEach(f=>{m[f]&&(y+=`
      <img src="${g("land",f)}" 
           class="land-type-icon"
           draggable="false">
    `)}),r.innerHTML=`
    <div class="stage-type-label">
  ${p.method.toUpperCase()}
  <span class="land-icons">${y}</span>
</div>



    <div class="stage-icons-row">
      ${p.stages.map(f=>`
        <div class="stage-icon-wrap">
          <img src="${f.icon?.startsWith("http")?f.icon:g("stage",f.icon||f.stage)}">
          <span>${f.name||f.stage||""}</span>
        </div>
      `).join("")}
    </div>
  `}const l=document.querySelector(".popup-tool"),h=t["You get it using this tool"];l&&(Array.isArray(h)&&h.length>0?l.innerHTML=h.map(p=>{const y=p.id||p.name,m=y?g("tool",y):"";return`
          <div class="popup-tool-item">
            ${m?`<img src="${m}" draggable="false">`:""}
            <span>${p.name||"-"}</span>
          </div>
        `}).join(""):l.innerHTML='<span style="opacity:.5">-</span>');const b=document.getElementById("popup-back-btn");b.onclick=mt,b.disabled=v.length===0,Bt(t),xt(t),pt(t),document.getElementById("p-skill").textContent=t.skill||"-",document.getElementById("p-level").textContent=t.level??"-",document.getElementById("p-tier").textContent=t.tier??"-",document.getElementById("p-energy").innerHTML=formatValue("energy",t.energy),document.getElementById("p-xp").innerHTML=formatValue("xp",t.xp),document.getElementById("p-time").innerHTML=formatValue("time",t.time);const E=window.MARKET_PRICE_INDEX?.[t.id]??window.MARKET_PRICE_INDEX?.[t.market_id]??null;document.getElementById("popup-market-price").innerHTML=E!=null?formatValue("coin",E):"-",$t(),j(),document.getElementById("popup-overlay").classList.remove("hidden")}function dt(t){const e=window.MARKET_PRICE_INDEX?.[t];return e??null}function Pt(t){const e=[];return Array.isArray(t.drops_from)&&e.push({method:"drops from",stages:t.drops_from}),Array.isArray(t.craft_in)&&e.push({method:"craft in",stages:t.craft_in}),Array.isArray(t["planted in"])&&e.push({method:"planted in",stages:t["planted in"]}),e}window.openItemPopupById=async function(t){const e=document.getElementById("popup-overlay");e&&!e.classList.contains("hidden")&&u&&v.push({id:u.id,output:u.output,station:u.station}),e.classList.remove("hidden"),document.getElementById("popup-title").innerHTML=`
    <div class="popup-loading">Loading...</div>
  `,document.getElementById("popup-content").innerHTML=`
    <div class="popup-loading-body">
      Loading item data...
    </div>
  `;const o=await k(t);if(!o)return;const a=structuredClone(o);a._baseOutput=o.output||1,u=a,await $(a)};function $t(){document.querySelectorAll(".mode-switch button").forEach(e=>{e.onclick=()=>{lt=e.dataset.mode,document.querySelectorAll(".mode-switch button").forEach(n=>n.classList.remove("active")),e.classList.add("active"),j()}});const t=document.getElementById("auto-resource-toggle");t&&(t.onchange=e=>{AUTO_RESOURCE=e.target.checked,j()})}window.addEventListener("keydown",t=>{const e=document.getElementById("popup-overlay");if(!(e&&!e.classList.contains("hidden")))return;const o=document.activeElement;if(!(o&&(o.tagName==="INPUT"||o.tagName==="TEXTAREA"||o.isContentEditable))){if(t.key==="Escape"){t.preventDefault(),closePopup();return}t.key==="Backspace"&&(t.preventDefault(),v.length>0?mt():closePopup())}});document.addEventListener("click",t=>{if(!u)return;const e=document.getElementById("popup-overlay");!e||e.classList.contains("hidden")||t.target===e&&closePopup()});window.closePopup=function(){document.getElementById("popup-overlay").classList.add("hidden"),u=null,v=[]};function ut(t){return window.GLOBAL_ITEM_INDEX?.filter(e=>e.id===t)||[]}function Bt(t){const e=document.querySelector("#ingredients-table tbody");if(e.innerHTML="",!Array.isArray(t.ingredients)||t.ingredients.length===0){e.innerHTML=`
      <tr>
        <td colspan="4" style="opacity:.5;text-align:center">
          No ingredients
        </td>
      </tr>
    `;return}const n=document.createDocumentFragment(),o=Number(t.output||1),a=Number(t._baseOutput||o);t.ingredients.forEach(i=>{const s=document.createElement("tr"),c=dt(i.id);let r=i.qty;if(a&&o!==a){const l=o/a;r=Math.ceil(i.qty*l)}const d=c!=null?c*r:null;s.innerHTML=`
      <td class="item-cell clickable"
      data-item-id="${i.id}">
        <img src="${g("item",i.id)}" loading="lazy" decoding="async">
        <span>${i.name}</span>
      </td>

      <td class="qty-cell">x ${r}</td>

      <td>
        ${c!=null?`<span class="price-cell">${formatValue("coin",c)}</span>`:'<span style="opacity:.4">-</span>'}
      </td>

      <td>
        ${d!=null?`<span class="price-cell">${formatValue("coin",d)}</span>`:'<span style="opacity:.4">-</span>'}
      </td>
    `,n.appendChild(s)}),e.appendChild(n)}function xt(t){const e=document.querySelector("#used-in-table tbody");e.innerHTML="";const n=t["used in"];if(!Array.isArray(n)||n.length===0){e.innerHTML=`
      <tr>
        <td colspan="2" style="opacity:.5;text-align:center">
          This item is not used as an ingredient
        </td>
      </tr>
    `;return}const o=document.createDocumentFragment();[...new Set(n.map(i=>i.id))].forEach(i=>{const s=document.createElement("tr"),r=ut(i)?.find(h=>Number(h.output||1)===1)?.name||i,d=g("item",i),l=dt(i);s.innerHTML=`
      <td class="item-cell clickable"
    data-item-id="${i}">

        <img src="${d}" loading="lazy" decoding="async">
        <span>${r}</span>
      </td>

      <td>
        ${l!=null?`<span class="price-cell">${formatValue("coin",l)}</span>`:'<span style="opacity:.4">-</span>'}
      </td>
    `,o.appendChild(s)}),e.appendChild(o)}function pt(t){const e=document.querySelector("#ingredients-table").parentElement,n=e.querySelector(".ingredient-summary");n&&n.remove();let o={ingredientsCost:0,energyCost:0,total:0},a=0;const i=structuredClone(t),s=Number(t.output||1),c=Number(t._baseOutput||s);if(Array.isArray(i.ingredients)&&(i.ingredients=i.ingredients.map(E=>{let p=E.qty;if(c&&s!==c){const y=s/c;p=Math.ceil(E.qty*y)}return{...E,qty:p}})),lt==="buy"){const E=ct(i,window.MARKET_PRICE_INDEX);o=E.craft,a=E.netProfit??0}const r=Number(u.output||1),d=r>0?Math.round(a/r):0,l=`${u.id}__${u.output||1}`;window.ITEM_CRAFT_COSTS??={},window.ITEM_CRAFT_COSTS[l]=o.total,window.ITEM_NET_PROFITS??={},window.ITEM_NET_PROFITS[l]=a;const h=a>0?"profit-good":a<0?"profit-bad":"",b=document.createElement("div");b.className="ingredient-summary",b.innerHTML=`
    <div class="summary-row">
      <span>Total Ingredients Cost</span>
      <span>${formatValue("coin",o.ingredientsCost)}</span>
    </div>

    <div class="summary-row">
      <span>Energy Cost</span>
      <span>${formatValue("coin",o.energyCost)}</span>
    </div>

    <div class="summary-divider"></div>

    <div class="summary-row total">
      <span>Total Craft Cost</span>
      <span>
  ${o.total!=null?formatValue("coin",o.total):"-"}
</span>

    </div>

   <div class="summary-row net-profit ${h}">
  <span>Net Profit</span>
 <span>${a>0?"+":a<0?"-":""}${formatValue("coin",Math.abs(a))}</span>
</div>

${r>1&&d!=null?`
<div class="summary-row net-profit ${h}" style="font-size:13px;opacity:.85">
  <span>Net Profit (x1)</span>
  <span>${d>0?"+":""}${formatValue("coin",Math.abs(d))}</span>
</div>
`:""}


  `,e.appendChild(b)}async function mt(){if(v.length===0)return;const{id:t,output:e,station:n}=v.pop(),o=await k(t,{output:e,station:n});if(!o)return;const a=structuredClone(o);a&&(u=a,$(a))}function j(){u&&pt(u)}document.addEventListener("click",t=>{const e=t.target.closest(".item-cell.clickable");if(!e)return;const n=e.dataset.itemId;n&&openItemPopupById(n)});let Q,q,tt=!1;function H(t){return typeof t!="string"?"":t.replace(/[&<>"']/g,"")}let L=Object.freeze([]),T=[],I=1,_=10;const Rt="#dataTable tbody",Ot="pagination",Dt="searchBox";function ft(){const e=document.querySelector("#dataTable");if(!e)return;const n=e.getBoundingClientRect(),o=Math.max(0,window.innerHeight-n.top-20);_=Math.max(6,Math.floor(o/48))}function B(){const t=document.querySelector(Rt);if(!t)return;t.textContent="";const e=(I-1)*_,n=T.slice(e,e+_);if(n.length===0){const a=document.createElement("tr"),i=document.createElement("td");i.colSpan=4,i.style.textAlign="center",i.style.opacity=".6",i.textContent="No results found",a.appendChild(i),t.appendChild(a);return}const o=document.createDocumentFragment();for(let a=0;a<n.length;a++){const i=n[a],s=document.createElement("tr"),c=document.createElement("td");c.className="icon-cell";const r=document.createElement("img");r.dataset.src=i.icon||g("ui","unknown"),r.className="icon",r.width=28,r.height=28,r.loading="lazy",r.decoding="async",c.appendChild(r);const d=document.createElement("td");d.className="item-name",d.dataset.itemId=H(i.id),d.dataset.marketIndex=e+a,d.textContent=H(i.displayName||i.name||i.id);const l=document.createElement("td");l.textContent=i.price!=null?Lt(i.price):"-";const h=document.createElement("td");h.textContent=H(i.supply??"-"),s.appendChild(c),s.appendChild(d),s.appendChild(l),s.appendChild(h),o.appendChild(s)}t.appendChild(o),requestAnimationFrame(Ht)}function M(){const t=document.getElementById(Ot);if(!t)return;t.textContent="";const e=Math.max(1,Math.ceil(T.length/_));if(e<=1)return;const n=(i,s,c=!1)=>{const r=document.createElement("button");r.textContent=i,c&&r.classList.add("active"),r.dataset.page=s,t.appendChild(r)};n("<<",1),n("<",Math.max(1,I-1));const o=Math.max(1,I-2),a=Math.min(e,I+2);for(let i=o;i<=a;i++)n(i,i,i===I);n(">",Math.min(e,I+1)),n(">>",e)}function qt(){if(tt)return;const t=document.getElementById(Dt);t&&(tt=!0,t.addEventListener("input",()=>{clearTimeout(Q),Q=setTimeout(()=>{const e=t.value.toLowerCase().trim();T=e?L.filter(n=>(n.displayName||n.name||n.id).toLowerCase().includes(e)):[...L],I=1,B(),M()},100)}))}function x(t){if(!Array.isArray(t))return;const e=t.filter(n=>n&&typeof n.id=="string");L=Object.freeze([...e]),T=L.slice(0,100),I=1,ft(),B(),M(),qt(),e.length>100&&requestIdleCallback(()=>{T=[...L],M()})}let et;window.addEventListener("resize",()=>{clearTimeout(et),et=setTimeout(()=>{const t=_;if(ft(),t===_)return;const e=Math.max(1,Math.ceil(T.length/_));I>e&&(I=e),B(),M()},120)},{passive:!0});function Ht(){q||(q=new IntersectionObserver((e,n)=>{for(const o of e){if(!o.isIntersecting)continue;const a=o.target;a.src=a.dataset.src,n.unobserve(a)}},{rootMargin:"200px"})),document.querySelectorAll("#dataTable img[data-src]:not([src])").forEach(e=>q.observe(e))}document.addEventListener("click",t=>{const e=t.target.closest("#pagination button");if(!e)return;const n=Number(e.dataset.page);n&&(I=n,B(),M())});document.addEventListener("click",t=>{const e=t.target.closest(".item-name");if(!e)return;const n=e.dataset.itemId,o=Number(e.dataset.marketIndex);if(!(!n||typeof window.openItemPopup!="function")){if(window.ITEM_BY_ID&&window.ITEM_BY_ID[n]){window.openItemPopup(n);return}if(Array.isArray(T)&&Number.isInteger(o)&&T[o]){const a=T[o];window.openItemPopup(n,a)}}});const Ut="https://script.google.com/macros/s/AKfycbw2BJxdEjBooLKIyNVFNwm7-T2tEOuuedj638MUTgPqiZ7qGvAz2NnEMY6bEUfGxCR-7A/exec?action=market",N="pixel_market_cache_v2",Ft=300*1e3,Kt=8e3;let U=!1;function jt(t){return t&&typeof t.id=="string"&&(typeof t.price=="number"||t.price===null)&&(typeof t.supply=="number"||typeof t.supply=="string"||t.supply===null)}function Gt(t){const e=Number(t);return Number.isFinite(e)?e:null}function yt(t,e=!1){const n=document.querySelector("#dataTable tbody");if(!n)return;n.textContent="";const o=document.createElement("tr"),a=document.createElement("td");a.colSpan=4,a.style.textAlign="center",a.style.opacity=e?"1":".6",e&&(a.style.color="#f66"),a.textContent=t,o.appendChild(a),n.appendChild(o)}async function Vt(t,e){const n=new AbortController,o=setTimeout(()=>n.abort(),e);try{const a=await fetch(t,{signal:n.signal});if(!a.ok)throw new Error("Network response not ok");return await a.json()}finally{clearTimeout(o)}}function gt(){const t=localStorage.getItem(N);if(!t)return null;try{const e=JSON.parse(t);if(e&&Array.isArray(e.items)&&typeof e.time=="number"&&Date.now()-e.time<Ft)return e.items;localStorage.removeItem(N)}catch{localStorage.removeItem(N)}return null}async function Xt(){const t=gt();if(t){x(t),nt();return}yt("Loading data..."),nt()}async function nt(){if(!U){U=!0;try{const t=await Vt(Ut,Kt);if(!t||!Array.isArray(t.items))throw new Error("Invalid API structure");const e=t.items.filter(jt).map(n=>({id:n.id,displayName:n.name||n.id,price:Gt(n.price),supply:n.supply??null,icon:g("item",n.id)}));if(!e.length)throw new Error("Empty dataset");x(e);for(let n=0;n<Math.min(6,e.length);n++){const o=new Image;o.src=e[n].icon}localStorage.setItem(N,JSON.stringify({time:Date.now(),items:e}))}catch(t){console.warn("Market refresh failed:",t.message),gt()||yt("Unable to load market data",!0)}finally{U=!1}}}Xt();window.ITEM_CRAFT_COSTS||={};window.ITEM_NET_PROFITS||={};let A=[],w={key:null,direction:null};function Yt(t){if(!Array.isArray(t))return[];const e=[],n={};(window.GLOBAL_ITEM_INDEX||[]).forEach(o=>{const a=`${o.id}_${o.skill}_${o.station}`;n[a]||(n[a]=[]),n[a].push(o)});for(const o of t){const a=`${o.id}_${o.skill}_${o.station}`,i=n[a]||[];i.length>0?i.forEach(s=>{e.push({...o,output:s.output||o.output||1,_recipe:s})}):e.push(o)}return e}function zt(){let t=[...A];if(document.querySelectorAll("th[data-sort-key]").forEach(e=>{e.classList.remove("sort-asc","sort-desc")}),w.key&&w.direction){const e=w.direction==="asc"?1:-1;t.sort((o,a)=>{const i=r=>{const d=r.output??1,l=`${r.id}__${d}`;switch(w.key){case"marketPrice":return window.MARKET_PRICE_INDEX?.[r.id]??0;case"craftCost":return window.ITEM_CRAFT_COSTS?.[l]??0;case"netProfit":return window.ITEM_NET_PROFITS?.[l]??0;default:return r[w.key]??0}},s=i(o),c=i(a);return(s-c)*e}),document.querySelector(`th[data-sort-key="${w.key}"]`)?.classList.add(w.direction==="asc"?"sort-asc":"sort-desc")}X(t),S(),window.CURRENT_ITEMS=t,C()}document.addEventListener("DOMContentLoaded",async()=>{await Jt(),window.GLOBAL_ITEM_INDEX?.length?ot():document.addEventListener("global-index-ready",()=>{ot()},{once:!0});const t=new URLSearchParams(location.search),e=t.get("skill"),n=t.get("station");if(!e){console.error("Missing skill in URL");return}let o="";if(n)o=`/data/skill/${e}/${n}.json`;else{const a=e.toLowerCase();o=`/data/skill/${a}/${a}.json`}console.log("Loading:",o);try{const a=await fetch(o);if(!a.ok)throw new Error("JSON not found");const i=await a.json();i.sort((c,r)=>{const d=c.level??0,l=r.level??0;return d-l}),A=[...i];const s=Yt(i);A=[...s],X(s),Wt(),window.CURRENT_ITEMS=s,S(),C(),S(),C(),setInterval(()=>{},6e4)}catch(a){console.error("Failed to load:",o,a)}});function Jt(){return new Promise(t=>{const e=()=>{document.querySelector("#items-body")?t():setTimeout(e,50)};e()})}function Wt(){document.querySelectorAll("th[data-sort-key]").forEach(t=>{t.style.cursor="pointer",t.addEventListener("click",()=>{const e=t.dataset.sortKey;Qt(e)})})}function X(t){const e=document.querySelector("#items-body");if(!e)return;const n=document.createDocumentFragment();t.forEach(o=>{const a=document.createElement("tr"),i=o.output??1,s=`${o.id}__${i}`;a.dataset.itemKey=s,a.dataset.itemId=o.id,a.dataset.output=i,a.innerHTML=`
      <td>${o.skill||""}</td>
      <td>${o.level??""}</td>
      <td>${o.tier||""}</td>
      <td>
        <div class="icon-wrapper">
          <img 
            data-src="${g("item",o.id)}"
            height="28"
            width="28"
            loading="lazy"
            decoding="async"
          >
        </div>
      </td>
      <td class="item-name clickable"
        data-item-id="${o.id.startsWith("itm_")?o.id:"itm_"+o.id}">
        ${o.name}
      </td>
      <td>${i}</td>
      <td class="market-price" data-item-id="${o.id}">-</td>
      <td>-</td>
      <td>-</td>
      <td>${o.energy??"-"}</td>
      <td>${o.xp??"-"}</td>
      <td>${o.time??"-"}</td>
    `,n.appendChild(a)}),e.innerHTML="",e.appendChild(n),Zt()}function Zt(){const t=document.querySelectorAll("#items-body img"),e=new IntersectionObserver((n,o)=>{n.forEach(a=>{if(a.isIntersecting){const i=a.target;i.src=i.dataset.src,o.unobserve(i)}})},{rootMargin:"200px"});t.forEach(n=>e.observe(n))}document.addEventListener("click",t=>{let e=t.target;for(;e&&e!==document;){if(e.classList?.contains("item-name")){const n=e.dataset.itemId;n&&window.openItemPopupById(n);break}e=e.parentElement}});function Qt(t){w.key!==t?w={key:t,direction:"asc"}:w.direction==="asc"?w.direction="desc":w.direction==="desc"?w={key:null,direction:null}:w.direction="asc",zt()}function te(t){let e;if(!t)e=A;else{const n=t.toLowerCase();e=A.filter(o=>o.name?.toLowerCase().includes(n)||o.skill?.toLowerCase().includes(n))}X(e),S(),window.CURRENT_ITEMS=e,C()}function ot(){if(!document.querySelector("#itemsTable"))return;const t=document.getElementById("searchBox");t&&t.addEventListener("input",e=>{const n=e.target.value.toLowerCase().trim();te(n);const o=document.getElementById("global-search-results");if(n.length<2){o&&(o.style.display="none");return}const a=(window.GLOBAL_ITEM_INDEX||[]).filter(i=>i.name?.toLowerCase().includes(n)).slice(0,20);if(!a.length){o&&(o.style.display="none");return}ee(a)})}function ee(t){let e=document.getElementById("global-search-results");const n=document.getElementById("searchBox");e||(e=document.createElement("div"),e.id="global-search-results",e.className="search-results",document.body.appendChild(e));const o=n.getBoundingClientRect();e.style.position="absolute",e.style.top=o.bottom+window.scrollY+"px",e.style.left=o.left+"px",e.style.width=o.width+"px",e.innerHTML="",t.forEach(a=>{const i=document.createElement("div");i.className="search-result-item",i.innerHTML=`<img 
         src="${g("item",a.id)}" 
         width="22"
         loading="lazy"
         decoding="async"
         style="margin-right:8px;vertical-align:middle"
       >${a.name}<span style="opacity:.6"> (${a.skill} → ${a.station})</span>`,i.onclick=()=>{location.href="/pages/station.html?skill="+encodeURIComponent(a.skill)+"&station="+encodeURIComponent(a.station)},e.appendChild(i)})}function S(){document.querySelectorAll(".market-price").forEach(t=>{const e=t.dataset.itemId,n=window.MARKET_PRICE_INDEX?.[e];n!=null&&(t.innerHTML=formatValue("coin",n),t.classList.add("price-loaded"))})}window.openItemPopupFromEl=function(t){openItemPopupById(t.dataset.itemId)};function ne(t,e=1){const n=`${t}__${e}`,o=document.querySelector(`#items-body tr[data-item-key="${n}"]`);if(!o)return;const a=window.ITEM_CRAFT_COSTS?.[n],i=window.ITEM_NET_PROFITS?.[n];if(a!=null&&(o.children[7].innerHTML=formatValue("coin",a)),i!=null){const s=o.children[8];s.innerHTML=(i>0?"+":"")+formatValue("coin",i),s.className=i>0?"profit-good":i<0?"profit-bad":""}}async function oe(t){if(!Array.isArray(t)||t.length===0)return;const e=window.MARKET_PRICE_INDEX||{},n=20;for(let o=0;o<t.length;o+=n){const a=t.slice(o,o+n);await Promise.all(a.map(async i=>{const s=i.output??1,c=await k(i.id,{output:s});if(!c)return;const r=Array.isArray(c.ingredients)&&c.ingredients.length>0,d=e[c.id];let l=null,h=null;if(r){const E=ct(c,e);l=E.craft.total,d!=null&&(h=E.netProfit)}else l=0,d!=null&&(h=d);const b=`${i.id}__${s}`;window.ITEM_CRAFT_COSTS[b]=l,window.ITEM_NET_PROFITS[b]=h})),await new Promise(i=>setTimeout(i,0)),a.forEach(i=>{const s=i.output??1;ne(i.id,s)})}}function C(){window.CURRENT_ITEMS&&Array.isArray(window.CURRENT_ITEMS)&&window.CURRENT_ITEMS.length>0&&window.MARKET_PRICE_INDEX&&window.ITEM_BY_ID&&Object.keys(window.ITEM_BY_ID).length>0&&oe(window.CURRENT_ITEMS)}document.addEventListener("market-ready",()=>{S(),C()});document.addEventListener("global-index-ready",C);let G=[],at;function ae(){return window.GLOBAL_ITEM_INDEX?.length?(G=window.GLOBAL_ITEM_INDEX,Promise.resolve()):new Promise(t=>{document.addEventListener("global-index-ready",()=>{G=window.GLOBAL_ITEM_INDEX,t()},{once:!0})})}function ie(){const t=document.getElementById("searchBox");if(!t)return;let e=document.createElement("div");e.id="global-search-results",e.className="search-results",document.body.appendChild(e),t.addEventListener("input",()=>{clearTimeout(at),at=setTimeout(()=>{const n=t.value.trim().toLowerCase();if(e.innerHTML="",n.length<2){e.style.display="none";return}const o=G.filter(s=>s.name.toLowerCase().includes(n)).slice(0,20);if(!o.length){e.style.display="none";return}e.style.display="block";const a=t.getBoundingClientRect();e.style.top=a.bottom+window.scrollY+"px",e.style.left=a.left+"px",e.style.width=a.width+"px";const i=document.createDocumentFragment();o.forEach(s=>{const c=document.createElement("div");c.className="search-result-item";const r=s.output&&s.output>1?` (x${s.output})`:"";c.innerHTML=`
        <img 
          src="${g("item",s.id)}"
          loading="lazy"
          decoding="async"
        >
        <span>${s.name}${r}</span>
        <small>${s.skill} → ${s.station}</small>
      `,c.onclick=()=>{e.style.display="none",openItemPopupById(s.id)},i.appendChild(c)}),e.appendChild(i)},120)}),document.addEventListener("click",n=>{!n.target.closest("#searchBox")&&!n.target.closest("#global-search-results")&&(e.style.display="none")})}document.addEventListener("DOMContentLoaded",async()=>{await ae(),ie()});const se="https://script.google.com/macros/s/AKfycbw2BJxdEjBooLKIyNVFNwm7-T2tEOuuedj638MUTgPqiZ7qGvAz2NnEMY6bEUfGxCR-7A/exec?action=ugc",P="pixel_ugc_cache_v2",re=300*1e3,ce=8e3;let F=!1;function K(t){return typeof t!="string"?"":t.replace(/[^\w\- ]/g,"").trim()}function le(t){const e=Number(t);return Number.isFinite(e)?e:null}function de(t){return t&&typeof t.id=="string"}function ht(t,e=!1){const n=document.querySelector("#dataTable tbody");if(!n)return;n.textContent="";const o=document.createElement("tr"),a=document.createElement("td");a.colSpan=4,a.style.textAlign="center",a.style.opacity=e?"1":".6",e&&(a.style.color="#f66"),a.textContent=t,o.appendChild(a),n.appendChild(o)}async function ue(t,e){const n=new AbortController,o=setTimeout(()=>n.abort(),e);try{const a=await fetch(t,{signal:n.signal});if(!a.ok)throw new Error("Network response not ok");return await a.json()}finally{clearTimeout(o)}}function wt(){const t=localStorage.getItem(P);if(!t)return null;try{const e=JSON.parse(t);if(e&&Array.isArray(e.items)&&typeof e.time=="number"&&Date.now()-e.time<re)return e.items;localStorage.removeItem(P)}catch{localStorage.removeItem(P)}return null}async function pe(){const t=wt();if(t){x(t),it();return}ht("Loading data..."),it()}async function it(){if(!F){F=!0;try{const t=await ue(se,ce);if(!t||!Array.isArray(t.items))throw new Error("Invalid UGC structure");const e=t.items.filter(de).map(n=>{const o=K(String(n.id).toLowerCase());return{id:o,displayName:K(n.name)||o.replace("itm_ugc-","").replace(/-/g," "),price:le(n.price),supply:n.supply??null,icon:g("item",o),description:K(n.description||"")}}).filter(n=>n.id);if(!e.length)throw new Error("Empty UGC dataset");x(e);for(let n=0;n<Math.min(6,e.length);n++){const o=new Image;o.src=e[n].icon}localStorage.setItem(P,JSON.stringify({time:Date.now(),items:e}))}catch(t){console.warn("UGC refresh failed:",t.message),wt()||ht("Unable to load UGC data",!0)}finally{F=!1}}}pe();
