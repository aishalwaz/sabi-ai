import { useState, useEffect, useRef, useCallback } from 'react'

async function fetchBTC() {
  try {
    const r = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,ngn')
    const d = await r.json()
    if (d?.bitcoin?.usd) return d.bitcoin
  } catch (e) {}
  return { usd: 96300, ngn: 154000000 }
}

function speak(text) {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const clean = text.replace(/[①②③④⑤⑥⑦⑧→₿⚡●#*•]/g, ' ')
  const u = new SpeechSynthesisUtterance(clean)
  u.rate = 0.9
  window.speechSynthesis.speak(u)
}

function fileToBase64(file) {
  return new Promise((res, rej) => {
    const reader = new FileReader()
    reader.onload = () => res(reader.result.split(',')[1])
    reader.onerror = () => rej(new Error('Failed to read file'))
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
  const score  = (list) => words.filter(w => list.includes(w)).length
  const scores = { ha: score(hausa), yo: score(yoruba), ig: score(igbo), pc: score(pidgin) }
  const top    = Object.entries(scores).sort((a, b) => b[1] - a[1])[0]
  return top[1] > 0 ? top[0] : 'en'
}

const COMMUNITY_LINK = 'fedi:community210v3xzat5dphhyhmsw43xketeygazycehvscnydmzxsmxzvnyx4jkze3jv5ek2e3jvycxvep4x4jnydtzvscrve35x4nrxd3hx33nxdfk893kgwpkvsenxvpnvvukyen9v3sjytpzvdhk6mt4de5hg72lw46kjezldpjhsg36ygmr2vt98ycnscejveskxef5vsex2ct9x3jnqcm98ycxxvtyxqmxxetxvgcrgvmpx43rxdeexsexvenyvyekgdf4vd3xzvtrv93ngvmrygkzyer9vde8jur5d9hkuhmtv4ujyw3zxe85umetgc6rj56ddyh4qntsd4ujk2m4v4s4wn2sfa6ksntnfed85nnz2enxzstpfdrrs0fz05uvt3ry'
const FAUCET_LINK    = 'https://prod.fedi-faucet.dev.fedibtc.com/c/9651a0b10fd1deafbaf4df554dc4bf85'

const PROMPTS_BY_LANG = {
  en: [
    { label: 'Buy BTC with Naira',        msg: 'How do I buy Bitcoin with Naira on Fedi?' },
    { label: 'Sat price in Naira',         msg: 'What is 1 sat worth in Naira right now?' },
    { label: 'Accept Bitcoin at my shop',  msg: '__MERCHANT__' },
    { label: 'New to Bitcoin? Start here', msg: '__MEMBER__' },
  ],
  ha: [
    { label: 'Saya Bitcoin da Naira',      msg: 'Ta yaya zan saya Bitcoin da Naira a Fedi?' },
    { label: 'Farashin sat a Naira',       msg: 'Nawa ne 1 sat a Naira yanzu?' },
    { label: 'Karbi Bitcoin a kantin na',  msg: '__MERCHANT__' },
    { label: 'Sabon zuwa Bitcoin?',        msg: '__MEMBER__' },
  ],
  yo: [
    { label: 'Ra Bitcoin pelu Naira',      msg: 'Bawo ni mo se le ra Bitcoin pelu Naira lori Fedi?' },
    { label: 'Iye sat ni Naira',           msg: 'Elo ni 1 sat ni Naira ni bayi?' },
    { label: 'Gba Bitcoin ni ile itaja mi',msg: '__MERCHANT__' },
    { label: 'Tuntun si Bitcoin?',         msg: '__MEMBER__' },
  ],
  ig: [
    { label: 'Zuo Bitcoin na Naira',       msg: 'Kedu ka m ga-esi zuo Bitcoin na Naira na Fedi?' },
    { label: 'Onu ego sat na Naira',       msg: 'Ego ole bu 1 sat na Naira ugbu a?' },
    { label: "Nata Bitcoin n'ulo ahia m",  msg: '__MERCHANT__' },
    { label: 'Ohuru na Bitcoin?',          msg: '__MEMBER__' },
  ],
  pc: [
    { label: 'Buy Bitcoin with Naira',     msg: 'Abeg how I go take buy Bitcoin with Naira for Fedi?' },
    { label: 'How much be 1 sat',          msg: 'How much be 1 sat in Naira right now?' },
    { label: 'Accept Bitcoin for my shop', msg: '__MERCHANT__' },
    { label: 'New to Bitcoin?',            msg: '__MEMBER__' },
  ],
}

const WELCOME_BY_LANG = {
  en: { greeting: 'How can I help you?',            sub: 'Ask me anything — Bitcoin, Fedi, merchants, savings, payments, or anything else on your mind.',                           langs: 'English · Hausa · Yoruba · Igbo · Pidgin' },
  ha: { greeting: 'Ina iya taimaka maka?',          sub: 'Tambaye ni komai — Bitcoin, Fedi, yan kasuwa, ajiya, biyan kudi, ko kowane tambaya da kake da ita.',                     langs: 'Hausa · English · Yoruba · Igbo · Pidgin' },
  yo: { greeting: 'Bawo ni mo se le ran o lowo?',   sub: 'Beere ohunkohun — Bitcoin, Fedi, awon onisowo, ifowopamo, awon isanwo, tabi ohunkohun ti o wa lori okan re.',            langs: 'Yoruba · Hausa · English · Igbo · Pidgin' },
  ig: { greeting: 'Kedu ka m ga-esi nyere gi aka?', sub: "Juo m ihe o bula — Bitcoin, Fedi, ndi ahia, nchekwa ego, ugwo, ma o bu ihe o bula di n'obi gi.",                        langs: 'Igbo · Hausa · Yoruba · English · Pidgin' },
  pc: { greeting: 'How I fit help you?',            sub: 'Ask me anything — Bitcoin, Fedi, merchants, savings, payments, or any other thing wey dey your mind.',                   langs: 'Pidgin · Hausa · Yoruba · Igbo · English' },
}

const ERROR_BY_LANG = {
  en: "Sabi couldn't respond right now. Please check your connection and try again. If the problem continues, contact Aisha directly in the community.",
  ha: "Sabi bai iya amsa yanzu ba. Da fatan za a duba hadin ku ku sake gwadawa. Idan matsalar ta ci gaba, tuntubi Aisha kai tsaye.",
  yo: "Sabi ko le dahun ni bayi. Jowo sayewo asopo re ki o tun gbiyanju. Ti isoro naa ba tesiwaju, kan si Aisha taara.",
  ig: "Sabi enwehi ike iza ugbu a. Biko lelee njiko gi ma gbalia ozo. O buru na nsogbu ahu na-aga n'ihu, kpoturu Aisha ozugbo.",
  pc: "Sabi no fit answer now. Abeg check your connection and try again. If e no work, reach Aisha directly for the community.",
}

const LEARN_CARDS = [
  {
    icon: '₿',
    title: 'What is Bitcoin?',
    body: 'Bitcoin is digital money that no bank or government controls. There will only ever be 21 million Bitcoins — forever. Nobody can print more. You own it completely and nobody can freeze it or take it from you.',
    highlight: 'Think of it like cash — except you can send it anywhere in the world in under 1 second at almost zero cost.',
  },
  {
    icon: '📉',
    title: 'Why does this matter for Nigerians?',
    body: 'Since 2020 the Naira has lost over 80% of its value. If you saved 1,000,000 Naira in 2020 it now buys what 200,000 Naira could then. Bitcoin cannot be inflated. Its supply is fixed forever at 21 million.',
    highlight: 'Nigerians who saved even 10% of their income in Bitcoin since 2020 are significantly better off today.',
  },
  {
    icon: '⚡',
    title: 'What is a Satoshi?',
    body: 'You do not need to buy a whole Bitcoin. The smallest unit is called a satoshi or sat. 1 Bitcoin = 100,000,000 sats. Right now 1 sat costs about 1 Naira. You can start with just 500 Naira worth of sats.',
    highlight: 'Stack sats weekly — even 500 Naira a week adds up. Small amounts today can become significant wealth over time.',
  },
  {
    icon: '🌍',
    title: 'What is Lightning Network?',
    body: 'Lightning is a layer on top of Bitcoin that makes payments instant — under 1 second — and nearly free — less than 1 Naira per transaction. You can send to Lagos, London, or New York instantly.',
    highlight: 'Fedi uses Lightning for all payments automatically. You never need to understand the technical details — it just works.',
  },
]

const MERCHANT_STEPS = [
  { ins: 'Step 1 of 6 — Install Fedi',              q: 'Do you have the Fedi app installed on your phone?',                                                                                    yes: "Great. Let's move on.",                                                                                                     no: 'Download Fedi from the App Store or Google Play — search "Fedi Bitcoin". Come back when installed.' },
  { ins: 'Step 2 of 6 — Join a Federation',          q: 'Open Fedi and tap the Wallet tab. You will see options to join a federation — join any available one. This creates your Bitcoin wallet. Done?', yes: 'Your Bitcoin wallet is ready.',                                                                                            no: 'Tap the Wallet tab at the bottom of Fedi. You will see options to join a federation. Pick any one — this is where your Bitcoin will live.' },
  { ins: 'Step 3 of 6 — Join Bitcoin Abuja',         q: 'Now join the Bitcoin Abuja community. This is separate from your wallet — it is the community space. Have you joined?',               yes: 'Welcome to the community.',                                                                                                 no: "Let us get you in right now.", joinScreen: true },
  { ins: 'Step 4 of 6 — Secure your wallet',         q: 'Have you backed up your wallet recovery words on paper?',                                                                             yes: 'Excellent. Your funds are protected.',                                                                                      no: 'Open Fedi → Profile → Personal Backup → write every word on physical paper. Never screenshot them. Come back when done.' },
  { ins: 'Step 5 of 6 — Fund your wallet (optional)',q: 'Have you added any sats to your wallet? You can skip this — you can receive payments without having sats first.',                     yes: 'Good. You have sats ready.',                                                                                               no: 'No problem. You can receive Bitcoin payments with zero balance. Move on.', canSkip: true },
  { ins: 'Step 6 of 6 — Get your payment QR',        q: 'Open Fedi → tap Wallet tab → tap Receive. You should see your payment QR code. Can you see it?',                                    yes: "You're ready. Let's build your banner.",                                                                                   no: 'Make sure you are on the Wallet tab at the bottom of Fedi. Tap Receive and your QR code will appear.' },
]

const MEMBER_STEPS = [
  { ins: 'Step 1 of 4 — Install Fedi',      q: 'Do you have the Fedi app installed on your phone?',                                                                                      yes: "Great. Let's move on.",          no: 'Download Fedi from the App Store or Google Play — search "Fedi Bitcoin". Come back when installed.' },
  { ins: 'Step 2 of 4 — Join a Federation', q: 'Open Fedi and tap the Wallet tab. Join any available federation — this creates your Bitcoin wallet. Have you done this?',               yes: 'Your wallet is ready.',          no: 'Tap the Wallet tab at the bottom of Fedi. You will see options to join a federation. Pick any one — this gives you your Bitcoin wallet.' },
  { ins: 'Step 3 of 4 — Join Bitcoin Abuja',q: 'Now join the Bitcoin Abuja community. Separate from your wallet — this is where the community lives. Have you joined?',                 yes: 'Welcome in.',                    no: "Let us get you in right now.", joinScreen: true },
  { ins: 'Step 4 of 4 — Secure your wallet',q: 'Have you written your wallet recovery words on paper?',                                                                                 yes: "You're all set. Let's finish.",  no: 'Open Fedi → Profile → Personal Backup → write every word on physical paper. Never screenshot them. Come back when done.' },
]

const BILINGUAL = {
  'en':    ['Scan to pay  ·  Instant  ·  No POS needed', null],
  'en-ha': ['Scan to pay  ·  Instant  ·  No POS needed', 'Danna don biya  ·  Nan take  ·  Ba POS da ake bukata'],
  'en-yo': ['Scan to pay  ·  Instant  ·  No POS needed', 'Scan lati san  ·  Lẹsẹkẹsẹ  ·  Ko si POS ti o nilo'],
  'en-ig': ['Scan to pay  ·  Instant  ·  No POS needed', 'Scan iji kwụọ  ·  Ozugbo  ·  Enweghị mkpa POS'],
  'en-pc': ['Scan to pay  ·  Fast fast  ·  No POS needed', 'Scan pay am  ·  Instant  ·  No POS wahala'],
}

async function sendToAI(history, btc) {
  const satN  = btc ? (btc.ngn / 100000000).toFixed(2) : '1.54'
  const kSat  = btc ? Math.round(btc.ngn / 100000).toLocaleString() : '1,540'
  const tenK  = btc ? Math.round(btc.ngn / 10000).toLocaleString() : '15,400'
  const hundK = btc ? Math.round(btc.ngn / 1000).toLocaleString() : '154,000'
  const usd   = btc ? btc.usd.toLocaleString() : '96,300'
  const ngnM  = btc ? (btc.ngn / 1000000).toFixed(0) : '154'

  const system = `You are Sabi — the AI guide for Bitcoin Abuja, a Bitcoin circular economy community in Nigeria built on the Fedi app.

CRITICAL INSTRUCTION — LANGUAGE:
Detect the language the user writes in and respond in THAT EXACT LANGUAGE.
Hausa → Hausa. Yoruba → Yoruba. Igbo → Igbo. Pidgin → Pidgin. English → English.

CRITICAL FORMATTING:
NEVER use asterisks, markdown bold, italic, or any symbols. No ** no * no ##. Plain conversational text only. Use numbers like 1. 2. 3. for lists.

PERSONALITY:
Warm, direct, knowledgeable — like a trusted Bitcoin expert from Nigeria. Speak like a real Nigerian. Match depth to the question. Never cut short on important topics.

LIVE BITCOIN PRICES:
1 satoshi = ₦${satN}
1,000 sats = ₦${kSat}
10,000 sats = ₦${tenK}
100,000 sats = ₦${hundK}
1 Bitcoin = $${usd} = ₦${ngnM}M NGN

FEDI MINI APPS IN BITCOIN ABUJA:
BTC Map — find Bitcoin merchants near you across Nigeria
My First Bitcoin — free Bitcoin education course for beginners
Cashwyre — buy or sell Bitcoin with Naira (bank transfer, no ID needed)
LnESIM — buy phone credit and mobile data using Bitcoin Lightning instantly
PayPerQ — AI chat giving access to multiple AI models, pay per prompt
Sats Faucet — claim free 100 sats (for Bitcoin Abuja community members)
Sabi AI — that is me, your Bitcoin guide

HOW TO GET STARTED ON FEDI:
1. Download Fedi from App Store or Google Play — search Fedi Bitcoin
2. Open Fedi and tap the Wallet tab — join any available federation — this creates your Bitcoin wallet
3. Separately join the Bitcoin Abuja community by scanning the community QR code or using the invite link
4. Back up your recovery words immediately — Profile → Personal Backup → write on paper, never screenshot

HOW TO BUY BITCOIN WITH NAIRA via Cashwyre:
1. Open Fedi → Community tab → Mini Apps → tap Cashwyre
2. Tap Crypto Onramp → select NGN
3. Enter amount (minimum 2,000 Naira)
4. Cashwyre gives you a Nigerian bank account number
5. Transfer from any bank — GTB, Access, Zenith, Opay, Kuda, any bank
6. Wait 5 to 10 minutes → sats appear in your wallet
No ID required. No paperwork.

HOW TO SELL BITCOIN FOR NAIRA:
Open Fedi → Mini Apps → Cashwyre → Crypto Offramp → enter amount → enter bank details → Naira arrives in minutes.

HOW TO ACCEPT BITCOIN AT YOUR SHOP:
1. Open Fedi → tap Wallet tab → tap Receive
2. You see a QR code — this is your payment address
3. Screenshot it and print it or display it at your counter
4. Customer scans with any Bitcoin wallet → payment arrives instantly
5. Convert to Naira anytime via Cashwyre Offramp
No POS machine. No fees. Works 24/7.

HOW TO FIND BITCOIN MERCHANTS:
Use BTC Map mini app inside Fedi or visit btcmap.org. Shows every merchant in Nigeria accepting Bitcoin.

WHAT IS BITCOIN:
Digital money with a fixed supply of 21 million coins forever. No bank or government controls it. You own it completely. The Naira has lost over 80% of its value since 2020. Bitcoin cannot be inflated.

WHAT IS FEDI:
A Bitcoin app combining a Lightning wallet, community chat, and mini apps. Your Bitcoin is held by a federation — a group of trusted community members — not one company that can fail or freeze your funds.

WALLET BACKUP:
Profile → Personal Backup → write recovery words on physical paper. Never screenshot. Those words are your money. Lose phone but have words: full recovery. Lose both: permanent loss.

LIGHTNING NETWORK:
Makes Bitcoin payments instant under 1 second and nearly free under 1 Naira per transaction. Fedi uses it automatically.

BITCOIN ABUJA:
A Bitcoin circular economy in Abuja, Nigeria. 60 plus members, 6 active merchants in Abuja and Minna. Weekly education classes. Led by Aisha Ummi Waziri. Uses Fedi as platform.

SCOPE:
You serve all Nigerians. Think Nigeria-wide. Bitcoin merchants exist in Lagos, Abuja, Kano, Port Harcourt, Ibadan and across the country.

KEEP RESPONSES:
Match depth to question. Numbers for steps, plain text elsewhere. Warm and human. Always in the user's language. Never use asterisks or markdown.`

  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: history, system })
  })
  if (!response.ok) throw new Error(`API ${response.status}`)
  const data = await response.json()
  if (data.error) throw new Error(data.error)
  return data.content?.[0]?.text || 'Something went wrong. Please try again.'
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

const CSS = `
  @import url('https://api.fontshare.com/v2/css?f[]=satoshi@300,400,500,700&display=swap');
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
  @keyframes pulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.15);opacity:.7}}
  @keyframes micRing{0%{box-shadow:0 0 0 0 rgba(212,168,67,.6)}100%{box-shadow:0 0 0 12px rgba(212,168,67,0)}}
  @keyframes checkPop{0%{transform:scale(0)}70%{transform:scale(1.15)}100%{transform:scale(1)}}
  @keyframes cardSlide{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:translateX(0)}}
  @keyframes donePop{from{opacity:0;transform:scale(0.94) translateY(16px)}to{opacity:1;transform:scale(1) translateY(0)}}
  @keyframes bannerIn{from{opacity:0;transform:scale(0.96)}to{opacity:1;transform:scale(1)}}

  .splash-out{animation:splashOut 0.45s ease forwards;}
  .chat-in{animation:chatIn 0.45s cubic-bezier(0.22,1,0.36,1) both;}
  .w1{animation:slideUp 0.4s cubic-bezier(0.22,1,0.36,1) 0.00s both;}
  .w2{animation:slideUp 0.4s cubic-bezier(0.22,1,0.36,1) 0.07s both;}
  .w3{animation:slideUp 0.4s cubic-bezier(0.22,1,0.36,1) 0.14s both;}
  .w4{animation:slideUp 0.4s cubic-bezier(0.22,1,0.36,1) 0.21s both;}
  .msg-user{animation:fromRight 0.28s cubic-bezier(0.22,1,0.36,1) both;}
  .msg-bot{animation:fromLeft 0.28s cubic-bezier(0.22,1,0.36,1) both;}
  .flow-in{animation:chatIn 0.35s cubic-bezier(0.22,1,0.36,1) both;}
  .card-slide{animation:cardSlide 0.35s cubic-bezier(0.22,1,0.36,1) both;}
  .done-pop{animation:donePop 0.5s cubic-bezier(0.22,1,0.36,1) both;}
  .banner-in{animation:bannerIn 0.5s cubic-bezier(0.22,1,0.36,1) both;}

  .prompt-card{transition:transform 0.18s,box-shadow 0.18s,border-color 0.18s;cursor:pointer;-webkit-tap-highlight-color:transparent;}
  .prompt-card:hover{transform:translateY(-2px);}
  .prompt-card:active{transform:scale(0.97);}
  .send-btn{transition:transform 0.15s,box-shadow 0.15s,background 0.15s;}
  .send-btn:not(:disabled):hover{transform:scale(1.08);}
  .send-btn:not(:disabled):active{transform:scale(0.96);}
  .mic-btn{transition:transform 0.15s,box-shadow 0.15s;-webkit-tap-highlight-color:transparent;}
  .mic-btn:hover{transform:scale(1.08);}
  .mic-btn:active{transform:scale(0.94);}
  .mic-btn.recording{animation:micRing 1s ease-out infinite;}
  .listen-btn{transition:color 0.15s;cursor:pointer;-webkit-tap-highlight-color:transparent;}
  .listen-btn:hover{color:#D4A843 !important;}
  .chat-input:focus{border-color:#D4A843 !important;box-shadow:0 0 0 3px rgba(212,168,67,.15) !important;outline:none;}
  .attach-btn{transition:color 0.15s,background 0.15s;-webkit-tap-highlight-color:transparent;}
  .attach-btn:hover{color:#D4A843 !important;background:rgba(212,168,67,.1) !important;}

  .yes-btn{transition:transform 0.15s;-webkit-tap-highlight-color:transparent;}
  .yes-btn:hover{transform:scale(1.03);}
  .yes-btn:active{transform:scale(0.97);}
  .no-btn{transition:transform 0.15s;-webkit-tap-highlight-color:transparent;}
  .no-btn:hover{transform:scale(1.03);}
  .choice-btn{transition:all 0.15s;-webkit-tap-highlight-color:transparent;}
  .choice-btn:hover{background:rgba(249,115,22,.18) !important;}
  .action-cta{transition:transform 0.15s,box-shadow 0.15s;-webkit-tap-highlight-color:transparent;}
  .action-cta:hover{transform:scale(1.02);}
  .learn-next{transition:transform 0.15s;-webkit-tap-highlight-color:transparent;}
  .learn-next:hover{transform:scale(1.04);}

  .error-bubble{background:rgba(248,113,113,.08);border:1px solid rgba(248,113,113,.25);border-radius:18px 18px 18px 4px;padding:12px 16px;font-size:13.5px;color:#F87171;line-height:1.6;}
  .msg-file-pill{display:inline-flex;align-items:center;gap:6px;background:rgba(212,168,67,.15);border:1px solid rgba(212,168,67,.3);border-radius:8px;padding:5px 10px;font-size:11px;color:#D4A843;margin-bottom:6px;max-width:200px;overflow:hidden;}
  .msg-file-pill span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .lang-bar{display:flex;gap:6px;padding:8px 16px;background:#222D3F;border-bottom:1px solid rgba(212,168,67,.14);overflow-x:auto;}
  .lang-pill{flex-shrink:0;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:500;cursor:pointer;border:1px solid rgba(212,168,67,.25);color:#8A9BB5;background:transparent;font-family:inherit;transition:all 0.15s;-webkit-tap-highlight-color:transparent;}
  .lang-pill.active,.lang-pill:hover{background:rgba(212,168,67,.12);border-color:rgba(212,168,67,.5);color:#D4A843;}

  .upload-area{border:2px dashed rgba(45,212,191,.4);border-radius:16px;padding:24px 20px;display:flex;flex-direction:column;align-items:center;gap:10px;cursor:pointer;transition:all 0.2s;background:rgba(45,212,191,.08);}
  .upload-area:hover{border-color:#2DD4BF;background:rgba(45,212,191,.14);}
  .banner-tab{flex:1;padding:9px;border-radius:10px;border:1px solid rgba(212,168,67,.14);background:transparent;color:#8A9BB5;font-size:12px;cursor:pointer;font-family:inherit;transition:all 0.15s;font-weight:500;}
  .banner-tab.active{background:rgba(212,168,67,.1);border-color:rgba(212,168,67,.4);color:#D4A843;}
  .dl-btn{flex:1;padding:13px;border-radius:14px;border:none;font-weight:700;font-size:14px;cursor:pointer;font-family:inherit;transition:transform 0.15s,box-shadow 0.15s;display:flex;align-items:center;justify-content:center;gap:6px;}
  .dl-btn:hover{transform:scale(1.03);}
`

function SpeakerIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <path d="M11 5L6 9H2v6h4l5 4V5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M19.07 4.93a10 10 0 010 14.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M15.54 8.46a5 5 0 010 7.07" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}
function MicIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <rect x="9" y="2" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="2"/>
      <path d="M5 10a7 7 0 0014 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="12" y1="19" x2="12" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}
function AttachIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
    </svg>
  )
}
function SendIcon({ color }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M12 19V5M5 12L12 5L19 12" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
function CheckIcon({ color = '#2DD4BF' }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, animation: 'checkPop 0.4s cubic-bezier(0.22,1,0.36,1) both' }}>
      <circle cx="12" cy="12" r="10" fill={color === '#2DD4BF' ? 'rgba(45,212,191,0.15)' : 'rgba(249,115,22,0.12)'} stroke={color} strokeWidth="1.5"/>
      <path d="M8 12l3 3 5-5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function SplashScreen({ onDone }) {
  const [leaving, setLeaving] = useState(false)
  useEffect(() => {
    const t1 = setTimeout(() => setLeaving(true), 1800)
    const t2 = setTimeout(() => onDone(), 2250)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [onDone])
  return (
    <div className={leaving ? 'splash-out' : ''} style={{ position:'fixed', inset:0, zIndex:999, background:B.navy, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <img src="/logo.png" alt="Sabi AI" style={{ width:280, maxWidth:'75vw', height:'auto', objectFit:'contain' }}/>
    </div>
  )
}

// ── Merchant Banner Generator ──
function drawBanner(canvas, shopName, bannerLang, qrDataURL, btcAbujaLogo) {
  const ctx = canvas.getContext('2d')
  const isPrint = canvas.dataset.mode === 'print'
  const W = isPrint ? 1240 : 1080
  const H = isPrint ? 620  : 1080
  canvas.width  = W
  canvas.height = H

  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, W, H)

  const g = ctx.createLinearGradient(0, 0, W, 0)
  g.addColorStop(0, '#1B2232'); g.addColorStop(0.5, '#2A3650'); g.addColorStop(1, '#1B2232')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, isPrint ? 90 : 120)
  ctx.fillStyle = '#1B2232'
  ctx.fillRect(0, H - (isPrint ? 70 : 100), W, isPrint ? 70 : 100)
  ctx.fillStyle = '#F97316'
  ctx.fillRect(0, isPrint ? 90 : 120, W, 6)

  const [s1, s2] = BILINGUAL[bannerLang] || BILINGUAL['en']
  const name = shopName || 'Your Shop'

  const render = (qrImg) => {
    if (isPrint) {
      const QS = 340, QX = W - QS - 80, QY = (H - QS) / 2 - 10
      ctx.fillStyle = '#F8F8F8'; rr(ctx, QX-20, QY-20, QS+40, QS+40, 20); ctx.fill()
      ctx.strokeStyle = '#E8E8E8'; ctx.lineWidth = 2; rr(ctx, QX-20, QY-20, QS+40, QS+40, 20); ctx.stroke()
      if (qrImg) ctx.drawImage(qrImg, QX, QY, QS, QS)
      ctx.fillStyle = '#8A9BB5'; ctx.font = '500 20px Satoshi,Arial'; ctx.textBaseline = 'top'
      ctx.fillText('Scan to pay with Bitcoin Lightning', QX - 20, QY + QS + 26)
      ctx.fillStyle = '#1B2232'; ctx.font = 'bold 44px Satoshi,Arial'; ctx.fillText(name, 80, 118)
      ctx.fillStyle = '#1B2232'; ctx.font = 'bold 64px Satoshi,Arial'; ctx.fillText('We Accept', 80, 188)
      ctx.fillStyle = '#F97316'; ctx.font = 'bold 72px Satoshi,Arial'; ctx.fillText('Bitcoin  ₿', 80, 264)
      ctx.fillStyle = '#4A5A72'; ctx.font = '500 28px Satoshi,Arial'; ctx.fillText(s1, 80, 364)
      if (s2) { ctx.fillStyle = '#8A9BB5'; ctx.font = '400 24px Satoshi,Arial'; ctx.fillText(s2, 80, 403) }
      ctx.fillStyle = '#2DD4BF'; ctx.font = '500 19px Satoshi,Arial'
      ctx.fillText('⚡ Instant  ·  ✓ No POS machine  ·  ✓ No transfer fees  ·  ✓ Works 24/7', 80, 460)
      ctx.fillStyle = '#FFFFFF'; ctx.font = '500 20px Satoshi,Arial'; ctx.textBaseline = 'middle'
      ctx.fillText('Bitcoin Abuja  ·  Powered by Fedi  ·  sabibtc.vercel.app', 40, H - 35)
      if (btcAbujaLogo) ctx.drawImage(btcAbujaLogo, W - 310, 10, 270, 68)
    } else {
      const QS = 300, QX = (W - QS) / 2, QY = 250
      ctx.fillStyle = '#F8F8F8'; rr(ctx, QX-24, QY-24, QS+48, QS+48, 24); ctx.fill()
      if (qrImg) ctx.drawImage(qrImg, QX, QY, QS, QS)
      ctx.fillStyle = '#8A9BB5'; ctx.font = '500 22px Satoshi,Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'top'
      ctx.fillText('Scan to pay with Bitcoin', W/2, QY + QS + 22)
      ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 36px Satoshi,Arial'; ctx.textBaseline = 'middle'; ctx.fillText(name, W/2, 54)
      ctx.fillStyle = '#1B2232'; ctx.font = 'bold 68px Satoshi,Arial'; ctx.textBaseline = 'top'; ctx.fillText('We Accept', W/2, 640)
      ctx.fillStyle = '#F97316'; ctx.font = 'bold 76px Satoshi,Arial'; ctx.fillText('Bitcoin  ₿', W/2, 718)
      ctx.fillStyle = '#4A5A72'; ctx.font = '500 30px Satoshi,Arial'; ctx.fillText(s1, W/2, 816)
      if (s2) { ctx.fillStyle = '#8A9BB5'; ctx.font = '400 25px Satoshi,Arial'; ctx.fillText(s2, W/2, 858) }
      ctx.fillStyle = '#FFFFFF'; ctx.font = '500 22px Satoshi,Arial'; ctx.textBaseline = 'middle'
      ctx.fillText('Bitcoin Abuja  ·  Powered by Fedi', W/2, H - 50)
      ctx.textAlign = 'left'; ctx.textBaseline = 'top'
      if (btcAbujaLogo) ctx.drawImage(btcAbujaLogo, (W - 220) / 2, 130, 220, 54)
    }
  }

  if (qrDataURL) {
    const qi = new Image(); qi.onload = () => render(qi); qi.src = qrDataURL
  } else {
    render(null)
  }
}

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x+r, y); ctx.lineTo(x+w-r, y); ctx.quadraticCurveTo(x+w, y, x+w, y+r)
  ctx.lineTo(x+w, y+h-r); ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h)
  ctx.lineTo(x+r, y+h); ctx.quadraticCurveTo(x, y+h, x, y+h-r)
  ctx.lineTo(x, y+r); ctx.quadraticCurveTo(x, y, x+r, y)
  ctx.closePath()
}

// ── Merchant Onboarding ──
function MerchantOnboarding({ onExit, activeLang }) {
  const [phase, setPhase]           = useState('steps') // steps | name | lang | upload | banner
  const [step, setStep]             = useState(0)
  const [feedback, setFeedback]     = useState(null)
  const [shopName, setShopName]     = useState('')
  const [bannerLang, setBannerLang] = useState('en')
  const [qrData, setQrData]         = useState(null)
  const [bannerMode, setBannerMode] = useState('print')
  const [btcLogo, setBtcLogo]       = useState(null)
  const canvasRef                   = useRef(null)

  useEffect(() => {
    const img = new Image()
    img.onload = () => setBtcLogo(img)
    img.src = '/bitcoin-abuja-logo.png'
  }, [])

  useEffect(() => {
    if (phase === 'banner' && canvasRef.current) {
      canvasRef.current.dataset.mode = bannerMode
      drawBanner(canvasRef.current, shopName, bannerLang, qrData, btcLogo)
    }
  }, [phase, bannerMode, qrData, btcLogo, shopName, bannerLang])

  const currentStep = MERCHANT_STEPS[step]

  const handleYes = () => {
    setFeedback('yes')
    setTimeout(() => {
      setFeedback(null)
      if (step === MERCHANT_STEPS.length - 1) {
        setPhase('name')
      } else {
        setStep(prev => prev + 1)
      }
    }, 1200)
  }

  const handleNo = () => setFeedback('no')
  const resetFeedback = () => setFeedback(null)

  const handleQRUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setQrData(ev.target.result)
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const downloadBanner = () => {
    if (!canvasRef.current) return
    const n = (shopName || 'bitcoin-abuja-merchant').toLowerCase().replace(/[^a-z0-9]/g, '-')
    const a = document.createElement('a')
    a.download = `${n}-banner-${bannerMode}.png`
    a.href = canvasRef.current.toDataURL('image/png')
    a.click()
  }

  const pct = (step / MERCHANT_STEPS.length) * 100

  // Phase: Banner output
  if (phase === 'banner') {
    return (
      <div className="banner-in" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 11, color: B.teal, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', textAlign: 'center' }}>✦ Your Banner is Ready</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['print', 'square'].map(m => (
            <button key={m} className="banner-tab" style={bannerMode === m ? { background: 'rgba(212,168,67,.1)', borderColor: 'rgba(212,168,67,.4)', color: B.gold } : {}}
              onClick={() => { setBannerMode(m); if(canvasRef.current){ canvasRef.current.dataset.mode=m; drawBanner(canvasRef.current, shopName, bannerLang, qrData, btcLogo) } }}>
              {m === 'print' ? 'Print (A4)' : 'Square (Social)'}
            </button>
          ))}
        </div>
        <div style={{ borderRadius: 14, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,.5)' }}>
          <canvas ref={canvasRef} style={{ width: '100%', height: 'auto', display: 'block' }}/>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="dl-btn" style={{ background: `linear-gradient(135deg,${B.gold},${B.goldD})`, color: '#0D0A00', boxShadow: '0 3px 16px rgba(212,168,67,.4)' }} onClick={downloadBanner}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Download PNG
          </button>
          <button className="dl-btn" style={{ background: B.navyL, border: `1px solid ${B.navyB}`, color: B.mid }} onClick={onExit}>Done</button>
        </div>
        <div style={{ fontSize: 11, color: B.dim, textAlign: 'center' }}>Save to camera roll · Send to any print shop via WhatsApp</div>
        <button onClick={onExit} style={{ width: '100%', padding: '12px', borderRadius: 14, border: `1px solid ${B.navyB}`, background: 'transparent', color: B.mid, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>← Back to Sabi AI</button>
      </div>
    )
  }

  // Phase: QR Upload
  if (phase === 'upload') {
    return (
      <div className="flow-in" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: B.teal, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>Merchant Setup</span>
          <button onClick={onExit} style={{ fontSize: 12, color: B.dim, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Exit</button>
        </div>
        <div style={{ background: B.navyL, borderRadius: 20, padding: 20, border: `1px solid ${B.tealB}`, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: B.white, textAlign: 'center', lineHeight: 1.5 }}>Upload your Fedi payment QR screenshot</div>
          <div style={{ fontSize: 13, color: B.mid, textAlign: 'center', lineHeight: 1.6 }}>Open Fedi → tap Wallet tab → tap Receive → screenshot that screen → upload it here.</div>
          {!qrData ? (
            <div className="upload-area" onClick={() => document.getElementById('merQRFile').click()}>
              <div style={{ fontSize: 30 }}>📸</div>
              <div style={{ fontSize: 13, color: B.teal, fontWeight: 500, textAlign: 'center' }}>Tap to upload your QR screenshot</div>
              <div style={{ fontSize: 11, color: B.dim, textAlign: 'center' }}>JPEG or PNG from your camera roll</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <img src={qrData} alt="QR" style={{ maxWidth: 160, maxHeight: 160, borderRadius: 12, border: `2px solid ${B.tealB}` }}/>
              <button onClick={() => document.getElementById('merQRFile').click()} style={{ background: 'transparent', border: `1px solid ${B.navyB}`, color: B.dim, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', padding: '7px 16px', borderRadius: 20 }}>Upload different image</button>
            </div>
          )}
          <input type="file" id="merQRFile" accept="image/*" onChange={handleQRUpload} style={{ display: 'none' }}/>
          <button disabled={!qrData} onClick={() => setPhase('banner')}
            style={{ width: '100%', padding: 14, borderRadius: 14, border: 'none', background: qrData ? `linear-gradient(135deg,${B.teal},#0ea5a0)` : B.navyLL, color: qrData ? '#0D1A1A' : B.dim, fontWeight: 700, fontSize: 15, cursor: qrData ? 'pointer' : 'default', fontFamily: 'inherit', boxShadow: qrData ? '0 3px 16px rgba(45,212,191,.3)' : 'none' }}>
            Generate My Banner ✦
          </button>
        </div>
        <div style={{ fontSize: 11, color: B.dim, textAlign: 'center' }}>Bitcoin Abuja · Powered by Fedi</div>
      </div>
    )
  }

  // Phase: Language select
  if (phase === 'lang') {
    const opts = [
      { key: 'en',    title: 'English only',       sub: '"We accept Bitcoin · Scan to pay"' },
      { key: 'en-ha', title: 'English + Hausa',    sub: '"We accept Bitcoin · Muna karbar Bitcoin"' },
      { key: 'en-yo', title: 'English + Yoruba',   sub: '"We accept Bitcoin · A gba Bitcoin"' },
      { key: 'en-ig', title: 'English + Igbo',     sub: '"We accept Bitcoin · Anyị na-anabata Bitcoin"' },
      { key: 'en-pc', title: 'English + Pidgin',   sub: '"We accept Bitcoin · We dey collect Bitcoin"' },
    ]
    return (
      <div style={{ margin: 16, background: B.navyL, border: `1px solid ${B.goldB}`, borderRadius: 20, padding: 22, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: B.white, textAlign: 'center', marginBottom: 4 }}>Choose your banner language</div>
        {opts.map(o => (
          <button key={o.key} onClick={() => { setBannerLang(o.key); setPhase('upload') }}
            style={{ padding: '13px 16px', borderRadius: 14, border: `1px solid ${B.navyB}`, background: B.navy, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', width: '100%', transition: 'all 0.15s' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: B.white, marginBottom: 3 }}>{o.title}</div>
            <div style={{ fontSize: 11.5, color: B.dim }}>{o.sub}</div>
          </button>
        ))}
      </div>
    )
  }

  // Phase: Name input
  if (phase === 'name') {
    return (
      <div style={{ margin: 16, background: B.navyL, border: `1px solid ${B.goldB}`, borderRadius: 20, padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: B.white, textAlign: 'center', lineHeight: 1.5 }}>What is your shop or business name?</div>
        <input value={shopName} onChange={e => setShopName(e.target.value)} placeholder="e.g. Fatima's Fashion, Musa Suya Joint…"
          style={{ padding: '13px 16px', background: B.navy, border: `1px solid ${B.navyB}`, borderRadius: 14, fontSize: 14, color: B.white, fontFamily: 'inherit', outline: 'none' }}/>
        <button onClick={() => setPhase('lang')}
          style={{ padding: 14, borderRadius: 14, border: 'none', background: shopName.trim() ? `linear-gradient(135deg,${B.teal},#0ea5a0)` : B.navyLL, color: shopName.trim() ? '#0D1A1A' : B.dim, fontWeight: 600, fontSize: 15, cursor: shopName.trim() ? 'pointer' : 'default', fontFamily: 'inherit' }}>
          Continue
        </button>
        <button onClick={() => { setShopName(''); setPhase('lang') }} style={{ background: 'transparent', border: 'none', color: B.dim, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center' }}>
          Skip — continue without name
        </button>
      </div>
    )
  }

  // Phase: Steps
  if (phase === 'join') {
    return (
      <div className="flow-in" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: B.teal, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>Merchant Setup</span>
          <button onClick={onExit} style={{ fontSize: 12, color: B.dim, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Exit</button>
        </div>
        <div style={{ background: B.navyL, borderRadius: 20, padding: 20, border: `1px solid ${B.orangeB}`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: B.white, textAlign: 'center', lineHeight: 1.5 }}>Join the Bitcoin Abuja Community</div>
          <div style={{ fontSize: 12, color: B.gold, background: B.goldF, border: `1px solid ${B.goldB}`, borderRadius: 10, padding: '10px 12px', lineHeight: 1.55, textAlign: 'center', width: '100%' }}>
            Make sure you have joined a federation first from the Wallet tab — that is where your wallet lives. Then join this community.
          </div>
          <div style={{ fontSize: 13, color: B.mid, textAlign: 'center', lineHeight: 1.6 }}>Scan this QR code inside Fedi or tap the button below to open directly.</div>
          <div style={{ background: 'white', borderRadius: 14, padding: 12 }}>
            <img src="/community-qr.png" alt="Bitcoin Abuja QR" style={{ width: 140, height: 140, display: 'block' }}/>
          </div>
          <div style={{ fontSize: 11, color: B.dim, textAlign: 'center' }}>Open Fedi → tap the scan icon at the bottom → scan this QR code</div>
          <button className="action-cta" onClick={() => { window.location.href = COMMUNITY_LINK }}
            style={{ width: '100%', padding: 13, borderRadius: 14, border: 'none', background: `linear-gradient(135deg,${B.orange},#c2610f)`, color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 3px 16px rgba(249,115,22,.3)' }}>
            Open Bitcoin Abuja in Fedi
          </button>
          <button onClick={() => { setPhase('steps'); setStep(prev => prev + 1) }} style={{ background: 'transparent', border: 'none', color: B.dim, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
            I have already joined ✓
          </button>
        </div>
        <div style={{ fontSize: 11, color: B.dim, textAlign: 'center' }}>Bitcoin Abuja · Powered by Fedi</div>
      </div>
    )
  }

  return (
    <div className="flow-in" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: B.teal, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>Merchant Setup</span>
        <button onClick={onExit} style={{ fontSize: 12, color: B.dim, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Exit</button>
      </div>
      <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg,${B.teal},${B.gold})`, borderRadius: 4, transition: 'width 0.5s cubic-bezier(0.22,1,0.36,1)' }}/>
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        {MERCHANT_STEPS.map((_, i) => (
          <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: i < step ? B.teal : i === step ? B.gold : 'rgba(255,255,255,0.08)', boxShadow: i < step ? `0 0 6px ${B.teal}` : i === step ? `0 0 8px ${B.gold}` : 'none', transition: 'background 0.3s,box-shadow 0.3s' }}/>
        ))}
      </div>
      <div style={{ background: B.navyL, borderRadius: 20, padding: 20, border: `1px solid ${feedback === 'yes' ? B.tealB : feedback === 'no' ? B.redB : B.navyB}`, transition: 'border-color 0.3s' }}>
        <div style={{ fontSize: 10, color: B.dim, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>{currentStep.ins}</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: B.white, lineHeight: 1.5, marginBottom: 18 }}>{currentStep.q}</div>

        {feedback === 'yes' && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 13px', background: B.tealF, border: `1px solid ${B.tealB}`, borderRadius: 12, marginBottom: 14, animation: 'chatIn 0.3s ease both' }}>
            <CheckIcon color={B.teal}/>
            <span style={{ fontSize: 13, color: B.teal, lineHeight: 1.5 }}>{currentStep.yes}</span>
          </div>
        )}

        {feedback === 'no' && (
          <div style={{ padding: '12px 13px', background: B.redF, border: `1px solid ${B.redB}`, borderRadius: 12, marginBottom: 14, animation: 'chatIn 0.3s ease both' }}>
            <div style={{ fontSize: 13, color: B.mid, lineHeight: 1.6, marginBottom: 10 }}>{currentStep.no}</div>
            <button onClick={resetFeedback} style={{ padding: '8px 18px', borderRadius: 20, border: `1px solid ${B.navyB}`, background: 'transparent', color: B.white, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>I'm ready now</button>
          </div>
        )}

        {!feedback && (
          <div style={{ display: 'flex', gap: 10, flexDirection: 'column' }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="yes-btn" onClick={handleYes}
                style={{ flex: 1, padding: 13, borderRadius: 14, border: 'none', background: `linear-gradient(135deg,${B.teal},#0ea5a0)`, color: '#0D1A1A', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 3px 16px rgba(45,212,191,.3)' }}>
                Yes ✓
              </button>
              <button className="no-btn" onClick={currentStep.joinScreen ? () => setPhase('join') : handleNo}
                style={{ flex: 1, padding: 13, borderRadius: 14, border: `1px solid ${B.redB}`, background: B.redF, color: B.red, fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
                Not yet
              </button>
            </div>
            {currentStep.canSkip && (
              <button onClick={() => setStep(prev => prev + 1)} style={{ background: 'transparent', border: 'none', color: B.dim, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center' }}>
                Skip this step
              </button>
            )}
          </div>
        )}
      </div>
      <div style={{ fontSize: 11, color: B.dim, textAlign: 'center' }}>Bitcoin Abuja · Powered by Fedi</div>
    </div>
  )
}

// ── Member Onboarding ──
function MemberOnboarding({ onExit }) {
  const [phase, setPhase]       = useState('choice') // choice | learn | steps | join | done
  const [learnStep, setLearnStep] = useState(0)
  const [step, setStep]         = useState(0)
  const [feedback, setFeedback] = useState(null)

  const currentStep = MEMBER_STEPS[step]
  const pct = (step / MEMBER_STEPS.length) * 100

  const handleYes = () => {
    setFeedback('yes')
    setTimeout(() => {
      setFeedback(null)
      if (step === MEMBER_STEPS.length - 1) { setPhase('done') }
      else { setStep(prev => prev + 1) }
    }, 1200)
  }
  const handleNo = () => setFeedback('no')
  const resetFeedback = () => setFeedback(null)

  if (phase === 'done') {
    return (
      <div className="done-pop" style={{ margin: 16, background: B.navyL, border: `1px solid ${B.orangeB}`, borderRadius: 20, padding: 22, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <div style={{ fontSize: 44 }}>₿</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: B.orange, textAlign: 'center', lineHeight: 1.4 }}>Welcome to Bitcoin Abuja!</div>
        <div style={{ fontSize: 13, color: B.mid, textAlign: 'center', lineHeight: 1.65 }}>You are now part of a real Bitcoin circular economy in Nigeria. Your sats are yours — no bank, no middleman, no one can take them.</div>
        <div style={{ width: '100%', background: B.navy, border: '1px solid rgba(212,168,67,.2)', borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 11, color: B.gold, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>🎁 100 Free Sats Waiting For You</div>
          <div style={{ fontSize: 13.5, color: B.white, lineHeight: 1.55 }}>Bitcoin Abuja has a free Sats Faucet. Claim 100 sats right now — your very first Bitcoin, on the community.</div>
          <button className="action-cta" onClick={() => window.open(FAUCET_LINK, '_blank')}
            style={{ width: '100%', padding: 12, borderRadius: 12, border: 'none', background: `linear-gradient(135deg,${B.gold},${B.goldD})`, color: '#0D0A00', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 3px 12px rgba(212,168,67,.35)', marginTop: 4 }}>
            Claim My 100 Free Sats →
          </button>
        </div>
        <div style={{ fontSize: 12, color: B.dim, textAlign: 'center' }}>Need help? Ask Sabi anything or message Aisha in the community.</div>
        <button className="action-cta" onClick={onExit}
          style={{ width: '100%', padding: 13, borderRadius: 14, border: 'none', background: `linear-gradient(135deg,${B.gold},${B.goldD})`, color: '#0D0A00', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 3px 16px rgba(212,168,67,.4)' }}>
          Back to Sabi AI
        </button>
      </div>
    )
  }

  if (phase === 'join') {
    return (
      <div className="flow-in" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: B.orange, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>New Member Setup</span>
          <button onClick={onExit} style={{ fontSize: 12, color: B.dim, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Exit</button>
        </div>
        <div style={{ background: B.navyL, borderRadius: 20, padding: 20, border: `1px solid ${B.orangeB}`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: B.white, textAlign: 'center', lineHeight: 1.5 }}>Join the Bitcoin Abuja Community</div>
          <div style={{ fontSize: 12, color: B.gold, background: B.goldF, border: `1px solid ${B.goldB}`, borderRadius: 10, padding: '10px 12px', lineHeight: 1.55, textAlign: 'center', width: '100%' }}>
            Make sure you have joined a federation from the Wallet tab first — that creates your Bitcoin wallet. Then join this community.
          </div>
          <div style={{ fontSize: 13, color: B.mid, textAlign: 'center', lineHeight: 1.6 }}>Scan this QR code inside Fedi or tap the button below to open directly.</div>
          <div style={{ background: 'white', borderRadius: 14, padding: 12 }}>
            <img src="/community-qr.png" alt="Bitcoin Abuja QR" style={{ width: 140, height: 140, display: 'block' }}/>
          </div>
          <div style={{ fontSize: 11, color: B.dim, textAlign: 'center' }}>Open Fedi → tap the scan icon at the bottom → scan this QR code</div>
          <button className="action-cta" onClick={() => { window.location.href = COMMUNITY_LINK }}
            style={{ width: '100%', padding: 13, borderRadius: 14, border: 'none', background: `linear-gradient(135deg,${B.orange},#c2610f)`, color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 3px 16px rgba(249,115,22,.3)' }}>
            Open Bitcoin Abuja in Fedi
          </button>
          <button onClick={() => { setPhase('steps'); setStep(prev => prev + 1) }} style={{ background: 'transparent', border: 'none', color: B.dim, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
            I have already joined ✓
          </button>
        </div>
        <div style={{ fontSize: 11, color: B.dim, textAlign: 'center' }}>Bitcoin Abuja · Powered by Fedi</div>
      </div>
    )
  }

  if (phase === 'learn') {
    const card = LEARN_CARDS[learnStep]
    const isLast = learnStep === LEARN_CARDS.length - 1
    return (
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: B.purple, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>Bitcoin Basics</span>
          <button onClick={onExit} style={{ fontSize: 12, color: B.dim, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Exit</button>
        </div>
        <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${((learnStep+1)/LEARN_CARDS.length)*100}%`, background: `linear-gradient(90deg,${B.purple},${B.teal})`, borderRadius: 4, transition: 'width 0.5s' }}/>
        </div>
        <div className="card-slide" style={{ background: B.navyL, border: `1px solid ${B.purpleB}`, borderRadius: 20, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 32, flexShrink: 0 }}>{card.icon}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: B.white, lineHeight: 1.3 }}>{card.title}</div>
          </div>
          <div style={{ fontSize: 13.5, color: B.mid, lineHeight: 1.7 }}>{card.body}</div>
          <div style={{ background: B.purpleF, border: `1px solid ${B.purpleB}`, borderRadius: 12, padding: '12px 14px', fontSize: 13, color: B.purple, lineHeight: 1.55 }}>{card.highlight}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: B.dim, fontWeight: 500 }}>{learnStep + 1} of {LEARN_CARDS.length}</span>
            {isLast ? (
              <button className="learn-next" onClick={() => { setPhase('steps'); setStep(0) }}
                style={{ padding: '12px 24px', borderRadius: 14, border: 'none', background: `linear-gradient(135deg,${B.orange},#c2610f)`, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 3px 16px rgba(249,115,22,.3)' }}>
                I'm ready to get started →
              </button>
            ) : (
              <button className="learn-next" onClick={() => setLearnStep(prev => prev + 1)}
                style={{ padding: '12px 24px', borderRadius: 14, border: 'none', background: `linear-gradient(135deg,${B.purple},#7c3aed)`, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 3px 16px rgba(167,139,250,.3)' }}>
                Next →
              </button>
            )}
          </div>
        </div>
        <div style={{ fontSize: 11, color: B.dim, textAlign: 'center' }}>Bitcoin Abuja · Powered by Fedi</div>
      </div>
    )
  }

  if (phase === 'choice') {
    const choices = [
      { label: 'I want to protect my savings from Naira inflation', next: 'steps' },
      { label: 'I want to send money without bank fees',            next: 'steps' },
      { label: 'I want to learn about Bitcoin',                     next: 'learn' },
    ]
    return (
      <div className="flow-in" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: B.orange, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>New Member Setup</span>
          <button onClick={onExit} style={{ fontSize: 12, color: B.dim, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Exit</button>
        </div>
        <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: '0%', background: `linear-gradient(90deg,${B.orange},${B.gold})`, borderRadius: 4 }}/>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: i === 0 ? B.gold : 'rgba(255,255,255,0.08)', boxShadow: i === 0 ? `0 0 8px ${B.gold}` : 'none' }}/>
          ))}
        </div>
        <div style={{ background: B.navyL, borderRadius: 20, padding: 20, border: `1px solid ${B.navyB}` }}>
          <div style={{ fontSize: 10, color: B.dim, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Step 1 of 4 — Why you are here</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: B.white, lineHeight: 1.5, marginBottom: 18 }}>What brings you to Bitcoin Abuja?</div>
          {choices.map((c, i) => (
            <button key={i} className="choice-btn"
              onClick={() => { setPhase(c.next === 'learn' ? 'learn' : 'steps'); setStep(0) }}
              style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: `1px solid ${B.orangeB}`, background: B.orangeF, color: B.white, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', marginBottom: i < 2 ? 8 : 0, transition: 'all 0.15s' }}>
              {c.label}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 11, color: B.dim, textAlign: 'center' }}>Bitcoin Abuja · Powered by Fedi</div>
      </div>
    )
  }

  // Phase: Steps
  return (
    <div className="flow-in" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: B.orange, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>New Member Setup</span>
        <button onClick={onExit} style={{ fontSize: 12, color: B.dim, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Exit</button>
      </div>
      <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg,${B.orange},${B.gold})`, borderRadius: 4, transition: 'width 0.5s cubic-bezier(0.22,1,0.36,1)' }}/>
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        {MEMBER_STEPS.map((_, i) => (
          <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: i < step ? B.orange : i === step ? B.gold : 'rgba(255,255,255,0.08)', boxShadow: i < step ? `0 0 6px ${B.orange}` : i === step ? `0 0 8px ${B.gold}` : 'none', transition: 'background 0.3s,box-shadow 0.3s' }}/>
        ))}
      </div>
      <div style={{ background: B.navyL, borderRadius: 20, padding: 20, border: `1px solid ${feedback === 'yes' ? B.orangeB : feedback === 'no' ? B.redB : B.navyB}`, transition: 'border-color 0.3s' }}>
        <div style={{ fontSize: 10, color: B.dim, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>{currentStep.ins}</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: B.white, lineHeight: 1.5, marginBottom: 18 }}>{currentStep.q}</div>

        {feedback === 'yes' && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 13px', background: B.orangeF, border: `1px solid ${B.orangeB}`, borderRadius: 12, marginBottom: 14, animation: 'chatIn 0.3s ease both' }}>
            <CheckIcon color={B.orange}/>
            <span style={{ fontSize: 13, color: B.orange, lineHeight: 1.5 }}>{currentStep.yes}</span>
          </div>
        )}

        {feedback === 'no' && (
          <div style={{ padding: '12px 13px', background: B.redF, border: `1px solid ${B.redB}`, borderRadius: 12, marginBottom: 14, animation: 'chatIn 0.3s ease both' }}>
            <div style={{ fontSize: 13, color: B.mid, lineHeight: 1.6, marginBottom: 10 }}>{currentStep.no}</div>
            <button onClick={resetFeedback} style={{ padding: '8px 18px', borderRadius: 20, border: `1px solid ${B.navyB}`, background: 'transparent', color: B.white, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>I'm ready now</button>
          </div>
        )}

        {!feedback && (
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="yes-btn" onClick={handleYes}
              style={{ flex: 1, padding: 13, borderRadius: 14, border: 'none', background: `linear-gradient(135deg,${B.orange},#c2610f)`, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 3px 16px rgba(249,115,22,.3)' }}>
              Yes ✓
            </button>
            <button className="no-btn" onClick={currentStep.joinScreen ? () => setPhase('join') : handleNo}
              style={{ flex: 1, padding: 13, borderRadius: 14, border: `1px solid ${B.redB}`, background: B.redF, color: B.red, fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
              Not yet
            </button>
          </div>
        )}
      </div>
      <div style={{ fontSize: 11, color: B.dim, textAlign: 'center' }}>Bitcoin Abuja · Powered by Fedi</div>
    </div>
  )
}

// ── Main App ──
export default function App() {
  const [splashDone, setSplashDone]         = useState(false)
  const [btc, setBtc]                       = useState({ usd: 96300, ngn: 154000000 })
  const [messages, setMessages]             = useState([])
  const [displayMsgs, setDisplayMsgs]       = useState([])
  const [inputText, setInputText]           = useState('')
  const [isLoading, setIsLoading]           = useState(false)
  const [speakingIdx, setSpeakingIdx]       = useState(null)
  const [attachedFile, setAttachedFile]     = useState(null)
  const [activeLang, setActiveLang]         = useState('en')
  const [isRecording, setIsRecording]       = useState(false)
  const [voiceSupported, setVoiceSupported] = useState(false)
  const [micError, setMicError]             = useState('')
  const [mode, setMode]                     = useState('chat') // chat | merchant | member
  const messagesEndRef = useRef(null)
  const fileInputRef   = useRef(null)
  const recognitionRef = useRef(null)

  const satNgn  = btc ? (btc.ngn / 100000000).toFixed(2) : '1.54'
  const welcome = WELCOME_BY_LANG[activeLang] || WELCOME_BY_LANG.en
  const prompts = PROMPTS_BY_LANG[activeLang] || PROMPTS_BY_LANG.en

  useEffect(() => {
    fetchBTC().then(setBtc)
    const iv = setInterval(() => fetchBTC().then(setBtc), 180000)
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SR) setVoiceSupported(true)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [displayMsgs, isLoading])

  const startRecording = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { setMicError('Voice not supported on this browser. Please type your question.'); return }
    setMicError('')
    const isAndroid = /android/i.test(navigator.userAgent)
    const startSR = () => {
      const langMap = { en:'en-NG', ha:'ha', yo:'yo', ig:'ig', pc:'en-NG' }
      const recognition = new SR()
      recognition.lang = langMap[activeLang] || 'en-NG'
      recognition.continuous = false
      recognition.interimResults = !isAndroid
      recognition.onstart = () => { setIsRecording(true); setMicError('') }
      recognition.onresult = (e) => {
        const t = Array.from(e.results).map(r => r[0].transcript).join('')
        setInputText(t)
      }
      recognition.onspeechend = () => recognition.stop()
      recognition.onend = () => { setIsRecording(false); recognitionRef.current = null }
      recognition.onerror = (e) => {
        setIsRecording(false); recognitionRef.current = null
        if (e.error === 'not-allowed') setMicError('Microphone blocked. Go to browser Settings → Site Settings → Microphone → allow this site.')
        else if (e.error === 'no-speech') setMicError('No speech detected. Try again.')
        else setMicError('Voice error. Please type your question instead.')
      }
      recognitionRef.current = recognition
      try { recognition.start() } catch(e) { setMicError('Could not start voice. Please type instead.') }
    }
    if (navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true }).then(() => startSR()).catch(() => setMicError('Microphone access denied. Please allow mic access and try again.'))
    } else { startSR() }
  }, [activeLang])

  const stopRecording = useCallback(() => { recognitionRef.current?.stop(); setIsRecording(false) }, [])
  const toggleMic     = useCallback(() => { if (isRecording) { stopRecording() } else { startRecording() } }, [isRecording, startRecording, stopRecording])

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const isImage = file.type.startsWith('image/')
    const isPDF   = file.type === 'application/pdf'
    if (!isImage && !isPDF) return
    const base64     = await fileToBase64(file)
    const previewUrl = isImage ? URL.createObjectURL(file) : null
    setAttachedFile({ type: isImage ? 'image' : 'pdf', base64, mediaType: file.type, name: file.name, previewUrl })
    e.target.value = ''
  }

  const sendMessage = async (textOverride) => {
    const text = (textOverride || inputText).trim()
    if (text === '__MERCHANT__') { setMode('merchant'); return }
    if (text === '__MEMBER__')   { setMode('member');   return }
    const file = attachedFile
    if (!text && !file) return
    if (isLoading) return
    if (messages.length === 0 && text) {
      const d = detectLang(text)
      if (d !== 'en') setActiveLang(d)
    }
    setInputText(''); setAttachedFile(null); setMicError('')
    setDisplayMsgs(prev => [...prev, { r: 'user', c: text, file }])
    const contentParts = []
    if (file) {
      if (file.type === 'image') contentParts.push({ type:'image', source:{ type:'base64', media_type:file.mediaType, data:file.base64 } })
      else contentParts.push({ type:'document', source:{ type:'base64', media_type:'application/pdf', data:file.base64 } })
    }
    contentParts.push({ type: 'text', text: text || 'Please look at this and help me understand it.' })
    const newHistory = [...messages, { role: 'user', content: contentParts }]
    setMessages(newHistory)
    setIsLoading(true)
    try {
      const reply = await sendToAI(newHistory, btc)
      setMessages(prev => [...prev, { role:'assistant', content:[{ type:'text', text:reply }] }])
      setDisplayMsgs(prev => [...prev, { r: 'bot', c: reply }])
    } catch (err) {
      const errMsg = ERROR_BY_LANG[activeLang] || ERROR_BY_LANG.en
      setDisplayMsgs(prev => [...prev, { r: 'error', c: errMsg }])
      setMessages(prev => [...prev, { role:'assistant', content:[{ type:'text', text:errMsg }] }])
    }
    setIsLoading(false)
  }

  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }

  const handleListen = (text, idx) => {
    if (speakingIdx === idx) { window.speechSynthesis?.cancel(); setSpeakingIdx(null) }
    else {
      speak(text); setSpeakingIdx(idx)
      const check = setInterval(() => { if (!window.speechSynthesis?.speaking) { setSpeakingIdx(null); clearInterval(check) } }, 300)
    }
  }

  const hasMessages  = displayMsgs.length > 0
  const langLabels   = { en:'EN', ha:'HA', yo:'YO', ig:'IG', pc:'PID' }
  const showInputBar = mode === 'chat'

  return (
    <>
      <style>{CSS}</style>
      {!splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}

      <div className={splashDone ? 'chat-in' : ''} style={{ background:B.navy, minHeight:'100dvh', maxWidth:440, margin:'0 auto', fontFamily:"'Satoshi',-apple-system,sans-serif", color:B.white, display:'flex', flexDirection:'column' }}>

        {/* HEADER */}
        <div style={{ padding:'12px 16px', background:B.navyL, borderBottom:`1px solid ${B.navyB}`, display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, zIndex:10 }}>
          <img src="/logo.png" alt="Sabi AI" style={{ height:34, width:'auto', objectFit:'contain' }}/>
          <div style={{ display:'flex', alignItems:'center', gap:7, background:B.goldF, border:`1px solid ${B.goldB}`, borderRadius:100, padding:'5px 13px' }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background:B.green, animation:'liveDot 2s ease infinite' }}/>
            <span style={{ fontSize:11, fontWeight:500, color:B.white }}>1 sat</span>
            <span style={{ fontSize:12, fontWeight:700, color:B.gold }}>₦{satNgn}</span>
          </div>
        </div>

        {/* LANG BAR — only in chat mode */}
        {mode === 'chat' && (
          <div className="lang-bar">
            {Object.entries(langLabels).map(([code, label]) => (
              <button key={code} className={`lang-pill${activeLang === code ? ' active' : ''}`} onClick={() => setActiveLang(code)}>
                {label}
              </button>
            ))}
          </div>
        )}

        {/* BODY */}
        <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column' }}>

          {mode === 'merchant' && <MerchantOnboarding onExit={() => setMode('chat')} activeLang={activeLang} />}
          {mode === 'member'   && <MemberOnboarding   onExit={() => setMode('chat')} />}

          {mode === 'chat' && !hasMessages && !isLoading && (
            <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'32px 22px 60px' }}>
              <h1 className="w1" style={{ fontSize:24, fontWeight:700, color:B.white, textAlign:'center', marginBottom:10 }}>{welcome.greeting}</h1>
              <p className="w2" style={{ fontSize:14, color:B.mid, textAlign:'center', lineHeight:1.65, marginBottom:6, maxWidth:290 }}>{welcome.sub}</p>
              <p className="w2" style={{ fontSize:11, color:B.dim, textAlign:'center', marginBottom:28, letterSpacing:0.4 }}>{welcome.langs}</p>
              <div className="w3" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, width:'100%', maxWidth:360 }}>
                {prompts.map((p, i) => {
                  const isMer = p.msg === '__MERCHANT__'
                  const isMem = p.msg === '__MEMBER__'
                  return (
                    <button key={i} onClick={() => sendMessage(p.msg)} className="prompt-card"
                      style={{ background:B.navyL, border:`1px solid ${isMer ? B.tealB : isMem ? B.orangeB : B.navyB}`, borderRadius:16, padding:'16px 14px 14px', textAlign:'left', boxShadow:'0 2px 12px rgba(0,0,0,.3)', fontFamily:'inherit' }}>
                      <div style={{ width:20, height:3, borderRadius:2, background: isMer ? B.teal : isMem ? B.orange : i%2===0 ? B.gold : B.goldD, marginBottom:12 }}/>
                      <div style={{ fontSize:13, fontWeight:400, color:B.white, lineHeight:1.4 }}>{p.label}</div>
                    </button>
                  )
                })}
              </div>
              {voiceSupported && (
                <div className="w4" style={{ marginTop:20, display:'flex', alignItems:'center', gap:6, color:B.dim, fontSize:11 }}>
                  <MicIcon/><span>Tap the mic to speak instead of typing</span>
                </div>
              )}
            </div>
          )}

          {mode === 'chat' && hasMessages && (
            <div style={{ padding:'16px 16px 8px', display:'flex', flexDirection:'column', gap:16 }}>
              {displayMsgs.map((msg, i) => (
                <div key={i} className={msg.r === 'user' ? 'msg-user' : 'msg-bot'} style={{ display:'flex', justifyContent:msg.r==='user'?'flex-end':'flex-start', alignItems:'flex-start', gap:9 }}>
                  {msg.r !== 'user' && <img src="/logo.png" alt="Sabi" style={{ width:32, height:32, objectFit:'contain', flexShrink:0, marginTop:2 }}/>}
                  <div style={{ maxWidth:'80%', display:'flex', flexDirection:'column', alignItems:msg.r==='user'?'flex-end':'flex-start', gap:5 }}>
                    {msg.r === 'error' ? (
                      <div className="error-bubble">{msg.c}</div>
                    ) : (
                      <div style={{ padding:'12px 16px', fontSize:14, lineHeight:1.75, whiteSpace:'pre-wrap', fontFamily:'inherit', ...(msg.r==='user' ? { background:`linear-gradient(135deg,${B.gold},${B.goldD})`, color:'#0D0A00', fontWeight:600, borderRadius:'18px 18px 4px 18px', boxShadow:'0 3px 14px rgba(212,168,67,.3)' } : { background:B.navyL, color:B.white, borderRadius:'18px 18px 18px 4px', border:`1px solid ${B.navyB}` }) }}>
                        {msg.file && (
                          <div style={{ marginBottom: msg.c ? 8 : 0 }}>
                            {msg.file.type === 'image' && msg.file.previewUrl
                              ? <img src={msg.file.previewUrl} alt="attachment" style={{ maxWidth:200, maxHeight:160, borderRadius:10, display:'block', objectFit:'cover' }}/>
                              : <div className="msg-file-pill"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg><span>{msg.file.name}</span></div>
                            }
                          </div>
                        )}
                        {msg.c}
                      </div>
                    )}
                    {msg.r === 'bot' && (
                      <button className="listen-btn" onClick={() => handleListen(msg.c, i)} style={{ display:'flex', alignItems:'center', gap:4, background:'transparent', border:'none', padding:'2px 4px', borderRadius:6, fontSize:11, color:speakingIdx===i?B.gold:B.dim, fontFamily:'inherit', cursor:'pointer' }}>
                        <SpeakerIcon/>{speakingIdx===i?'Stop':'Listen'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="msg-bot" style={{ display:'flex', alignItems:'flex-start', gap:9 }}>
                  <img src="/logo.png" alt="Sabi" style={{ width:32, height:32, objectFit:'contain', flexShrink:0, marginTop:2 }}/>
                  <div style={{ background:B.navyL, borderRadius:'18px 18px 18px 4px', padding:'14px 18px', border:`1px solid ${B.navyB}` }}>
                    <div style={{ display:'flex', gap:5, alignItems:'center' }}>
                      {[0,1,2].map(j => <div key={j} style={{ width:7, height:7, borderRadius:'50%', background:B.gold, animation:`bounce 1.2s ${j*0.15}s ease-in-out infinite` }}/>)}
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef}/>
            </div>
          )}
        </div>

        {/* INPUT BAR */}
        {showInputBar && (
          <div style={{ padding:'12px 16px 24px', background:B.navyL, borderTop:`1px solid ${B.navyB}`, position:'sticky', bottom:0 }}>
            {isRecording && (
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8, padding:'8px 12px', background:B.goldF, border:`1px solid ${B.goldB}`, borderRadius:12 }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:B.gold, animation:'pulse 1s ease-in-out infinite' }}/>
                <span style={{ fontSize:12, color:B.gold, fontWeight:500 }}>Listening… tap mic to stop</span>
              </div>
            )}
            {micError && (
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8, padding:'8px 12px', background:B.redF, border:`1px solid ${B.redB}`, borderRadius:12 }}>
                <span style={{ fontSize:12, color:B.red }}>{micError}</span>
              </div>
            )}
            {attachedFile && (
              <div style={{ display:'flex', alignItems:'center', gap:8, background:B.navy, border:`1px solid ${B.navyB}`, borderRadius:12, padding:'7px 10px', marginBottom:8, maxWidth:260 }}>
                {attachedFile.type==='image'&&attachedFile.previewUrl
                  ? <img src={attachedFile.previewUrl} alt="preview" style={{ width:34, height:34, borderRadius:7, objectFit:'cover', flexShrink:0 }}/>
                  : <div style={{ width:34, height:34, borderRadius:7, background:B.navyLL, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={B.gold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div>
                }
                <span style={{ fontSize:11.5, color:B.white, flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{attachedFile.name}</span>
                <button onClick={() => setAttachedFile(null)} style={{ width:20, height:20, borderRadius:'50%', background:B.navyLL, border:'none', color:B.mid, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, flexShrink:0 }}>✕</button>
              </div>
            )}
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp,application/pdf" onChange={handleFileChange} style={{ display:'none' }}/>
              <button className="attach-btn" onClick={() => fileInputRef.current?.click()}
                style={{ width:40, height:40, borderRadius:12, background:attachedFile?B.goldF:'transparent', border:`1px solid ${attachedFile?B.goldB:B.navyB}`, color:attachedFile?B.gold:B.dim, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <AttachIcon/>
              </button>
              <input className="chat-input" value={inputText} onChange={e => setInputText(e.target.value)} onKeyDown={handleKeyDown}
                placeholder={isRecording ? 'Listening…' : attachedFile ? 'Add a question… (optional)' : 'Ask anything…'}
                style={{ flex:1, padding:'13px 18px', background:B.navy, border:`1px solid ${B.navyB}`, borderRadius:28, fontSize:14, color:B.white, fontFamily:'inherit', transition:'border-color 0.2s,box-shadow 0.2s' }}/>
              {voiceSupported && !inputText.trim() && !attachedFile && (
                <button className={`mic-btn${isRecording?' recording':''}`} onClick={toggleMic}
                  style={{ width:46, height:46, borderRadius:'50%', border:'none', background:isRecording?`linear-gradient(135deg,${B.gold},${B.goldD})`:B.navyLL, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, color:isRecording?'#0D0A00':B.mid, boxShadow:isRecording?'0 3px 16px rgba(212,168,67,.5)':'none' }}>
                  <MicIcon/>
                </button>
              )}
              {(inputText.trim() || attachedFile) && (
                <button onClick={() => sendMessage()} disabled={isLoading} className="send-btn"
                  style={{ width:46, height:46, borderRadius:'50%', border:'none', background:!isLoading?`linear-gradient(135deg,${B.gold},${B.goldD})`:B.navyLL, cursor:!isLoading?'pointer':'default', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:!isLoading?'0 3px 16px rgba(212,168,67,.4)':'none' }}>
                  <SendIcon color={!isLoading?'#0D0A00':B.dim}/>
                </button>
              )}
            </div>
            <div style={{ fontSize:9, color:B.dim, textAlign:'center', marginTop:8, letterSpacing:0.8 }}>Bitcoin Abuja · Powered by Fedi</div>
          </div>
        )}
      </div>
    </>
  )
}
