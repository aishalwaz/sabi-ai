import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

async function logConversation(language, communityId = 'bitcoin-abuja') {
  try { await supabase.from('conversations').insert({ language, type: 'chat', community_id: communityId }) } catch(e) {}
}
async function logOnboarding(type, shopName = null, location = null, category = null, communityId = 'bitcoin-abuja') {
  try { await supabase.from('onboardings').insert({ type, shop_name: shopName, location, category, completed: true, community_id: communityId }) } catch(e) {}
}
async function submitCommunityRequest(data) {
  try { await supabase.from('community_requests').insert(data) } catch(e) {}
}

function getCommunityFromURL() {
  try { return new URLSearchParams(window.location.search).get('community') || 'bitcoin-abuja' } catch(e) { return 'bitcoin-abuja' }
}

const COMMUNITIES = {
  'bitcoin-abuja': {
    id: 'bitcoin-abuja', name: 'Bitcoin Abuja', city: 'Abuja, Nigeria', color: '#D4A843',
    communityLink: 'fedi:community210v3xzat5dphhyhmsw43xketeygazycehvscnydmzxsmxzvnyx4jkze3jv5ek2e3jvycxvep4x4jnydtzvscrve35x4nrxd3hx33nxdfk893kgwpkvsenxvpnvvukyen9v3sjytpzvdhk6mt4de5hg72lw46kjezldpjhsg36ygmr2vt98ycnscejveskxef5vsex2ct9x3jnqcm98ycxxvtyxqmxxetxvgcrgvmpx43rxdeexsexvenyvyekgdf4vd3xzvtrv93ngvmrygkzyer9vde8jur5d9hkuhmtv4ujyw3zxe85umetgc6rj56ddyh4qntsd4ujk2m4v4s4wn2sfa6ksntnfed85nnz2enxzstpfdrrs0fz05uvt3ry',
    faucetLink: 'https://prod.fedi-faucet.dev.fedibtc.com/c/9651a0b10fd1deafbaf4df554dc4bf85',
    communityQR: '/community-qr.png', communityLogo: '/bitcoin-abuja-logo.png',
    appLogo: '/logo.png', memberCount: '60+', merchantCount: '6',
  }
}

async function fetchBTC() {
  try {
    const r = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,ngn')
    const d = await r.json()
    if (d?.bitcoin?.usd) return d.bitcoin
  } catch(e) {}
  return { usd: 96300, ngn: 154000000 }
}

async function speakElevenLabs(audioBase64) {
  try {
    const bytes = Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0))
    const blob  = new Blob([bytes], { type: 'audio/mpeg' })
    const url   = URL.createObjectURL(blob)
    const audio = new Audio(url)
    await audio.play()
    return true
  } catch(e) { return false }
}

function speakDevice(text, lang) {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text.replace(/[₿⚡●#*•①②③④⑤]/g, ' '))
  u.lang = { en:'en-NG', ha:'ha', yo:'yo', ig:'ig', pc:'en-NG' }[lang] || 'en-NG'
  u.rate = 0.9
  window.speechSynthesis.speak(u)
}

function fileToBase64(file) {
  return new Promise((res, rej) => {
    const reader = new FileReader()
    reader.onload = () => res(reader.result.split(',')[1])
    reader.onerror = rej
    reader.readAsDataURL(file)
  })
}

function detectLang(text) {
  const t = text.toLowerCase()
  const hausa  = ['ina','yaya','sannu','kudi','mene','yaushe','wane','kai','shi','ita','mu','ku','su','don','da','ko','ba','ne','ce']
  const yoruba = ['bawo','elo','jowo','owo','se','ni','mo','wa','pe','ti','fun','ati','tabi','ile']
  const igbo   = ['kedu','gini','oge','ego','obere','nke','ya','ha','site','na']
  const pidgin = ['abeg','wetin','oya','e dey','dem','wey','nah','comot','chop','ginger']
  const words  = t.split(/\s+/)
  const score  = list => words.filter(w => list.includes(w)).length
  const scores = { ha:score(hausa), yo:score(yoruba), ig:score(igbo), pc:score(pidgin) }
  const top    = Object.entries(scores).sort((a,b)=>b[1]-a[1])[0]
  return top[1] > 0 ? top[0] : 'en'
}

const BUSINESS_CATEGORIES = [
  { id:'food',      label:'Food & Restaurant',     emoji:'🍲' },
  { id:'fashion',   label:'Fashion & Clothing',    emoji:'👗' },
  { id:'beauty',    label:'Beauty & Hair',          emoji:'💇' },
  { id:'tech',      label:'Electronics & Tech',    emoji:'💻' },
  { id:'pharmacy',  label:'Pharmacy & Health',     emoji:'💊' },
  { id:'grocery',   label:'Grocery & Market',      emoji:'🛒' },
  { id:'transport', label:'Transport & Logistics', emoji:'🚗' },
  { id:'education', label:'Education & Training',  emoji:'📚' },
  { id:'services',  label:'Services & Repairs',    emoji:'🔧' },
  { id:'other',     label:'Other',                 emoji:'🏪' },
]

const CAT_EMOJI = Object.fromEntries(BUSINESS_CATEGORIES.map(c=>[c.id,c.emoji]))
const LANG_COLORS_S = {en:'#D4A843',ha:'#2DD4BF',pc:'#F97316',yo:'#A78BFA',ig:'#F87171'}
const LANG_NAMES_S  = {en:'English',ha:'Hausa',pc:'Nigerian Pidgin',yo:'Yoruba',ig:'Igbo'}

const PROMPTS_BY_LANG = {
  en: [
    { label:'Buy BTC with Naira',        msg:'How do I buy Bitcoin with Naira on Fedi?' },
    { label:'Sat price in Naira',         msg:'What is 1 sat worth in Naira right now?' },
    { label:'Accept Bitcoin at my shop',  msg:'__MERCHANT__' },
    { label:'New to Bitcoin? Start here', msg:'__MEMBER__' },
  ],
  ha: [
    { label:'Saya Bitcoin da Naira',      msg:'Ta yaya zan saya Bitcoin da Naira a Fedi?' },
    { label:'Farashin sat a Naira',       msg:'Nawa ne 1 sat a Naira yanzu?' },
    { label:'Karbi Bitcoin a kantin na',  msg:'__MERCHANT__' },
    { label:'Sabon zuwa Bitcoin?',        msg:'__MEMBER__' },
  ],
  yo: [
    { label:'Ra Bitcoin pelu Naira',      msg:'Bawo ni mo se le ra Bitcoin pelu Naira lori Fedi?' },
    { label:'Iye sat ni Naira',           msg:'Elo ni 1 sat ni Naira ni bayi?' },
    { label:'Gba Bitcoin ni ile itaja mi',msg:'__MERCHANT__' },
    { label:'Tuntun si Bitcoin?',         msg:'__MEMBER__' },
  ],
  ig: [
    { label:'Zuo Bitcoin na Naira',       msg:'Kedu ka m ga-esi zuo Bitcoin na Naira na Fedi?' },
    { label:'Onu ego sat na Naira',       msg:'Ego ole bu 1 sat na Naira ugbu a?' },
    { label:"Nata Bitcoin n'ulo ahia m",  msg:'__MERCHANT__' },
    { label:'Ohuru na Bitcoin?',          msg:'__MEMBER__' },
  ],
  pc: [
    { label:'Buy Bitcoin with Naira',     msg:'Abeg how I go take buy Bitcoin with Naira for Fedi?' },
    { label:'How much be 1 sat',          msg:'How much be 1 sat in Naira right now?' },
    { label:'Accept Bitcoin for my shop', msg:'__MERCHANT__' },
    { label:'New to Bitcoin?',            msg:'__MEMBER__' },
  ],
}

const WELCOME_BY_LANG = {
  en: { greeting:'How can I help you?',            sub:'Ask me anything — Bitcoin, Fedi, merchants, savings, payments, or anything else on your mind.',      langs:'English · Hausa · Yoruba · Igbo · Pidgin' },
  ha: { greeting:'Ina iya taimaka maka?',          sub:'Tambaye ni komai — Bitcoin, Fedi, yan kasuwa, ajiya, biyan kudi, ko kowane tambaya da kake da ita.', langs:'Hausa · English · Yoruba · Igbo · Pidgin' },
  yo: { greeting:'Bawo ni mo se le ran o lowo?',   sub:'Beere ohunkohun — Bitcoin, Fedi, awon onisowo, ifowopamo, awon isanwo, tabi ohunkohun ti o wa.',    langs:'Yoruba · Hausa · English · Igbo · Pidgin' },
  ig: { greeting:'Kedu ka m ga-esi nyere gi aka?', sub:"Juo m ihe o bula — Bitcoin, Fedi, ndi ahia, nchekwa ego, ugwo, ma o bu ihe o bula di n'obi gi.",    langs:'Igbo · Hausa · Yoruba · English · Pidgin' },
  pc: { greeting:'How I fit help you?',            sub:'Ask me anything — Bitcoin, Fedi, merchants, savings, payments, or any other thing wey dey your mind.',langs:'Pidgin · Hausa · Yoruba · Igbo · English' },
}

const ERROR_BY_LANG = {
  en: "Sabi couldn't respond right now. Please check your connection and try again.",
  ha: "Sabi bai iya amsa yanzu ba. Da fatan za a duba hadin ku ku sake gwadawa.",
  yo: "Sabi ko le dahun ni bayi. Jowo sayewo asopo re ki o tun gbiyanju.",
  ig: "Sabi enwehi ike iza ugbu a. Biko lelee njiko gi ma gbalia ozo.",
  pc: "Sabi no fit answer now. Abeg check your connection and try again.",
}

const BILINGUAL = {
  'en':    ['Scan to pay  ·  Instant  ·  No POS needed', null],
  'en-ha': ['Scan to pay  ·  Instant  ·  No POS needed', 'Danna don biya  ·  Nan take  ·  Ba POS da ake bukata'],
  'en-yo': ['Scan to pay  ·  Instant  ·  No POS needed', 'Scan lati san  ·  Lẹsẹkẹsẹ  ·  Ko si POS ti o nilo'],
  'en-ig': ['Scan to pay  ·  Instant  ·  No POS needed', 'Scan iji kwụọ  ·  Ozugbo  ·  Enweghị mkpa POS'],
  'en-pc': ['Scan to pay  ·  Fast fast  ·  No POS needed', 'Scan pay am  ·  Instant  ·  No POS wahala'],
}

const CONTEXT_CARDS = {
  savings: [
    { icon:'📉', title:'Your Naira is losing value — fast.', body:'Since 2020, the Naira has lost over 80% of its purchasing power. If you saved ₦1,000,000 in 2020, it now buys what ₦200,000 could then. This is not an accident — the government prints more Naira every year, reducing the value of every note you hold.', stat:'₦1,000,000 in 2020 = ₦200,000 in buying power today', statColor:'#F87171' },
    { icon:'₿', title:'Bitcoin cannot be inflated. Ever.', body:"There will only ever be 21 million Bitcoin in existence — hardcoded into the software forever. No government, no bank, no president can change this. While the Naira supply grows every year, Bitcoin's supply is fixed. This is why Nigerians are stacking sats.", stat:'Fixed supply: 21 million Bitcoin. Forever.', statColor:'#D4A843' },
    { icon:'📈', title:'Small amounts add up significantly.', body:'You do not need to buy a whole Bitcoin. The smallest unit is 1 satoshi — about ₦1 right now. Even ₦500 a week, invested consistently in Bitcoin, adds up to a meaningful savings position over time. The goal is to start, not to start big.', stat:'₦500/week × 52 weeks = ₦26,000 in Bitcoin savings', statColor:'#34C77A' },
  ],
  remittance: [
    { icon:'🏦', title:'Nigerian bank transfers are expensive.', body:'Sending money across Nigerian banks costs between ₦50 and ₦100 per transfer. Sending internationally costs even more — Western Union and bank wires charge 3% to 8% fees plus unfavorable exchange rates. On a ₦50,000 transfer that is up to ₦4,000 gone in fees.', stat:'Bank fees on ₦50,000 transfer: up to ₦4,000', statColor:'#F87171' },
    { icon:'⚡', title:'Bitcoin Lightning: instant, nearly free.', body:'The Lightning Network enables instant payments anywhere in the world for less than ₦1 in fees. Send to Lagos, London, or New York in under 1 second. The recipient can convert to local currency immediately. No middleman. No waiting.', stat:'Lightning fee on ₦50,000 transfer: less than ₦1', statColor:'#34C77A' },
    { icon:'🇳🇬', title:'Keep more of your money.', body:'Every naira you save on fees stays in your pocket. For someone sending money home monthly, switching to Bitcoin Lightning can save tens of thousands of Naira per year. Fedi makes this simple — your wallet is built in and Cashwyre converts Naira in minutes.', stat:'Potential annual savings: ₦48,000+ for regular senders', statColor:'#D4A843' },
  ],
}

const LEARN_CARDS = [
  { icon:'₿', title:'What is Bitcoin?', body:'Bitcoin is digital money that no bank or government controls. There will only ever be 21 million Bitcoins — forever. Nobody can print more. You own it completely and nobody can freeze it or take it from you.', highlight:'Think of it like cash — except you can send it anywhere in the world in under 1 second at almost zero cost.' },
  { icon:'📉', title:'Why does this matter for Nigerians?', body:'Since 2020 the Naira has lost over 80% of its value. If you saved 1,000,000 Naira in 2020 it now buys what 200,000 Naira could then. Bitcoin cannot be inflated. Its supply is fixed forever at 21 million.', highlight:'Nigerians who saved even 10% of their income in Bitcoin since 2020 are significantly better off today.' },
  { icon:'⚡', title:'What is a Satoshi?', body:'You do not need to buy a whole Bitcoin. The smallest unit is called a satoshi or sat. 1 Bitcoin = 100,000,000 sats. Right now 1 sat costs about 1 Naira. You can start with just 500 Naira worth of sats.', highlight:'Stack sats weekly — even 500 Naira a week adds up. Small amounts today can become significant wealth over time.' },
  { icon:'🌍', title:'What is Lightning Network?', body:'Lightning is a layer on top of Bitcoin that makes payments instant — under 1 second — and nearly free — less than 1 Naira per transaction. You can send to Lagos, London, or New York instantly.', highlight:'Fedi uses Lightning for all payments automatically. You never need to understand the technical details — it just works.' },
  { icon:'🔐', title:'How do I keep my Bitcoin safe?', body:'When you create a wallet on Fedi, you are given recovery words — usually 12 or 24 words. These words ARE your money. Write them on paper immediately. Store them somewhere safe. Never take a screenshot. Never share them with anyone.', highlight:'If you lose your phone, your recovery words let you restore your entire wallet on any device. Without them, your Bitcoin is gone forever.' },
]

const MERCHANT_STEPS = [
  { ins:'Step 1 of 6 — Install Fedi',               q:'Do you have the Fedi app installed on your phone?',                                                              yes:"Great. Let's move on.",               no:'Download Fedi from the App Store or Google Play — search "Fedi Bitcoin". Come back when installed.' },
  { ins:'Step 2 of 6 — Join a Federation',           q:'Open Fedi and tap the Wallet tab. Join any available federation — this creates your Bitcoin wallet. Done?',     yes:'Your Bitcoin wallet is ready.',       no:'Tap the Wallet tab at the bottom of Fedi. You will see options to join a federation. Pick any one.' },
  { ins:'Step 3 of 6 — Join Community',              q:'Now join the Bitcoin Abuja community on Fedi. This is separate from your wallet. Have you joined?',             yes:'Welcome to the community.',           no:"Let us get you in right now.", joinScreen:true },
  { ins:'Step 4 of 6 — Secure your wallet',          q:'Have you backed up your wallet recovery words on paper?',                                                       yes:'Excellent. Your funds are protected.', no:'Open Fedi → Profile → Personal Backup → write every word on physical paper. Never screenshot. Come back when done.' },
  { ins:'Step 5 of 6 — Fund your wallet (optional)', q:'Have you added any sats to your wallet? You can skip this — you can receive payments without having sats.',    yes:'Good.',                               no:'No problem. You can receive Bitcoin payments with zero balance. Move on.', canSkip:true },
  { ins:'Step 6 of 6 — Get your payment QR',         q:'Open Fedi → tap Wallet tab → tap Receive. You should see your payment QR code. Can you see it?',               yes:"You're ready. Let's build your banner.", no:'Make sure you are on the Wallet tab. Tap Receive and your QR code will appear.' },
]

const MEMBER_STEPS = [
  { ins:'Step 1 of 4 — Install Fedi',       q:'Do you have the Fedi app installed on your phone?',                                                               yes:"Great. Let's move on.",         no:'Download Fedi from the App Store or Google Play — search "Fedi Bitcoin". Come back when installed.' },
  { ins:'Step 2 of 4 — Join a Federation',  q:'Open Fedi and tap the Wallet tab. Join any available federation — this creates your Bitcoin wallet. Done?',      yes:'Your wallet is ready.',         no:'Tap the Wallet tab at the bottom of Fedi. Pick any federation — this creates your Bitcoin wallet.' },
  { ins:'Step 3 of 4 — Join Community',     q:'Now join the Bitcoin Abuja community on Fedi. This is your community space. Have you joined?',                   yes:'Welcome in.',                   no:"Let us get you in right now.", joinScreen:true },
  { ins:'Step 4 of 4 — Secure your wallet', q:'Have you written your wallet recovery words on paper?',                                                          yes:"You're all set. Let's finish.", no:'Open Fedi → Profile → Personal Backup → write every word on physical paper. Never screenshot. Come back when done.' },
]
async function sendToAI(history, btc, activeLang, community) {
  const satN = btc ? (btc.ngn/100000000).toFixed(2) : '1.54'
  const usd = btc ? btc.usd.toLocaleString() : '96,300'
  const ngnM = btc ? (btc.ngn/1000000).toFixed(0) : '154'
  const system = 'You are Sabi — the AI Bitcoin guide for ' + community.name + ' in ' + community.city + ' on the Fedi app. LANGUAGE: Always respond in the same language the user writes in. FORMATTING: Never use asterisks or markdown. Plain text only. Numbers for lists. PRICES: 1 satoshi = ' + satN + ' Naira. 1 Bitcoin = $' + usd + ' = ' + ngnM + 'M Naira. TO BUY BITCOIN: Fedi — Mini Apps — Cashwyre — Crypto Onramp — NGN — transfer from any Nigerian bank — wait 5-10 minutes. No ID needed. TO ACCEPT BITCOIN AT SHOP: Fedi — Wallet tab — Receive — show QR to customer — they scan — instant payment — convert to Naira via Cashwyre anytime. COMMUNITY: ' + community.name + ' has ' + community.memberCount + ' members and ' + community.merchantCount + ' merchants. Led by Aisha Ummi Waziri. Always be warm, direct and human.'
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: history, system, language: activeLang, tts: true })
  })
  if (!response.ok) throw new Error('API ' + response.status)
  const data = await response.json()
  if (data.error) throw new Error(data.error)
  return { text: data.content?.[0]?.text || '', audio: data.audio || null }
}

async function fetchStats() {
  const SB_URL = import.meta.env.VITE_SUPABASE_URL
  const SB_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
  const h = { apikey:SB_KEY, Authorization:`Bearer ${SB_KEY}` }
  const q = (table,params) => fetch(`${SB_URL}/rest/v1/${table}?${params}`,{headers:h}).then(r=>r.json())
  const monthStart = new Date(new Date().getFullYear(),new Date().getMonth(),1).toISOString()
  const weekAgo = new Date(Date.now()-7*24*60*60*1000).toISOString()
  const [allC,weekC,allM,weekM,langD,dailyD,merchants,requests] = await Promise.all([
    q('conversations',`select=id&created_at=gte.${monthStart}`),
    q('conversations',`select=id&created_at=gte.${weekAgo}`),
    q('onboardings',`select=id&type=eq.member&created_at=gte.${monthStart}`),
    q('onboardings',`select=id&type=eq.member&created_at=gte.${weekAgo}`),
    q('conversations',`select=language&created_at=gte.${monthStart}`),
    q('conversations',`select=created_at&created_at=gte.${weekAgo}`),
    q('onboardings',`select=shop_name,location,category,created_at&type=eq.merchant&order=created_at.desc`),
    q('community_requests',`select=name,community,city,created_at&order=created_at.desc&limit=5`),
  ])
  return {
    totalConv: Array.isArray(allC)?allC.length:0,
    weekConv: Array.isArray(weekC)?weekC.length:0,
    totalMemb: Array.isArray(allM)?allM.length:0,
    weekMemb: Array.isArray(weekM)?weekM.length:0,
    langData: Array.isArray(langD)?langD:[],
    dailyData: Array.isArray(dailyD)?dailyD:[],
    merchants: Array.isArray(merchants)?merchants.filter(m=>m.shop_name):[],
    requests: Array.isArray(requests)?requests:[],
  }
}

const B = {
  navy:'#1B2232', navyL:'#222D3F', navyLL:'#2A3650',
  navyB:'rgba(212,168,67,.14)', gold:'#D4A843', goldD:'#A67C2A',
  goldF:'rgba(212,168,67,.08)', goldB:'rgba(212,168,67,.22)',
  white:'#EDF2FF', mid:'#8A9BB5', dim:'#4A5A72',
  green:'#34C77A', teal:'#2DD4BF', tealF:'rgba(45,212,191,.08)',
  tealB:'rgba(45,212,191,.3)', red:'#F87171',
  redF:'rgba(248,113,113,.08)', redB:'rgba(248,113,113,.25)',
  orange:'#F97316', orangeF:'rgba(249,115,22,.08)', orangeB:'rgba(249,115,22,.3)',
  purple:'#A78BFA', purpleF:'rgba(167,139,250,.08)', purpleB:'rgba(167,139,250,.3)',
}

const CSS = `@import url('https://api.fontshare.com/v2/css?f[]=satoshi@300,400,500,700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
body{background:#1B2232;-webkit-font-smoothing:antialiased;}
::-webkit-scrollbar{width:0;}
@keyframes splashOut{from{opacity:1}to{opacity:0}}
@keyframes chatIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes fromLeft{from{opacity:0;transform:translateX(-14px)}to{opacity:1;transform:translateX(0)}}
@keyframes fromRight{from{opacity:0;transform:translateX(14px)}to{opacity:1;transform:translateX(0)}}
@keyframes bounce{0%,60%,100%{transform:scale(1);opacity:.25}30%{transform:scale(1.8);opacity:1}}
@keyframes liveDot{0%,100%{opacity:1}50%{opacity:.35}}
@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.15)}}
@keyframes micRing{0%{box-shadow:0 0 0 0 rgba(212,168,67,.6)}100%{box-shadow:0 0 0 12px rgba(212,168,67,0)}}
@keyframes checkPop{0%{transform:scale(0)}70%{transform:scale(1.15)}100%{transform:scale(1)}}
@keyframes cardSlide{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:translateX(0)}}
@keyframes donePop{from{opacity:0;transform:scale(0.94) translateY(16px)}to{opacity:1;transform:scale(1) translateY(0)}}
@keyframes speakPulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.1);opacity:.7}}
.splash-out{animation:splashOut 0.45s ease forwards;}
.chat-in{animation:chatIn 0.45s cubic-bezier(0.22,1,0.36,1) both;}
.w1{animation:slideUp 0.4s cubic-bezier(0.22,1,0.36,1) 0.00s both;}
.w2{animation:slideUp 0.4s cubic-bezier(0.22,1,0.36,1) 0.07s both;}
.w3{animation:slideUp 0.4s cubic-bezier(0.22,1,0.36,1) 0.14s both;}
.w4{animation:slideUp 0.4s cubic-bezier(0.22,1,0.36,1) 0.21s both;}
.msg-user{animation:fromRight 0.28s cubic-bezier(0.22,1,0.36,1) both;}
.msg-bot{animation:fromLeft 0.28s cubic-bezier(0.22,1,0.36,1) both;}
.card-slide{animation:cardSlide 0.35s cubic-bezier(0.22,1,0.36,1) both;}
.done-pop{animation:donePop 0.5s cubic-bezier(0.22,1,0.36,1) both;}
.speaking{animation:speakPulse 1.5s ease-in-out infinite;}
.prompt-card{transition:transform 0.18s,border-color 0.18s;cursor:pointer;-webkit-tap-highlight-color:transparent;}
.prompt-card:active{transform:scale(0.97);}
.send-btn{transition:transform 0.15s;}
.send-btn:not(:disabled):active{transform:scale(0.96);}
.mic-btn{transition:transform 0.15s;-webkit-tap-highlight-color:transparent;}
.mic-btn.recording{animation:micRing 1s ease-out infinite;}
.yes-btn:active{transform:scale(0.97);}
.choice-btn{transition:all 0.15s;-webkit-tap-highlight-color:transparent;}
.action-cta{transition:transform 0.15s;-webkit-tap-highlight-color:transparent;}
.action-cta:active{transform:scale(0.97);}
.attach-btn{transition:color 0.15s,background 0.15s;-webkit-tap-highlight-color:transparent;}
.chat-input:focus{border-color:#D4A843 !important;box-shadow:0 0 0 3px rgba(212,168,67,.15) !important;outline:none;}
.error-bubble{background:rgba(248,113,113,.08);border:1px solid rgba(248,113,113,.25);border-radius:18px 18px 18px 4px;padding:12px 16px;font-size:13.5px;color:#F87171;line-height:1.6;}
.lang-bar{display:flex;gap:6px;padding:8px 16px;background:#222D3F;border-bottom:1px solid rgba(212,168,67,.14);overflow-x:auto;}
.lang-pill{flex-shrink:0;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:500;cursor:pointer;border:1px solid rgba(212,168,67,.25);color:#8A9BB5;background:transparent;font-family:inherit;transition:all 0.15s;}
.lang-pill.active{background:rgba(212,168,67,.12);border-color:rgba(212,168,67,.5);color:#D4A843;}
.upload-area{border:2px dashed rgba(45,212,191,.4);border-radius:16px;padding:28px 20px;display:flex;flex-direction:column;align-items:center;gap:12px;cursor:pointer;background:rgba(45,212,191,.06);}
.banner-tab{flex:1;padding:10px;border-radius:10px;border:1px solid rgba(212,168,67,.14);background:transparent;color:#8A9BB5;font-size:12px;cursor:pointer;font-family:inherit;transition:all 0.15s;font-weight:500;}
.banner-tab.active{background:rgba(212,168,67,.1);border-color:rgba(212,168,67,.4);color:#D4A843;}
.dl-btn{flex:1;padding:14px;border-radius:14px;border:none;font-weight:700;font-size:14px;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:6px;}
.cat-btn{padding:14px 12px;border-radius:12px;border:1px solid rgba(212,168,67,.2);background:rgba(212,168,67,.04);cursor:pointer;font-family:inherit;text-align:left;transition:all 0.15s;}
.cat-btn.selected{border-color:#D4A843;background:rgba(212,168,67,.12);}
.back-btn{display:flex;align-items:center;gap:6px;background:transparent;border:none;color:#8A9BB5;cursor:pointer;font-family:inherit;font-size:13px;padding:4px 0;}
.stat-pill{border-radius:10px;padding:12px 14px;font-size:13px;font-weight:600;line-height:1.4;}`

const Icons = {
  Mic: () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><rect x="9" y="2" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="2"/><path d="M5 10a7 7 0 0014 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="12" y1="19" x2="12" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  Attach: () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>,
  Send: ({color}) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 19V5M5 12L12 5L19 12" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Speaker: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M11 5L6 9H2v6h4l5 4V5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M19.07 4.93a10 10 0 010 14.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  Download: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  Check: ({color='#2DD4BF'}) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{flexShrink:0,animation:'checkPop 0.4s cubic-bezier(0.22,1,0.36,1) both'}}><circle cx="12" cy="12" r="10" fill={color+'22'} stroke={color} strokeWidth="1.5"/><path d="M8 12l3 3 5-5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Twitter: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/></svg>,
  Back: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M5 12l7 7M5 12l7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
}

function rrect(ctx,x,y,w,h,r) {
  ctx.beginPath()
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r)
  ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h)
  ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r)
  ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath()
}

function SubHeader({ title, titleColor, onBack }) {
  return (
    <div style={{padding:'12px 16px',background:B.navyL,borderBottom:`1px solid ${B.navyB}`,display:'flex',alignItems:'center',gap:12,position:'sticky',top:0,zIndex:10}}>
      <button className="back-btn" onClick={onBack}><Icons.Back/> Back</button>
      <div style={{fontSize:13,fontWeight:600,color:titleColor||B.white,letterSpacing:0.5,textTransform:'uppercase'}}>{title}</div>
    </div>
  )
}

function Progress({ step, total, color }) {
  return (
    <div style={{padding:'10px 16px 0'}}>
      <div style={{height:3,background:'rgba(255,255,255,0.06)',borderRadius:3,overflow:'hidden',marginBottom:10}}>
        <div style={{height:'100%',width:`${(step/total)*100}%`,background:`linear-gradient(90deg,${color},${B.gold})`,borderRadius:3,transition:'width 0.5s cubic-bezier(0.22,1,0.36,1)'}}/>
      </div>
      <div style={{display:'flex',gap:6,justifyContent:'center',marginBottom:12}}>
        {Array.from({length:total}).map((_,i)=>(
          <div key={i} style={{width:8,height:8,borderRadius:'50%',background:i<step?color:i===step?B.gold:'rgba(255,255,255,0.08)',boxShadow:i===step?`0 0 8px ${B.gold}`:'none',transition:'all 0.3s'}}/>
        ))}
      </div>
    </div>
  )
}

function SplashScreen({ onDone }) {
  const [leaving, setLeaving] = useState(false)
  useEffect(() => {
    const t1 = setTimeout(() => setLeaving(true), 1500)
    const t2 = setTimeout(() => onDone(), 1950)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [onDone])
  return (
    <div className={leaving?'splash-out':''} style={{position:'fixed',inset:0,zIndex:999,background:B.navy,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <img src="/logo.png" alt="Sabi AI" style={{width:280,maxWidth:'75vw',height:'auto',objectFit:'contain'}}/>
    </div>
  )
}
function StatsView({ onBack }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

  useEffect(() => {
    fetchStats().then(d=>{setData(d);setLoading(false)}).catch(()=>setLoading(false))
  }, [])

  return (
    <div style={{flex:1,overflowY:'auto',display:'flex',flexDirection:'column'}}>
      <SubHeader title="Impact Dashboard" titleColor={B.gold} onBack={onBack}/>
      <div style={{padding:'16px 16px 40px',display:'flex',flexDirection:'column',gap:14}}>

        <div style={{background:B.navyL,border:`1px solid ${B.goldB}`,borderRadius:16,padding:18,display:'flex',alignItems:'center',gap:14}}>
          <div style={{fontSize:32,flexShrink:0}}>🇳🇬</div>
          <div>
            <div style={{fontSize:14,fontWeight:700,color:B.white,lineHeight:1.3,marginBottom:4}}>Nigeria's Bitcoin AI guide.<br/><span style={{color:B.gold}}>Real people. Real language. Real sats.</span></div>
            <div style={{fontSize:11,color:B.mid}}>Built by Aisha Ummi Waziri · Powered by Fedi</div>
          </div>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
          {[
            {label:'Conversations',value:loading?'—':data?.totalConv??0,delta:loading?'...':`+${data?.weekConv??0} this week`,color:B.gold},
            {label:'Members',      value:loading?'—':data?.totalMemb??0,delta:loading?'...':`+${data?.weekMemb??0} this week`,color:B.teal},
            {label:'Merchants',    value:loading?'—':data?.merchants?.length??0,delta:'Bitcoin Abuja',color:B.orange},
          ].map((s,i)=>(
            <div key={i} style={{background:B.navyL,border:`1px solid ${B.dim}`,borderRadius:14,padding:'14px 10px',position:'relative',overflow:'hidden'}}>
              <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${s.color},${s.color}66)`}}/>
              <div style={{fontSize:9,color:B.mid,letterSpacing:0.5,textTransform:'uppercase',marginBottom:6}}>{s.label}</div>
              <div style={{fontSize:26,fontWeight:900,color:s.color,letterSpacing:-1,marginBottom:3}}>{s.value}</div>
              <div style={{fontSize:9,color:B.green,fontWeight:500,lineHeight:1.3}}>{s.delta}</div>
            </div>
          ))}
        </div>

        <div style={{background:B.navyL,border:`1px solid ${B.dim}`,borderRadius:16,padding:18}}>
          <div style={{fontSize:12,fontWeight:700,color:B.white,marginBottom:14,display:'flex',alignItems:'center',gap:8}}>
            <div style={{width:7,height:7,borderRadius:'50%',background:B.gold}}/>Language Breakdown
          </div>
          {loading ? <div style={{fontSize:12,color:B.dim,textAlign:'center',padding:8}}>Loading...</div> : (() => {
            const lc = {}
            data?.langData?.forEach(r=>{const l=r.language||'en';lc[l]=(lc[l]||0)+1})
            const total = Object.values(lc).reduce((a,b)=>a+b,0)||1
            const sorted = Object.entries(lc).sort((a,b)=>b[1]-a[1])
            if (!sorted.length) return <div style={{fontSize:12,color:B.dim,textAlign:'center',padding:8}}>No data yet</div>
            return sorted.map(([lang,count],i)=>{
              const pct = Math.round((count/total)*100)
              const color = LANG_COLORS_S[lang]||'#8A9BB5'
              return (
                <div key={i} style={{marginBottom:i<sorted.length-1?12:0}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
                    <span style={{fontSize:12,fontWeight:500,color:B.white}}>{LANG_NAMES_S[lang]||lang}</span>
                    <span style={{fontSize:11,color:B.mid}}>{count}</span>
                  </div>
                  <div style={{height:5,background:'rgba(255,255,255,0.06)',borderRadius:3,overflow:'hidden'}}>
                    <div style={{height:'100%',width:`${pct}%`,background:color,borderRadius:3}}/>
                  </div>
                </div>
              )
            })
          })()}
        </div>

        <div style={{background:B.navyL,border:`1px solid ${B.dim}`,borderRadius:16,padding:18}}>
          <div style={{fontSize:12,fontWeight:700,color:B.white,marginBottom:14,display:'flex',alignItems:'center',gap:8}}>
            <div style={{width:7,height:7,borderRadius:'50%',background:B.teal}}/>Daily Conversations
          </div>
          <div style={{height:90,display:'flex',alignItems:'flex-end',gap:5}}>
            {(() => {
              const dc = new Array(7).fill(0)
              data?.dailyData?.forEach(r=>{const d=new Date(r.created_at).getDay();dc[d===0?6:d-1]++})
              const maxC = Math.max(...dc,1)
              const todayIdx = new Date().getDay()===0?6:new Date().getDay()-1
              return dc.map((count,i)=>(
                <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4,height:'100%',justifyContent:'flex-end'}}>
                  <div style={{width:'100%',borderRadius:'4px 4px 2px 2px',background:i===todayIdx?B.gold:`${B.gold}44`,height:`${Math.max((count/maxC)*100,5)}%`,boxShadow:i===todayIdx?`0 0 8px ${B.gold}66`:'none'}}/>
                  <div style={{fontSize:9,color:i===todayIdx?B.gold:B.dim,fontWeight:i===todayIdx?600:400}}>{days[i]}</div>
                </div>
              ))
            })()}
          </div>
        </div>

        <div style={{background:B.navyL,border:`1px solid ${B.dim}`,borderRadius:16,padding:18}}>
          <div style={{fontSize:12,fontWeight:700,color:B.white,marginBottom:14,display:'flex',alignItems:'center',gap:8}}>
            <div style={{width:7,height:7,borderRadius:'50%',background:B.orange}}/>Active Merchants
          </div>
          {loading ? <div style={{fontSize:12,color:B.dim,textAlign:'center',padding:8}}>Loading...</div>
          : !data?.merchants?.length ? <div style={{fontSize:12,color:B.dim,textAlign:'center',padding:8}}>No merchants yet. Be the first!</div>
          : (
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              {data.merchants.map((m,i)=>(
                <div key={i} style={{background:B.navyLL,border:`1px solid ${B.dim}`,borderRadius:10,padding:10,display:'flex',alignItems:'center',gap:8}}>
                  <div style={{width:30,height:30,borderRadius:7,background:`linear-gradient(135deg,${B.gold},${B.goldD})`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,flexShrink:0}}>{CAT_EMOJI[m.category]||'🏪'}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:11,fontWeight:600,color:B.white,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.shop_name}</div>
                    <div style={{fontSize:9,color:B.mid,marginTop:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.location||'Abuja'}</div>
                  </div>
                  <div style={{width:6,height:6,borderRadius:'50%',background:B.green,flexShrink:0}}/>
                </div>
              ))}
            </div>
          )}
        </div>

        {data?.requests?.length > 0 && (
          <div style={{background:B.navyL,border:`1px solid ${B.dim}`,borderRadius:16,padding:18}}>
            <div style={{fontSize:12,fontWeight:700,color:B.white,marginBottom:14,display:'flex',alignItems:'center',gap:8}}>
              <div style={{width:7,height:7,borderRadius:'50%',background:B.purple}}/>Community Requests
            </div>
            {data.requests.map((r,i)=>(
              <div key={i} style={{background:B.navyLL,border:`1px solid ${B.dim}`,borderRadius:10,padding:10,marginBottom:i<data.requests.length-1?8:0}}>
                <div style={{fontSize:12,fontWeight:600,color:B.white}}>{r.name||'Anonymous'} — {r.community||'Unknown'}</div>
                <div style={{fontSize:10,color:B.mid,marginTop:3}}>📍 {r.city||'Unknown'} · {new Date(r.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{fontSize:10,color:B.dim,textAlign:'center',letterSpacing:0.5}}>Bitcoin Abuja · sabibtc.vercel.app · @Ummi_xyz</div>
      </div>
    </div>
  )
}

function JoinCommunityScreen({ community, onDone, onBack, titleColor, title }) {
  return (
    <div style={{flex:1,display:'flex',flexDirection:'column'}}>
      <SubHeader title={title} titleColor={titleColor} onBack={onBack}/>
      <div style={{flex:1,overflowY:'auto',padding:'16px 16px 40px',display:'flex',flexDirection:'column',gap:14}}>
        <div style={{background:B.navyL,borderRadius:20,padding:20,border:`1px solid ${B.orangeB}`,display:'flex',flexDirection:'column',alignItems:'center',gap:14}}>
          <div style={{fontSize:15,fontWeight:600,color:B.white,textAlign:'center',lineHeight:1.5}}>Join {community.name} on Fedi</div>
          <div style={{fontSize:12,color:B.gold,background:B.goldF,border:`1px solid ${B.goldB}`,borderRadius:10,padding:'10px 14px',lineHeight:1.6,textAlign:'center',width:'100%'}}>
            Important: Join a federation from the Wallet tab first — that creates your Bitcoin wallet. Then join this community separately.
          </div>
          <div style={{background:'white',borderRadius:14,padding:12}}>
            <img src={community.communityQR} alt={`${community.name} QR`} style={{width:160,height:160,display:'block'}}/>
          </div>
          <div style={{fontSize:12,color:B.mid,textAlign:'center',lineHeight:1.6}}>Open Fedi → tap the scan icon → scan this QR code</div>
          <button className="action-cta" onClick={()=>{window.location.href=community.communityLink}}
            style={{width:'100%',padding:14,borderRadius:14,border:'none',background:`linear-gradient(135deg,${B.orange},#c2610f)`,color:'white',fontWeight:700,fontSize:14,cursor:'pointer',fontFamily:'inherit',boxShadow:'0 3px 16px rgba(249,115,22,.3)'}}>
            Open {community.name} in Fedi
          </button>
          <button onClick={onDone} style={{background:'transparent',border:'none',color:B.dim,fontSize:12,cursor:'pointer',fontFamily:'inherit'}}>I have already joined ✓</button>
        </div>
        <div style={{fontSize:11,color:B.dim,textAlign:'center'}}>Bitcoin Abuja · Powered by Fedi</div>
      </div>
    </div>
  )
}

function StepCard({ step, feedback, titleColor, onYes, onNo, onSkip }) {
  return (
    <div style={{background:B.navyL,borderRadius:20,padding:22,border:`1px solid ${feedback==='yes'?`${titleColor}40`:feedback==='no'?B.redB:B.navyB}`,transition:'border-color 0.3s',marginBottom:4}}>
      <div style={{fontSize:10,color:B.dim,letterSpacing:1,textTransform:'uppercase',marginBottom:10}}>{step.ins}</div>
      <div style={{fontSize:16,fontWeight:600,color:B.white,lineHeight:1.5,marginBottom:20}}>{step.q}</div>
      {feedback==='yes' && (
        <div style={{display:'flex',alignItems:'flex-start',gap:10,padding:'10px 13px',background:`${titleColor}18`,border:`1px solid ${titleColor}40`,borderRadius:12,marginBottom:14}}>
          <Icons.Check color={titleColor}/><span style={{fontSize:13,color:titleColor,lineHeight:1.5}}>{step.yes}</span>
        </div>
      )}
      {feedback==='no' && (
        <div style={{padding:'13px',background:B.redF,border:`1px solid ${B.redB}`,borderRadius:12,marginBottom:14}}>
          <div style={{fontSize:13,color:B.mid,lineHeight:1.65,marginBottom:12}}>{step.no}</div>
          <button onClick={()=>onNo('reset')} style={{padding:'9px 18px',borderRadius:20,border:`1px solid ${B.navyB}`,background:'transparent',color:B.white,fontSize:12,cursor:'pointer',fontFamily:'inherit'}}>I'm ready now</button>
        </div>
      )}
      {!feedback && (
        <div style={{display:'flex',gap:10,flexDirection:'column'}}>
          <div style={{display:'flex',gap:10}}>
            <button className="yes-btn" onClick={onYes}
              style={{flex:1,padding:14,borderRadius:14,border:'none',background:`linear-gradient(135deg,${titleColor},${titleColor}cc)`,color:titleColor===B.teal?'#0D1A1A':'white',fontWeight:700,fontSize:15,cursor:'pointer',fontFamily:'inherit',boxShadow:`0 3px 16px ${titleColor}44`}}>
              Yes ✓
            </button>
            <button className="no-btn" onClick={()=>onNo('no')}
              style={{flex:1,padding:14,borderRadius:14,border:`1px solid ${B.redB}`,background:B.redF,color:B.red,fontWeight:600,fontSize:15,cursor:'pointer',fontFamily:'inherit'}}>
              Not yet
            </button>
          </div>
          {step.canSkip && (
            <button onClick={onSkip} style={{background:'transparent',border:'none',color:B.dim,fontSize:12,cursor:'pointer',fontFamily:'inherit',textAlign:'center',padding:'4px 0'}}>
              Skip this step
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function ContextCarousel({ cards, onDone, onBack, title, titleColor }) {
  const [idx, setIdx] = useState(0)
  const card = cards[idx]
  const isLast = idx === cards.length - 1

  return (
    <div style={{flex:1,display:'flex',flexDirection:'column'}}>
      <SubHeader title={title} titleColor={titleColor} onBack={onBack}/>
      <div style={{flex:1,overflowY:'auto',padding:'16px 16px 40px',display:'flex',flexDirection:'column',gap:14}}>
        <div style={{height:3,background:'rgba(255,255,255,0.06)',borderRadius:3,overflow:'hidden'}}>
          <div style={{height:'100%',width:`${((idx+1)/cards.length)*100}%`,background:`linear-gradient(90deg,${titleColor},${B.gold})`,borderRadius:3,transition:'width 0.5s'}}/>
        </div>
        <div className="card-slide" key={idx} style={{background:B.navyL,border:`1px solid ${B.navyB}`,borderRadius:20,padding:22,display:'flex',flexDirection:'column',gap:16}}>
          <div style={{fontSize:40}}>{card.icon}</div>
          <div style={{fontSize:18,fontWeight:700,color:B.white,lineHeight:1.3}}>{card.title}</div>
          <div style={{fontSize:14,color:B.mid,lineHeight:1.75}}>{card.body}</div>
          <div className="stat-pill" style={{background:`${card.statColor}18`,border:`1px solid ${card.statColor}33`,color:card.statColor}}>
            {card.stat}
          </div>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span style={{fontSize:11,color:B.dim}}>{idx+1} of {cards.length}</span>
          <div style={{display:'flex',gap:6}}>
            {cards.map((_,i)=><div key={i} style={{width:7,height:7,borderRadius:'50%',background:i===idx?titleColor:'rgba(255,255,255,0.12)',transition:'background 0.3s'}}/>)}
          </div>
        </div>
        {isLast ? (
          <button className="action-cta" onClick={onDone}
            style={{width:'100%',padding:14,borderRadius:14,border:'none',background:`linear-gradient(135deg,${B.orange},#c2610f)`,color:'white',fontWeight:700,fontSize:15,cursor:'pointer',fontFamily:'inherit',boxShadow:'0 3px 16px rgba(249,115,22,.3)'}}>
            I'm ready — let's set up my wallet →
          </button>
        ) : (
          <button className="action-cta" onClick={()=>setIdx(p=>p+1)}
            style={{width:'100%',padding:14,borderRadius:14,border:'none',background:`linear-gradient(135deg,${titleColor},${titleColor}cc)`,color:titleColor===B.teal?'#0D1A1A':'white',fontWeight:700,fontSize:15,cursor:'pointer',fontFamily:'inherit'}}>
            Next →
          </button>
        )}
        <button onClick={onBack} style={{background:'transparent',border:'none',color:B.dim,fontSize:12,cursor:'pointer',fontFamily:'inherit',textAlign:'center'}}>Skip to setup →</button>
      </div>
    </div>
  )
}
function MerchantOnboarding({ onBack, community }) {
  const [phase, setPhase]               = useState('steps')
  const [step, setStep]                 = useState(0)
  const [feedback, setFeedback]         = useState(null)
  const [shopName, setShopName]         = useState('')
  const [shopCategory, setShopCategory] = useState('')
  const [shopLocation, setShopLocation] = useState('')
  const [bannerLang, setBannerLang]     = useState('en')
  const [qrData, setQrData]             = useState(null)
  const [bannerMode, setBannerMode]     = useState('print')
  const [bannerReady, setBannerReady]   = useState(false)
  const canvasRef                       = useRef(null)

  const currentStep = MERCHANT_STEPS[Math.min(step, MERCHANT_STEPS.length-1)]
  const pct = (step/MERCHANT_STEPS.length)*100

  const handleYes = () => {
    setFeedback('yes')
    setTimeout(()=>{ setFeedback(null); setStep(p=>p+1) }, 1000)
  }
  const handleNo = (action) => {
    if (action==='reset') { setFeedback(null); return }
    if (currentStep?.joinScreen) { setPhase('join'); return }
    setFeedback('no')
  }

  useEffect(()=>{ if(step>=MERCHANT_STEPS.length) setPhase('name') },[step])

  useEffect(() => {
    if (phase !== 'banner' || !canvasRef.current || !qrData) return
    setBannerReady(false)
    const canvas = canvasRef.current
    const isPrint = bannerMode === 'print'
    const W = isPrint ? 1240 : 1080
    const H = isPrint ? 620 : 1080
    canvas.width = W; canvas.height = H

    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0,0,W,H)

    const grd = ctx.createLinearGradient(0,0,W,0)
    grd.addColorStop(0,'#1B2232'); grd.addColorStop(0.5,'#2A3650'); grd.addColorStop(1,'#1B2232')
    ctx.fillStyle = grd; ctx.fillRect(0,0,W,isPrint?90:120)
    ctx.fillStyle = '#1B2232'; ctx.fillRect(0,H-(isPrint?70:100),W,isPrint?70:100)
    ctx.fillStyle = '#F97316'; ctx.fillRect(0,isPrint?90:120,W,6)

    const [s1,s2] = BILINGUAL[bannerLang]||BILINGUAL['en']
    const cat = BUSINESS_CATEGORIES.find(c=>c.id===shopCategory)
    const catEmoji = cat?.emoji||'🏪'
    const name = shopName||'Your Shop'
    const loc  = shopLocation||''

    const drawAll = (qrImg, fediImg, btcImg) => {
      if (isPrint) {
        const QS=340,QX=W-QS-80,QY=(H-QS)/2-10
        ctx.fillStyle='#F8F8F8'; rrect(ctx,QX-20,QY-20,QS+40,QS+40,20); ctx.fill()
        if (qrImg) ctx.drawImage(qrImg,QX,QY,QS,QS)
        ctx.fillStyle='#8A9BB5'; ctx.font='18px Arial'; ctx.textBaseline='top'
        ctx.fillText('Scan to pay with Bitcoin Lightning',QX-20,QY+QS+26)
        ctx.font='38px Arial'; ctx.fillText(catEmoji,80,112)
        ctx.fillStyle='#1B2232'; ctx.font='bold 48px Arial'; ctx.fillText(name,80,165)
        ctx.font='bold 40px Arial'; ctx.fillText('now accepts',80,228)
        ctx.fillStyle='#F97316'; ctx.font='bold 70px Arial'; ctx.fillText('Bitcoin  ₿',80,278)
        if (loc) { ctx.fillStyle='#8A9BB5'; ctx.font='22px Arial'; ctx.fillText('📍 '+loc,80,366) }
        ctx.fillStyle='#4A5A72'; ctx.font='24px Arial'; ctx.fillText(s1,80,loc?404:366)
        if (s2) { ctx.fillStyle='#8A9BB5'; ctx.font='20px Arial'; ctx.fillText(s2,80,loc?438:400) }
        ctx.fillStyle='#2DD4BF'; ctx.font='17px Arial'
        ctx.fillText('⚡ Instant  ·  No POS  ·  No transfer fees  ·  24/7',80,475)
        ctx.fillStyle='#FFFFFF'; ctx.font='18px Arial'; ctx.textBaseline='middle'
        ctx.fillText('Bitcoin Abuja  ·  sabibtc.vercel.app',40,H-35)
        if (btcImg) ctx.drawImage(btcImg,W-256,(90-70)/2,240,70)
        if (fediImg) ctx.drawImage(fediImg,W-120,H-50,100,30)
      } else {
        const QS=280,QX=(W-QS)/2,QY=210
        ctx.fillStyle='#F8F8F8'; rrect(ctx,QX-20,QY-20,QS+40,QS+40,20); ctx.fill()
        if (qrImg) ctx.drawImage(qrImg,QX,QY,QS,QS)
        ctx.fillStyle='#8A9BB5'; ctx.font='21px Arial'; ctx.textAlign='center'; ctx.textBaseline='top'
        ctx.fillText('Scan to pay with Bitcoin',W/2,QY+QS+18)
        ctx.fillStyle='#FFFFFF'; ctx.font='bold 32px Arial'; ctx.textBaseline='middle'
        ctx.fillText(catEmoji+' '+name,W/2,50)
        if (loc) { ctx.fillStyle='rgba(255,255,255,0.6)'; ctx.font='18px Arial'; ctx.fillText('📍 '+loc,W/2,80) }
        ctx.fillStyle='#1B2232'; ctx.font='bold 50px Arial'; ctx.textBaseline='top'
        ctx.fillText('now accepts',W/2,594)
        ctx.fillStyle='#F97316'; ctx.font='bold 70px Arial'; ctx.fillText('Bitcoin  ₿',W/2,652)
        ctx.fillStyle='#4A5A72'; ctx.font='26px Arial'; ctx.fillText(s1,W/2,748)
        if (s2) { ctx.fillStyle='#8A9BB5'; ctx.font='22px Arial'; ctx.fillText(s2,W/2,784) }
        ctx.fillStyle='#FFFFFF'; ctx.font='19px Arial'; ctx.textBaseline='middle'
        ctx.fillText('Bitcoin Abuja  ·  Powered by Fedi',W/2,H-58)
        ctx.textAlign='left'; ctx.textBaseline='top'
        if (btcImg) ctx.drawImage(btcImg,(W-180)/2,118,180,46)
        if (fediImg) ctx.drawImage(fediImg,W-108,H-46,88,26)
      }
      setBannerReady(true)
    }

    let loadCount = 0
    const fediImg = new Image(), btcImg = new Image()
    const onLoad = () => {
      loadCount++
      if (loadCount >= 2) {
        const qrImg = new Image()
        qrImg.onload = () => drawAll(qrImg, fediImg, btcImg)
        qrImg.onerror = () => drawAll(null, fediImg, btcImg)
        qrImg.src = qrData
      }
    }
    fediImg.onload = onLoad; fediImg.onerror = onLoad
    btcImg.onload  = onLoad; btcImg.onerror  = onLoad
    fediImg.src = '/fedi-logo-dark.png'
    btcImg.src  = '/bitcoin-abuja-logo.png'
  }, [phase, bannerMode, qrData, shopName, shopLocation, shopCategory, bannerLang])

  if (phase==='sharecard') return <ShareCard type="merchant" shopName={shopName} shopCategory={shopCategory} onClose={onBack}/>

  if (phase==='banner') {
    return (
      <div style={{flex:1,display:'flex',flexDirection:'column'}}>
        <SubHeader title="Your Banner" titleColor={B.teal} onBack={()=>setPhase('upload')}/>
        <div style={{flex:1,overflowY:'auto',padding:'16px 16px 40px',display:'flex',flexDirection:'column',gap:14}}>
          <div style={{display:'flex',gap:8}}>
            {['print','square'].map(m=>(
              <button key={m} className={`banner-tab${bannerMode===m?' active':''}`} onClick={()=>setBannerMode(m)}>
                {m==='print'?'Print (A4)':'Square (Social)'}
              </button>
            ))}
          </div>
          <div style={{borderRadius:14,overflow:'hidden',boxShadow:'0 8px 32px rgba(0,0,0,.5)',background:B.navyL,minHeight:200,display:'flex',alignItems:'center',justifyContent:'center'}}>
            {!bannerReady && <div style={{color:B.mid,fontSize:13,padding:20}}>Generating banner...</div>}
            <canvas ref={canvasRef} style={{width:'100%',height:'auto',display:bannerReady?'block':'none'}}/>
          </div>
          {bannerReady && (
            <>
              <div style={{display:'flex',gap:10}}>
                <button className="dl-btn" style={{background:`linear-gradient(135deg,${B.gold},${B.goldD})`,color:'#0D0A00',boxShadow:'0 3px 16px rgba(212,168,67,.4)'}}
                  onClick={()=>{
                    const n=(shopName||'merchant').toLowerCase().replace(/[^a-z0-9]/g,'-')
                    const a=document.createElement('a')
                    a.download=`${n}-${bannerMode}.png`
                    a.href=canvasRef.current.toDataURL('image/png')
                    a.click()
                  }}>
                  <Icons.Download/> Download
                </button>
                <button className="dl-btn" style={{background:`linear-gradient(135deg,${B.orange},#c2610f)`,color:'white'}} onClick={()=>setPhase('sharecard')}>
                  Share Card →
                </button>
              </div>
              <div style={{fontSize:11,color:B.dim,textAlign:'center'}}>Save to camera roll · WhatsApp to any print shop</div>
            </>
          )}
          <button onClick={onBack} style={{width:'100%',padding:12,borderRadius:14,border:`1px solid ${B.navyB}`,background:'transparent',color:B.mid,fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>← Back to Sabi AI</button>
        </div>
      </div>
    )
  }

  if (phase==='upload') {
    return (
      <div style={{flex:1,display:'flex',flexDirection:'column'}}>
        <SubHeader title="Merchant Setup" titleColor={B.teal} onBack={()=>setPhase('lang')}/>
        <div style={{flex:1,overflowY:'auto',padding:'16px 16px 40px',display:'flex',flexDirection:'column',gap:14}}>
          <div style={{background:B.navyL,borderRadius:20,padding:20,border:`1px solid ${B.tealB}`,display:'flex',flexDirection:'column',gap:14}}>
            <div style={{fontSize:15,fontWeight:600,color:B.white,textAlign:'center',lineHeight:1.5}}>Upload your Fedi payment QR</div>
            <div style={{fontSize:13,color:B.mid,textAlign:'center',lineHeight:1.65}}>Open Fedi → Wallet tab → Receive → screenshot that screen → upload here.</div>
            {!qrData ? (
              <div className="upload-area" onClick={()=>document.getElementById('merQR').click()}>
                <div style={{fontSize:36}}>📸</div>
                <div style={{fontSize:14,color:B.teal,fontWeight:600,textAlign:'center'}}>Tap to upload your QR screenshot</div>
                <div style={{fontSize:11,color:B.dim,textAlign:'center'}}>JPEG or PNG from your camera roll</div>
              </div>
            ) : (
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:10}}>
                <img src={qrData} alt="QR" style={{maxWidth:180,maxHeight:180,borderRadius:12,border:`2px solid ${B.tealB}`}}/>
                <button onClick={()=>document.getElementById('merQR').click()} style={{background:'transparent',border:`1px solid ${B.navyB}`,color:B.dim,fontSize:12,cursor:'pointer',fontFamily:'inherit',padding:'8px 18px',borderRadius:20}}>Upload different image</button>
              </div>
            )}
            <input type="file" id="merQR" accept="image/*" onChange={e=>{
              const f=e.target.files[0]; if(!f) return
              const reader = new FileReader()
              reader.onload = ev => setQrData(ev.target.result)
              reader.readAsDataURL(f)
              e.target.value=''
            }} style={{display:'none'}}/>
            <button disabled={!qrData} onClick={()=>{ logOnboarding('merchant',shopName,shopLocation,shopCategory,community.id); setPhase('banner') }}
              style={{width:'100%',padding:14,borderRadius:14,border:'none',background:qrData?`linear-gradient(135deg,${B.teal},#0ea5a0)`:B.navyLL,color:qrData?'#0D1A1A':B.dim,fontWeight:700,fontSize:15,cursor:qrData?'pointer':'default',fontFamily:'inherit',boxShadow:qrData?'0 3px 16px rgba(45,212,191,.3)':'none'}}>
              Generate My Banner ✦
            </button>
          </div>
          <div style={{fontSize:11,color:B.dim,textAlign:'center'}}>Bitcoin Abuja · Powered by Fedi</div>
        </div>
      </div>
    )
  }

  if (phase==='lang') {
    return (
      <div style={{flex:1,display:'flex',flexDirection:'column'}}>
        <SubHeader title="Merchant Setup" titleColor={B.teal} onBack={()=>setPhase('location')}/>
        <div style={{flex:1,overflowY:'auto',padding:'16px 16px 40px',display:'flex',flexDirection:'column',gap:10}}>
          <div style={{fontSize:15,fontWeight:600,color:B.white,marginBottom:4}}>Choose your banner language</div>
          {[
            {key:'en',    title:'English only',     sub:'"now accepts Bitcoin · Scan to pay"'},
            {key:'en-ha', title:'English + Hausa',  sub:'"now accepts Bitcoin · Muna karbar Bitcoin"'},
            {key:'en-yo', title:'English + Yoruba', sub:'"now accepts Bitcoin · A gba Bitcoin"'},
            {key:'en-ig', title:'English + Igbo',   sub:'"now accepts Bitcoin · Anyị na-anabata Bitcoin"'},
            {key:'en-pc', title:'English + Pidgin', sub:'"now accepts Bitcoin · We dey collect Bitcoin"'},
          ].map(o=>(
            <button key={o.key} onClick={()=>{setBannerLang(o.key);setPhase('upload')}}
              style={{padding:'14px 16px',borderRadius:14,border:`1px solid ${B.navyB}`,background:B.navyL,cursor:'pointer',fontFamily:'inherit',textAlign:'left',width:'100%'}}>
              <div style={{fontSize:14,fontWeight:600,color:B.white,marginBottom:3}}>{o.title}</div>
              <div style={{fontSize:11.5,color:B.dim}}>{o.sub}</div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (phase==='location') {
    return (
      <div style={{flex:1,display:'flex',flexDirection:'column'}}>
        <SubHeader title="Merchant Setup" titleColor={B.teal} onBack={()=>setPhase('category')}/>
        <div style={{flex:1,overflowY:'auto',padding:'16px 16px 40px',display:'flex',flexDirection:'column',gap:14}}>
          <div style={{fontSize:15,fontWeight:600,color:B.white}}>Where is your shop located?</div>
          <div style={{fontSize:13,color:B.mid}}>This helps customers find you on BTCMap.</div>
          <input value={shopLocation} onChange={e=>setShopLocation(e.target.value)} placeholder="e.g. Wuse Market, Abuja"
            style={{padding:'14px 16px',background:B.navy,border:`1px solid ${B.navyB}`,borderRadius:14,fontSize:14,color:B.white,fontFamily:'inherit',outline:'none'}}/>
          <button onClick={()=>setPhase('lang')}
            style={{padding:14,borderRadius:14,border:'none',background:shopLocation.trim()?`linear-gradient(135deg,${B.teal},#0ea5a0)`:B.navyLL,color:shopLocation.trim()?'#0D1A1A':B.dim,fontWeight:600,fontSize:15,cursor:shopLocation.trim()?'pointer':'default',fontFamily:'inherit'}}>
            Continue
          </button>
          <button onClick={()=>setPhase('lang')} style={{background:'transparent',border:'none',color:B.dim,fontSize:12,cursor:'pointer',fontFamily:'inherit',textAlign:'center'}}>
            Skip — continue without location
          </button>
        </div>
      </div>
    )
  }

  if (phase==='category') {
    return (
      <div style={{flex:1,display:'flex',flexDirection:'column'}}>
        <SubHeader title="Merchant Setup" titleColor={B.teal} onBack={()=>setPhase('name')}/>
        <div style={{flex:1,overflowY:'auto',padding:'16px 16px 40px',display:'flex',flexDirection:'column',gap:14}}>
          <div style={{fontSize:15,fontWeight:600,color:B.white}}>What type of business is this?</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            {BUSINESS_CATEGORIES.map(c=>(
              <button key={c.id} className={`cat-btn${shopCategory===c.id?' selected':''}`} onClick={()=>setShopCategory(c.id)}>
                <div style={{fontSize:22,marginBottom:6}}>{c.emoji}</div>
                <div style={{fontSize:12.5,fontWeight:500,color:B.white,lineHeight:1.3}}>{c.label}</div>
              </button>
            ))}
          </div>
          <button onClick={()=>setPhase('location')} disabled={!shopCategory}
            style={{padding:14,borderRadius:14,border:'none',background:shopCategory?`linear-gradient(135deg,${B.teal},#0ea5a0)`:B.navyLL,color:shopCategory?'#0D1A1A':B.dim,fontWeight:600,fontSize:15,cursor:shopCategory?'pointer':'default',fontFamily:'inherit',marginTop:4}}>
            Continue
          </button>
        </div>
      </div>
    )
  }

  if (phase==='name') {
    return (
      <div style={{flex:1,display:'flex',flexDirection:'column'}}>
        <SubHeader title="Merchant Setup" titleColor={B.teal} onBack={onBack}/>
        <div style={{flex:1,overflowY:'auto',padding:'16px 16px 40px',display:'flex',flexDirection:'column',gap:14}}>
          <div style={{fontSize:15,fontWeight:600,color:B.white}}>What is your shop or business name?</div>
          <input value={shopName} onChange={e=>setShopName(e.target.value)} placeholder="e.g. Fatima's Fashion, Musa Suya Joint…"
            style={{padding:'14px 16px',background:B.navy,border:`1px solid ${B.navyB}`,borderRadius:14,fontSize:14,color:B.white,fontFamily:'inherit',outline:'none'}}/>
          <button onClick={()=>setPhase('category')}
            style={{padding:14,borderRadius:14,border:'none',background:shopName.trim()?`linear-gradient(135deg,${B.teal},#0ea5a0)`:B.navyLL,color:shopName.trim()?'#0D1A1A':B.dim,fontWeight:600,fontSize:15,cursor:shopName.trim()?'pointer':'default',fontFamily:'inherit'}}>
            Continue
          </button>
          <button onClick={()=>setPhase('category')} style={{background:'transparent',border:'none',color:B.dim,fontSize:12,cursor:'pointer',fontFamily:'inherit',textAlign:'center'}}>
            Skip — continue without name
          </button>
        </div>
      </div>
    )
  }

  if (phase==='join') {
    return <JoinCommunityScreen community={community} onDone={()=>{setPhase('steps');setStep(p=>p+1)}} onBack={()=>setPhase('steps')} titleColor={B.teal} title="Merchant Setup"/>
  }

  return (
    <div style={{flex:1,display:'flex',flexDirection:'column'}}>
      <SubHeader title="Merchant Setup" titleColor={B.teal} onBack={onBack}/>
      <Progress step={step} total={MERCHANT_STEPS.length} color={B.teal}/>
      <div style={{flex:1,overflowY:'auto',padding:'0 16px 40px'}}>
        <StepCard step={currentStep} feedback={feedback} titleColor={B.teal}
          onYes={handleYes} onNo={handleNo} onSkip={()=>setStep(p=>p+1)}/>
        <div style={{fontSize:11,color:B.dim,textAlign:'center',marginTop:16}}>Bitcoin Abuja · Powered by Fedi</div>
      </div>
    </div>
  )
}
function MemberOnboarding({ onBack, community }) {
  const [phase, setPhase]             = useState('choice')
  const [learnStep, setLearnStep]     = useState(0)
  const [step, setStep]               = useState(0)
  const [feedback, setFeedback]       = useState(null)
  const [contextType, setContextType] = useState(null)

  const currentStep = MEMBER_STEPS[Math.min(step, MEMBER_STEPS.length-1)]

  const handleYes = () => {
    setFeedback('yes')
    setTimeout(()=>{
      setFeedback(null)
      if (step===MEMBER_STEPS.length-1) { logOnboarding('member',null,null,null,community.id); setPhase('done') }
      else setStep(p=>p+1)
    }, 1000)
  }
  const handleNo = (action) => {
    if (action==='reset') { setFeedback(null); return }
    if (currentStep?.joinScreen) { setPhase('join'); return }
    setFeedback('no')
  }

  if (phase==='sharecard') return <ShareCard type="member" onClose={onBack}/>

  if (phase==='done') {
    return (
      <div style={{flex:1,display:'flex',flexDirection:'column'}}>
        <SubHeader title="Welcome" titleColor={B.orange} onBack={onBack}/>
        <div style={{flex:1,overflowY:'auto',padding:'20px 16px 40px',display:'flex',flexDirection:'column',gap:14}}>
          <div className="done-pop" style={{background:B.navyL,border:`1px solid ${B.orangeB}`,borderRadius:20,padding:24,display:'flex',flexDirection:'column',alignItems:'center',gap:14,textAlign:'center'}}>
            <div style={{fontSize:52}}>₿</div>
            <div style={{fontSize:20,fontWeight:700,color:B.orange,lineHeight:1.3}}>Welcome to {community.name}!</div>
            <div style={{fontSize:13,color:B.mid,lineHeight:1.65,maxWidth:280}}>You are now part of a real Bitcoin circular economy in Nigeria. Your sats are yours — no bank, no middleman.</div>
          </div>
          <div style={{background:B.navy,border:'1px solid rgba(212,168,67,.2)',borderRadius:16,padding:18,display:'flex',flexDirection:'column',gap:10}}>
            <div style={{fontSize:11,color:B.gold,fontWeight:600,letterSpacing:1,textTransform:'uppercase'}}>🎁 100 Free Sats Waiting</div>
            <div style={{fontSize:13.5,color:B.white,lineHeight:1.6}}>The {community.name} Sats Faucet has 100 free sats for new members. This is your first real Bitcoin — proof of ownership. Stack more via Cashwyre when you are ready. Even 500 Naira a week adds up significantly over time.</div>
            <button className="action-cta" onClick={()=>window.open(community.faucetLink,'_blank')}
              style={{width:'100%',padding:13,borderRadius:12,border:'none',background:`linear-gradient(135deg,${B.gold},${B.goldD})`,color:'#0D0A00',fontWeight:700,fontSize:14,cursor:'pointer',fontFamily:'inherit',boxShadow:'0 3px 12px rgba(212,168,67,.35)'}}>
              Claim My 100 Free Sats →
            </button>
          </div>
          <button className="action-cta" onClick={()=>setPhase('sharecard')}
            style={{width:'100%',padding:14,borderRadius:14,border:'none',background:`linear-gradient(135deg,${B.orange},#c2610f)`,color:'white',fontWeight:700,fontSize:14,cursor:'pointer',fontFamily:'inherit',boxShadow:'0 3px 16px rgba(249,115,22,.3)'}}>
            Share Your Bitcoin Card ✦
          </button>
          <button onClick={onBack}
            style={{width:'100%',padding:12,borderRadius:14,border:`1px solid ${B.navyB}`,background:'transparent',color:B.mid,fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>
            Back to Sabi AI
          </button>
        </div>
      </div>
    )
  }

  if (phase==='join') {
    return <JoinCommunityScreen community={community} onDone={()=>{setPhase('steps');setStep(p=>p+1)}} onBack={()=>setPhase('steps')} titleColor={B.orange} title="New Member Setup"/>
  }

  if (phase==='context') {
    const cards = CONTEXT_CARDS[contextType]||[]
    return <ContextCarousel cards={cards} title={contextType==='savings'?'Why Bitcoin?':'Why Lightning?'} titleColor={B.orange}
      onBack={()=>setPhase('choice')} onDone={()=>{setPhase('steps');setStep(0)}}/>
  }

  if (phase==='learn') {
    const card = LEARN_CARDS[learnStep]
    const isLast = learnStep===LEARN_CARDS.length-1
    return (
      <div style={{flex:1,display:'flex',flexDirection:'column'}}>
        <SubHeader title="Bitcoin Basics" titleColor={B.purple} onBack={()=>learnStep>0?setLearnStep(p=>p-1):setPhase('choice')}/>
        <div style={{height:3,background:'rgba(255,255,255,0.06)',margin:'10px 16px 0',borderRadius:3,overflow:'hidden'}}>
          <div style={{height:'100%',width:`${((learnStep+1)/LEARN_CARDS.length)*100}%`,background:`linear-gradient(90deg,${B.purple},${B.teal})`,borderRadius:3,transition:'width 0.5s'}}/>
        </div>
        <div style={{flex:1,overflowY:'auto',padding:'14px 16px 40px',display:'flex',flexDirection:'column',gap:14}}>
          <div className="card-slide" key={learnStep} style={{background:B.navyL,border:`1px solid ${B.purpleB}`,borderRadius:20,padding:22,display:'flex',flexDirection:'column',gap:14}}>
            <div style={{fontSize:36}}>{card.icon}</div>
            <div style={{fontSize:17,fontWeight:700,color:B.white,lineHeight:1.3}}>{card.title}</div>
            <div style={{fontSize:13.5,color:B.mid,lineHeight:1.75}}>{card.body}</div>
            <div style={{background:B.purpleF,border:`1px solid ${B.purpleB}`,borderRadius:12,padding:'13px 15px',fontSize:13,color:B.purple,lineHeight:1.6}}>{card.highlight}</div>
          </div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{fontSize:11,color:B.dim}}>{learnStep+1} of {LEARN_CARDS.length}</span>
            <div style={{display:'flex',gap:5}}>
              {LEARN_CARDS.map((_,i)=><div key={i} style={{width:6,height:6,borderRadius:'50%',background:i===learnStep?B.purple:'rgba(255,255,255,0.12)',transition:'background 0.3s'}}/>)}
            </div>
          </div>
          {isLast ? (
            <button className="action-cta" onClick={()=>{setPhase('steps');setStep(0)}}
              style={{width:'100%',padding:14,borderRadius:14,border:'none',background:`linear-gradient(135deg,${B.orange},#c2610f)`,color:'white',fontWeight:700,fontSize:15,cursor:'pointer',fontFamily:'inherit',boxShadow:'0 3px 16px rgba(249,115,22,.3)'}}>
              I'm ready — set up my wallet →
            </button>
          ) : (
            <button className="action-cta" onClick={()=>setLearnStep(p=>p+1)}
              style={{width:'100%',padding:14,borderRadius:14,border:'none',background:`linear-gradient(135deg,${B.purple},#7c3aed)`,color:'white',fontWeight:700,fontSize:15,cursor:'pointer',fontFamily:'inherit',boxShadow:'0 3px 16px rgba(167,139,250,.3)'}}>
              Next →
            </button>
          )}
          <div style={{fontSize:11,color:B.dim,textAlign:'center'}}>Bitcoin Abuja · Powered by Fedi</div>
        </div>
      </div>
    )
  }

  if (phase==='steps') {
    return (
      <div style={{flex:1,display:'flex',flexDirection:'column'}}>
        <SubHeader title="New Member Setup" titleColor={B.orange} onBack={()=>step>0?setStep(p=>p-1):setPhase('choice')}/>
        <Progress step={step} total={MEMBER_STEPS.length} color={B.orange}/>
        <div style={{flex:1,overflowY:'auto',padding:'0 16px 40px'}}>
          <StepCard step={currentStep} feedback={feedback} titleColor={B.orange}
            onYes={handleYes} onNo={handleNo} onSkip={()=>setStep(p=>p+1)}/>
          <div style={{fontSize:11,color:B.dim,textAlign:'center',marginTop:16}}>Bitcoin Abuja · Powered by Fedi</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{flex:1,display:'flex',flexDirection:'column'}}>
      <SubHeader title="New Member Setup" titleColor={B.orange} onBack={onBack}/>
      <div style={{flex:1,overflowY:'auto',padding:'16px 16px 40px',display:'flex',flexDirection:'column',gap:12}}>
        <div style={{fontSize:16,fontWeight:700,color:B.white,lineHeight:1.4,marginBottom:4}}>What brings you to {community.name}?</div>
        <div style={{fontSize:13,color:B.mid,lineHeight:1.6,marginBottom:8}}>Choose what matters most to you. We will show you exactly why Bitcoin is the right tool — then get you set up.</div>
        {[
          { icon:'📉', label:'Protect my savings from Naira inflation', sub:'See how Bitcoin protects your money — with real numbers', type:'savings',    color:B.gold },
          { icon:'⚡', label:'Send money without bank fees',             sub:'See how much you can save on every transfer',          type:'remittance', color:B.teal },
          { icon:'📚', label:'Learn about Bitcoin first',               sub:'5 short cards covering everything you need to know',   type:'learn',      color:B.purple },
          { icon:'🚀', label:'I know Bitcoin — just set me up',         sub:'Skip straight to wallet setup',                       type:'skip',       color:B.orange },
        ].map((c,i)=>(
          <button key={i} className="choice-btn"
            onClick={()=>{
              if(c.type==='learn') setPhase('learn')
              else if(c.type==='skip') { setPhase('steps'); setStep(0) }
              else { setContextType(c.type); setPhase('context') }
            }}
            style={{width:'100%',padding:'16px',borderRadius:16,border:`1px solid ${c.color}33`,background:`${c.color}08`,cursor:'pointer',fontFamily:'inherit',textAlign:'left',display:'flex',gap:14,alignItems:'flex-start'}}>
            <div style={{fontSize:26,flexShrink:0,marginTop:2}}>{c.icon}</div>
            <div>
              <div style={{fontSize:14,fontWeight:600,color:B.white,lineHeight:1.3,marginBottom:4}}>{c.label}</div>
              <div style={{fontSize:11.5,color:B.mid,lineHeight:1.4}}>{c.sub}</div>
            </div>
          </button>
        ))}
        <div style={{fontSize:11,color:B.dim,textAlign:'center',marginTop:4}}>Bitcoin Abuja · Powered by Fedi</div>
      </div>
    </div>
  )
}
export default function App() {
  const communityId = getCommunityFromURL()
  const community   = COMMUNITIES[communityId] || COMMUNITIES['bitcoin-abuja']

  const [splashDone, setSplashDone]     = useState(false)
  const [btc, setBtc]                   = useState({usd:96300,ngn:154000000})
  const [messages, setMessages]         = useState([])
  const [displayMsgs, setDisplayMsgs]   = useState([])
  const [inputText, setInputText]       = useState('')
  const [isLoading, setIsLoading]       = useState(false)
  const [isSpeaking, setIsSpeaking]     = useState(false)
  const [attachedFile, setAttachedFile] = useState(null)
  const [activeLang, setActiveLang]     = useState('en')
  const [isRecording, setIsRecording]   = useState(false)
  const [voiceSupported, setVS]         = useState(false)
  const [micError, setMicError]         = useState('')
  const [mode, setMode]                 = useState('chat')
  const messagesEndRef = useRef(null)
  const fileInputRef   = useRef(null)
  const recognitionRef = useRef(null)

  const satNgn  = btc ? (btc.ngn/100000000).toFixed(2) : '1.54'
  const welcome = WELCOME_BY_LANG[activeLang] || WELCOME_BY_LANG.en
  const prompts = PROMPTS_BY_LANG[activeLang] || PROMPTS_BY_LANG.en

  useEffect(()=>{
    fetchBTC().then(setBtc)
    const iv=setInterval(()=>fetchBTC().then(setBtc),180000)
    if(window.SpeechRecognition||window.webkitSpeechRecognition) setVS(true)
    return ()=>clearInterval(iv)
  },[])

  useEffect(()=>{ messagesEndRef.current?.scrollIntoView({behavior:'smooth'}) },[displayMsgs,isLoading])

  const startRecording = useCallback(()=>{
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition
    if(!SR){setMicError('Voice not supported on this browser.');return}
    setMicError('')
    const go=()=>{
      const r=new SR()
      r.lang={en:'en-NG',ha:'ha',yo:'yo',ig:'ig',pc:'en-NG'}[activeLang]||'en-NG'
      r.continuous=false; r.interimResults=false
      r.onstart=()=>setIsRecording(true)
      r.onresult=e=>{const t=Array.from(e.results).map(x=>x[0].transcript).join('');setInputText(t)}
      r.onspeechend=()=>r.stop()
      r.onend=()=>{setIsRecording(false);recognitionRef.current=null}
      r.onerror=e=>{
        setIsRecording(false);recognitionRef.current=null
        if(e.error==='not-allowed') setMicError('Microphone blocked. Allow mic in browser settings.')
        else setMicError('Voice error. Please type instead.')
      }
      recognitionRef.current=r
      try{r.start()}catch(e){setMicError('Could not start voice.')}
    }
    if(navigator.mediaDevices?.getUserMedia) navigator.mediaDevices.getUserMedia({audio:true}).then(go).catch(()=>setMicError('Microphone access denied.'))
    else go()
  },[activeLang])

  const stopRecording=useCallback(()=>{recognitionRef.current?.stop();setIsRecording(false)},[])
  const toggleMic=useCallback(()=>{if(isRecording)stopRecording();else startRecording()},[isRecording,startRecording,stopRecording])

  const handleFileChange=async e=>{
    const file=e.target.files[0];if(!file)return
    const isImage=file.type.startsWith('image/')
    const isPDF=file.type==='application/pdf'
    if(!isImage&&!isPDF)return
    const base64=await fileToBase64(file)
    const previewUrl=isImage?URL.createObjectURL(file):null
    setAttachedFile({type:isImage?'image':'pdf',base64,mediaType:file.type,name:file.name,previewUrl})
    e.target.value=''
  }

  const sendMessage=async textOverride=>{
    const text=(textOverride||inputText).trim()
    if(text==='__MERCHANT__'){setMode('merchant');return}
    if(text==='__MEMBER__'){setMode('member');return}
    const file=attachedFile
    if(!text&&!file)return
    if(isLoading)return
    if(messages.length===0&&text){const d=detectLang(text);if(d!=='en')setActiveLang(d)}
    setInputText('');setAttachedFile(null);setMicError('')
    setDisplayMsgs(p=>[...p,{r:'user',c:text,file}])
    const parts=[]
    if(file){
      if(file.type==='image') parts.push({type:'image',source:{type:'base64',media_type:file.mediaType,data:file.base64}})
      else parts.push({type:'document',source:{type:'base64',media_type:'application/pdf',data:file.base64}})
    }
    parts.push({type:'text',text:text||'Please look at this and help me understand it.'})
    const newHistory=[...messages,{role:'user',content:parts}]
    setMessages(newHistory)
    setIsLoading(true)
    try {
      const {text:reply,audio}=await sendToAI(newHistory,btc,activeLang,community)
      logConversation(activeLang,community.id)
      setMessages(p=>[...p,{role:'assistant',content:[{type:'text',text:reply}]}])
      setDisplayMsgs(p=>[...p,{r:'bot',c:reply}])
      if(audio){
        setIsSpeaking(true)
        await speakElevenLabs(audio)
        setTimeout(()=>setIsSpeaking(false),500)
      } else if(activeLang!=='en'&&activeLang!=='pc'){
        setIsSpeaking(true)
        speakDevice(reply,activeLang)
        const chk=setInterval(()=>{if(!window.speechSynthesis?.speaking){setIsSpeaking(false);clearInterval(chk)}},300)
      }
    } catch(err){
      const errMsg=ERROR_BY_LANG[activeLang]||ERROR_BY_LANG.en
      setDisplayMsgs(p=>[...p,{r:'error',c:errMsg}])
      setMessages(p=>[...p,{role:'assistant',content:[{type:'text',text:errMsg}]}])
    }
    setIsLoading(false)
  }

  const handleKeyDown=e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage()}}
  const stopSpeaking=()=>{window.speechSynthesis?.cancel();setIsSpeaking(false)}
  const hasMessages=displayMsgs.length>0
  const langLabels={en:'EN',ha:'HA',yo:'YO',ig:'IG',pc:'PID'}
  const wrap = children => (
    <div style={{background:B.navy,minHeight:'100dvh',maxWidth:440,margin:'0 auto',fontFamily:"'Satoshi',-apple-system,sans-serif",color:B.white,display:'flex',flexDirection:'column'}}>
      <style>{CSS}</style>
      {children}
    </div>
  )

  if(mode==='merchant') return wrap(<MerchantOnboarding onBack={()=>setMode('chat')} community={community}/>)
  if(mode==='member')   return wrap(<MemberOnboarding   onBack={()=>setMode('chat')} community={community}/>)
  if(mode==='request')  return wrap(<CommunityRequestForm onBack={()=>setMode('chat')}/>)
  if(mode==='stats')    return wrap(<StatsView onBack={()=>setMode('chat')}/>)

  return wrap(
    <>
      {!splashDone&&<SplashScreen onDone={()=>setSplashDone(true)}/>}
      <div className={splashDone?'chat-in':''} style={{display:'flex',flexDirection:'column',flex:1}}>

        <div style={{padding:'12px 16px',background:B.navyL,borderBottom:`1px solid ${B.navyB}`,display:'flex',justifyContent:'space-between',alignItems:'center',position:'sticky',top:0,zIndex:10}}>
          <img src={community.appLogo} alt="Sabi AI" style={{height:34,width:'auto',objectFit:'contain'}}/>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            {isSpeaking&&(
              <button onClick={stopSpeaking} className="speaking"
                style={{display:'flex',alignItems:'center',gap:5,background:'rgba(45,212,191,.1)',border:`1px solid ${B.tealB}`,borderRadius:100,padding:'4px 10px',fontSize:11,color:B.teal,cursor:'pointer',fontFamily:'inherit'}}>
                <Icons.Speaker/> Stop
              </button>
            )}
            <button onClick={()=>setMode('stats')}
              style={{fontSize:10,color:B.dim,background:'transparent',border:`1px solid ${B.dim}`,borderRadius:8,padding:'4px 8px',cursor:'pointer',fontFamily:'inherit',letterSpacing:0.5}}>
              Stats
            </button>
            <div style={{display:'flex',alignItems:'center',gap:7,background:B.goldF,border:`1px solid ${B.goldB}`,borderRadius:100,padding:'5px 13px'}}>
              <div style={{width:6,height:6,borderRadius:'50%',background:B.green,animation:'liveDot 2s ease infinite'}}/>
              <span style={{fontSize:11,fontWeight:500,color:B.white}}>1 sat</span>
              <span style={{fontSize:12,fontWeight:700,color:B.gold}}>₦{satNgn}</span>
            </div>
          </div>
        </div>

        <div className="lang-bar">
          {Object.entries(langLabels).map(([code,label])=>(
            <button key={code} className={`lang-pill${activeLang===code?' active':''}`} onClick={()=>setActiveLang(code)}>{label}</button>
          ))}
        </div>

        <div style={{flex:1,overflowY:'auto',display:'flex',flexDirection:'column'}}>
          {!hasMessages&&!isLoading&&(
            <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'28px 20px 20px'}}>
              <h1 className="w1" style={{fontSize:24,fontWeight:700,color:B.white,textAlign:'center',marginBottom:10}}>{welcome.greeting}</h1>
              <p className="w2" style={{fontSize:14,color:B.mid,textAlign:'center',lineHeight:1.65,marginBottom:6,maxWidth:290}}>{welcome.sub}</p>
              <p className="w2" style={{fontSize:11,color:B.dim,textAlign:'center',marginBottom:4,letterSpacing:0.4}}>{welcome.langs}</p>
              <p className="w2" style={{fontSize:11,color:B.dim,textAlign:'center',marginBottom:22}}>Joined by {community.memberCount} members across Nigeria</p>
              <div className="w3" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,width:'100%',maxWidth:360}}>
                {prompts.map((p,i)=>{
                  const isMer=p.msg==='__MERCHANT__', isMem=p.msg==='__MEMBER__'
                  return (
                    <button key={i} onClick={()=>sendMessage(p.msg)} className="prompt-card"
                      style={{background:B.navyL,border:`1px solid ${isMer?B.tealB:isMem?B.orangeB:B.navyB}`,borderRadius:16,padding:'16px 14px 14px',textAlign:'left',boxShadow:'0 2px 12px rgba(0,0,0,.3)',fontFamily:'inherit'}}>
                      <div style={{width:20,height:3,borderRadius:2,background:isMer?B.teal:isMem?B.orange:i%2===0?B.gold:B.goldD,marginBottom:12}}/>
                      <div style={{fontSize:13,fontWeight:400,color:B.white,lineHeight:1.4}}>{p.label}</div>
                    </button>
                  )
                })}
              </div>
              {voiceSupported&&(
                <div className="w4" style={{marginTop:16,display:'flex',alignItems:'center',gap:6,color:B.dim,fontSize:11}}>
                  <Icons.Mic/><span>Speak in any language — Sabi understands you</span>
                </div>
              )}
            </div>
          )}

          {hasMessages&&(
            <div style={{padding:'16px 16px 8px',display:'flex',flexDirection:'column',gap:16}}>
              {displayMsgs.map((msg,i)=>(
                <div key={i} className={msg.r==='user'?'msg-user':'msg-bot'} style={{display:'flex',justifyContent:msg.r==='user'?'flex-end':'flex-start',alignItems:'flex-start',gap:9}}>
                  {msg.r!=='user'&&<img src={community.appLogo} alt="Sabi" style={{width:32,height:32,objectFit:'contain',flexShrink:0,marginTop:2}}/>}
                  <div style={{maxWidth:'80%',display:'flex',flexDirection:'column',alignItems:msg.r==='user'?'flex-end':'flex-start',gap:5}}>
                    {msg.r==='error'?(
                      <div className="error-bubble">{msg.c}</div>
                    ):(
                      <div style={{padding:'12px 16px',fontSize:14,lineHeight:1.75,whiteSpace:'pre-wrap',fontFamily:'inherit',
                        ...(msg.r==='user'
                          ?{background:`linear-gradient(135deg,${B.gold},${B.goldD})`,color:'#0D0A00',fontWeight:600,borderRadius:'18px 18px 4px 18px',boxShadow:'0 3px 14px rgba(212,168,67,.3)'}
                          :{background:B.navyL,color:B.white,borderRadius:'18px 18px 18px 4px',border:`1px solid ${B.navyB}`})}}>
                        {msg.file&&(
                          <div style={{marginBottom:msg.c?8:0}}>
                            {msg.file.type==='image'&&msg.file.previewUrl
                              ?<img src={msg.file.previewUrl} alt="attachment" style={{maxWidth:200,maxHeight:160,borderRadius:10,display:'block',objectFit:'cover'}}/>
                              :<div style={{display:'inline-flex',alignItems:'center',gap:6,background:'rgba(212,168,67,.15)',border:'1px solid rgba(212,168,67,.3)',borderRadius:8,padding:'5px 10px',fontSize:11,color:B.gold}}>{msg.file.name}</div>
                            }
                          </div>
                        )}
                        {msg.c}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading&&(
                <div className="msg-bot" style={{display:'flex',alignItems:'flex-start',gap:9}}>
                  <img src={community.appLogo} alt="Sabi" style={{width:32,height:32,objectFit:'contain',flexShrink:0,marginTop:2}}/>
                  <div style={{background:B.navyL,borderRadius:'18px 18px 18px 4px',padding:'14px 18px',border:`1px solid ${B.navyB}`}}>
                    <div style={{display:'flex',gap:5,alignItems:'center'}}>
                      {[0,1,2].map(j=><div key={j} style={{width:7,height:7,borderRadius:'50%',background:B.gold,animation:`bounce 1.2s ${j*0.15}s ease-in-out infinite`}}/>)}
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef}/>
            </div>
          )}
        </div>

        <div style={{padding:'12px 16px 20px',background:B.navyL,borderTop:`1px solid ${B.navyB}`,position:'sticky',bottom:0}}>
          {isRecording&&(
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8,padding:'8px 12px',background:B.goldF,border:`1px solid ${B.goldB}`,borderRadius:12}}>
              <div style={{width:8,height:8,borderRadius:'50%',background:B.gold,animation:'pulse 1s ease-in-out infinite'}}/>
              <span style={{fontSize:12,color:B.gold,fontWeight:500}}>Listening… tap mic to stop</span>
            </div>
          )}
          {micError&&(
            <div style={{marginBottom:8,padding:'8px 12px',background:B.redF,border:`1px solid ${B.redB}`,borderRadius:12}}>
              <span style={{fontSize:12,color:B.red}}>{micError}</span>
            </div>
          )}
          {attachedFile&&(
            <div style={{display:'flex',alignItems:'center',gap:8,background:B.navy,border:`1px solid ${B.navyB}`,borderRadius:12,padding:'7px 10px',marginBottom:8,maxWidth:260}}>
              {attachedFile.type==='image'&&attachedFile.previewUrl
                ?<img src={attachedFile.previewUrl} alt="preview" style={{width:34,height:34,borderRadius:7,objectFit:'cover',flexShrink:0}}/>
                :<div style={{width:34,height:34,borderRadius:7,background:B.navyLL,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>📄</div>
              }
              <span style={{fontSize:11.5,color:B.white,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{attachedFile.name}</span>
              <button onClick={()=>setAttachedFile(null)} style={{width:20,height:20,borderRadius:'50%',background:B.navyLL,border:'none',color:B.mid,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,flexShrink:0}}>✕</button>
            </div>
          )}
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp,application/pdf" onChange={handleFileChange} style={{display:'none'}}/>
            <button className="attach-btn" onClick={()=>fileInputRef.current?.click()}
              style={{width:40,height:40,borderRadius:12,background:attachedFile?B.goldF:'transparent',border:`1px solid ${attachedFile?B.goldB:B.navyB}`,color:attachedFile?B.gold:B.dim,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <Icons.Attach/>
            </button>
            <input className="chat-input" value={inputText} onChange={e=>setInputText(e.target.value)} onKeyDown={handleKeyDown}
              placeholder={isRecording?'Listening…':attachedFile?'Add a question… (optional)':'Ask anything…'}
              style={{flex:1,padding:'13px 18px',background:B.navy,border:`1px solid ${B.navyB}`,borderRadius:28,fontSize:14,color:B.white,fontFamily:'inherit',transition:'border-color 0.2s,box-shadow 0.2s'}}/>
            {voiceSupported&&!inputText.trim()&&!attachedFile&&(
              <button className={`mic-btn${isRecording?' recording':''}`} onClick={toggleMic}
                style={{width:46,height:46,borderRadius:'50%',border:'none',background:isRecording?`linear-gradient(135deg,${B.gold},${B.goldD})`:B.navyLL,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,color:isRecording?'#0D0A00':B.mid,boxShadow:isRecording?'0 3px 16px rgba(212,168,67,.5)':'none'}}>
                <Icons.Mic/>
              </button>
            )}
            {(inputText.trim()||attachedFile)&&(
              <button onClick={()=>sendMessage()} disabled={isLoading} className="send-btn"
                style={{width:46,height:46,borderRadius:'50%',border:'none',background:!isLoading?`linear-gradient(135deg,${B.gold},${B.goldD})`:B.navyLL,cursor:!isLoading?'pointer':'default',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,boxShadow:!isLoading?'0 3px 16px rgba(212,168,67,.4)':'none'}}>
                <Icons.Send color={!isLoading?'#0D0A00':B.dim}/>
              </button>
            )}
          </div>
          <div style={{display:'flex',justifyContent:'center',alignItems:'center',gap:16,marginTop:8}}>
            <div style={{fontSize:9,color:B.dim,letterSpacing:0.8}}>Bitcoin Abuja · Powered by Fedi</div>
            <button onClick={()=>setMode('request')} style={{fontSize:9,color:B.dim,background:'transparent',border:'none',cursor:'pointer',fontFamily:'inherit',letterSpacing:0.5,textDecoration:'underline'}}>
              Bring Sabi to your community
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

function rrect(ctx,x,y,w,h,r) {
  ctx.beginPath()
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r)
  ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h)
  ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r)
  ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath()
}
