import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

async function logConversation(language, communityId = 'bitcoin-abuja') {
  try {
    await supabase.from('conversations').insert({
      language,
      type: 'chat',
      community_id: communityId,
    })
  } catch (e) {}
}

async function logOnboarding(type, shopName = null, location = null, category = null, communityId = 'bitcoin-abuja') {
  try {
    await supabase.from('onboardings').insert({
      type,
      shop_name: shopName,
      location,
      category,
      completed: true,
      community_id: communityId,
    })
  } catch (e) {}
}

async function submitCommunityRequest(data) {
  try {
    await supabase.from('community_requests').insert(data)
  } catch (e) {}
}

function getCommunityFromURL() {
  try {
    return new URLSearchParams(window.location.search).get('community') || 'bitcoin-abuja'
  } catch {
    return 'bitcoin-abuja'
  }
}

async function fetchBTC() {
  try {
    const r = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,ngn')
    const d = await r.json()
    if (d?.bitcoin?.usd && d?.bitcoin?.ngn) return d.bitcoin
  } catch {}
  return { usd: 96300, ngn: 154000000 }
}

function getSpeechRecognition() {
  if (typeof window === 'undefined') return null
  return window.SpeechRecognition || window.webkitSpeechRecognition || null
}

function createAudioFromBase64(audioBase64) {
  try {
    const bytes = Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0))
    const blob = new Blob([bytes], { type: 'audio/mpeg' })
    const url = URL.createObjectURL(blob)
    const audio = new Audio(url)
    audio.__objectUrl = url
    return audio
  } catch {
    return null
  }
}

function speakDevice(text, lang) {
  if (!window.speechSynthesis) return false
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text.replace(/[₿⚡●#*•①②③④⑤]/g, ' '))
  u.lang = { en: 'en-NG', ha: 'ha', yo: 'yo', ig: 'ig', pc: 'en-NG' }[lang] || 'en-NG'
  u.rate = 0.92
  window.speechSynthesis.speak(u)
  return true
}

function fileToBase64(file) {
  return new Promise((res, rej) => {
    const reader = new FileReader()
    reader.onload = () => res(String(reader.result || '').split(',')[1] || '')
    reader.onerror = rej
    reader.readAsDataURL(file)
  })
}

function detectLang(text) {
  const t = text.toLowerCase()
  const hausa = ['ina', 'yaya', 'sannu', 'kudi', 'mene', 'yaushe', 'wane', 'kai', 'shi', 'ita', 'mu', 'ku', 'su', 'don', 'da', 'ko', 'ba', 'ne', 'ce']
  const yoruba = ['bawo', 'elo', 'jowo', 'owo', 'se', 'ni', 'mo', 'wa', 'pe', 'ti', 'fun', 'ati', 'tabi', 'ile']
  const igbo = ['kedu', 'gini', 'oge', 'ego', 'obere', 'nke', 'ya', 'ha', 'site', 'na']
  const pidgin = ['abeg', 'wetin', 'oya', 'e dey', 'dem', 'wey', 'nah', 'comot', 'chop', 'ginger']
  const words = t.split(/\s+/)
  const score = list => words.filter(w => list.includes(w)).length
  const scores = { ha: score(hausa), yo: score(yoruba), ig: score(igbo), pc: score(pidgin) }
  const top = Object.entries(scores).sort((a, b) => b[1] - a[1])[0]
  return top[1] > 0 ? top[0] : 'en'
}

const COMMUNITIES = {
  'bitcoin-abuja': {
    id: 'bitcoin-abuja',
    name: 'Bitcoin Abuja',
    city: 'Abuja, Nigeria',
    color: '#D4A843',
    communityLink:
      'fedi:community210v3xzat5dphhyhmsw43xketeygazycehvscnydmzxsmxzvnyx4jkze3jv5ek2e3jvycxvep4x4jnydtzvscrve35x4nrxd3hx33nxdfk893kgwpkvsenxvpnvvukyen9v3sjytpzvdhk6mt4de5hg72lw46kjezldpjhsg36ygmr2vt98ycnscejveskxef5vsex2ct9x3jnqcm98ycxxvtyxqmxxetxvgcrgvmpx43rxdeexsexvenyvyekgdf4vd3xzvtrv93ngvmrygkzyer9vde8jur5d9hkuhmtv4ujyw3zxe85umetgc6rj56ddyh4qntsd4ujk2m4v4s4wn2sfa6ksntnfed85nnz2enxzstpfdrrs0fz05uvt3ry',
    faucetLink: 'https://prod.fedi-faucet.dev.fedibtc.com/c/9651a0b10fd1deafbaf4df554dc4bf85',
    communityQR: '/community-qr.png',
    communityLogo: '/bitcoin-abuja-logo.png',
    appLogo: '/logo.png',
    memberCount: '60+',
    merchantCount: '6',
  },
}

const BUSINESS_CATEGORIES = [
  { id: 'food', label: 'Food & Restaurant', emoji: '🍲' },
  { id: 'fashion', label: 'Fashion & Clothing', emoji: '👗' },
  { id: 'beauty', label: 'Beauty & Hair', emoji: '💇' },
  { id: 'tech', label: 'Electronics & Tech', emoji: '💻' },
  { id: 'pharmacy', label: 'Pharmacy & Health', emoji: '💊' },
  { id: 'grocery', label: 'Grocery & Market', emoji: '🛒' },
  { id: 'transport', label: 'Transport & Logistics', emoji: '🚗' },
  { id: 'education', label: 'Education & Training', emoji: '📚' },
  { id: 'services', label: 'Services & Repairs', emoji: '🔧' },
  { id: 'other', label: 'Other', emoji: '🏪' },
]

const CAT_EMOJI = Object.fromEntries(BUSINESS_CATEGORIES.map(c => [c.id, c.emoji]))

const LANG_COLORS_S = { en: '#D4A843', ha: '#2DD4BF', pc: '#F97316', yo: '#A78BFA', ig: '#F87171' }
const LANG_NAMES_S = { en: 'English', ha: 'Hausa', pc: 'Nigerian Pidgin', yo: 'Yoruba', ig: 'Igbo' }

const PROMPTS_BY_LANG = {
  en: [
    { label: 'BTC price in Naira', msg: 'What is the current Bitcoin price in Naira, and what is 1 sat worth?' },
    { label: 'Buy BTC with Naira', msg: 'How do I buy Bitcoin with Naira on Fedi?' },
    { label: 'Accept Bitcoin at my shop', msg: '__MERCHANT__' },
    { label: 'New to Bitcoin? Start here', msg: '__MEMBER__' },
  ],
  ha: [
    { label: 'Farashin BTC a Naira', msg: 'Nawa ne farashin Bitcoin a Naira yanzu, kuma nawa ne 1 sat?' },
    { label: 'Saya Bitcoin da Naira', msg: 'Ta yaya zan saya Bitcoin da Naira a Fedi?' },
    { label: 'Karbi Bitcoin a kantin na', msg: '__MERCHANT__' },
    { label: 'Sabon zuwa Bitcoin?', msg: '__MEMBER__' },
  ],
  yo: [
    { label: 'Iye BTC ni Naira', msg: 'Elo ni iye Bitcoin ni Naira ni bayi, ati pe 1 sat nawo?' },
    { label: 'Ra Bitcoin pelu Naira', msg: 'Bawo ni mo se le ra Bitcoin pelu Naira lori Fedi?' },
    { label: 'Gba Bitcoin ni ile itaja mi', msg: '__MERCHANT__' },
    { label: 'Tuntun si Bitcoin?', msg: '__MEMBER__' },
  ],
  ig: [
    { label: 'Ulo BTC na Naira', msg: 'Ego ole ka Bitcoin ji na Naira ugbu a, kwa ego ole bu 1 sat?' },
    { label: 'Zuo Bitcoin na Naira', msg: 'Kedu ka m ga-esi zuo Bitcoin na Naira na Fedi?' },
    { label: "Nata Bitcoin n'ulo ahia m", msg: '__MERCHANT__' },
    { label: 'Ohuru na Bitcoin?', msg: '__MEMBER__' },
  ],
  pc: [
    { label: 'BTC price for Naira', msg: 'How much Bitcoin price be for Naira now, and how much be 1 sat?' },
    { label: 'Buy Bitcoin with Naira', msg: 'Abeg how I go take buy Bitcoin with Naira for Fedi?' },
    { label: 'Accept Bitcoin for my shop', msg: '__MERCHANT__' },
    { label: 'New to Bitcoin?', msg: '__MEMBER__' },
  ],
}

const WELCOME_BY_LANG = {
  en: {
    greeting: 'How can I help you?',
    sub: 'Ask, learn, or start using Bitcoin in your language.',
    langs: 'English · Hausa · Yoruba · Igbo · Pidgin',
  },
  ha: {
    greeting: 'Ina iya taimaka maka?',
    sub: 'Tambaya, koya, ko fara amfani da Bitcoin a harshenka.',
    langs: 'Hausa · English · Yoruba · Igbo · Pidgin',
  },
  yo: {
    greeting: 'Bawo ni mo se le ran o lowo?',
    sub: 'Beere, ko eko, tabi bere fun lilo Bitcoin ni ede re.',
    langs: 'Yoruba · Hausa · English · Igbo · Pidgin',
  },
  ig: {
    greeting: 'Kedu ka m ga-esi nyere gi aka?',
    sub: 'Jụọ, mụta, ma ọ bụ bido iji Bitcoin n’asụsụ gị.',
    langs: 'Igbo · Hausa · Yoruba · English · Pidgin',
  },
  pc: {
    greeting: 'How I fit help you?',
    sub: 'Ask, learn, or start to use Bitcoin for your side.',
    langs: 'Pidgin · Hausa · Yoruba · Igbo · English',
  },
}

const ERROR_BY_LANG = {
  en: "Sabi couldn't respond right now. Please check your connection and try again.",
  ha: 'Sabi bai iya amsa yanzu ba. Da fatan a duba hadin ku ku sake gwadawa.',
  yo: 'Sabi ko le dahun ni bayi. Jowo sayewo asopo re ki o tun gbiyanju.',
  ig: 'Sabi enweghi ike aza ugbu a. Biko lelee njikọ gi ma nwaa ozo.',
  pc: 'Sabi no fit answer now. Abeg check your connection and try again.',
}

const BILINGUAL = {
  en: { title: 'BITCOIN ACCEPTED HERE', lightning: '⚡ Lightning payments. Instant settlement.', localTitle: null, localLightning: null },
  'en-ha': { title: 'BITCOIN ACCEPTED HERE', lightning: '⚡ Lightning payments. Instant settlement.', localTitle: 'BITCOIN AN KARBA A NAN', localLightning: '⚡ Biyan kuɗi nan take. Ba jira ba.' },
  'en-yo': { title: 'BITCOIN ACCEPTED HERE', lightning: '⚡ Lightning payments. Instant settlement.', localTitle: 'A GBA BITCOIN NIBI', localLightning: '⚡ Isanwo lẹsẹkẹsẹ. Ko si idaduro.' },
  'en-ig': { title: 'BITCOIN ACCEPTED HERE', lightning: '⚡ Lightning payments. Instant settlement.', localTitle: 'A NA-ANABATA BITCOIN EBE A', localLightning: '⚡ Ịkwụ ụgwọ ozigbo. Ọ dịghị oge ntọ.' },
  'en-pc': { title: 'BITCOIN ACCEPTED HERE', lightning: '⚡ Lightning payments. Instant settlement.', localTitle: 'WE DEY COLLECT BITCOIN HERE', localLightning: '⚡ Payment fast fast. No wahala.' },
}

const CONTEXT_CARDS = {
  savings: [
    {
      icon: '📉',
      title: 'Your Naira is losing value — fast.',
      body: 'Since 2020, the Naira has lost over 80% of its purchasing power. If you saved ₦1,000,000 in 2020, it now buys what ₦200,000 could then.',
      stat: '₦1,000,000 in 2020 = ₦200,000 in buying power today',
      statColor: '#F87171',
    },
    {
      icon: '₿',
      title: 'Bitcoin cannot be inflated.',
      body: 'There will only ever be 21 million Bitcoin in existence — hardcoded into the software forever. No government can change this.',
      stat: 'Fixed supply: 21 million Bitcoin. Forever.',
      statColor: '#D4A843',
    },
    {
      icon: '📈',
      title: 'Small amounts add up.',
      body: 'You do not need a whole Bitcoin. The smallest unit is 1 satoshi. Even ₦500 a week becomes meaningful over time.',
      stat: '₦500/week × 52 weeks = ₦26,000 in Bitcoin savings',
      statColor: '#34C77A',
    },
  ],
  remittance: [
    {
      icon: '🏦',
      title: 'Bank transfers are expensive.',
      body: 'Sending money across banks costs fees. International transfers cost even more with worse exchange rates.',
      stat: 'Bank fees on ₦50,000 transfer: up to ₦4,000',
      statColor: '#F87171',
    },
    {
      icon: '⚡',
      title: 'Lightning is instant.',
      body: 'The Lightning Network makes Bitcoin payments fast and nearly free.',
      stat: 'Lightning fee on ₦50,000 transfer: less than ₦1',
      statColor: '#34C77A',
    },
    {
      icon: '🇳🇬',
      title: 'Keep more of your money.',
      body: 'Every naira you save on fees stays in your pocket.',
      stat: 'Potential annual savings: ₦48,000+ for regular senders',
      statColor: '#D4A843',
    },
  ],
}

const LEARN_CARDS = [
  {
    icon: '₿',
    title: 'What is Bitcoin?',
    body: 'Bitcoin is digital money no bank or government controls.',
    highlight: 'You can send it anywhere in the world in under 1 second at almost zero cost.',
  },
  {
    icon: '📉',
    title: 'Why does this matter?',
    body: 'Since 2020 the Naira has lost a lot of value.',
    highlight: 'Saving even a little in Bitcoin can protect purchasing power.',
  },
  {
    icon: '⚡',
    title: 'What is a Satoshi?',
    body: '1 Bitcoin = 100,000,000 sats. Start with small amounts.',
    highlight: 'Stack sats weekly — even 500 Naira a week adds up.',
  },
  {
    icon: '🌍',
    title: 'What is Lightning?',
    body: 'Lightning makes Bitcoin payments instant and nearly free.',
    highlight: 'Fedi uses Lightning for payments automatically.',
  },
  {
    icon: '🔐',
    title: 'How do I keep Bitcoin safe?',
    body: 'Write your recovery words on paper and never screenshot them.',
    highlight: 'Those words let you restore your wallet if your phone is lost.',
  },
]

const T = {
  en: {
    merchantTitle: 'Merchant Setup',
    memberTitle: 'New Member Setup',
    bitcoinBasics: 'Bitcoin Basics',
    whyBitcoin: 'Why Bitcoin?',
    whyLightning: 'Why Lightning?',
    back: 'Back',
    yes: 'Yes ✓',
    notYet: 'Not yet',
    skip: 'Skip this step',
    skipSetup: 'Skip to setup →',
    next: 'Next →',
    iAmReady: "I'm ready — set up my wallet →",
    continue: 'Continue',
    skipNoLocation: 'Skip — continue without location',
    skipNoName: 'Skip — continue without name',
    generateBanner: 'Generate My Banner ✦',
    backToSabi: 'Back to Sabi AI',
    claimSats: 'Claim My 100 Free Sats →',
    shareCard: 'Share Your Bitcoin Card ✦',
    readyMsg: "You're all set. Let's finish.",
    welcomeTo: 'Welcome to',
    poweredBy: 'Bitcoin Abuja · Powered by Fedi',
    alreadyJoined: 'I have already joined ✓',
    openInFedi: 'Open in Fedi',
    whatBringsYou: 'What brings you to',
    chooseMatters: 'Choose what matters most to you. We will show you exactly why Bitcoin is the right tool — then get you set up.',
    shopName: 'What is your shop or business name?',
    shopLocation: 'Where is your shop located?',
    businessType: 'What type of business is this?',
    bannerLang: 'Choose your banner language',
    uploadQR: 'Add your Fedi payment QR',
    uploadQRSub: 'Open Fedi → Wallet tab → Receive → screenshot the QR code → upload it here.',
    tapUpload: 'Tap to upload QR screenshot',
    listening: 'Listening… tap mic to stop',
    askAnything: 'Ask anything…',
    choices: [
      { label: 'Protect my savings from Naira inflation', sub: 'See how Bitcoin protects your money — with real numbers' },
      { label: 'Send money without bank fees', sub: 'See how much you can save on every transfer' },
      { label: 'Learn about Bitcoin first', sub: '5 short cards covering everything you need to know' },
      { label: 'I know Bitcoin — just set me up', sub: 'Skip straight to wallet setup' },
    ],
  },
  ha: {
    merchantTitle: 'Kafa Kasuwa',
    memberTitle: 'Sabon Memba Setup',
    bitcoinBasics: 'Asalin Bitcoin',
    whyBitcoin: 'Me yasa Bitcoin?',
    whyLightning: 'Me yasa Lightning?',
    back: 'Koma',
    yes: 'Eh ✓',
    notYet: 'Ba tukuna',
    skip: 'Tsallake wannan matakin',
    skipSetup: 'Tsallake zuwa kafa →',
    next: 'Na gaba →',
    iAmReady: "Ina shirye — kafa walat din na →",
    continue: 'Ci gaba',
    skipNoLocation: 'Tsallake — ci gaba ba tare da wuri ba',
    skipNoName: 'Tsallake — ci gaba ba tare da suna ba',
    generateBanner: 'Ƙirƙiri Banner na ✦',
    backToSabi: 'Koma Sabi AI',
    claimSats: 'Karɓi Sat 100 Kyauta →',
    shareCard: 'Raba Katunan Bitcoin na ✦',
    readyMsg: "Kun shirya. Mu gama.",
    welcomeTo: 'Barka da zuwa',
    poweredBy: 'Bitcoin Abuja · Powered by Fedi',
    alreadyJoined: 'Na riga na shiga ✓',
    openInFedi: 'Buɗe a Fedi',
    whatBringsYou: 'Me ya kawo ku',
    chooseMatters: 'Zaɓi abin da ya fi muhimmanci gare ku. Za mu nuna muku dalilin da ya sa Bitcoin shine kayan aiki mafi dacewa.',
    shopName: 'Menene sunan kantin ko kasuwancin ku?',
    shopLocation: 'Ina kantin ku yake?',
    businessType: 'Wane irin kasuwanci ne wannan?',
    bannerLang: 'Zaɓi harshen banner',
    uploadQR: 'Ƙara QR na biyan kuɗi na Fedi',
    uploadQRSub: 'Buɗe Fedi → Wallet → Karɓa → ɗauki hoton allon QR → loda shi anan.',
    tapUpload: 'Taɓa don loda hoton QR',
    listening: 'Sauraro… taɓa makirofon don tsayawa',
    askAnything: 'Yi tambaya...',
    choices: [
      { label: 'Kare ajiyena daga hauhawar farashin Naira', sub: 'Duba yadda Bitcoin ke kare kuɗin ku — da lambobi na gaske' },
      { label: 'Aika kuɗi ba tare da kuɗin banki ba', sub: 'Duba nawa za ku iya adanawa a kowane canja wurin' },
      { label: 'Koyi Bitcoin da farko', sub: 'Katunan gajere 5 da ke rufe duk abin da kuke bukata' },
      { label: 'Na san Bitcoin — kawai kafa mini', sub: 'Tsallake kai tsaye zuwa kafa walat' },
    ],
  },
  yo: {
    merchantTitle: 'Iṣeto Oniṣowo',
    memberTitle: 'Iṣeto Ọmọ Ẹgbẹ Tuntun',
    bitcoinBasics: 'Ipilẹ Bitcoin',
    whyBitcoin: 'Kini idi Bitcoin?',
    whyLightning: 'Kini idi Lightning?',
    back: 'Pada',
    yes: 'Bẹẹni ✓',
    notYet: 'Ko si tii',
    skip: 'Fo igbese yii',
    skipSetup: 'Fo si iṣeto →',
    next: 'Tókàn →',
    iAmReady: "Mo ti ṣetan — ṣeto apamọwọ mi →",
    continue: 'Tẹsiwaju',
    skipNoLocation: 'Fo — tẹsiwaju laisi ipo',
    skipNoName: 'Fo — tẹsiwaju laisi orukọ',
    generateBanner: 'Ṣẹda Banner Mi ✦',
    backToSabi: 'Pada si Sabi AI',
    claimSats: 'Gba Sat 100 Ọfẹ Mi →',
    shareCard: 'Pin Kaadi Bitcoin Mi ✦',
    readyMsg: "O ti ṣetan. Jẹ ki a pari.",
    welcomeTo: 'Kaabọ si',
    poweredBy: 'Bitcoin Abuja · Powered by Fedi',
    alreadyJoined: 'Mo ti darapọ mọ tẹlẹ ✓',
    openInFedi: 'Ṣii ni Fedi',
    whatBringsYou: 'Kini o mu ọ wá si',
    chooseMatters: 'Yan ohun ti o ṣe pataki julọ fun ọ. A yoo fihan ọ gangan idi ti Bitcoin jẹ ohun elo ti o tọ.',
    shopName: 'Kini orukọ ile itaja tabi iṣowo rẹ?',
    shopLocation: 'Nibo ni ile itaja rẹ wa?',
    businessType: 'Iru iṣowo wo ni eyi?',
    bannerLang: 'Yan ede banner',
    uploadQR: 'Fi QR isanwo Fedi rẹ kun',
    uploadQRSub: 'Ṣii Fedi → Apamọwọ → Gba → ya aworan iboju QR → gbe e soke nibi.',
    tapUpload: 'Tẹ lati gbe aworan QR soke',
    listening: 'Tẹtisi… tẹ mikrofonu lati da duro',
    askAnything: 'Beere ohunkohun...',
    choices: [
      { label: 'Daabobo ifowopamọ mi lọwọ afikun owo Naira', sub: 'Wo bii Bitcoin ṣe daabobo owo rẹ — pẹlu awọn nọmba gidi' },
      { label: 'Fi owo ranṣẹ laisi owo ẹka banki', sub: 'Wo iye ti o le fi pamọ ni gbigbe kọọkan' },
      { label: 'Kọ nipa Bitcoin ni akọkọ', sub: 'Awọn kaadi kukuru 5 ti o bo ohun gbogbo ti o nilo lati mọ' },
      { label: 'Mo mọ Bitcoin — kan ṣeto mi', sub: 'Fo taara si iṣeto apamọwọ' },
    ],
  },
  ig: {
    merchantTitle: 'Nhazi Onye Ahịa',
    memberTitle: 'Nhazi Onye Otu Ọhụrụ',
    bitcoinBasics: 'Ntọala Bitcoin',
    whyBitcoin: 'Gịnị mere Bitcoin?',
    whyLightning: 'Gịnị mere Lightning?',
    back: 'Laghachi',
    yes: 'Ee ✓',
    notYet: 'Ọ dịghị ka ugbu a',
    skip: 'Wụfee nzọụkwụ a',
    skipSetup: 'Wụfee gaa nhazi →',
    next: 'Ọzọ →',
    iAmReady: "Anọ m n'ọchịchọ — hazi akpa ego m →",
    continue: 'Gaa n\'ihu',
    skipNoLocation: 'Wụfee — gaa n\'ihu na-enweghị ebe',
    skipNoName: 'Wụfee — gaa n\'ihu na-enweghị aha',
    generateBanner: 'Mepụta Banner m ✦',
    backToSabi: 'Laghachi Sabi AI',
    claimSats: 'Nweta Sat 100 Efu m →',
    shareCard: 'Kekọrịta Kaadị Bitcoin m ✦',
    readyMsg: "Iduola. Ka anyị mechaa.",
    welcomeTo: 'Nnọọ na',
    poweredBy: 'Bitcoin Abuja · Powered by Fedi',
    alreadyJoined: 'Esiela m ịdị n\'ime ✓',
    openInFedi: 'Mepee na Fedi',
    whatBringsYou: 'Gịnị wetara gị na',
    chooseMatters: 'Họọ ihe dị mkpa n\'ọchịchọ gị. Anyị ga-egosi gị n\'ụzọ ziri ezi ihe kpatara Bitcoin bụ ngwa kwesịrị.',
    shopName: 'Gịnị bụ aha ụlọ ahịa ma ọ bụ ọrụ ahịa gị?',
    shopLocation: 'Ebe ụlọ ahịa gị dị?',
    businessType: 'Kedu ụdị azụmahịa bụ nke a?',
    bannerLang: 'Họọ asụsụ banner',
    uploadQR: 'Tinye QR ịkwụ ụgwọ Fedi gị',
    uploadQRSub: 'Mepee Fedi → Akpa ego → Nataa → ṅụọ foto QR → bulite ya ebe a.',
    tapUpload: 'Kụọ iji bulite foto QR',
    listening: 'Na-ege ntị… kụọ maịkrofọn iji kwụsị',
    askAnything: 'Jụọ ihe ọ bụla...',
    choices: [
      { label: 'Chekwaa nchekwa m n\'aka ọnụ ahịa Naira arịala', sub: 'Hụ otu Bitcoin si echebe ego gị — na ọnụọgụ ezie' },
      { label: 'Zipu ego na-enweghị ụgwọ ụlọ akụ', sub: 'Hụ ego ole i nwere ike chekwaa n\'nnomi ọ bụla' },
      { label: 'Mụta Bitcoin nke mbụ', sub: 'Kaadị 5 dị mkpụmkpụ na-ekpuchi ihe niile ị chọrọ ịmara' },
      { label: 'Amara m Bitcoin — naanị haziri m', sub: 'Wụfee ozigbo gaa nhazi akpa ego' },
    ],
  },
  pc: {
    merchantTitle: 'Merchant Setup',
    memberTitle: 'New Member Setup',
    bitcoinBasics: 'Bitcoin Basics',
    whyBitcoin: 'Why Bitcoin?',
    whyLightning: 'Why Lightning?',
    back: 'Go Back',
    yes: 'Yes ✓',
    notYet: 'No yet',
    skip: 'Skip this step',
    skipSetup: 'Skip go setup →',
    next: 'Next →',
    iAmReady: "I don ready — set up my wallet →",
    continue: 'Continue',
    skipNoLocation: 'Skip — continue without location',
    skipNoName: 'Skip — continue without name',
    generateBanner: 'Make My Banner ✦',
    backToSabi: 'Back to Sabi AI',
    claimSats: 'Claim My 100 Free Sats →',
    shareCard: 'Share My Bitcoin Card ✦',
    readyMsg: "You don ready. Make we finish.",
    welcomeTo: 'Welcome to',
    poweredBy: 'Bitcoin Abuja · Powered by Fedi',
    alreadyJoined: 'I don join already ✓',
    openInFedi: 'Open for Fedi',
    whatBringsYou: 'Wetin carry you come',
    chooseMatters: 'Choose wetin matter most to you. We go show you exactly why Bitcoin be the right tool — then we go set you up.',
    shopName: 'Wetin be the name of your shop or business?',
    shopLocation: 'Where your shop dey?',
    businessType: 'Which kind business be this?',
    bannerLang: 'Choose banner language',
    uploadQR: 'Add your Fedi payment QR',
    uploadQRSub: 'Open Fedi → Wallet → Receive → screenshot the QR → upload am here.',
    tapUpload: 'Tap to upload QR screenshot',
    listening: 'I dey listen… tap mic to stop',
    askAnything: 'Ask anything...',
    choices: [
      { label: 'Protect my savings from Naira wahala', sub: 'See how Bitcoin go protect your money — with real numbers' },
      { label: 'Send money without bank fees', sub: 'See how much you go save on every transfer' },
      { label: 'Learn about Bitcoin first', sub: '5 short cards wey cover everything you need to know' },
      { label: 'I know Bitcoin — just set me up', sub: 'Skip straight to wallet setup' },
    ],
  },
}

const MERCHANT_STEPS_TRANSLATED = {
  en: [
    { ins: 'Step 1 of 6 — Install Fedi', q: 'Do you have the Fedi app installed on your phone?', yes: "Great. Let's move on.", no: 'Download Fedi from the App Store or Google Play — search "Fedi Bitcoin".', },
    { ins: 'Step 2 of 6 — Join a Federation', q: 'Open Fedi and tap Wallet. Join any available federation to create your wallet.', yes: 'Your Bitcoin wallet is ready.', no: 'Tap Wallet and choose any federation.', },
    { ins: 'Step 3 of 6 — Join Community', q: 'Now join the Bitcoin Abuja community on Fedi. Have you joined?', yes: 'Welcome to the community.', no: 'Let us get you in right now.', joinScreen: true, },
    { ins: 'Step 4 of 6 — Secure your wallet', q: 'Have you backed up your wallet recovery words on paper?', yes: 'Excellent. Your funds are protected.', no: 'Open Fedi → Profile → Personal Backup → write every word on paper.', },
    { ins: 'Step 5 of 6 — Fund your wallet (optional)', q: 'Have you added any sats to your wallet? You can skip this.', yes: 'Good.', no: 'No problem. You can receive Bitcoin payments with zero balance.', canSkip: true, },
    { ins: 'Step 6 of 6 — Get your payment QR', q: 'Open Fedi → Wallet → Receive. Can you see your payment QR code?', yes: "You're ready. Let's build your banner.", no: 'Tap Receive and your QR code will appear.', },
  ],
  ha: [
    { ins: 'Matakin 1 na 6 — Shigar da Fedi', q: 'Kuna da app din Fedi a wayar ku?', yes: "Kyau. Mu ci gaba.", no: 'Zazzage Fedi daga App Store ko Google Play — nemi "Fedi Bitcoin".', },
    { ins: 'Matakin 2 na 6 — Shiga Ƙungiya', q: 'Buɗe Fedi ku taɓa Wallet. Shiga duk wata ƙungiya da ke akwai don ƙirƙirar walat ku.', yes: 'Walat Bitcoin ku yana shirye.', no: 'Taɓa Wallet ku zaɓi duk wata ƙungiya.', },
    { ins: "Matakin 3 na 6 — Shiga Al'umma", q: "Yanzu shiga al'ummar Bitcoin Abuja a Fedi. Kun shiga?", yes: "Barka da zuwa al'umma.", no: "Mu shigar da ku yanzu haka.", joinScreen: true, },
    { ins: 'Matakin 4 na 6 — Kare walat ku', q: 'Kun rubuta kalmomin dawo da walat ku a takarda?', yes: 'Kyakkyawa. Kuɗin ku yana da kariya.', no: 'Buɗe Fedi → Profile → Personal Backup → rubuta kowane kalma a takarda.', },
    { ins: "Matakin 5 na 6 — Cika walat ku (zabi)", q: "Kun ƙara wasu sats zuwa walat ku? Kuna iya tsallake wannan.", yes: "Kyau.", no: "Babu matsala. Kuna iya karɓar biyan Bitcoin ba tare da ma'auni ba.", canSkip: true, },
    { ins: 'Matakin 6 na 6 — Sami QR ɗin biyan ku', q: 'Buɗe Fedi → Wallet → Karɓa. Kuna iya ganin lambar QR ɗin biyan ku?', yes: "Kun shirya. Mu gina banner ku.", no: 'Taɓa Karɓa QR ɗin ku zai bayyana.', },
  ],
  yo: [
    { ins: 'Igbese 1 ti 6 — Fi Fedi sori', q: 'Ṣe o ni app Fedi sori foonu rẹ?', yes: "O dara. Jẹ ki a tẹsiwaju.", no: 'Gba Fedi lati App Store tabi Google Play — wa "Fedi Bitcoin".', },
    { ins: 'Igbese 2 ti 6 — Darapọ mọ Federation', q: 'Ṣii Fedi ki o tẹ Wallet. Darapọ mọ federation eyikeyi ti o wa lati ṣẹda apamọwọ rẹ.', yes: 'Apamọwọ Bitcoin rẹ ti ṣetan.', no: 'Tẹ Wallet ki o yan federation eyikeyi.', },
    { ins: 'Igbese 3 ti 6 — Darapọ mọ Agbegbe', q: 'Darapọ mọ agbegbe Bitcoin Abuja lori Fedi. Ṣe o ti darapọ mọ?', yes: 'Kaabọ si agbegbe.', no: 'Jẹ ki a gba ọ wọle bayi.', joinScreen: true, },
    { ins: 'Igbese 4 ti 6 — Daabobo apamọwọ rẹ', q: 'Ṣe o ti ṣe afipamọ awọn ọrọ imularada apamọwọ rẹ lori iwe?', yes: 'O dara pupọ. Owo rẹ wa ni aabo.', no: 'Ṣii Fedi → Profile → Personal Backup → kọ gbogbo ọrọ lori iwe.', },
    { ins: 'Igbese 5 ti 6 — Kun apamọwọ rẹ (yiyan)', q: 'Ṣe o ti ṣafikun awọn sats si apamọwọ rẹ? O le fo eyi.', yes: 'O dara.', no: 'Ko si iṣoro. O le gba awọn isanwo Bitcoin pẹlu iwontunwonsi odo.', canSkip: true, },
    { ins: 'Igbese 6 ti 6 — Gba QR isanwo rẹ', q: 'Ṣii Fedi → Wallet → Gba. Ṣe o le ri koodu QR isanwo rẹ?', yes: "O ti ṣetan. Jẹ ki a kọ banner rẹ.", no: 'Tẹ Gba ki koodu QR rẹ han.', },
  ],
  ig: [
    { ins: "Nzọụkwụ 1 nke 6 — Wụnye Fedi", q: "I nwere ngwa Fedi n'ekwentị gị?", yes: "Ọ dị mma. Ka anyị gaa n'ihu.", no: "Budata Fedi site na App Store ma ọ bụ Google Play — chọọ \"Fedi Bitcoin\".", },
    { ins: 'Nzọụkwụ 2 nke 6 — Sonye Federation', q: 'Mepee Fedi wee kụọ Wallet. Sonye federation ọ bụla dị iji mepụta akpa ego gị.', yes: 'Akpa ego Bitcoin gị dị njikere.', no: 'Kụọ Wallet wee họọ federation ọ bụla.', },
    { ins: "Nzọụkwụ 3 nke 6 — Sonye Obodo", q: "Sonye obodo Bitcoin Abuja na Fedi ugbu a. I sonaela?", yes: "Nnọọ n'obodo.", no: "Ka anyị banye gị ugbu a.", joinScreen: true, },
    { ins: "Nzọụkwụ 4 nke 6 — Chekwaa akpa ego gị", q: "I deere okwu nweghachi akpa ego gị n'akwụkwọ?", yes: "Ọ dị mma nke ukwu. Ego gị nọ n'ntụkwasị obi.", no: "Mepee Fedi → Profile → Personal Backup → dee okwu ọ bụla n'akwụkwọ.", },
    { ins: "Nzọụkwụ 5 nke 6 — Tinye ego n'akpa ego gị (ọhọrọ)", q: "I tinyelaola sats ọ bụla n'akpa ego gị? Ị nwere ike ịwụfee nke a.", yes: "Ọ dị mma.", no: "Ọ dịghị nsogbu. Ị nwere ike ịnata ụgwọ Bitcoin na-enweghị ego.", canSkip: true, },
    { ins: "Nzọụkwụ 6 nke 6 — Nweta QR ịkwụ ụgwọ gị", q: "Mepee Fedi → Wallet → Nataa. Ị nwere ike ịhụ koodu QR ịkwụ ụgwọ gị?", yes: "I dị njikere. Ka anyị wuo banner gị.", no: "Kụọ Nataa koodu QR gị ga-apụta.", },
  ],
  pc: [
    { ins: 'Step 1 of 6 — Install Fedi', q: 'You get Fedi app for your phone?', yes: "E good. Make we continue.", no: 'Download Fedi from App Store or Google Play — search "Fedi Bitcoin".', },
    { ins: 'Step 2 of 6 — Join Federation', q: 'Open Fedi tap Wallet. Join any federation wey dey available to create your wallet.', yes: 'Your Bitcoin wallet don ready.', no: 'Tap Wallet choose any federation.', },
    { ins: 'Step 3 of 6 — Join Community', q: 'Now join Bitcoin Abuja community for Fedi. You don join?', yes: 'Welcome to the community.', no: 'Make we enter you now now.', joinScreen: true, },
    { ins: 'Step 4 of 6 — Secure your wallet', q: 'You don back up your wallet recovery words for paper?', yes: 'Correct. Your money don safe.', no: 'Open Fedi → Profile → Personal Backup → write every word for paper.', },
    { ins: 'Step 5 of 6 — Fund your wallet (optional)', q: 'You don add any sats to your wallet? You fit skip this one.', yes: 'E good.', no: 'No wahala. You fit receive Bitcoin payments even with zero balance.', canSkip: true, },
    { ins: 'Step 6 of 6 — Get your payment QR', q: 'Open Fedi → Wallet → Receive. You fit see your payment QR code?', yes: "You don ready. Make we build your banner.", no: 'Tap Receive your QR code go show.', },
  ],
}

const MEMBER_STEPS_TRANSLATED = {
  en: [
    { ins: 'Step 1 of 4 — Install Fedi', q: 'Do you have the Fedi app installed on your phone?', yes: "Great. Let's move on.", no: 'Download Fedi from the App Store or Google Play — search "Fedi Bitcoin".', },
    { ins: 'Step 2 of 4 — Join a Federation', q: 'Open Fedi and tap Wallet. Join any available federation.', yes: 'Your wallet is ready.', no: 'Tap Wallet and choose any federation.', },
    { ins: 'Step 3 of 4 — Join Community', q: 'Now join the Bitcoin Abuja community on Fedi. Have you joined?', yes: 'Welcome in.', no: 'Let us get you in right now.', joinScreen: true, },
    { ins: 'Step 4 of 4 — Secure your wallet', q: 'Have you written your wallet recovery words on paper?', yes: "You're all set. Let's finish.", no: 'Open Fedi → Profile → Personal Backup → write every word on paper.', },
  ],
  ha: [
    { ins: 'Matakin 1 na 4 — Shigar da Fedi', q: 'Kuna da app din Fedi a wayar ku?', yes: "Kyau. Mu ci gaba.", no: 'Zazzage Fedi daga App Store ko Google Play — nemi "Fedi Bitcoin".', },
    { ins: 'Matakin 2 na 4 — Shiga Ƙungiya', q: 'Buɗe Fedi ku taɓa Wallet. Shiga duk wata ƙungiya da ke akwai.', yes: 'Walat ku yana shirye.', no: 'Taɓa Wallet ku zaɓi duk wata ƙungiya.', },
    { ins: "Matakin 3 na 4 — Shiga Al'umma", q: "Yanzu shiga al'ummar Bitcoin Abuja a Fedi. Kun shiga?", yes: "Barka da zuwa.", no: "Mu shigar da ku yanzu haka.", joinScreen: true, },
    { ins: 'Matakin 4 na 4 — Kare walat ku', q: 'Kun rubuta kalmomin dawo da walat ku a takarda?', yes: "Kun shirya. Mu gama.", no: 'Buɗe Fedi → Profile → Personal Backup → rubuta kowane kalma a takarda.', },
  ],
  yo: [
    { ins: 'Igbese 1 ti 4 — Fi Fedi sori', q: 'Ṣe o ni app Fedi sori foonu rẹ?', yes: "O dara. Jẹ ki a tẹsiwaju.", no: 'Gba Fedi lati App Store tabi Google Play — wa "Fedi Bitcoin".', },
    { ins: 'Igbese 2 ti 4 — Darapọ mọ Federation', q: 'Ṣii Fedi ki o tẹ Wallet. Darapọ mọ federation eyikeyi ti o wa.', yes: 'Apamọwọ rẹ ti ṣetan.', no: 'Tẹ Wallet ki o yan federation eyikeyi.', },
    { ins: 'Igbese 3 ti 4 — Darapọ mọ Agbegbe', q: 'Darapọ mọ agbegbe Bitcoin Abuja lori Fedi. Ṣe o ti darapọ mọ?', yes: 'Kaabọ.', no: 'Jẹ ki a gba ọ wọle bayi.', joinScreen: true, },
    { ins: 'Igbese 4 ti 4 — Daabobo apamọwọ rẹ', q: 'Ṣe o ti kọ awọn ọrọ imularada apamọwọ rẹ lori iwe?', yes: "O ti ṣetan. Jẹ ki a pari.", no: 'Ṣii Fedi → Profile → Personal Backup → kọ gbogbo ọrọ lori iwe.', },
  ],
  ig: [
    { ins: "Nzọụkwụ 1 nke 4 — Wụnye Fedi", q: "I nwere ngwa Fedi n'ekwentị gị?", yes: "Ọ dị mma. Ka anyị gaa n'ihu.", no: "Budata Fedi site na App Store ma ọ bụ Google Play — chọọ \"Fedi Bitcoin\".", },
    { ins: 'Nzọụkwụ 2 nke 4 — Sonye Federation', q: 'Mepee Fedi wee kụọ Wallet. Sonye federation ọ bụla dị.', yes: 'Akpa ego gị dị njikere.', no: 'Kụọ Wallet wee họọ federation ọ bụla.', },
    { ins: "Nzọụkwụ 3 nke 4 — Sonye Obodo", q: "Sonye obodo Bitcoin Abuja na Fedi ugbu a. I sonaela?", yes: "Nnọọ.", no: "Ka anyị banye gị ugbu a.", joinScreen: true, },
    { ins: "Nzọụkwụ 4 nke 4 — Chekwaa akpa ego gị", q: "I deere okwu nweghachi akpa ego gị n'akwụkwọ?", yes: "I dị njikere niile. Ka anyị mechaa.", no: "Mepee Fedi → Profile → Personal Backup → dee okwu ọ bụla n'akwụkwọ.", },
  ],
  pc: [
    { ins: 'Step 1 of 4 — Install Fedi', q: 'You get Fedi app for your phone?', yes: "E good. Make we continue.", no: 'Download Fedi from App Store or Google Play — search "Fedi Bitcoin".', },
    { ins: 'Step 2 of 4 — Join Federation', q: 'Open Fedi tap Wallet. Join any federation wey dey available.', yes: 'Your wallet don ready.', no: 'Tap Wallet choose any federation.', },
    { ins: 'Step 3 of 4 — Join Community', q: 'Now join Bitcoin Abuja community for Fedi. You don join?', yes: 'Welcome.', no: 'Make we enter you now now.', joinScreen: true, },
    { ins: 'Step 4 of 4 — Secure your wallet', q: 'You don write your wallet recovery words for paper?', yes: "You don ready. Make we finish.", no: 'Open Fedi → Profile → Personal Backup → write every word for paper.', },
  ],
}


const MERCHANT_STEPS = [
  {
    ins: 'Step 1 of 6 — Install Fedi',
    q: 'Do you have the Fedi app installed on your phone?',
    yes: "Great. Let's move on.",
    no: 'Download Fedi from the App Store or Google Play — search "Fedi Bitcoin".',
  },
  {
    ins: 'Step 2 of 6 — Join a Federation',
    q: 'Open Fedi and tap Wallet. Join any available federation to create your wallet.',
    yes: 'Your Bitcoin wallet is ready.',
    no: 'Tap Wallet and choose any federation.',
  },
  {
    ins: 'Step 3 of 6 — Join Community',
    q: 'Now join the Bitcoin Abuja community on Fedi. Have you joined?',
    yes: 'Welcome to the community.',
    no: 'Let us get you in right now.',
    joinScreen: true,
  },
  {
    ins: 'Step 4 of 6 — Secure your wallet',
    q: 'Have you backed up your wallet recovery words on paper?',
    yes: 'Excellent. Your funds are protected.',
    no: 'Open Fedi → Profile → Personal Backup → write every word on paper.',
  },
  {
    ins: 'Step 5 of 6 — Fund your wallet (optional)',
    q: 'Have you added any sats to your wallet? You can skip this.',
    yes: 'Good.',
    no: 'No problem. You can receive Bitcoin payments with zero balance.',
    canSkip: true,
  },
  {
    ins: 'Step 6 of 6 — Get your payment QR',
    q: 'Open Fedi → Wallet → Receive. Can you see your payment QR code?',
    yes: "You're ready. Let's build your banner.",
    no: 'Tap Receive and your QR code will appear.',
  },
]

const MEMBER_STEPS = [
  {
    ins: 'Step 1 of 4 — Install Fedi',
    q: 'Do you have the Fedi app installed on your phone?',
    yes: "Great. Let's move on.",
    no: 'Download Fedi from the App Store or Google Play — search "Fedi Bitcoin".',
  },
  {
    ins: 'Step 2 of 4 — Join a Federation',
    q: 'Open Fedi and tap Wallet. Join any available federation.',
    yes: 'Your wallet is ready.',
    no: 'Tap Wallet and choose any federation.',
  },
  {
    ins: 'Step 3 of 4 — Join Community',
    q: 'Now join the Bitcoin Abuja community on Fedi. Have you joined?',
    yes: 'Welcome in.',
    no: 'Let us get you in right now.',
    joinScreen: true,
  },
  {
    ins: 'Step 4 of 4 — Secure your wallet',
    q: 'Have you written your wallet recovery words on paper?',
    yes: "You're all set. Let's finish.",
    no: 'Open Fedi → Profile → Personal Backup → write every word on paper.',
  },
]

async function sendToAI(history, btc, activeLang, community) {
  const satN = btc ? (btc.ngn / 100000000).toFixed(2) : '1.54'
  const usd = btc ? btc.usd.toLocaleString() : '96,300'
  const ngnM = btc ? (btc.ngn / 1000000).toFixed(0) : '154'
  const system =
    'You are Sabi — the AI Bitcoin guide for ' +
    community.name +
    ' in ' +
    community.city +
    ' on the Fedi app. ' +
    'LANGUAGE: Always respond in the same language the user writes in. ' +
    'FORMATTING: Never use asterisks or markdown. Plain text only. Use numbered lists when helpful. ' +
    'PRICES: 1 satoshi = ' +
    satN +
    ' Naira. 1 Bitcoin = $' +
    usd +
    ' = ' +
    ngnM +
    'M Naira. Always mention sats and full Bitcoin together when discussing price. ' +
    'TO BUY BITCOIN: Fedi — Mini Apps — Cashwyre — Crypto Onramp — NGN — transfer from any Nigerian bank — wait 5-10 minutes. No ID needed. ' +
    'TO ACCEPT BITCOIN AT SHOP: Fedi — Wallet tab — Receive — show QR to customer — they scan — instant payment — convert to Naira via Cashwyre anytime. ' +
    'COMMUNITY: ' +
    community.name +
    ' has ' +
    community.memberCount +
    ' members and ' +
    community.merchantCount +
    ' merchants. ' +
    'Always be direct, helpful, and human.'

  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: history, system, language: activeLang, tts: true, communityId: community.id }),
  })

  if (!response.ok) throw new Error('API ' + response.status)
  const data = await response.json()
  if (data.error) throw new Error(data.error)
  return { text: data.content?.[0]?.text || '', audio: data.audio || null }
}

async function fetchStats(communityId = 'bitcoin-abuja') {
  const SB_URL = import.meta.env.VITE_SUPABASE_URL
  const SB_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
  const h = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }
  const q = (table, params) => fetch(`${SB_URL}/rest/v1/${table}?${params}`, { headers: h }).then(r => r.json())

  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [allC, weekC, allM, weekM, langD, dailyD, merchants, requests] = await Promise.all([
    q('conversations', `select=id&community_id=eq.${communityId}&created_at=gte.${monthStart}`),
    q('conversations', `select=id&community_id=eq.${communityId}&created_at=gte.${weekAgo}`),
    q('onboardings', `select=id&type=eq.member&community_id=eq.${communityId}&created_at=gte.${monthStart}`),
    q('onboardings', `select=id&type=eq.member&community_id=eq.${communityId}&created_at=gte.${weekAgo}`),
    q('conversations', `select=language&community_id=eq.${communityId}&created_at=gte.${monthStart}`),
    q('conversations', `select=created_at&community_id=eq.${communityId}&created_at=gte.${weekAgo}`),
    q('onboardings', `select=shop_name,location,category,created_at&community_id=eq.${communityId}&type=eq.merchant&order=created_at.desc`),
    q('community_requests', `select=name,community,city,created_at&order=created_at.desc&limit=5`),
  ])

  return {
    totalConv: Array.isArray(allC) ? allC.length : 0,
    weekConv: Array.isArray(weekC) ? weekC.length : 0,
    totalMemb: Array.isArray(allM) ? allM.length : 0,
    weekMemb: Array.isArray(weekM) ? weekM.length : 0,
    langData: Array.isArray(langD) ? langD : [],
    dailyData: Array.isArray(dailyD) ? dailyD : [],
    merchants: Array.isArray(merchants) ? merchants.filter(m => m.shop_name) : [],
    requests: Array.isArray(requests) ? requests : [],
  }
}

const B = {
  navy: '#1B2232',
  navyL: '#222D3F',
  navyLL: '#2A3650',
  navyB: 'rgba(212,168,67,.14)',
  gold: '#D4A843',
  goldD: '#A67C2A',
  goldF: 'rgba(212,168,67,.08)',
  goldB: 'rgba(212,168,67,.22)',
  white: '#EDF2FF',
  mid: '#8A9BB5',
  dim: '#4A5A72',
  green: '#34C77A',
  teal: '#2DD4BF',
  tealF: 'rgba(45,212,191,.08)',
  tealB: 'rgba(45,212,191,.3)',
  red: '#F87171',
  redF: 'rgba(248,113,113,.08)',
  redB: 'rgba(248,113,113,.25)',
  orange: '#F97316',
  orangeF: 'rgba(249,115,22,.08)',
  orangeB: 'rgba(249,115,22,.3)',
  purple: '#A78BFA',
  purpleF: 'rgba(167,139,250,.08)',
  purpleB: 'rgba(167,139,250,.3)',
}

const CSS = `@import url('https://api.fontshare.com/v2/css?f[]=satoshi@300,400,500,700,900&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
body{background:#1B2232;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;}
::-webkit-scrollbar{width:0;height:0;}
@keyframes splashOut{from{opacity:1}to{opacity:0}}
@keyframes chatIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes fromLeft{from{opacity:0;transform:translateX(-14px)}to{opacity:1;transform:translateX(0)}}
@keyframes fromRight{from{opacity:0;transform:translateX(14px)}to{opacity:1;transform:translateX(0)}}
@keyframes bounce{0%,60%,100%{transform:scale(1);opacity:.25}30%{transform:scale(1.8);opacity:1}}
@keyframes liveDot{0%,100%{opacity:1}50%{opacity:.35}}
@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.15)}}
@keyframes micRing{0%{box-shadow:0 0 0 0 rgba(212,168,67,.55)}100%{box-shadow:0 0 0 12px rgba(212,168,67,0)}}
@keyframes checkPop{0%{transform:scale(0)}70%{transform:scale(1.15)}100%{transform:scale(1)}}
@keyframes cardSlide{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:translateX(0)}}
@keyframes donePop{from{opacity:0;transform:scale(0.94) translateY(16px)}to{opacity:1;transform:scale(1) translateY(0)}}
@keyframes speakPulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.1);opacity:.7}}
.splash-out{animation:splashOut .45s ease forwards;}
.chat-in{animation:chatIn .45s cubic-bezier(.22,1,.36,1) both;}
.w1{animation:slideUp .4s cubic-bezier(.22,1,.36,1) 0s both;}
.w2{animation:slideUp .4s cubic-bezier(.22,1,.36,1) .07s both;}
.w3{animation:slideUp .4s cubic-bezier(.22,1,.36,1) .14s both;}
.w4{animation:slideUp .4s cubic-bezier(.22,1,.36,1) .21s both;}
.msg-user{animation:fromRight .28s cubic-bezier(.22,1,.36,1) both;}
.msg-bot{animation:fromLeft .28s cubic-bezier(.22,1,.36,1) both;}
.card-slide{animation:cardSlide .35s cubic-bezier(.22,1,.36,1) both;}
.done-pop{animation:donePop .5s cubic-bezier(.22,1,.36,1) both;}
.speaking{animation:speakPulse 1.5s ease-in-out infinite;}
.prompt-card{transition:transform .18s,border-color .18s,background .18s;cursor:pointer;-webkit-tap-highlight-color:transparent;}
.prompt-card:active{transform:scale(.97);}
.send-btn{transition:transform .15s;}
.send-btn:not(:disabled):active{transform:scale(.96);}
.mic-btn{transition:transform .15s;-webkit-tap-highlight-color:transparent;}
.mic-btn.recording{animation:micRing 1s ease-out infinite;}
.yes-btn:active{transform:scale(.97);}
.choice-btn{transition:all .15s;-webkit-tap-highlight-color:transparent;}
.action-cta{transition:transform .15s;-webkit-tap-highlight-color:transparent;}
.action-cta:active{transform:scale(.97);}
.attach-btn{transition:color .15s,background .15s;-webkit-tap-highlight-color:transparent;}
.chat-input:focus{border-color:#D4A843 !important;box-shadow:0 0 0 3px rgba(212,168,67,.15) !important;outline:none;}
.error-bubble{background:rgba(248,113,113,.08);border:1px solid rgba(248,113,113,.25);border-radius:18px 18px 18px 4px;padding:12px 16px;font-size:13.5px;color:#F87171;line-height:1.6;}
.lang-bar{display:flex;gap:6px;overflow-x:auto;}
.lang-pill{flex-shrink:0;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:500;cursor:pointer;border:1px solid rgba(212,168,67,.25);color:#8A9BB5;background:transparent;font-family:inherit;transition:all .15s;}
.lang-pill.active{background:rgba(212,168,67,.12);border-color:rgba(212,168,67,.5);color:#D4A843;}
.upload-area{border:2px dashed rgba(45,212,191,.4);border-radius:16px;padding:28px 20px;display:flex;flex-direction:column;align-items:center;gap:12px;cursor:pointer;background:rgba(45,212,191,.06);}
.banner-tab{flex:1;padding:10px;border-radius:10px;border:1px solid rgba(212,168,67,.14);background:transparent;color:#8A9BB5;font-size:12px;cursor:pointer;font-family:inherit;transition:all .15s;font-weight:500;}
.banner-tab.active{background:rgba(212,168,67,.1);border-color:rgba(212,168,67,.4);color:#D4A843;}
.dl-btn{flex:1;padding:14px;border-radius:14px;border:none;font-weight:700;font-size:14px;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:6px;}
.cat-btn{padding:14px 12px;border-radius:12px;border:1px solid rgba(212,168,67,.2);background:rgba(212,168,67,.04);cursor:pointer;font-family:inherit;text-align:left;transition:all .15s;}
.cat-btn.selected{border-color:#D4A843;background:rgba(212,168,67,.12);}
.back-btn{display:flex;align-items:center;gap:6px;background:transparent;border:none;color:#8A9BB5;cursor:pointer;font-family:inherit;font-size:13px;padding:4px 0;}
.stat-pill{border-radius:10px;padding:12px 14px;font-size:13px;font-weight:600;line-height:1.4;}`

const Icons = {
  Mic: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <rect x="9" y="2" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="2" />
      <path d="M5 10a7 7 0 0014 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="12" y1="19" x2="12" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  Attach: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
    </svg>
  ),
  Send: ({ color }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M12 19V5M5 12L12 5L19 12" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Speaker: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <path d="M11 5L6 9H2v6h4l5 4V5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19.07 4.93a10 10 0 010 14.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  Download: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  Check: ({ color = '#2DD4BF' }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, animation: 'checkPop 0.4s cubic-bezier(0.22,1,0.36,1) both' }}>
      <circle cx="12" cy="12" r="10" fill={color + '22'} stroke={color} strokeWidth="1.5" />
      <path d="M8 12l3 3 5-5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Twitter: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
    </svg>
  ),
  Back: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M19 12H5M5 12l7 7M5 12l7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
}

function rrect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

const inputStyle = {
  padding: '14px 16px',
  background: B.navy,
  border: `1px solid ${B.navyB}`,
  borderRadius: 14,
  fontSize: 14,
  color: B.white,
  fontFamily: 'inherit',
  outline: 'none',
}

function SubHeader({ title, titleColor, onBack, rightSlot = null }) {
  return (
    <div
      style={{
        padding: '12px 16px',
        background: B.navyL,
        borderBottom: `1px solid ${B.navyB}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      <button className="back-btn" onClick={onBack}>
        <Icons.Back /> Back
      </button>
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: titleColor || B.white,
          letterSpacing: 0.5,
          textTransform: 'uppercase',
          textAlign: 'center',
          flex: 1,
        }}
      >
        {title}
      </div>
      <div style={{ minWidth: 40, display: 'flex', justifyContent: 'flex-end' }}>{rightSlot}</div>
    </div>
  )
}

function Progress({ step, total, color }) {
  return (
    <div style={{ padding: '10px 16px 0' }}>
      <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden', marginBottom: 10 }}>
        <div
          style={{
            height: '100%',
            width: `${(step / total) * 100}%`,
            background: `linear-gradient(90deg,${color},${B.gold})`,
            borderRadius: 3,
            transition: 'width 0.45s cubic-bezier(0.22,1,0.36,1)',
          }}
        />
      </div>
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 12 }}>
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: i < step ? color : i === step ? B.gold : 'rgba(255,255,255,0.08)',
              boxShadow: i === step ? `0 0 8px ${B.gold}` : 'none',
              transition: 'all 0.3s',
            }}
          />
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
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [onDone])

  return (
    <div
      className={leaving ? 'splash-out' : ''}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999,
        background: B.navy,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <img src="/logo.png" alt="Sabi AI" style={{ width: 280, maxWidth: '75vw', height: 'auto', objectFit: 'contain' }} />
    </div>
  )
}

function HomeActionCard({ icon, title, sub, color, onClick, accent = 'soft' }) {
  const bg = accent === 'strong' ? `${color}12` : `${color}08`
  const border = accent === 'strong' ? `${color}55` : `${color}28`

  return (
    <button
      onClick={onClick}
      className="prompt-card"
      style={{
        width: '100%',
        padding: accent === 'strong' ? '18px 16px' : '14px 14px',
        borderRadius: 18,
        border: `1px solid ${border}`,
        background: bg,
        textAlign: 'left',
        display: 'flex',
        gap: 14,
        alignItems: 'flex-start',
        boxShadow: accent === 'strong' ? '0 8px 26px rgba(0,0,0,.22)' : '0 4px 16px rgba(0,0,0,.18)',
        fontFamily: 'inherit',
      }}
    >
      <div
        style={{
          width: accent === 'strong' ? 44 : 36,
          height: accent === 'strong' ? 44 : 36,
          borderRadius: 14,
          background: `linear-gradient(135deg, ${color}, ${color}cc)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          color: color === B.teal ? '#0D1A1A' : '#0D0A00',
          fontSize: accent === 'strong' ? 20 : 17,
          boxShadow: `0 0 0 3px ${color}22`,
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: accent === 'strong' ? 14.5 : 13.5, fontWeight: 800, color: B.white, lineHeight: 1.28, marginBottom: 4 }}>
          {title}
        </div>
        <div style={{ fontSize: accent === 'strong' ? 11.5 : 11, color: B.mid, lineHeight: 1.45 }}>
          {sub}
        </div>
      </div>
    </button>
  )
}
function ShareCard({ type, shopName = '', shopCategory = '', community = COMMUNITIES['bitcoin-abuja'], onClose }) {
  const title = type === 'merchant' ? 'My shop accepts Bitcoin now' : 'I joined Bitcoin Abuja'
  const subtitle =
    type === 'merchant'
      ? `${shopName || 'My shop'} is now ready for Bitcoin Lightning payments.`
      : `I just joined ${community.name} on Fedi.`
  const emoji = type === 'merchant' ? (CAT_EMOJI[shopCategory] || '🏪') : '₿'

  const shareText =
    type === 'merchant'
      ? `${title}\n${subtitle}\nJoin Bitcoin Abuja on Fedi: ${community.communityLink}`
      : `${title}\n${subtitle}\nJoin here: ${community.communityLink}`

  const shareToX = () => {
    const url = `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(shareText)
      alert('Copied')
    } catch {
      alert('Copy failed')
    }
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <SubHeader title="Share Card" titleColor={type === 'merchant' ? B.teal : B.orange} onBack={onClose} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 40px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div
          style={{
            background: `linear-gradient(180deg, ${B.navyL}, ${B.navy})`,
            border: `1px solid ${type === 'merchant' ? B.tealB : B.orangeB}`,
            borderRadius: 20,
            padding: 22,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: 12,
          }}
        >
          <div style={{ fontSize: 42 }}>{emoji}</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: B.white, lineHeight: 1.25 }}>{title}</div>
          <div style={{ fontSize: 14, color: B.mid, lineHeight: 1.7 }}>{subtitle}</div>

          {type === 'merchant' && (
            <div
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 12,
                background: B.tealF,
                border: `1px solid ${B.tealB}`,
                color: B.teal,
                fontSize: 12,
                lineHeight: 1.6,
              }}
            >
              {shopName ? `${shopName} · ` : ''}Scan, pay, and settle with Bitcoin Lightning.
            </div>
          )}

          <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8 }}>
            <button
              className="action-cta"
              onClick={shareToX}
              style={{
                padding: 14,
                borderRadius: 14,
                border: 'none',
                background: `linear-gradient(135deg, ${B.gold}, ${B.goldD})`,
                color: '#0D0A00',
                fontWeight: 800,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Post to X
            </button>
            <button
              className="action-cta"
              onClick={copyText}
              style={{
                padding: 14,
                borderRadius: 14,
                border: `1px solid ${B.navyB}`,
                background: 'transparent',
                color: B.white,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Copy Text
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: 12,
            borderRadius: 14,
            border: `1px solid ${B.navyB}`,
            background: 'transparent',
            color: B.mid,
            fontSize: 13,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Back
        </button>
      </div>
    </div>
  )
}

function CommunityRequestForm({ onBack }) {
  const [name, setName] = useState('')
  const [community, setCommunity] = useState('')
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('Nigeria')
  const [fediLink, setFediLink] = useState('')
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!name.trim() || !community.trim() || !city.trim()) return
    setLoading(true)
    await submitCommunityRequest({
      name: name.trim(),
      community: community.trim(),
      city: city.trim(),
      country: country.trim(),
      fediLink: fediLink.trim(),
      email: email.trim(),
    })
    setLoading(false)
    setDone(true)
  }

  if (done) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <SubHeader title="Request Sent" titleColor={B.teal} onBack={onBack} />
        <div style={{ flex: 1, padding: '20px 16px 40px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div
            style={{
              background: B.navyL,
              border: `1px solid ${B.tealB}`,
              borderRadius: 20,
              padding: 24,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 44, marginBottom: 10 }}>✓</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: B.white, marginBottom: 8 }}>Request received</div>
            <div style={{ fontSize: 14, color: B.mid, lineHeight: 1.7 }}>
              Sabi can be adapted for your community.
            </div>
          </div>
          <button
            onClick={onBack}
            style={{
              width: '100%',
              padding: 14,
              borderRadius: 14,
              border: 'none',
              background: `linear-gradient(135deg, ${B.teal}, #0ea5a0)`,
              color: '#0D1A1A',
              fontWeight: 800,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Back to Sabi AI
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <SubHeader title="Community Request" titleColor={B.purple} onBack={onBack} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 40px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: B.white, lineHeight: 1.4 }}>
          Bring Sabi to your community
        </div>
        <div style={{ fontSize: 13, color: B.mid, lineHeight: 1.7 }}>
          Fill this in and it gets saved for follow-up.
        </div>

        <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" style={inputStyle} />
        <input value={community} onChange={e => setCommunity(e.target.value)} placeholder="Community name" style={inputStyle} />
        <input value={city} onChange={e => setCity(e.target.value)} placeholder="City" style={inputStyle} />
        <input value={country} onChange={e => setCountry(e.target.value)} placeholder="Country" style={inputStyle} />
        <input value={fediLink} onChange={e => setFediLink(e.target.value)} placeholder="Fedi link (optional)" style={inputStyle} />
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email (optional)" style={inputStyle} />

        <button
          onClick={submit}
          disabled={loading}
          style={{
            padding: 14,
            borderRadius: 14,
            border: 'none',
            background: loading ? B.navyLL : `linear-gradient(135deg, ${B.purple}, #7c3aed)`,
            color: 'white',
            fontWeight: 800,
            fontSize: 15,
            cursor: loading ? 'default' : 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {loading ? 'Sending…' : 'Submit Request'}
        </button>

        <button
          onClick={onBack}
          style={{
            background: 'transparent',
            border: 'none',
            color: B.dim,
            fontSize: 12,
            cursor: 'pointer',
            fontFamily: 'inherit',
            textAlign: 'center',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

function StatsView({ onBack, communityId = 'bitcoin-abuja' }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  useEffect(() => {
    fetchStats(communityId)
      .then(d => {
        setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [communityId])

  const statsCards = [
    { label: 'Conversations', value: loading ? '—' : data?.totalConv ?? 0, delta: loading ? '...' : `+${data?.weekConv ?? 0} this week`, color: B.gold },
    { label: 'Members', value: loading ? '—' : data?.totalMemb ?? 0, delta: loading ? '...' : `+${data?.weekMemb ?? 0} this week`, color: B.teal },
    { label: 'Merchants', value: loading ? '—' : data?.merchants?.length ?? 0, delta: 'Bitcoin Abuja', color: B.orange },
  ]

  return (
    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      <SubHeader title="Impact Dashboard" titleColor={B.gold} onBack={onBack} />
      <div style={{ padding: '16px 16px 40px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ background: B.navyL, border: `1px solid ${B.goldB}`, borderRadius: 16, padding: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 32, flexShrink: 0 }}>🇳🇬</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: B.white, lineHeight: 1.3, marginBottom: 4 }}>
              Nigeria's Bitcoin AI guide.
              <br />
              <span style={{ color: B.gold }}>Real people. Real language. Real sats.</span>
            </div>
            <div style={{ fontSize: 11, color: B.mid }}>Built by Aisha Ummi Waziri · Powered by Fedi</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          {statsCards.map((s, i) => (
            <div key={i} style={{ background: B.navyL, border: `1px solid ${B.dim}`, borderRadius: 14, padding: '14px 10px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${s.color},${s.color}66)` }} />
              <div style={{ fontSize: 9, color: B.mid, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: s.color, letterSpacing: -1, marginBottom: 3 }}>{s.value}</div>
              <div style={{ fontSize: 9, color: B.green, fontWeight: 500, lineHeight: 1.3 }}>{s.delta}</div>
            </div>
          ))}
        </div>

        <div style={{ background: B.navyL, border: `1px solid ${B.dim}`, borderRadius: 16, padding: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: B.white, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: B.gold }} />
            Language Breakdown
          </div>
          {loading ? (
            <div style={{ fontSize: 12, color: B.dim, textAlign: 'center', padding: 8 }}>Loading...</div>
          ) : (() => {
              const lc = {}
              data?.langData?.forEach(r => {
                const l = r.language || 'en'
                lc[l] = (lc[l] || 0) + 1
              })
              const total = Object.values(lc).reduce((a, b) => a + b, 0) || 1
              const sorted = Object.entries(lc).sort((a, b) => b[1] - a[1])
              if (!sorted.length) return <div style={{ fontSize: 12, color: B.dim, textAlign: 'center', padding: 8 }}>No data yet</div>
              return sorted.map(([lang, count], i) => {
                const pct = Math.round((count / total) * 100)
                const color = LANG_COLORS_S[lang] || '#8A9BB5'
                return (
                  <div key={i} style={{ marginBottom: i < sorted.length - 1 ? 12 : 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: B.white }}>{LANG_NAMES_S[lang] || lang}</span>
                      <span style={{ fontSize: 11, color: B.mid }}>{count}</span>
                    </div>
                    <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3 }} />
                    </div>
                  </div>
                )
              })
            })()}
        </div>

        <div style={{ background: B.navyL, border: `1px solid ${B.dim}`, borderRadius: 16, padding: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: B.white, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: B.teal }} />
            Daily Conversations
          </div>
          <div style={{ height: 90, display: 'flex', alignItems: 'flex-end', gap: 5 }}>
            {(() => {
              const dc = new Array(7).fill(0)
              data?.dailyData?.forEach(r => {
                const d = new Date(r.created_at).getDay()
                dc[d === 0 ? 6 : d - 1]++
              })
              const maxC = Math.max(...dc, 1)
              const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1
              return dc.map((count, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
                  <div
                    style={{
                      width: '100%',
                      borderRadius: '4px 4px 2px 2px',
                      background: i === todayIdx ? B.gold : `${B.gold}44`,
                      height: `${Math.max((count / maxC) * 100, 5)}%`,
                      boxShadow: i === todayIdx ? `0 0 8px ${B.gold}66` : 'none',
                    }}
                  />
                  <div style={{ fontSize: 9, color: i === todayIdx ? B.gold : B.dim, fontWeight: i === todayIdx ? 600 : 400 }}>{days[i]}</div>
                </div>
              ))
            })()}
          </div>
        </div>

        <div style={{ background: B.navyL, border: `1px solid ${B.dim}`, borderRadius: 16, padding: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: B.white, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: B.orange }} />
            Active Merchants
          </div>
          {loading ? (
            <div style={{ fontSize: 12, color: B.dim, textAlign: 'center', padding: 8 }}>Loading...</div>
          ) : !data?.merchants?.length ? (
            <div style={{ fontSize: 12, color: B.dim, textAlign: 'center', padding: 8 }}>No merchants yet. Be the first!</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.merchants.map((m, i) => (
                <div key={i} style={{ background: B.navyLL, border: `1px solid ${B.dim}`, borderRadius: 12, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg,${B.gold},${B.goldD})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                    {CAT_EMOJI[m.category] || '🏪'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: B.white, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.shop_name}</div>
                    <div style={{ fontSize: 10.5, color: B.mid, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.location || 'Abuja'}</div>
                  </div>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: B.green, flexShrink: 0 }} />
                </div>
              ))}
            </div>
          )}
        </div>

        {data?.requests?.length > 0 && (
          <div style={{ background: B.navyL, border: `1px solid ${B.dim}`, borderRadius: 16, padding: 18 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: B.white, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: B.purple }} />
              Community Requests
            </div>
            {data.requests.map((r, i) => (
              <div key={i} style={{ background: B.navyLL, border: `1px solid ${B.dim}`, borderRadius: 10, padding: 10, marginBottom: i < data.requests.length - 1 ? 8 : 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: B.white }}>
                  {r.name || 'Anonymous'} — {r.community || 'Unknown'}
                </div>
                <div style={{ fontSize: 10, color: B.mid, marginTop: 3 }}>
                  📍 {r.city || 'Unknown'} · {new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ fontSize: 10, color: B.dim, textAlign: 'center', letterSpacing: 0.5 }}>Bitcoin Abuja · sabibtc.vercel.app · @Ummi_xyz</div>
      </div>
    </div>
  )
}

function JoinCommunityScreen({ community, onDone, onBack, titleColor, title }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <SubHeader title={title} titleColor={titleColor} onBack={onBack} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 40px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ background: B.navyL, borderRadius: 20, padding: 20, border: `1px solid ${B.orangeB}`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: B.white, textAlign: 'center', lineHeight: 1.5 }}>
            Join {community.name} on Fedi
          </div>
          <div style={{ fontSize: 12, color: B.gold, background: B.goldF, border: `1px solid ${B.goldB}`, borderRadius: 10, padding: '10px 14px', lineHeight: 1.6, textAlign: 'center', width: '100%' }}>
            Important: Join a federation from the Wallet tab first — that creates your Bitcoin wallet. Then join this community separately.
          </div>
          <div style={{ background: 'white', borderRadius: 14, padding: 12 }}>
            <img src={community.communityQR} alt={`${community.name} QR`} style={{ width: 160, height: 160, display: 'block' }} />
          </div>
          <div style={{ fontSize: 12, color: B.mid, textAlign: 'center', lineHeight: 1.6 }}>
            Open Fedi → tap the scan icon → scan this QR code
          </div>
          <button
            className="action-cta"
            onClick={() => {
              window.location.href = community.communityLink
            }}
            style={{
              width: '100%',
              padding: 14,
              borderRadius: 14,
              border: 'none',
              background: `linear-gradient(135deg,${B.orange},#c2610f)`,
              color: 'white',
              fontWeight: 800,
              fontSize: 14,
              cursor: 'pointer',
              fontFamily: 'inherit',
              boxShadow: '0 3px 16px rgba(249,115,22,.3)',
            }}
          >
            Open {community.name} in Fedi
          </button>
          <button
            onClick={onDone}
            style={{
              background: 'transparent',
              border: 'none',
              color: B.dim,
              fontSize: 12,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            I have already joined ✓
          </button>
        </div>
        <div style={{ fontSize: 11, color: B.dim, textAlign: 'center' }}>Bitcoin Abuja · Powered by Fedi</div>
      </div>
    </div>
  )
}

function StepCard({ step, feedback, titleColor, onYes, onNo, onSkip, yesLabel = 'Yes ✓', noLabel = 'Not yet', skipLabel = 'Skip this step' }) {
  return (
    <div
      style={{
        background: B.navyL,
        borderRadius: 20,
        padding: 22,
        border: `1px solid ${feedback === 'yes' ? `${titleColor}40` : feedback === 'no' ? B.redB : B.navyB}`,
        transition: 'border-color 0.3s',
        marginBottom: 4,
      }}
    >
      <div style={{ fontSize: 10, color: B.dim, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>{step.ins}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: B.white, lineHeight: 1.5, marginBottom: 20 }}>{step.q}</div>

      {feedback === 'yes' && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 13px', background: `${titleColor}18`, border: `1px solid ${titleColor}40`, borderRadius: 12, marginBottom: 14 }}>
          <Icons.Check color={titleColor} />
          <span style={{ fontSize: 13, color: titleColor, lineHeight: 1.5 }}>{step.yes}</span>
        </div>
      )}

      {feedback === 'no' && (
        <div style={{ padding: '13px', background: B.redF, border: `1px solid ${B.redB}`, borderRadius: 12, marginBottom: 14 }}>
          <div style={{ fontSize: 13, color: B.mid, lineHeight: 1.65, marginBottom: 12 }}>{step.no}</div>
          <button
            onClick={() => onNo('reset')}
            style={{
              padding: '9px 18px',
              borderRadius: 20,
              border: `1px solid ${B.navyB}`,
              background: 'transparent',
              color: B.white,
              fontSize: 12,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            I'm ready now
          </button>
        </div>
      )}

      {!feedback && (
        <div style={{ display: 'flex', gap: 10, flexDirection: 'column' }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="yes-btn"
              onClick={onYes}
              style={{
                flex: 1,
                padding: 14,
                borderRadius: 14,
                border: 'none',
                background: `linear-gradient(135deg,${titleColor},${titleColor}cc)`,
                color: titleColor === B.teal ? '#0D1A1A' : 'white',
                fontWeight: 800,
                fontSize: 15,
                cursor: 'pointer',
                fontFamily: 'inherit',
                boxShadow: `0 3px 16px ${titleColor}44`,
              }}
            >
              {yesLabel}
            </button>
            <button
              className="no-btn"
              onClick={() => onNo('no')}
              style={{
                flex: 1,
                padding: 14,
                borderRadius: 14,
                border: `1px solid ${B.redB}`,
                background: B.redF,
                color: B.red,
                fontWeight: 700,
                fontSize: 15,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {noLabel}
            </button>
          </div>

          {step.canSkip && (
            <button
              onClick={onSkip}
              style={{
                background: 'transparent',
                border: 'none',
                color: B.dim,
                fontSize: 12,
                cursor: 'pointer',
                fontFamily: 'inherit',
                textAlign: 'center',
                padding: '4px 0',
              }}
            >
              {skipLabel}
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
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <SubHeader title={title} titleColor={titleColor} onBack={onBack} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 40px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${((idx + 1) / cards.length) * 100}%`, background: `linear-gradient(90deg,${titleColor},${B.gold})`, borderRadius: 3, transition: 'width 0.5s' }} />
        </div>

        <div className="card-slide" key={idx} style={{ background: B.navyL, border: `1px solid ${B.navyB}`, borderRadius: 20, padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 40 }}>{card.icon}</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: B.white, lineHeight: 1.3 }}>{card.title}</div>
          <div style={{ fontSize: 14, color: B.mid, lineHeight: 1.75 }}>{card.body}</div>
          <div className="stat-pill" style={{ background: `${card.statColor}18`, border: `1px solid ${card.statColor}33`, color: card.statColor }}>
            {card.stat}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: B.dim }}>
            {idx + 1} of {cards.length}
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            {cards.map((_, i) => (
              <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: i === idx ? titleColor : 'rgba(255,255,255,0.12)', transition: 'background 0.3s' }} />
            ))}
          </div>
        </div>

        {isLast ? (
          <button
            className="action-cta"
            onClick={onDone}
            style={{
              width: '100%',
              padding: 14,
              borderRadius: 14,
              border: 'none',
              background: `linear-gradient(135deg,${B.orange},#c2610f)`,
              color: 'white',
              fontWeight: 800,
              fontSize: 15,
              cursor: 'pointer',
              fontFamily: 'inherit',
              boxShadow: '0 3px 16px rgba(249,115,22,.3)',
            }}
          >
            {tx.iAmReady}
          </button>
        ) : (
          <button
            className="action-cta"
            onClick={() => setIdx(p => p + 1)}
            style={{
              width: '100%',
              padding: 14,
              borderRadius: 14,
              border: 'none',
              background: `linear-gradient(135deg,${titleColor},${titleColor}cc)`,
              color: titleColor === B.teal ? '#0D1A1A' : 'white',
              fontWeight: 800,
              fontSize: 15,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Next →
          </button>
        )}

        <button
          onClick={onBack}
          style={{
            background: 'transparent',
            border: 'none',
            color: B.dim,
            fontSize: 12,
            cursor: 'pointer',
            fontFamily: 'inherit',
            textAlign: 'center',
          }}
        >
          {tx.skipSetup}
        </button>
      </div>
    </div>
  )
}
function MerchantOnboarding({ onBack, community, activeLang = 'en' }) {
  const lang = activeLang === 'pc' ? 'pc' : activeLang === 'ha' ? 'ha' : activeLang === 'yo' ? 'yo' : activeLang === 'ig' ? 'ig' : 'en'
  const tx = T[lang] || T.en
  const steps = MERCHANT_STEPS_TRANSLATED[lang] || MERCHANT_STEPS_TRANSLATED.en
  const [phase, setPhase] = useState('steps')
  const [step, setStep] = useState(0)
  const [feedback, setFeedback] = useState(null)
  const [shopName, setShopName] = useState('')
  const [shopCategory, setShopCategory] = useState('')
  const [shopLocation, setShopLocation] = useState('')
  const [bannerLang, setBannerLang] = useState('en')
  const [qrData, setQrData] = useState(null)
  const [bannerMode, setBannerMode] = useState('print')
  const [bannerReady, setBannerReady] = useState(false)
  const canvasRef = useRef(null)

  const currentStep = steps[Math.min(step, steps.length - 1)]

  useEffect(() => {
    if (step >= steps.length) setPhase('name')
  }, [step])

  const handleYes = () => {
    setFeedback('yes')
    setTimeout(() => {
      setFeedback(null)
      setStep(p => p + 1)
    }, 900)
  }

  const handleNo = action => {
    if (action === 'reset') {
      setFeedback(null)
      return
    }
    if (currentStep?.joinScreen) {
      setPhase('join')
      return
    }
    setFeedback('no')
  }

  useEffect(() => {
    if (phase !== 'banner' || !canvasRef.current || !qrData) return

    let cancelled = false
    const canvas = canvasRef.current
    const isPrint = bannerMode === 'print'
    const W = isPrint ? 1240 : 1080
    const H = isPrint ? 620 : 1080
    canvas.width = W
    canvas.height = H

    const loadImage = src =>
      new Promise(resolve => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => resolve(img)
        img.onerror = () => resolve(null)
        img.src = src
      })

    const fitText = (ctx, text, x, y, maxWidth, lineHeight, maxLines = 2) => {
      const words = String(text || '').split(/\s+/)
      let line = ''
      let lines = 0
      for (let i = 0; i < words.length; i++) {
        const test = line ? line + ' ' + words[i] : words[i]
        if (ctx.measureText(test).width > maxWidth && i > 0) {
          ctx.fillText(line, x, y)
          line = words[i]
          y += lineHeight
          lines++
          if (lines >= maxLines - 1) break
        } else {
          line = test
        }
      }
      if (lines < maxLines) ctx.fillText(line, x, y)
      return y
    }

    const drawBanner = async () => {
      const [fediImg, btcImg, qrImg] = await Promise.all([
        loadImage('/fedi-logo-dark.png'),
        loadImage('/bitcoin-abuja-logo.png'),
        loadImage(qrData),
      ])
      if (cancelled) return

      const ctx = canvas.getContext('2d')

      const bg = ctx.createLinearGradient(0, 0, W, H)
      bg.addColorStop(0, '#0E1524')
      bg.addColorStop(0.5, '#1B2232')
      bg.addColorStop(1, '#0B1220')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, W, H)

      const topBand = ctx.createLinearGradient(0, 0, W, 0)
      topBand.addColorStop(0, '#F97316')
      topBand.addColorStop(0.55, '#D4A843')
      topBand.addColorStop(1, '#F97316')
      ctx.fillStyle = topBand
      ctx.fillRect(0, 0, W, isPrint ? 12 : 14)

      const cat = BUSINESS_CATEGORIES.find(c => c.id === shopCategory)
      const catEmoji = cat?.emoji || '🏪'
      const catLabel = cat?.label || 'Business'
      const name = shopName || 'Your Shop'
      const loc = shopLocation || ''
      const bl = BILINGUAL[bannerLang] || BILINGUAL.en

      ctx.fillStyle = 'rgba(255,255,255,0.04)'
      rrect(ctx, 42, 42, W - 84, H - 84, 28)
      ctx.fill()

      const drawLogo = (img, x, y, w, h) => {
        if (img) ctx.drawImage(img, x, y, w, h)
      }


      if (isPrint) {
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, W, H)

        const stripe = ctx.createLinearGradient(0, 0, W, 0)
        stripe.addColorStop(0, '#F97316')
        stripe.addColorStop(0.5, '#D4A843')
        stripe.addColorStop(1, '#F97316')
        ctx.fillStyle = stripe
        ctx.fillRect(0, 0, W, 18)
        ctx.fillRect(0, H - 18, W, 18)

        drawLogo(btcImg, 48, 28, 200, 56)
        if (fediImg) ctx.drawImage(fediImg, W - 168, 32, 120, 34)

        const leftX = 52
        const rightCardW = 300
        const rightCardX = W - rightCardW - 56
        const rightCardH = 342
        const rightCardY = Math.round((H - rightCardH) / 2)
        const textMaxW = rightCardX - leftX - 36

        ctx.save()
        ctx.shadowColor = 'rgba(11,18,32,0.12)'
        ctx.shadowBlur = 24
        ctx.shadowOffsetY = 10
        ctx.fillStyle = '#F8F9FA'
        ctx.strokeStyle = '#E5E7EB'
        ctx.lineWidth = 1.5
        rrect(ctx, rightCardX, rightCardY, rightCardW, rightCardH, 18)
        ctx.fill()
        ctx.stroke()
        ctx.restore()

        const qrSize = 220
        const qrX = rightCardX + Math.round((rightCardW - qrSize) / 2)
        const qrY = rightCardY + 40
        if (qrImg) ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize)

        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        ctx.fillStyle = '#0B1220'
        ctx.font = '700 16px Satoshi, Arial'
        ctx.fillText('Scan to pay', rightCardX + rightCardW / 2, qrY + qrSize + 16)

        ctx.fillStyle = '#2DD4BF'
        ctx.font = '600 13px Satoshi, Arial'
        ctx.fillText('No POS needed', rightCardX + rightCardW / 2, qrY + qrSize + 34)

        ctx.fillStyle = '#8A9BB5'
        ctx.font = '500 12px Satoshi, Arial'
        ctx.fillText('Bitcoin Abuja · Powered by Fedi', rightCardX + rightCardW / 2, qrY + qrSize + 54)

        ctx.textAlign = 'left'
        ctx.textBaseline = 'top'

        ctx.fillStyle = '#F97316'
        ctx.font = '800 25px Satoshi, Arial'
        ctx.fillText(bl.title, leftX, 88)

        if (bl.localTitle) {
          ctx.fillStyle = '#D4A843'
          ctx.font = '700 18px Satoshi, Arial'
          ctx.fillText(bl.localTitle, leftX, 120)
        }

        ctx.fillStyle = '#0B1220'
        ctx.font = '900 60px Satoshi, Arial'
        const nameY = fitText(ctx, name, leftX, bl.localTitle ? 156 : 140, textMaxW, 62, 2)

        ctx.fillStyle = '#2DD4BF'
        ctx.font = '700 20px Satoshi, Arial'
        ctx.fillText(bl.lightning, leftX, nameY + 62)

        if (bl.localLightning) {
          ctx.fillStyle = '#2DD4BF'
          ctx.font = '500 16px Satoshi, Arial'
          ctx.fillText(bl.localLightning, leftX, nameY + 88)
        }

        if (loc) {
          ctx.fillStyle = '#8A9BB5'
          ctx.font = '500 18px Satoshi, Arial'
          ctx.fillText('📍 ' + loc, leftX, bl.localLightning ? nameY + 116 : nameY + 96)
        }
      } else {
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, W, H)

        const sqStripe = ctx.createLinearGradient(0, 0, W, 0)
        sqStripe.addColorStop(0, '#F97316')
        sqStripe.addColorStop(0.5, '#D4A843')
        sqStripe.addColorStop(1, '#F97316')
        ctx.fillStyle = sqStripe
        ctx.fillRect(0, 0, W, 22)
        ctx.fillRect(0, H - 22, W, 22)

        drawLogo(btcImg, 50, 40, 200, 56)
        if (fediImg) ctx.drawImage(fediImg, W - 210, 48, 160, 44)

        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'

        ctx.fillStyle = '#F97316'
        ctx.font = '800 38px Satoshi, Arial'
        ctx.fillText(bl.title, W / 2, 116)

        if (bl.localTitle) {
          ctx.fillStyle = '#D4A843'
          ctx.font = '700 26px Satoshi, Arial'
          ctx.fillText(bl.localTitle, W / 2, 160)
        }

        ctx.fillStyle = '#0B1220'
        ctx.font = '900 74px Satoshi, Arial'
        const nameY = fitText(ctx, name, W / 2, bl.localTitle ? 208 : 188, W - 160, 82, 2)

        ctx.fillStyle = '#2DD4BF'
        ctx.font = '700 28px Satoshi, Arial'
        ctx.fillText(bl.lightning, W / 2, nameY + 68)

        if (bl.localLightning) {
          ctx.fillStyle = '#2DD4BF'
          ctx.font = '500 20px Satoshi, Arial'
          ctx.fillText(bl.localLightning, W / 2, nameY + 102)
        }

        if (loc) {
          ctx.fillStyle = '#8A9BB5'
          ctx.font = '500 22px Satoshi, Arial'
          ctx.fillText('📍 ' + loc, W / 2, nameY + 132)
        }

        const sqQrSize = 300
        const sqQrX = W / 2 - sqQrSize / 2
        const sqQrY = Math.max(
          430,
          Math.min(H - 410, bl.localLightning ? nameY + 192 : nameY + 170)
        )

        ctx.save()
        ctx.shadowColor = 'rgba(11,18,32,0.12)'
        ctx.shadowBlur = 24
        ctx.shadowOffsetY = 10
        ctx.fillStyle = '#FFFFFF'
        ctx.strokeStyle = '#E5E7EB'
        ctx.lineWidth = 2
        rrect(ctx, sqQrX - 18, sqQrY - 18, sqQrSize + 36, sqQrSize + 54, 18)
        ctx.fill()
        ctx.stroke()
        ctx.restore()

        if (qrImg) ctx.drawImage(qrImg, sqQrX, sqQrY, sqQrSize, sqQrSize)

        ctx.fillStyle = '#0B1220'
        ctx.font = '700 22px Satoshi, Arial'
        ctx.fillText('Scan to pay · No POS needed', W / 2, sqQrY + sqQrSize + 18)

        ctx.fillStyle = '#8A9BB5'
        ctx.font = '500 18px Satoshi, Arial'
        ctx.fillText('Bitcoin Abuja · Powered by Fedi', W / 2, H - 46)
      }

      if (!cancelled) setBannerReady(true)
    }

    drawBanner().catch(() => {
      if (!cancelled) setBannerReady(true)
    })

    return () => {
      cancelled = true
    }
  }, [phase, bannerMode, qrData, shopName, shopLocation, shopCategory, bannerLang])

  if (phase === 'congrats') {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <SubHeader title={tx.merchantTitle} titleColor={B.teal} onBack={onBack} />
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 16px 40px', display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', textAlign: 'center' }}>
          <div className="done-pop" style={{ background: B.navyL, border: `1px solid ${B.tealB}`, borderRadius: 24, padding: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, width: '100%' }}>
            <div style={{ fontSize: 56 }}>🎉</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: B.teal, lineHeight: 1.25 }}>
              {activeLang === 'ha' ? 'Barka da zama Ɗan Kasuwar Bitcoin!' :
               activeLang === 'yo' ? 'Eku idapọ mọ awọn oniṣowo Bitcoin!' :
               activeLang === 'ig' ? "Nnọọ n'ime ndị ahịa Bitcoin!" :
               activeLang === 'pc' ? 'You don become Bitcoin merchant!' :
               'Congratulations! You are now a Bitcoin merchant.'}
            </div>
            <div style={{ fontSize: 14, color: B.mid, lineHeight: 1.7, maxWidth: 300 }}>
              {activeLang === 'ha' ? 'Kantin ku yana shirye don karɓar Bitcoin. Masu siye na gaba na iya biyan ku nan take.' :
               activeLang === 'yo' ? 'Ile itaja rẹ ti ṣetan lati gba Bitcoin. Awọn onibara rẹ ti o tẹle le san ọ lẹsẹkẹsẹ.' :
               activeLang === 'ig' ? 'Ụlọ ahịa gị dị njikere ịnata Bitcoin. Ndị ahịa gị na-esote nwere ike ịkwụ ụgwọ gị ozigbo.' :
               activeLang === 'pc' ? 'Your shop don ready to receive Bitcoin. Your next customer fit pay you instantly.' :
               'Your shop is now ready to accept Bitcoin. Your next customer can pay you instantly — no POS, no bank, no wait.'}
            </div>
          </div>
          <button
            onClick={() => setPhase('banner')}
            style={{ width: '100%', padding: 15, borderRadius: 14, border: 'none', background: `linear-gradient(135deg,${B.teal},#0ea5a0)`, color: '#0D1A1A', fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 3px 16px rgba(45,212,191,.3)' }}
          >
            {activeLang === 'ha' ? 'Ƙirƙiri Banner na →' :
             activeLang === 'yo' ? 'Ṣẹda Banner Mi →' :
             activeLang === 'ig' ? 'Mepụta Banner m →' :
             activeLang === 'pc' ? 'Make My Banner →' :
             'Get My Banner →'}
          </button>
          <button
            onClick={onBack}
            style={{ width: '100%', padding: 12, borderRadius: 14, border: `1px solid ${B.navyB}`, background: 'transparent', color: B.mid, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            {tx.backToSabi}
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'sharecard') return <ShareCard type="merchant" shopName={shopName} shopCategory={shopCategory} community={community} onClose={onBack} />

  if (phase === 'banner') {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <SubHeader title="Your Banner" titleColor={B.teal} onBack={() => setPhase('upload')} />
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 40px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {['print', 'square'].map(m => (
              <button key={m} className={`banner-tab${bannerMode === m ? ' active' : ''}`} onClick={() => setBannerMode(m)}>
                {m === 'print' ? 'Print (A4)' : 'Square (Social)'}
              </button>
            ))}
          </div>

          <div style={{ borderRadius: 18, overflow: 'hidden', boxShadow: '0 16px 40px rgba(0,0,0,.45)', background: '#0B1220', minHeight: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {!bannerReady && <div style={{ color: B.mid, fontSize: 13, padding: 20 }}>Generating banner...</div>}
            <canvas ref={canvasRef} style={{ width: '100%', height: 'auto', display: bannerReady ? 'block' : 'none' }} />
          </div>

          {bannerReady && (
            <>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  className="dl-btn"
                  style={{ background: `linear-gradient(135deg,${B.gold},${B.goldD})`, color: '#0D0A00', boxShadow: '0 3px 16px rgba(212,168,67,.35)' }}
                  onClick={() => {
                    const n = (shopName || 'merchant').toLowerCase().replace(/[^a-z0-9]/g, '-')
                    const a = document.createElement('a')
                    a.download = `${n}-${bannerMode}.png`
                    a.href = canvasRef.current.toDataURL('image/png')
                    a.click()
                  }}
                >
                  <Icons.Download /> Download
                </button>
                <button
                  className="dl-btn"
                  style={{ background: `linear-gradient(135deg,${B.orange},#c2610f)`, color: 'white' }}
                  onClick={() => setPhase('sharecard')}
                >
                  Share Card →
                </button>
              </div>
              <div style={{ fontSize: 11, color: B.dim, textAlign: 'center' }}>Save to camera roll · WhatsApp to any print shop</div>
            </>
          )}

          <button
            onClick={onBack}
            style={{
              width: '100%',
              padding: 12,
              borderRadius: 14,
              border: `1px solid ${B.navyB}`,
              background: 'transparent',
              color: B.mid,
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            ← {tx.backToSabi}
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'upload') {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <SubHeader title={tx.merchantTitle} titleColor={B.teal} onBack={() => setPhase('lang')} />
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 40px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: B.navyL, borderRadius: 20, padding: 20, border: `1px solid ${B.tealB}`, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: B.white, textAlign: 'center', lineHeight: 1.5 }}>
              {tx.uploadQR}
            </div>
            <div style={{ fontSize: 13, color: B.mid, textAlign: 'center', lineHeight: 1.65 }}>
              {tx.uploadQRSub}
            </div>
            {!qrData ? (
              <div className="upload-area" onClick={() => document.getElementById('merQR').click()}>
                <div style={{ fontSize: 36 }}>📸</div>
                <div style={{ fontSize: 14, color: B.teal, fontWeight: 700, textAlign: 'center' }}>{tx.tapUpload}</div>
                <div style={{ fontSize: 11, color: B.dim, textAlign: 'center' }}>JPEG or PNG from your camera roll</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <img src={qrData} alt="QR" style={{ maxWidth: 180, maxHeight: 180, borderRadius: 12, border: `2px solid ${B.tealB}` }} />
                <button
                  onClick={() => document.getElementById('merQR').click()}
                  style={{ background: 'transparent', border: `1px solid ${B.navyB}`, color: B.dim, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', padding: '8px 18px', borderRadius: 20 }}
                >
                  Upload different image
                </button>
              </div>
            )}
            <input
              type="file"
              id="merQR"
              accept="image/*"
              onChange={e => {
                const f = e.target.files[0]
                if (!f) return
                const reader = new FileReader()
                reader.onload = ev => setQrData(ev.target.result)
                reader.readAsDataURL(f)
                e.target.value = ''
              }}
              style={{ display: 'none' }}
            />
            <button
              disabled={!qrData}
              onClick={() => {
                logOnboarding('merchant', shopName, shopLocation, shopCategory, community.id)
                setPhase('congrats')
              }}
              style={{
                width: '100%',
                padding: 14,
                borderRadius: 14,
                border: 'none',
                background: qrData ? `linear-gradient(135deg,${B.teal},#0ea5a0)` : B.navyLL,
                color: qrData ? '#0D1A1A' : B.dim,
                fontWeight: 800,
                fontSize: 15,
                cursor: qrData ? 'pointer' : 'default',
                fontFamily: 'inherit',
                boxShadow: qrData ? '0 3px 16px rgba(45,212,191,.3)' : 'none',
              }}
            >
              {tx.generateBanner}
            </button>
          </div>
          <div style={{ fontSize: 11, color: B.dim, textAlign: 'center' }}>{tx.poweredBy}</div>
        </div>
      </div>
    )
  }

  if (phase === 'lang') {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <SubHeader title={tx.merchantTitle} titleColor={B.teal} onBack={() => setPhase('location')} />
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 40px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: B.white, marginBottom: 4 }}>{tx.bannerLang}</div>
          {[
            { key: 'en', title: 'English only', sub: '"Bitcoin accepted here · Scan to pay"' },
            { key: 'en-ha', title: 'English + Hausa', sub: '"Bitcoin accepted here · Muna karbar Bitcoin"' },
            { key: 'en-yo', title: 'English + Yoruba', sub: '"Bitcoin accepted here · A gba Bitcoin"' },
            { key: 'en-ig', title: 'English + Igbo', sub: '"Bitcoin accepted here · Anyị na-anabata Bitcoin"' },
            { key: 'en-pc', title: 'English + Pidgin', sub: '"Bitcoin accepted here · We dey collect Bitcoin"' },
          ].map(o => (
            <button
              key={o.key}
              onClick={() => {
                setBannerLang(o.key)
                setPhase('upload')
              }}
              style={{
                padding: '14px 16px',
                borderRadius: 14,
                border: `1px solid ${B.navyB}`,
                background: B.navyL,
                cursor: 'pointer',
                fontFamily: 'inherit',
                textAlign: 'left',
                width: '100%',
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, color: B.white, marginBottom: 3 }}>{o.title}</div>
              <div style={{ fontSize: 11.5, color: B.dim }}>{o.sub}</div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (phase === 'location') {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <SubHeader title={tx.merchantTitle} titleColor={B.teal} onBack={() => setPhase('category')} />
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 40px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: B.white }}>{tx.shopLocation}</div>
          <div style={{ fontSize: 13, color: B.mid }}>This helps customers find you on BTCMap.</div>
          <input
            value={shopLocation}
            onChange={e => setShopLocation(e.target.value)}
            placeholder="e.g. Wuse Market, Abuja"
            style={{ padding: '14px 16px', background: B.navy, border: `1px solid ${B.navyB}`, borderRadius: 14, fontSize: 14, color: B.white, fontFamily: 'inherit', outline: 'none' }}
          />
          <button
            onClick={() => setPhase('lang')}
            style={{
              padding: 14,
              borderRadius: 14,
              border: 'none',
              background: shopLocation.trim() ? `linear-gradient(135deg,${B.teal},#0ea5a0)` : B.navyLL,
              color: shopLocation.trim() ? '#0D1A1A' : B.dim,
              fontWeight: 700,
              fontSize: 15,
              cursor: shopLocation.trim() ? 'pointer' : 'default',
              fontFamily: 'inherit',
            }}
          >
            {tx.continue}
          </button>
          <button
            onClick={() => setPhase('lang')}
            style={{ background: 'transparent', border: 'none', color: B.dim, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center' }}
          >
            {tx.skipNoLocation}
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'category') {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <SubHeader title={tx.merchantTitle} titleColor={B.teal} onBack={() => setPhase('name')} />
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 40px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: B.white }}>{tx.businessType}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {BUSINESS_CATEGORIES.map(c => (
              <button key={c.id} className={`cat-btn${shopCategory === c.id ? ' selected' : ''}`} onClick={() => setShopCategory(c.id)}>
                <div style={{ fontSize: 22, marginBottom: 6 }}>{c.emoji}</div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: B.white, lineHeight: 1.3 }}>{c.label}</div>
              </button>
            ))}
          </div>
          <button
            onClick={() => setPhase('location')}
            disabled={!shopCategory}
            style={{
              padding: 14,
              borderRadius: 14,
              border: 'none',
              background: shopCategory ? `linear-gradient(135deg,${B.teal},#0ea5a0)` : B.navyLL,
              color: shopCategory ? '#0D1A1A' : B.dim,
              fontWeight: 700,
              fontSize: 15,
              cursor: shopCategory ? 'pointer' : 'default',
              fontFamily: 'inherit',
              marginTop: 4,
            }}
          >
            {tx.continue}
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'name') {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <SubHeader title={tx.merchantTitle} titleColor={B.teal} onBack={onBack} />
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 40px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: B.white }}>{tx.shopName}</div>
          <input
            value={shopName}
            onChange={e => setShopName(e.target.value)}
            placeholder="e.g. Fatima's Fashion, Musa Suya Joint…"
            style={{ padding: '14px 16px', background: B.navy, border: `1px solid ${B.navyB}`, borderRadius: 14, fontSize: 14, color: B.white, fontFamily: 'inherit', outline: 'none' }}
          />
          <button
            onClick={() => setPhase('category')}
            style={{
              padding: 14,
              borderRadius: 14,
              border: 'none',
              background: shopName.trim() ? `linear-gradient(135deg,${B.teal},#0ea5a0)` : B.navyLL,
              color: shopName.trim() ? '#0D1A1A' : B.dim,
              fontWeight: 700,
              fontSize: 15,
              cursor: shopName.trim() ? 'pointer' : 'default',
              fontFamily: 'inherit',
            }}
          >
            {tx.continue}
          </button>
          <button
            onClick={() => setPhase('category')}
            style={{ background: 'transparent', border: 'none', color: B.dim, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center' }}
          >
            {tx.skipNoName}
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'join') {
    return <JoinCommunityScreen community={community} onDone={() => { setPhase('steps'); setStep(p => p + 1) }} onBack={() => setPhase('steps')} titleColor={B.teal} title={tx.merchantTitle} />
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <SubHeader title={tx.merchantTitle} titleColor={B.teal} onBack={onBack} />
      <Progress step={step} total={steps.length} color={B.teal} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 40px' }}>
        <StepCard step={currentStep} feedback={feedback} titleColor={B.teal} onYes={handleYes} onNo={handleNo} onSkip={() => setStep(p => p + 1)} yesLabel={tx.yes} noLabel={tx.notYet} skipLabel={tx.skip} />
        <div style={{ fontSize: 11, color: B.dim, textAlign: 'center', marginTop: 16 }}>{tx.poweredBy}</div>
      </div>
    </div>
  )
}

function MemberOnboarding({ onBack, community, activeLang = 'en' }) {
  const lang = activeLang === 'pc' ? 'pc' : activeLang === 'ha' ? 'ha' : activeLang === 'yo' ? 'yo' : activeLang === 'ig' ? 'ig' : 'en'
  const tx = T[lang] || T.en
  const steps = MEMBER_STEPS_TRANSLATED[lang] || MEMBER_STEPS_TRANSLATED.en
  const [phase, setPhase] = useState('choice')
  const [learnStep, setLearnStep] = useState(0)
  const [step, setStep] = useState(0)
  const [feedback, setFeedback] = useState(null)
  const [contextType, setContextType] = useState(null)

  const currentStep = steps[Math.min(step, steps.length - 1)]

  const handleYes = () => {
    setFeedback('yes')
    setTimeout(() => {
      setFeedback(null)
      if (step === steps.length - 1) {
        logOnboarding('member', null, null, null, community.id)
        setPhase('done')
      } else {
        setStep(p => p + 1)
      }
    }, 900)
  }

  const handleNo = action => {
    if (action === 'reset') {
      setFeedback(null)
      return
    }
    if (currentStep?.joinScreen) {
      setPhase('join')
      return
    }
    setFeedback('no')
  }

  if (phase === 'sharecard') return <ShareCard type="member" community={community} onClose={onBack} />

  if (phase === 'done') {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <SubHeader title={`${tx.welcomeTo} ${community.name}`} titleColor={B.orange} onBack={onBack} />
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px 40px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="done-pop" style={{ background: B.navyL, border: `1px solid ${B.orangeB}`, borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center' }}>
            <div style={{ fontSize: 52 }}>₿</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: B.orange, lineHeight: 1.3 }}>Welcome to {community.name}!</div>
            <div style={{ fontSize: 13, color: B.mid, lineHeight: 1.65, maxWidth: 280 }}>You are now part of a real Bitcoin circular economy in Nigeria. Your sats are yours — no bank, no middleman.</div>
          </div>

          <div style={{ background: B.navy, border: '1px solid rgba(212,168,67,.2)', borderRadius: 16, padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 11, color: B.gold, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>🎁 100 Free Sats Waiting</div>
            <div style={{ fontSize: 13.5, color: B.white, lineHeight: 1.6 }}>
              The {community.name} Sats Faucet has 100 free sats for new members. This is your first real Bitcoin — proof of ownership. Stack more via Cashwyre when you are ready.
            </div>
            <button
              className="action-cta"
              onClick={() => window.open(community.faucetLink, '_blank')}
              style={{
                width: '100%',
                padding: 13,
                borderRadius: 12,
                border: 'none',
                background: `linear-gradient(135deg,${B.gold},${B.goldD})`,
                color: '#0D0A00',
                fontWeight: 800,
                fontSize: 14,
                cursor: 'pointer',
                fontFamily: 'inherit',
                boxShadow: '0 3px 12px rgba(212,168,67,.35)',
              }}
            >
              {tx.claimSats}
            </button>
          </div>

          <button
            className="action-cta"
            onClick={() => setPhase('sharecard')}
            style={{
              width: '100%',
              padding: 14,
              borderRadius: 14,
              border: 'none',
              background: `linear-gradient(135deg,${B.orange},#c2610f)`,
              color: 'white',
              fontWeight: 800,
              fontSize: 14,
              cursor: 'pointer',
              fontFamily: 'inherit',
              boxShadow: '0 3px 16px rgba(249,115,22,.3)',
            }}
          >
            {tx.shareCard}
          </button>

          <button
            onClick={onBack}
            style={{
              width: '100%',
              padding: 12,
              borderRadius: 14,
              border: `1px solid ${B.navyB}`,
              background: 'transparent',
              color: B.mid,
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {tx.backToSabi}
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'join') {
    return <JoinCommunityScreen community={community} onDone={() => { setPhase('steps'); setStep(p => p + 1) }} onBack={() => setPhase('steps')} titleColor={B.orange} title={tx.memberTitle} />
  }

  if (phase === 'context') {
    const cards = CONTEXT_CARDS[contextType] || []
    return (
      <ContextCarousel
        cards={cards}
        title={contextType === 'savings' ? tx.whyBitcoin : tx.whyLightning}
        titleColor={B.orange}
        onBack={() => setPhase('choice')}
        onDone={() => {
          setPhase('steps')
          setStep(0)
        }}
      />
    )
  }

  if (phase === 'learn') {
    const card = LEARN_CARDS[learnStep]
    const isLast = learnStep === LEARN_CARDS.length - 1
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <SubHeader title={tx.bitcoinBasics} titleColor={B.purple} onBack={() => (learnStep > 0 ? setLearnStep(p => p - 1) : setPhase('choice'))} />
        <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', margin: '10px 16px 0', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${((learnStep + 1) / LEARN_CARDS.length) * 100}%`, background: `linear-gradient(90deg,${B.purple},${B.teal})`, borderRadius: 3, transition: 'width 0.5s' }} />
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px 40px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card-slide" key={learnStep} style={{ background: B.navyL, border: `1px solid ${B.purpleB}`, borderRadius: 20, padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: 36 }}>{card.icon}</div>
            <div style={{ fontSize: 17, fontWeight: 900, color: B.white, lineHeight: 1.3 }}>{card.title}</div>
            <div style={{ fontSize: 13.5, color: B.mid, lineHeight: 1.75 }}>{card.body}</div>
            <div style={{ background: B.purpleF, border: `1px solid ${B.purpleB}`, borderRadius: 12, padding: '13px 15px', fontSize: 13, color: B.purple, lineHeight: 1.6 }}>
              {card.highlight}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: B.dim }}>
              {learnStep + 1} of {LEARN_CARDS.length}
            </span>
            <div style={{ display: 'flex', gap: 5 }}>
              {LEARN_CARDS.map((_, i) => (
                <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: i === learnStep ? B.purple : 'rgba(255,255,255,0.12)', transition: 'background 0.3s' }} />
              ))}
            </div>
          </div>
          {isLast ? (
            <button
              className="action-cta"
              onClick={() => {
                setPhase('steps')
                setStep(0)
              }}
              style={{
                width: '100%',
                padding: 14,
                borderRadius: 14,
                border: 'none',
                background: `linear-gradient(135deg,${B.orange},#c2610f)`,
                color: 'white',
                fontWeight: 800,
                fontSize: 15,
                cursor: 'pointer',
                fontFamily: 'inherit',
                boxShadow: '0 3px 16px rgba(249,115,22,.3)',
              }}
            >
              {tx.iAmReady}
            </button>
          ) : (
            <button
              className="action-cta"
              onClick={() => setLearnStep(p => p + 1)}
              style={{
                width: '100%',
                padding: 14,
                borderRadius: 14,
                border: 'none',
                background: `linear-gradient(135deg,${B.purple},#7c3aed)`,
                color: 'white',
                fontWeight: 800,
                fontSize: 15,
                cursor: 'pointer',
                fontFamily: 'inherit',
                boxShadow: '0 3px 16px rgba(167,139,250,.3)',
              }}
            >
              {tx.next}
            </button>
          )}
          <div style={{ fontSize: 11, color: B.dim, textAlign: 'center' }}>Bitcoin Abuja · Powered by Fedi</div>
        </div>
      </div>
    )
  }

  if (phase === 'steps') {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <SubHeader title={tx.memberTitle} titleColor={B.orange} onBack={() => (step > 0 ? setStep(p => p - 1) : setPhase('choice'))} />
        <Progress step={step} total={steps.length} color={B.orange} />
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 40px' }}>
          <StepCard step={currentStep} feedback={feedback} titleColor={B.orange} onYes={handleYes} onNo={handleNo} onSkip={() => setStep(p => p + 1)} yesLabel={tx.yes} noLabel={tx.notYet} skipLabel={tx.skip} />
          <div style={{ fontSize: 11, color: B.dim, textAlign: 'center', marginTop: 16 }}>{tx.poweredBy}</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <SubHeader title={tx.memberTitle} titleColor={B.orange} onBack={onBack} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 40px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 16, fontWeight: 900, color: B.white, lineHeight: 1.4, marginBottom: 4 }}>{tx.whatBringsYou} {community.name}?</div>
        <div style={{ fontSize: 13, color: B.mid, lineHeight: 1.6, marginBottom: 8 }}>
          {tx.chooseMatters}
        </div>

        {tx.choices.map((c, i) => ({ ...c, icon: ['📉','⚡','📚','🚀'][i], type: ['savings','remittance','learn','skip'][i], color: [B.gold, B.teal, B.purple, B.orange][i] })).map((c, i) => (
          <button
            key={i}
            className="choice-btn"
            onClick={() => {
              if (c.type === 'learn') setPhase('learn')
              else if (c.type === 'skip') {
                setPhase('steps')
                setStep(0)
              } else {
                setContextType(c.type)
                setPhase('context')
              }
            }}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: 16,
              border: `1px solid ${c.color}33`,
              background: `${c.color}08`,
              cursor: 'pointer',
              fontFamily: 'inherit',
              textAlign: 'left',
              display: 'flex',
              gap: 14,
              alignItems: 'flex-start',
            }}
          >
            <div style={{ fontSize: 26, flexShrink: 0, marginTop: 2 }}>{c.icon}</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: B.white, lineHeight: 1.3, marginBottom: 4 }}>{c.label}</div>
              <div style={{ fontSize: 11.5, color: B.mid, lineHeight: 1.4 }}>{c.sub}</div>
            </div>
          </button>
        ))}

        <div style={{ fontSize: 11, color: B.dim, textAlign: 'center', marginTop: 4 }}>Bitcoin Abuja · Powered by Fedi</div>
      </div>
    </div>
  )
}
export default function App() {
  const communityId = getCommunityFromURL()
  const community = COMMUNITIES[communityId] || COMMUNITIES['bitcoin-abuja']

  const [screen, setScreen] = useState('home')
  const [splashDone, setSplashDone] = useState(false)
  const [btc, setBtc] = useState({ usd: 96300, ngn: 154000000 })
  const [messages, setMessages] = useState([])
  const [displayMsgs, setDisplayMsgs] = useState([])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [attachedFile, setAttachedFile] = useState(null)
  const [activeLang, setActiveLang] = useState('en')
  const [isRecording, setIsRecording] = useState(false)
  const [voiceSupported, setVS] = useState(false)
  const [micError, setMicError] = useState('')
  const [mode, setMode] = useState('chat')

  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)
  const recognitionRef = useRef(null)
  const audioPlayerRef = useRef(null)

  const satNgn = btc ? (btc.ngn / 100000000).toFixed(2) : '1.54'
  const btcPrice = btc?.ngn ? (btc.ngn / 1000000).toFixed(0) : '154'
  const welcome = WELCOME_BY_LANG[activeLang] || WELCOME_BY_LANG.en
  const prompts = PROMPTS_BY_LANG[activeLang] || PROMPTS_BY_LANG.en

  useEffect(() => {
    fetchBTC().then(setBtc)
    const iv = setInterval(() => fetchBTC().then(setBtc), 180000)
    if (getSpeechRecognition()) setVS(true)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [displayMsgs, isLoading])


  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort()
        } catch {}
      }
    }
  }, [])

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel()

    if (audioPlayerRef.current) {
      try {
        audioPlayerRef.current.pause()
        audioPlayerRef.current.currentTime = 0
        if (audioPlayerRef.current.__objectUrl) URL.revokeObjectURL(audioPlayerRef.current.__objectUrl)
      } catch (e) {}
      audioPlayerRef.current = null
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort()
      } catch {}
      recognitionRef.current = null
    }

    setIsSpeaking(false)
    setIsRecording(false)
  }, [])

  const playAssistantAudio = useCallback(async audioBase64 => {
    if (!audioBase64) return false

    try {
      stopSpeaking()
      const audio = createAudioFromBase64(audioBase64)
      if (!audio) return false

      audioPlayerRef.current = audio
      setIsSpeaking(true)

      audio.onended = () => {
        setIsSpeaking(false)
        if (audio.__objectUrl) URL.revokeObjectURL(audio.__objectUrl)
        if (audioPlayerRef.current === audio) audioPlayerRef.current = null
      }

      audio.onerror = () => {
        setIsSpeaking(false)
        if (audio.__objectUrl) URL.revokeObjectURL(audio.__objectUrl)
        if (audioPlayerRef.current === audio) audioPlayerRef.current = null
      }

      await audio.play()
      return true
    } catch (e) {
      setIsSpeaking(false)
      return false
    }
  }, [stopSpeaking])

  const startRecording = useCallback(() => {
    const SpeechRecognition = getSpeechRecognition()
    if (!SpeechRecognition) {
      setMicError('Voice input is not supported on this browser.')
      return
    }

    setMicError('')

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort()
        } catch {}
        recognitionRef.current = null
      }

      const recognition = new SpeechRecognition()
      recognition.lang = { en: 'en-NG', ha: 'ha', yo: 'yo', ig: 'ig', pc: 'en-NG' }[activeLang] || 'en-NG'
      recognition.continuous = false
      recognition.interimResults = false
      recognition.maxAlternatives = 1

      recognition.onstart = () => {
        setIsRecording(true)
        setMicError('')
      }

      recognition.onresult = event => {
        const transcript = Array.from(event.results || [])
          .map(result => result?.[0]?.transcript || '')
          .join(' ')
          .trim()

        if (transcript) {
          setInputText(transcript)
          setMicError('')
        }
      }

      recognition.onerror = event => {
        setIsRecording(false)
        recognitionRef.current = null

        if (event?.error === 'not-allowed' || event?.error === 'service-not-allowed') {
          setMicError('Microphone permission blocked. Allow microphone access and try again.')
        } else if (event?.error === 'no-speech') {
          setMicError('No speech detected. Try again.')
        } else {
          setMicError('Voice input failed. Please type instead.')
        }
      }

      recognition.onend = () => {
        setIsRecording(false)
        recognitionRef.current = null
      }

      recognitionRef.current = recognition
      recognition.start()
    } catch (err) {
      setIsRecording(false)
      recognitionRef.current = null
      setMicError('Could not start voice input.')
    }
  }, [activeLang])

  const stopRecording = useCallback(() => {
    const recognition = recognitionRef.current
    if (recognition) {
      try {
        recognition.stop()
      } catch {
        try {
          recognition.abort()
        } catch {}
      }
      recognitionRef.current = null
    }
    setIsRecording(false)
  }, [])

  const toggleMic = useCallback(() => {
    if (isRecording) stopRecording()
    else startRecording()
  }, [isRecording, startRecording, stopRecording])

  const handleFileChange = async e => {
    const file = e.target.files[0]
    if (!file) return
    const isImage = file.type.startsWith('image/')
    const isPDF = file.type === 'application/pdf'
    if (!isImage && !isPDF) return

    const base64 = await fileToBase64(file)
    const previewUrl = isImage ? URL.createObjectURL(file) : null
    setAttachedFile({ type: isImage ? 'image' : 'pdf', base64, mediaType: file.type, name: file.name, previewUrl })
    e.target.value = ''
  }

  const resetChat = useCallback(() => {
    stopSpeaking()
    setMessages([])
    setDisplayMsgs([])
    setInputText('')
    setAttachedFile(null)
    setIsLoading(false)
    setMicError('')
    setIsRecording(false)
    setScreen('home')
    setMode('chat')
  }, [stopSpeaking])

  const sendMessage = async textOverride => {
    const text = (textOverride || inputText).trim()

    if (text === '__MERCHANT__') {
      setMode('merchant')
      return
    }
    if (text === '__MEMBER__') {
      setMode('member')
      return
    }

    const file = attachedFile
    if (!text && !file) return
    if (isLoading) return

    if (messages.length === 0 && text) {
      const d = detectLang(text)
      if (d !== 'en') setActiveLang(d)
    }

    setScreen('chat')
    setInputText('')
    setAttachedFile(null)
    setMicError('')
    setDisplayMsgs(p => [...p, { r: 'user', c: text, file }])

    const parts = []
    if (file) {
      if (file.type === 'image') parts.push({ type: 'image', source: { type: 'base64', media_type: file.mediaType, data: file.base64 } })
      else parts.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: file.base64 } })
    }
    parts.push({ type: 'text', text: text || 'Please look at this and help me understand it.' })

    const newHistory = [...messages, { role: 'user', content: parts }]
    setMessages(newHistory)
    setIsLoading(true)

    try {
      const { text: reply, audio } = await sendToAI(newHistory, btc, activeLang, community)
      logConversation(activeLang, community.id)

      setMessages(p => [...p, { role: 'assistant', content: [{ type: 'text', text: reply }] }])
      setDisplayMsgs(p => [...p, { r: 'bot', c: reply, audio, lang: activeLang }])

      if (audio) {
        await playAssistantAudio(audio)
      } else {
        setIsSpeaking(true)
        const started = speakDevice(reply, activeLang)
        if (started) {
          const chk = setInterval(() => {
            if (!window.speechSynthesis?.speaking) {
              setIsSpeaking(false)
              clearInterval(chk)
            }
          }, 300)
        } else {
          setIsSpeaking(false)
        }
      }
    } catch (err) {
      const errMsg = ERROR_BY_LANG[activeLang] || ERROR_BY_LANG.en
      setDisplayMsgs(p => [...p, { r: 'error', c: errMsg, lang: activeLang }])
      setMessages(p => [...p, { role: 'assistant', content: [{ type: 'text', text: errMsg }] }])
    }

    setIsLoading(false)
  }

  const handleKeyDown = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const hasMessages = displayMsgs.length > 0
  const langLabels = { en: 'EN', ha: 'HA', yo: 'YO', ig: 'IG', pc: 'PID' }

  const wrap = children => (
    <div
      style={{
        background: B.navy,
        minHeight: '100dvh',
        maxWidth: 440,
        margin: '0 auto',
        fontFamily: "'Satoshi',-apple-system,sans-serif",
        color: B.white,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <style>{CSS}</style>
      {children}
    </div>
  )

  if (mode === 'merchant') return wrap(<MerchantOnboarding onBack={resetChat} community={community} activeLang={activeLang} />)
  if (mode === 'member') return wrap(<MemberOnboarding onBack={resetChat} community={community} activeLang={activeLang} />)
  if (mode === 'request') return wrap(<CommunityRequestForm onBack={() => setMode('chat')} />)
  if (mode === 'stats') return wrap(<StatsView onBack={() => setMode('chat')} communityId={community.id} />)

  return wrap(
    <>
      {!splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}
      <div className={splashDone ? 'chat-in' : ''} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div
          style={{
            padding: '10px 14px',
            background: B.navyL,
            borderBottom: `1px solid ${B.navyB}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <img src={community.appLogo} alt="Sabi AI" style={{ height: 30, width: 'auto', objectFit: 'contain', flexShrink: 0 }} />
            {(screen === 'chat' || hasMessages || isLoading) && (
              <button
                onClick={resetChat}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 10,
                  border: `1px solid ${B.goldB}`,
                  background: `linear-gradient(135deg, ${B.goldF}, rgba(212,168,67,.02))`,
                  color: B.gold,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 0 0 3px rgba(212,168,67,.08)',
                  flexShrink: 0,
                }}
                aria-label="Back to home"
              >
                <Icons.Back />
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <button
              onClick={() => setMode('stats')}
              style={{
                fontSize: 10,
                color: B.white,
                background: 'rgba(212,168,67,.12)',
                border: `1px solid ${B.goldB}`,
                borderRadius: 999,
                padding: '5px 9px',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontWeight: 800,
                whiteSpace: 'nowrap',
              }}
            >
              Impact Dashboard
            </button>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '5px 9px',
                borderRadius: 999,
                border: `1px solid ${B.goldB}`,
                background: B.goldF,
                color: B.gold,
                fontSize: 10,
                fontWeight: 800,
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: B.green, display: 'inline-block' }} />
              <span>1 sat ≈ ₦{satNgn}</span>
            </div>
          </div>
        </div>

        <div style={{ padding: '8px 14px 0', background: B.navyL, borderBottom: `1px solid ${B.navyB}` }}>
          <div className="lang-bar" style={{ padding: '0 0 8px' }}>
            {Object.entries(langLabels).map(([code, label]) => (
              <button
                key={code}
                className={`lang-pill${activeLang === code ? ' active' : ''}`}
                onClick={() => setActiveLang(code)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {screen === 'home' && !hasMessages && !isLoading && (
  <div style={{ padding: '6px 14px 0', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
    <div style={{ padding: '4px 2px 2px' }}>
      <div style={{ fontSize: 22, fontWeight: 900, color: B.white, lineHeight: 1.15, marginBottom: 4 }}>
        {activeLang === 'en' ? (<>Bitcoin, in your <span style={{ color: B.gold }}>language.</span></>) : welcome.greeting}
      </div>
      <div style={{ fontSize: 12.5, color: B.mid, lineHeight: 1.5, maxWidth: 340 }}>
        {activeLang === 'en' ? (<>Ask questions, learn, or get started in <span style={{ color: B.gold }}>Hausa, Yoruba, Igbo, Pidgin,</span> or English.</>) : welcome.sub}
      </div>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <button onClick={() => setMode('merchant')} style={{ width: '100%', borderRadius: 14, border: `1px solid ${B.tealB}`, background: 'linear-gradient(135deg, #0d2b2b, #0a1f1f)', textAlign: 'left', display: 'flex', alignItems: 'stretch', overflow: 'hidden', cursor: 'pointer', fontFamily: 'inherit', minHeight: 82, padding: 0 }}>
        <div style={{ width: 90, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 6px', background: 'rgba(45,212,191,.07)' }}>
          <img src="/merchant-shop.png" alt="Merchant shop" style={{ width: 70, height: 70, objectFit: 'contain' }} />
        </div>
        <div style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: 14.5, fontWeight: 800, color: B.white, lineHeight: 1.2, marginBottom: 3 }}>{prompts[2]?.label || 'Accept Bitcoin at my shop'}</div>
          <div style={{ fontSize: 12, color: B.mid, lineHeight: 1.4 }}>Create a merchant setup and payment QR.</div>
        </div>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: `1px solid ${B.tealB}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: 'auto 12px auto 0', flexShrink: 0, color: B.teal, fontSize: 16 }}>→</div>
      </button>
      <button onClick={() => setMode('member')} style={{ width: '100%', borderRadius: 14, border: `1px solid ${B.tealB}`, background: 'linear-gradient(135deg, #0d2b2b, #0a1f1f)', textAlign: 'left', display: 'flex', alignItems: 'stretch', overflow: 'hidden', cursor: 'pointer', fontFamily: 'inherit', minHeight: 82, padding: 0 }}>
        <div style={{ width: 90, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 6px', background: 'rgba(45,212,191,.05)' }}>
          <img src="/learn-bitcoin.png" alt="Learn Bitcoin" style={{ width: 70, height: 70, objectFit: 'contain' }} />
        </div>
        <div style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: 14.5, fontWeight: 800, color: B.white, lineHeight: 1.2, marginBottom: 3 }}>{prompts[3]?.label || 'New to Bitcoin? Start here'}</div>
          <div style={{ fontSize: 12, color: B.mid, lineHeight: 1.4 }}>A guided path that explains Bitcoin simply.</div>
        </div>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: `1px solid ${B.tealB}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: 'auto 12px auto 0', flexShrink: 0, color: B.teal, fontSize: 16 }}>→</div>
      </button>
    </div>
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 2px' }}>
      <img src="/sabi-icon.png" alt="Sabi" style={{ width: 40, height: 40, objectFit: 'contain', marginBottom: 8, background: 'transparent' }} />
      <div style={{ fontSize: 30, fontWeight: 900, color: B.white, lineHeight: 1.1, marginBottom: 6 }}>
        How can I help<br />you <span style={{ color: B.gold }}>today?</span>
      </div>
      <div style={{ fontSize: 13, color: B.mid, lineHeight: 1.5 }}>Ask anything about Bitcoin in your language.</div>
    </div>
  </div>
)}

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {hasMessages && (
            <div style={{ padding: '16px 16px 8px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {displayMsgs.map((msg, i) => {
                const canListen = msg.r !== 'user' && (msg.audio || msg.r === 'bot')
                return (
                  <div
                    key={i}
                    className={msg.r === 'user' ? 'msg-user' : 'msg-bot'}
                    style={{ display: 'flex', justifyContent: msg.r === 'user' ? 'flex-end' : 'flex-start', alignItems: 'flex-start', gap: 9 }}
                  >
                    {msg.r !== 'user' && <img src={community.appLogo} alt="Sabi" style={{ width: 32, height: 32, objectFit: 'contain', flexShrink: 0, marginTop: 2 }} />}
                    <div style={{ maxWidth: '84%', display: 'flex', flexDirection: 'column', alignItems: msg.r === 'user' ? 'flex-end' : 'flex-start', gap: 6 }}>
                      {msg.r === 'error' ? (
                        <div className="error-bubble">{msg.c}</div>
                      ) : (
                        <div
                          style={{
                            padding: '12px 16px',
                            fontSize: 14,
                            lineHeight: 1.75,
                            whiteSpace: 'pre-wrap',
                            fontFamily: 'inherit',
                            ...(msg.r === 'user'
                              ? {
                                  background: `linear-gradient(135deg,${B.gold},${B.goldD})`,
                                  color: '#0D0A00',
                                  fontWeight: 700,
                                  borderRadius: '18px 18px 4px 18px',
                                  boxShadow: '0 3px 14px rgba(212,168,67,.3)',
                                }
                              : {
                                  background: B.navyL,
                                  color: B.white,
                                  borderRadius: '18px 18px 18px 4px',
                                  border: `1px solid ${B.navyB}`,
                                }),
                          }}
                        >
                          {msg.file && (
                            <div style={{ marginBottom: msg.c ? 8 : 0 }}>
                              {msg.file.type === 'image' && msg.file.previewUrl ? (
                                <img
                                  src={msg.file.previewUrl}
                                  alt="attachment"
                                  style={{ maxWidth: 200, maxHeight: 160, borderRadius: 10, display: 'block', objectFit: 'cover' }}
                                />
                              ) : (
                                <div
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    background: 'rgba(212,168,67,.15)',
                                    border: '1px solid rgba(212,168,67,.3)',
                                    borderRadius: 8,
                                    padding: '5px 10px',
                                    fontSize: 11,
                                    color: B.gold,
                                  }}
                                >
                                  {msg.file.name}
                                </div>
                              )}
                            </div>
                          )}
                          {msg.c}
                          {canListen && (
                            <button
                              onClick={() => {
                                if (msg.audio) playAssistantAudio(msg.audio)
                                else speakDevice(msg.c, msg.lang || activeLang)
                              }}
                              style={{
                                marginTop: 10,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                background: 'rgba(212,168,67,.12)',
                                border: `1px solid ${B.goldB}`,
                                color: B.gold,
                                borderRadius: 999,
                                padding: '6px 10px',
                                fontSize: 11,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                fontWeight: 800,
                              }}
                            >
                              <Icons.Speaker /> Listen
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}

              {isLoading && (
                <div className="msg-bot" style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                  <img src={community.appLogo} alt="Sabi" style={{ width: 32, height: 32, objectFit: 'contain', flexShrink: 0, marginTop: 2 }} />
                  <div style={{ background: B.navyL, borderRadius: '18px 18px 18px 4px', padding: '14px 18px', border: `1px solid ${B.navyB}` }}>
                    <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                      {[0, 1, 2].map(j => (
                        <div key={j} style={{ width: 7, height: 7, borderRadius: '50%', background: B.gold, animation: `bounce 1.2s ${j * 0.15}s ease-in-out infinite` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div style={{ padding: '12px 16px 20px', background: B.navyL, borderTop: `1px solid ${B.navyB}`, position: 'sticky', bottom: 0 }}>
          {isRecording && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, padding: '8px 12px', background: B.goldF, border: `1px solid ${B.goldB}`, borderRadius: 12 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: B.gold, animation: 'pulse 1s ease-in-out infinite' }} />
              <span style={{ fontSize: 12, color: B.gold, fontWeight: 700 }}>Listening… tap mic to stop</span>
            </div>
          )}

          {micError && (
            <div style={{ marginBottom: 8, padding: '8px 12px', background: B.redF, border: `1px solid ${B.redB}`, borderRadius: 12 }}>
              <span style={{ fontSize: 12, color: B.red }}>{micError}</span>
            </div>
          )}

          {attachedFile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: B.navy, border: `1px solid ${B.navyB}`, borderRadius: 12, padding: '7px 10px', marginBottom: 8, maxWidth: 260 }}>
              {attachedFile.type === 'image' && attachedFile.previewUrl ? (
                <img src={attachedFile.previewUrl} alt="preview" style={{ width: 34, height: 34, borderRadius: 7, objectFit: 'cover', flexShrink: 0 }} />
              ) : (
                <div style={{ width: 34, height: 34, borderRadius: 7, background: B.navyLL, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  📄
                </div>
              )}
              <span style={{ fontSize: 11.5, color: B.white, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{attachedFile.name}</span>
              <button
                onClick={() => setAttachedFile(null)}
                style={{ width: 20, height: 20, borderRadius: '50%', background: B.navyLL, border: 'none', color: B.mid, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, flexShrink: 0 }}
              >
                ✕
              </button>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp,application/pdf" onChange={handleFileChange} style={{ display: 'none' }} />
            <button
              className="attach-btn"
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: attachedFile ? B.goldF : 'transparent',
                border: `1px solid ${attachedFile ? B.goldB : B.navyB}`,
                color: attachedFile ? B.gold : B.dim,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icons.Attach />
            </button>

            <input
              className="chat-input"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isRecording ? 'Listening…' : attachedFile ? 'Add a question… (optional)' : 'Ask anything…'}
              style={{
                flex: 1,
                padding: '13px 18px',
                background: B.navy,
                border: `1px solid ${B.navyB}`,
                borderRadius: 28,
                fontSize: 14,
                color: B.white,
                fontFamily: 'inherit',
                transition: 'border-color 0.2s,box-shadow 0.2s',
              }}
            />

            {voiceSupported && !inputText.trim() && !attachedFile && (
              <button
                className={`mic-btn${isRecording ? ' recording' : ''}`}
                onClick={toggleMic}
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: '50%',
                  border: `1px solid ${B.goldB}`,
                  background: isRecording ? `linear-gradient(135deg,${B.gold},${B.goldD})` : `linear-gradient(135deg, rgba(212,168,67,.16), rgba(212,168,67,.05))`,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  color: isRecording ? '#0D0A00' : B.gold,
                  boxShadow: isRecording ? '0 3px 16px rgba(212,168,67,.5)' : '0 0 0 3px rgba(212,168,67,.08)',
                }}
              >
                <Icons.Mic />
              </button>
            )}

            {(inputText.trim() || attachedFile) && (
              <button
                onClick={() => sendMessage()}
                disabled={isLoading}
                className="send-btn"
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: '50%',
                  border: 'none',
                  background: !isLoading ? `linear-gradient(135deg,${B.gold},${B.goldD})` : B.navyLL,
                  cursor: !isLoading ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: !isLoading ? '0 3px 16px rgba(212,168,67,.4)' : 'none',
                }}
              >
                <Icons.Send color={!isLoading ? '#0D0A00' : B.dim} />
              </button>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 8 }}>
            <div style={{ fontSize: 9, color: B.dim, letterSpacing: 0.8 }}>Bitcoin Abuja · Powered by Fedi</div>
            <button
              onClick={() => setMode('request')}
              style={{
                fontSize: 9,
                color: B.gold,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
                letterSpacing: 0.5,
                textDecoration: 'underline',
                fontWeight: 700,
              }}
            >
              Bring Sabi to your community
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
