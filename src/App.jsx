import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
// ── Supabase ──────────────────────────────────────────────────────────────────
const supabase = createClient(
import.meta.env.VITE_SUPABASE_URL,
import.meta.env.VITE_SUPABASE_ANON_KEY
)
const logConvo = (lang) => supabase.from('conversations').insert({ language: lang, type: 'chat', community_id: 'bitcoin-abuja' }).catch(() => {})
const logMerchant = (name, loc, cat) => supabase.from('onboardings').insert({ type: 'merchant', shop_name: name, location: loc, category: cat, completed: true, community_id: 'bitcoin-abuja' }).catch(() => {})
const logMember = () => supabase.from('onboardings').insert({ type: 'member', completed: true, community_id: 'bitcoin-abuja' }).catch(() => {})
// ── Community ─────────────────────────────────────────────────────────────────
const COMMUNITY = {
id: 'bitcoin-abuja',
name: 'Bitcoin Abuja',
city: 'Abuja, Nigeria',
appLogo: '/logo.png',
communityQR: '/community-qr.png',
communityLink: 'fedi:community210v3xzat5dphhyhmsw43xketeygazycehvscnydmzxsmxzvnyx4jkze3jv5ek2e3jvycxvep4x4jnydtzvscrve35x4nrxd3hx33nxdfk893kgwpkvsenxvpnvvukyen9v3sjytpzvdhk6mt4de5hg72lw46kjezldpjhsg36ygmr2vt98ycnscejveskxef5vsex2ct9x3jnqcm98ycxxvtyxqmxxetxvgcrgvmpx43rxdeexsexvenyvyekgdf4vd3xzvtrv93ngvmrygkzyer9vde8jur5d9hkuhmtv4ujyw3zxe85umetgc6rj56ddyh4qntsd4ujk2m4v4s4wn2sfa6ksntnfed85nnz2enxzstpfdrrs0fz05uvt3ry',
faucetLink: 'https://prod.fedi-faucet.dev.fedibtc.com/c/9651a0b10fd1deafbaf4df554dc4bf85',
memberCount: '60+',
merchantCount: '6',
}
// ── BTC price ─────────────────────────────────────────────────────────────────
async function fetchBTC() {
try {
const r = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,ngn')
const d = await r.json()
if (d?.bitcoin?.usd) return d.bitcoin
} catch {}
return { usd: 96300, ngn: 154000000 }
}
// ── AI ────────────────────────────────────────────────────────────────────────
async function sendToAI(history, btc, lang) {
const satN = btc ? (btc.ngn / 100000000).toFixed(2) : '1.54'
const usd = btc ? btc.usd.toLocaleString() : '96,300'
const ngnM = btc ? (btc.ngn / 1000000).toFixed(0) : '154'
const system =
'You are Sabi — the AI Bitcoin guide for Bitcoin Abuja, a community in Abuja, Nigeria on the Fedi app. ' +
'LANGUAGE: Always reply in the exact same language the user wrote in — Hausa, Yoruba, Igbo, Pidgin, or English. ' +
'FORMATTING: Never use asterisks, markdown, or bold. Plain text only. Numbered lists when helpful. ' +

'PRICES NOW: 1 satoshi = ' + satN + ' Naira. 1 Bitcoin = $' + usd + ' = ' + ngnM + 'M Naira. ' +
'TO BUY: Fedi app → Mini Apps → Cashwyre → Crypto Onramp → NGN → bank transfer → 5-10 min. No ID. ' +
'TO ACCEPT AT SHOP: Fedi → Wallet → Receive → show QR → customer scans → instant. Convert via Cashwyre anytime. ' +
'Bitcoin Abuja has 60+ members and 6 merchants. Led by Aisha Ummi Waziri. Be warm, direct, human.'
const res = await fetch('/api/chat', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ messages: history, system, language: lang, tts: true }),
})
if (!res.ok) throw new Error('API ' + res.status)
const data = await res.json()
if (data.error) throw new Error(data.error)
return { text: data.content?.[0]?.text || '', audio: data.audio || null }
}
// ── Audio ─────────────────────────────────────────────────────────────────────
async function playAudio(base64) {
try {
const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0))
const blob = new Blob([bytes], { type: 'audio/mpeg' })
const url = URL.createObjectURL(blob)
const audio = new Audio(url)
audio.onended = () => URL.revokeObjectURL(url)
await audio.play()
return true
} catch { return false }
}
function speakFallback(text, lang) {
if (!window.speechSynthesis) return
window.speechSynthesis.cancel()
const u = new SpeechSynthesisUtterance(text.replace(/[₿ #*•]/g, ' '))
u.lang = { en:'en-NG', ha:'ha', yo:'yo', ig:'ig', pc:'en-NG' }[lang] || 'en-NG'
u.rate = 0.9
window.speechSynthesis.speak(u)
}
function detectLang(text) {
const t = text.toLowerCase()
const ha = ['ina','yaya','sannu','kudi','kai','ba','ne','ce','don','da']
const yo = ['bawo','elo','jowo','owo','ni','mo','wa','ti','fun','ati']
const ig = ['kedu','gini','ego','ya','ha','site','na']
const pc = ['abeg','wetin','oya','dem','wey','nah','comot']
const words = t.split(/\s+/)
const sc = list => words.filter(w => list.includes(w)).length
const scores = { ha: sc(ha), yo: sc(yo), ig: sc(ig), pc: sc(pc) }
const top = Object.entries(scores).sort((a,b) => b[1]-a[1])[0]

return top[1] > 0 ? top[0] : 'en'
}
function fileToBase64(file) {
return new Promise((res, rej) => {
const r = new FileReader()
r.onload = () => res(r.result.split(',')[1])
r.onerror = rej
r.readAsDataURL(file)
})
}
// ── Categories ────────────────────────────────────────────────────────────────
const CATS = [
{ id:'food', label:'Food & Restaurant', emoji:' ' },
{ id:'fashion', label:'Fashion & Clothing', emoji:' ' },
{ id:'beauty', label:'Beauty & Hair', emoji:' ' },
{ id:'tech', label:'Electronics & Tech', emoji:' ' },
{ id:'pharmacy', label:'Pharmacy & Health', emoji:' ' },
{ id:'grocery', label:'Grocery & Market', emoji:' ' },
{ id:'transport', label:'Transport', emoji:' ' },
{ id:'services', label:'Services & Repairs', emoji:' ' },
{ id:'other', label:'Other', emoji:' ' },
]
// ── Colors ────────────────────────────────────────────────────────────────────
const C = {
bg: '#111827',
card: '#1F2937',
border: 'rgba(212,168,67,0.15)',
gold: '#D4A843',
goldD: '#A67C2A',
white: '#F9FAFB',
mid: '#9CA3AF',
dim: '#4B5563',
teal: '#2DD4BF',
orange: '#F97316',
red: '#F87171',
green: '#34D399',
}
// ── CSS ───────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
html,body{background:${C.bg};font-family:'DM Sans',-apple-system,sans-serif;-webkit-font-smoothing:antialiased;}
::-webkit-scrollbar{width:0;}

@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
@keyframes bounce{0%,60%,100%{transform:scale(1);opacity:0.3}30%{transform:scale(1.6);opacity:1}}
@keyframes ring{0%{box-shadow:0 0 0 0 rgba(212,168,67,0.5)}100%{box-shadow:0 0 0 10px rgba(212,168,67,0)}}
.fade-up{animation:fadeUp 0.35s cubic-bezier(0.22,1,0.36,1) both;}
.msg-user{animation:fadeUp 0.25s cubic-bezier(0.22,1,0.36,1) both;}
.msg-bot{animation:fadeUp 0.25s cubic-bezier(0.22,1,0.36,1) both;}
.btn{transition:transform 0.15s,opacity 0.15s;-webkit-tap-highlight-color:transparent;cursor:pointer;}
.btn:active{transform:scale(0.96);}
.input-field:focus{outline:none;border-color:${C.gold} !important;box-shadow:0 0 0 3px rgba(212,168,67,0.12);}
.mic-ring{animation:ring 1s ease-out infinite;}
`
// ── Icons ─────────────────────────────────────────────────────────────────────
const SendIcon = ({color}) => (
<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
<path d="M12 19V5M5 12l7-7 7 7" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
</svg>
)
const MicIcon = () => (
<svg width="16" height="16" viewBox="0 0 24 24" fill="none">
<rect x="9" y="2" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="2"/>
<path d="M5 10a7 7 0 0014 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
<line x1="12" y1="19" x2="12" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
</svg>
)
const AttachIcon = () => (
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
<path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
</svg>
)
const BackIcon = () => (
<svg width="16" height="16" viewBox="0 0 24 24" fill="none">
<path d="M19 12H5M5 12l7 7M5 12l7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
</svg>
)
const CheckIcon = ({color}) => (
<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
<circle cx="12" cy="12" r="10" fill={color+'22'} stroke={color} strokeWidth="1.5"/>
<path d="M8 12l3 3 5-5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
</svg>
)
// ── Subheader ─────────────────────────────────────────────────────────────────
function SubHeader({ title, color, onBack }) {
return (

<div style={{display:'flex',alignItems:'center',gap:12,padding:'12px 16px',background:C.card,borderBottom:`1px solid ${C.border}`,position:'sticky',top:0,zIndex:10}}>
<button className="btn" onClick={onBack} style={{background:'transparent',border:'none',color:C.mid,display:'flex',alignItems:'center',gap:6,fontSize:13,padding:'4px 0',fontFamily:'inherit'}}>
<BackIcon/> Back
</button>
<div style={{fontSize:12,fontWeight:700,color:color||C.white,letterSpacing:1,textTransform:'uppercase',flex:1,textAlign:'center'}}>{title}</div>
<div style={{width:52}}/>
</div>
)
}
// ── Step card ─────────────────────────────────────────────────────────────────
function StepCard({ ins, q, yes, no, canSkip, onYes, onNo, onSkip, accentColor }) {
const [state, setState] = useState(null)
const handleYes = () => { setState('yes'); setTimeout(() => { setState(null); onYes() }, 900) }
const handleNo = () => { setState('no'); onNo() }
return (
<div style={{background:C.card,borderRadius:16,padding:22,border:`1px solid ${state==='yes'?accentColor+'44':state==='no'?C.red+'44':C.border}`,transition:'border-color 0.3s'}}>
<div style={{fontSize:10,color:C.dim,letterSpacing:1,textTransform:'uppercase',marginBottom:10}}>{ins}</div>
<div style={{fontSize:16,fontWeight:600,color:C.white,lineHeight:1.5,marginBottom:20}}>{q}</div>
{state==='yes' && (
<div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',background:accentColor+'18',border:`1px solid ${accentColor}44`,borderRadius:10}}>
<CheckIcon color={accentColor}/><span style={{fontSize:13,color:accentColor}}>{yes}</span>
</div>
)}
{state==='no' && (
<div style={{padding:12,background:'rgba(248,113,113,0.08)',border:'1px solid rgba(248,113,113,0.25)',borderRadius:10}}>
<div style={{fontSize:13,color:C.mid,lineHeight:1.6,marginBottom:12}}>{no}</div>
<button className="btn" onClick={()=>setState(null)} style={{padding:'8px 16px',borderRadius:20,border:`1px solid ${C.border}`,background:'transparent',color:C.white,fontSize:12,fontFamily:'inherit'}}>I am ready now</button>
</div>
)}
{!state && (
<div style={{display:'flex',gap:10}}>
<button className="btn" onClick={handleYes} style={{flex:1,padding:14,borderRadius:12,border:'none',background:`linear-gradient(135deg,${accentColor},${accentColor}cc)`,color:accentColor===C.teal?'#0D1A1A':'white',fontWeight:700,fontSize:15,fontFamily:'inherit'}}>
Yes
</button>
<button className="btn" onClick={handleNo} style={{flex:1,padding:14,borderRadius:12,border:'1px solid rgba(248,113,113,0.3)',background:'rgba(248,113,113,0.08)',color:C.red,fontWeight:600,fontSize:15,fontFamily:'inherit'}}>
Not yet
</button>
</div>
)}
{!state && canSkip && (
<button className="btn" onClick={onSkip} style={{width:'100%',marginTop:10,background:'transparent',border:'none',color:C.dim,fontSize:12,fontFamily:'inherit',textAlign:'center',padding:'4px 0'}}>
Skip this step
</button>
)}
</div>
)

}
// ── Join screen ───────────────────────────────────────────────────────────────
function JoinScreen({ onDone, onBack, color, title }) {
return (
<div style={{flex:1,display:'flex',flexDirection:'column'}}>
<SubHeader title={title} color={color} onBack={onBack}/>
<div style={{flex:1,overflowY:'auto',padding:'20px 16px 40px',display:'flex',flexDirection:'column',gap:14,alignItems:'center'}}>
<div style={{fontSize:15,fontWeight:600,color:C.white,textAlign:'center'}}>Join Bitcoin Abuja on Fedi</div>
<div style={{fontSize:12,color:C.gold,background:'rgba(212,168,67,0.08)',border:'1px solid rgba(212,168,67,0.2)',borderRadius:10,padding:'10px 14px',lineHeight:1.7,textAlign:'center',width:'100%'}}>
Join a federation from Wallet tab first to create your Bitcoin wallet. Then join this community separately.
</div>
<div style={{background:'white',borderRadius:12,padding:10}}>
<img src={COMMUNITY.communityQR} alt="QR" style={{width:160,height:160,display:'block'}}/>
</div>
<div style={{fontSize:12,color:C.mid,textAlign:'center',lineHeight:1.6}}>Open Fedi → tap the scan icon → scan this QR</div>
<button className="btn" onClick={()=>{window.location.href=COMMUNITY.communityLink}}
style={{width:'100%',padding:14,borderRadius:12,border:'none',background:`linear-gradient(135deg,${C.orange},#c2610f)`,color:'white',fontWeight:700,fontSize:14,fontFamily:'inherit'}}>
Open Bitcoin Abuja in Fedi
</button>
<button className="btn" onClick={onDone} style={{background:'transparent',border:'none',color:C.dim,fontSize:12,fontFamily:'inherit'}}>
I have already joined
</button>
</div>
</div>
)
}
// ── Banner helpers ────────────────────────────────────────────────────────────
function rrect(ctx, x, y, w, h, r) {
ctx.beginPath()
ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r)
ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h)
ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r)
ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y)
ctx.closePath()
}
const BILINGUAL = {
en: ['Scan to pay · Instant · No POS needed', null],
'en-ha':['Scan to pay · Instant · No POS needed','Danna don biya · Nan take · Ba POS da ake bukata'],
'en-yo':['Scan to pay · Instant · No POS needed','Scan lati san · Lesekese · Ko si POS ti o nilo'],
'en-ig':['Scan to pay · Instant · No POS needed','Scan iji kwuo · Ozugbo · Enwegh mkpa POS'],
'en-pc':['Scan to pay · Fast fast · No POS needed','Scan pay am · Instant · No POS wahala'],
}
// ── Merchant Onboarding ───────────────────────────────────────────────────────

function MerchantOnboarding({ onBack }) {
const [phase, setPhase] = useState('steps')
const [step, setStep] = useState(0)
const [shopName, setShopName] = useState('')
const [shopCat, setShopCat] = useState('')
const [shopLoc, setShopLoc] = useState('')
const [bannerLang, setBannerLang] = useState('en')
const [qrData, setQrData] = useState(null)
const [bannerMode, setBannerMode] = useState('print')
const [bannerReady, setBannerReady] = useState(false)
const canvasRef = useRef(null)
const STEPS = [
{ ins:'Step 1 of 6 — Install Fedi', q:'Do you have the Fedi app installed?', yes:"Great. Let's move on.", no:'Download Fedi from App Store or Google Play — search "Fedi Bitcoin".' },
{ ins:'Step 2 of 6 — Join a Federation', q:'Open Fedi and tap Wallet. Join any federation to create your Bitcoin wallet. Done?', yes:'Your wallet is ready.', no:'Tap Wallet and choose any federation.' },
{ ins:'Step 3 of 6 — Join Community', q:'Now join Bitcoin Abuja on Fedi. Have you joined?', yes:'Welcome to the community.', no:'Let us get you in now.', joinScreen:true },
{ ins:'Step 4 of 6 — Backup your wallet', q:'Have you written your recovery words on paper?', yes:'Your funds are protected.', no:'Fedi → Profile → Personal Backup → write every word on paper. Never screenshot.' },
{ ins:'Step 5 of 6 — Fund wallet (optional)',q:'Have you added any sats? Skip if not — you can receive without having sats.', yes:'Good.', no:'No problem. You can receive Bitcoin with zero balance.', canSkip:true },
{ ins:'Step 6 of 6 — Get your QR', q:'Open Fedi → Wallet → Receive. Can you see your payment QR code?', yes:"You're ready. Let's build your banner.", no:'Tap Receive and your QR code will appear.' },
]
useEffect(() => {
if (phase !== 'banner' || !canvasRef.current || !qrData) return
setBannerReady(false)
let cancelled = false
const canvas = canvasRef.current
const isPrint = bannerMode === 'print'
const W = isPrint ? 1240 : 1080
const H = isPrint ? 620 : 1080
canvas.width = W; canvas.height = H
const loadImg = src => new Promise(res => {
const img = new Image(); img.crossOrigin = 'anonymous'
img.onload = () => res(img); img.onerror = () => res(null); img.src = src
})
const draw = async () => {
const [btcLogo, fediLogo, qrImg] = await Promise.all([
loadImg('/bitcoin-abuja-logo.png'),
loadImg('/fedi-logo-dark.png'),
loadImg(qrData),
])
if (cancelled) return
const ctx = canvas.getContext('2d')
const [s1, s2] = BILINGUAL[bannerLang] || BILINGUAL.en
const name = shopName || 'Your Shop'

if (isPrint) {
const bg = ctx.createLinearGradient(0,0,W,H)
bg.addColorStop(0,'#0E1524'); bg.addColorStop(1,'#1B2232')
ctx.fillStyle = bg; ctx.fillRect(0,0,W,H)
ctx.fillStyle = C.orange; ctx.fillRect(0,0,W,10)
if (btcLogo) ctx.drawImage(btcLogo, 72, 28, 180, 50)
ctx.textAlign = 'left'; ctx.textBaseline = 'top'
ctx.fillStyle = C.gold; ctx.font = '700 20px Arial'
ctx.fillText('BITCOIN ACCEPTED HERE', 72, 98)
ctx.fillStyle = '#EDF2FF'; ctx.font = '900 60px Arial'
ctx.fillText(name.length>18 ? name.slice(0,18)+'…' : name, 72, 138)
ctx.fillStyle = C.orange; ctx.font = '900 42px Arial'
ctx.fillText('Accept Bitcoin', 72, 220)
ctx.fillStyle = C.teal; ctx.font = '700 21px Arial'
ctx.fillText('Lightning payments. Instant settlement.', 72, 278)
ctx.fillStyle = '#8A9BB5'; ctx.font = '500 16px Arial'
ctx.fillText(s1, 72, 316)
if (s2) ctx.fillText(s2, 72, 340)
ctx.fillStyle = '#EDF2FF'; ctx.font = '500 14px Arial'
ctx.fillText('Bitcoin Abuja · Powered by Fedi', 72, H-36)
if (fediLogo) ctx.drawImage(fediLogo, W-126, H-40, 100, 26)
const qX=824, qY=76, qS=340
ctx.fillStyle='rgba(255,255,255,0.97)'; rrect(ctx,qX-16,qY-16,qS+32,qS+80,20); ctx.fill()
if (qrImg) ctx.drawImage(qrImg,qX,qY,qS,qS)
ctx.fillStyle='#8A9BB5'; ctx.font='500 14px Arial'; ctx.textAlign='center'
ctx.fillText('Bitcoin Abuja',qX+qS/2,qY+qS+16)
ctx.fillStyle=C.teal; ctx.font='700 14px Arial'
ctx.fillText('No POS needed',qX+qS/2,qY+qS+36)
} else {
const bg2 = ctx.createLinearGradient(0,0,0,H)
bg2.addColorStop(0,'#0E1524'); bg2.addColorStop(1,'#1B2232')
ctx.fillStyle=bg2; ctx.fillRect(0,0,W,H)
ctx.fillStyle=C.orange; ctx.fillRect(0,0,W,10)
ctx.textAlign='center'; ctx.textBaseline='top'
if (btcLogo) ctx.drawImage(btcLogo,(W-180)/2,28,180,50)
ctx.fillStyle=C.gold; ctx.font='700 22px Arial'
ctx.fillText('BITCOIN ACCEPTED HERE',W/2,96)
ctx.fillStyle='#EDF2FF'; ctx.font='900 58px Arial'
ctx.fillText(name.length>16?name.slice(0,16)+'…':name,W/2,136)
ctx.fillStyle=C.orange; ctx.font='900 44px Arial'
ctx.fillText('Accept Bitcoin',W/2,212)
ctx.fillStyle=C.teal; ctx.font='700 20px Arial'
ctx.fillText('Lightning payments. Instant settlement.',W/2,272)
ctx.fillStyle='#8A9BB5'; ctx.font='500 16px Arial'
ctx.fillText(s1,W/2,308)
if (s2) ctx.fillText(s2,W/2,332)
const qS2=300,qX2=(W-qS2)/2,qY2=380

ctx.fillStyle='rgba(255,255,255,0.97)'; rrect(ctx,qX2-20,qY2-20,qS2+40,qS2+60,20); ctx.fill()
if (qrImg) ctx.drawImage(qrImg,qX2,qY2,qS2,qS2)
ctx.fillStyle='#8A9BB5'; ctx.font='500 16px Arial'
ctx.fillText('Scan to pay',W/2,qY2+qS2+14)
ctx.fillStyle='#EDF2FF'; ctx.font='500 14px Arial'
ctx.fillText('Bitcoin Abuja · Powered by Fedi',W/2,H-50)
if (fediLogo) ctx.drawImage(fediLogo,(W-100)/2,H-40,100,26)
}
if (!cancelled) setBannerReady(true)
}
draw().catch(()=>{ if (!cancelled) setBannerReady(true) })
return ()=>{ cancelled=true }
}, [phase, bannerMode, qrData, shopName, bannerLang])
if (phase==='join') return (
<JoinScreen color={C.teal} title="Merchant Setup"
onBack={()=>setPhase('steps')}
onDone={()=>{ setPhase('steps'); setStep(s=>s+1) }}/>
)
if (phase==='banner') return (
<div style={{flex:1,display:'flex',flexDirection:'column'}}>
<SubHeader title="Your Banner" color={C.teal} onBack={()=>setPhase('upload')}/>
<div style={{flex:1,overflowY:'auto',padding:'16px 16px 40px',display:'flex',flexDirection:'column',gap:14}}>
<div style={{display:'flex',gap:8}}>
{['print','square'].map(m=>(
<button key={m} className="btn" onClick={()=>setBannerMode(m)}
style={{flex:1,padding:10,borderRadius:10,border:`1px solid ${bannerMode===m?C.gold+'66':'rgba(255,255,255,0.1)'}`,background:bannerMode===m?'rgba(212,168,67,0.1)':'transparent',color:bannerMode===m?C.gold:C.mid,fontSize:12,fontWeight:600,fontFamily:'inherit'}}>
{m==='print'?'Print A4':'Square Social'}
</button>
))}
</div>
<div style={{borderRadius:14,overflow:'hidden',background:'#0B1220',minHeight:180,display:'flex',alignItems:'center',justifyContent:'center'}}>
{!bannerReady && <div style={{color:C.mid,fontSize:13}}>Generating banner...</div>}
<canvas ref={canvasRef} style={{width:'100%',height:'auto',display:bannerReady?'block':'none'}}/>
</div>
{bannerReady && (
<button className="btn" onClick={()=>{
const a=document.createElement('a')
a.download=(shopName||'banner').toLowerCase().replace(/[^a-z0-9]/g,'-')+'-'+bannerMode+'.png'
a.href=canvasRef.current.toDataURL('image/png'); a.click()
}} style={{width:'100%',padding:14,borderRadius:12,border:'none',background:`linear-gradient(135deg,${C.gold},${C.goldD})`,color:'#0D0A00',fontWeight:700,fontSize:15,fontFamily:'inherit'}}>
Download Banner
</button>
)}
<button className="btn" onClick={onBack} style={{width:'100%',padding:12,borderRadius:12,border:`1px solid ${C.border}`,background:'transparent',color:C.mid,fontSize:13,fontFamily:'inherit'}}>
Back to Sabi AI

</button>
</div>
</div>
)
if (phase==='upload') return (
<div style={{flex:1,display:'flex',flexDirection:'column'}}>
<SubHeader title="Merchant Setup" color={C.teal} onBack={()=>setPhase('lang')}/>
<div style={{flex:1,overflowY:'auto',padding:'16px 16px 40px',display:'flex',flexDirection:'column',gap:14}}>
<div style={{fontSize:15,fontWeight:600,color:C.white}}>Upload your payment QR</div>
<div style={{fontSize:13,color:C.mid,lineHeight:1.65}}>Open Fedi → Wallet → Receive → screenshot → upload here.</div>
{!qrData ? (
<div className="btn" onClick={()=>document.getElementById('qrInput').click()}
style={{border:'2px dashed rgba(45,212,191,0.4)',borderRadius:14,padding:'32px 20px',display:'flex',flexDirection:'column',alignItems:'center',gap:12,background:'rgba(45,212,191,0.05)'}}>
<div style={{fontSize:36}}> </div>
<div style={{fontSize:14,color:C.teal,fontWeight:600}}>Tap to upload QR screenshot</div>
<div style={{fontSize:11,color:C.dim}}>JPEG or PNG from your camera roll</div>
</div>
) : (
<div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:10}}>
<img src={qrData} alt="QR" style={{maxWidth:180,maxHeight:180,borderRadius:12,border:'2px solid rgba(45,212,191,0.3)'}}/>
<button className="btn" onClick={()=>document.getElementById('qrInput').click()}
style={{background:'transparent',border:`1px solid ${C.border}`,color:C.mid,fontSize:12,fontFamily:'inherit',padding:'8px 16px',borderRadius:20}}>
Upload different image
</button>
</div>
)}
<input type="file" id="qrInput" accept="image/*" style={{display:'none'}} onChange={e=>{
const f=e.target.files[0]; if (!f) return
const r=new FileReader(); r.onload=ev=>setQrData(ev.target.result); r.readAsDataURL(f); e.target.value=''
}}/>
<button disabled={!qrData} className="btn" onClick={()=>{ logMerchant(shopName,shopLoc,shopCat); setPhase('banner') }}
style={{width:'100%',padding:14,borderRadius:12,border:'none',background:qrData?`linear-gradient(135deg,${C.teal},#0ea5a0)`:'rgba(255,255,255,0.1)',color:qrData?'#0D1A1A':C.dim,fontWeight:700,fontSize:15,fontFamily:'inherit'}}>
Generate My Banner
</button>
</div>
</div>
)
if (phase==='lang') return (
<div style={{flex:1,display:'flex',flexDirection:'column'}}>
<SubHeader title="Merchant Setup" color={C.teal} onBack={()=>setPhase('location')}/>
<div style={{flex:1,overflowY:'auto',padding:'16px 16px 40px',display:'flex',flexDirection:'column',gap:10}}>
<div style={{fontSize:15,fontWeight:600,color:C.white,marginBottom:4}}>Choose banner language</div>
{[{key:'en',label:'English only'},{key:'en-ha',label:'English + Hausa'},{key:'en-yo',label:'English + Yoruba'},{key:'en-ig',label:'English + Igbo'},{key:'en-pc',label:'English + Pidgin'}].map(o=>(
<button key={o.key} className="btn" onClick={()=>{ setBannerLang(o.key); setPhase('upload') }}
style={{padding:'14px 16px',borderRadius:12,border:`1px solid ${C.border}`,background:C.card,fontFamily:'inherit',textAlign:'left',width:'100%',color:C.white,fontSize:14,fontWeight:500}}>

{o.label}
</button>
))}
</div>
</div>
)
if (phase==='location') return (
<div style={{flex:1,display:'flex',flexDirection:'column'}}>
<SubHeader title="Merchant Setup" color={C.teal} onBack={()=>setPhase('category')}/>
<div style={{flex:1,overflowY:'auto',padding:'16px 16px 40px',display:'flex',flexDirection:'column',gap:14}}>
<div style={{fontSize:15,fontWeight:600,color:C.white}}>Where is your shop?</div>
<div style={{fontSize:13,color:C.mid}}>Optional — helps customers find you.</div>
<input value={shopLoc} onChange={e=>setShopLoc(e.target.value)} placeholder="e.g. Wuse Market, Abuja"
className="input-field"
style={{padding:'14px 16px',background:C.bg,border:`1px solid ${C.border}`,borderRadius:12,fontSize:14,color:C.white,fontFamily:'inherit',transition:'border-color 0.2s,box-shadow 0.2s'}}/>
<button className="btn" onClick={()=>setPhase('lang')}
style={{padding:14,borderRadius:12,border:'none',background:`linear-gradient(135deg,${C.teal},#0ea5a0)`,color:'#0D1A1A',fontWeight:700,fontSize:15,fontFamily:'inherit'}}>
Continue
</button>
<button className="btn" onClick={()=>setPhase('lang')} style={{background:'transparent',border:'none',color:C.dim,fontSize:12,fontFamily:'inherit',textAlign:'center'}}>Skip</button>
</div>
</div>
)
if (phase==='category') return (
<div style={{flex:1,display:'flex',flexDirection:'column'}}>
<SubHeader title="Merchant Setup" color={C.teal} onBack={()=>setPhase('name')}/>
<div style={{flex:1,overflowY:'auto',padding:'16px 16px 40px',display:'flex',flexDirection:'column',gap:14}}>
<div style={{fontSize:15,fontWeight:600,color:C.white}}>What type of business?</div>
<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
{CATS.map(c=>(
<button key={c.id} className="btn" onClick={()=>setShopCat(c.id)}
style={{padding:'14px 12px',borderRadius:12,border:`1px solid ${shopCat===c.id?C.gold:'rgba(255,255,255,0.1)'}`,background:shopCat===c.id?'rgba(212,168,67,0.1)':C.card,fontFamily:'inherit',textAlign:'left',transition:'all 0.15s'}}>
<div style={{fontSize:22,marginBottom:6}}>{c.emoji}</div>
<div style={{fontSize:12.5,fontWeight:500,color:C.white,lineHeight:1.3}}>{c.label}</div>
</button>
))}
</div>
<button disabled={!shopCat} className="btn" onClick={()=>setPhase('location')}
style={{padding:14,borderRadius:12,border:'none',background:shopCat?`linear-gradient(135deg,${C.teal},#0ea5a0)`:'rgba(255,255,255,0.1)',color:shopCat?'#0D1A1A':C.dim,fontWeight:700,fontSize:15,fontFamily:'inherit',marginTop:4}}>
Continue
</button>
</div>
</div>
)

if (phase==='name') return (
<div style={{flex:1,display:'flex',flexDirection:'column'}}>
<SubHeader title="Merchant Setup" color={C.teal} onBack={onBack}/>
<div style={{flex:1,overflowY:'auto',padding:'16px 16px 40px',display:'flex',flexDirection:'column',gap:14}}>
<div style={{fontSize:15,fontWeight:600,color:C.white}}>What is your shop name?</div>
<input value={shopName} onChange={e=>setShopName(e.target.value)} placeholder="e.g. Fatima Fashion, Musa Suya Joint"
className="input-field"
style={{padding:'14px 16px',background:C.bg,border:`1px solid ${C.border}`,borderRadius:12,fontSize:14,color:C.white,fontFamily:'inherit',transition:'border-color 0.2s,box-shadow 0.2s'}}/>
<button className="btn" onClick={()=>setPhase('category')}
style={{padding:14,borderRadius:12,border:'none',background:shopName.trim()?`linear-gradient(135deg,${C.teal},#0ea5a0)`:'rgba(255,255,255,0.1)',color:shopName.trim()?'#0D1A1A':C.dim,fontWeight:700,fontSize:15,fontFamily:'inherit'}}>
Continue
</button>
<button className="btn" onClick={()=>setPhase('category')} style={{background:'transparent',border:'none',color:C.dim,fontSize:12,fontFamily:'inherit',textAlign:'center'}}>Skip</button>
</div>
</div>
)
const currentStep = STEPS[Math.min(step, STEPS.length-1)]
const pct = Math.round((step/STEPS.length)*100)
return (
<div style={{flex:1,display:'flex',flexDirection:'column'}}>
<SubHeader title="Merchant Setup" color={C.teal} onBack={onBack}/>
<div style={{padding:'10px 16px 0'}}>
<div style={{height:3,background:'rgba(255,255,255,0.08)',borderRadius:3,overflow:'hidden',marginBottom:8}}>
<div style={{height:'100%',width:pct+'%',background:C.teal,borderRadius:3,transition:'width 0.4s'}}/>
</div>
<div style={{fontSize:10,color:C.dim,textAlign:'right',marginBottom:12}}>Step {step+1} of {STEPS.length}</div>
</div>
<div style={{flex:1,overflowY:'auto',padding:'0 16px 40px'}}>
<StepCard {...currentStep} accentColor={C.teal}
onYes={()=>{ if (step>=STEPS.length-1) setPhase('name'); else setStep(s=>s+1) }}
onNo={()=>{ if (currentStep.joinScreen) setPhase('join') }}
onSkip={()=>setStep(s=>s+1)}/>
<div style={{fontSize:10,color:C.dim,textAlign:'center',marginTop:16}}>Bitcoin Abuja · Powered by Fedi</div>
</div>
</div>
)
}
// ── Member Onboarding ─────────────────────────────────────────────────────────
function MemberOnboarding({ onBack }) {
const [phase, setPhase] = useState('steps')
const [step, setStep] = useState(0)
const STEPS = [
{ ins:'Step 1 of 4 — Install Fedi', q:'Do you have the Fedi app installed?', yes:"Great. Let's move on.", no:'Download Fedi from App Store or Google Play — search "Fedi Bitcoin".' },
{ ins:'Step 2 of 4 — Join a Federation', q:'Open Fedi and tap Wallet. Join any federation to create your wallet.', yes:'Your wallet is ready.', no:'Tap Wallet and choose any federation.' },

{ ins:'Step 3 of 4 — Join Community', q:'Now join Bitcoin Abuja on Fedi. Have you joined?', yes:'Welcome in.', no:'Let us get you in now.', joinScreen:true },
{ ins:'Step 4 of 4 — Backup wallet', q:'Have you written your recovery words on paper?', yes:"You are all set. Let's finish.", no:'Fedi → Profile → Personal Backup → write every word on paper.' },
]
if (phase==='join') return (
<JoinScreen color={C.orange} title="New Member Setup"
onBack={()=>setPhase('steps')}
onDone={()=>{ setPhase('steps'); setStep(s=>s+1) }}/>
)
if (phase==='done') return (
<div style={{flex:1,display:'flex',flexDirection:'column'}}>
<SubHeader title="Welcome" color={C.orange} onBack={onBack}/>
<div style={{flex:1,overflowY:'auto',padding:'20px 16px 40px',display:'flex',flexDirection:'column',gap:14}}>
<div style={{background:C.card,border:'1px solid rgba(249,115,22,0.3)',borderRadius:16,padding:24,display:'flex',flexDirection:'column',alignItems:'center',gap:12,textAlign:'center'}}>
<div style={{fontSize:52}}>₿</div>
<div style={{fontSize:20,fontWeight:700,color:C.orange}}>Welcome to Bitcoin Abuja!</div>
<div style={{fontSize:13,color:C.mid,lineHeight:1.65,maxWidth:280}}>You are now part of a real Bitcoin circular economy in Nigeria. Your sats are yours — no bank, no middleman.</div>
</div>
<div style={{background:C.card,border:'1px solid rgba(212,168,67,0.2)',borderRadius:14,padding:16,display:'flex',flexDirection:'column',gap:10}}>
<div style={{fontSize:11,color:C.gold,fontWeight:700,letterSpacing:1,textTransform:'uppercase'}}>100 Free Sats Waiting</div>
<div style={{fontSize:13,color:C.white,lineHeight:1.6}}>The Bitcoin Abuja Sats Faucet has 100 free sats for new members. This is your first real Bitcoin.</div>
<button className="btn" onClick={()=>window.open(COMMUNITY.faucetLink,'_blank')}
style={{width:'100%',padding:13,borderRadius:12,border:'none',background:`linear-gradient(135deg,${C.gold},${C.goldD})`,color:'#0D0A00',fontWeight:700,fontSize:14,fontFamily:'inherit'}}>
Claim My 100 Free Sats
</button>
</div>
<button className="btn" onClick={onBack}
style={{width:'100%',padding:12,borderRadius:12,border:`1px solid ${C.border}`,background:'transparent',color:C.mid,fontSize:13,fontFamily:'inherit'}}>
Back to Sabi AI
</button>
</div>
</div>
)
const currentStep = STEPS[Math.min(step, STEPS.length-1)]
const pct = Math.round((step/STEPS.length)*100)
return (
<div style={{flex:1,display:'flex',flexDirection:'column'}}>
<SubHeader title="New Member Setup" color={C.orange} onBack={onBack}/>
<div style={{padding:'10px 16px 0'}}>
<div style={{height:3,background:'rgba(255,255,255,0.08)',borderRadius:3,overflow:'hidden',marginBottom:8}}>
<div style={{height:'100%',width:pct+'%',background:C.orange,borderRadius:3,transition:'width 0.4s'}}/>
</div>
<div style={{fontSize:10,color:C.dim,textAlign:'right',marginBottom:12}}>Step {step+1} of {STEPS.length}</div>
</div>
<div style={{flex:1,overflowY:'auto',padding:'0 16px 40px'}}>

<StepCard {...currentStep} accentColor={C.orange}
onYes={()=>{ if (step>=STEPS.length-1) { logMember(); setPhase('done') } else setStep(s=>s+1) }}
onNo={()=>{ if (currentStep.joinScreen) setPhase('join') }}
onSkip={()=>setStep(s=>s+1)}/>
<div style={{fontSize:10,color:C.dim,textAlign:'center',marginTop:16}}>Bitcoin Abuja · Powered by Fedi</div>
</div>
</div>
)
}
// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
const [btc, setBtc] = useState({ usd:96300, ngn:154000000 })
const [mode, setMode] = useState('chat')
const [messages, setMessages] = useState([])
const [display, setDisplay] = useState([])
const [input, setInput] = useState('')
const [loading, setLoading] = useState(false)
const [speaking, setSpeaking] = useState(false)
const [lang, setLang] = useState('en')
const [recording, setRecording] = useState(false)
const [micErr, setMicErr] = useState('')
const [attached, setAttached] = useState(null)
const endRef = useRef(null)
const fileRef = useRef(null)
const recogRef = useRef(null)
const satNgn = btc ? (btc.ngn/100000000).toFixed(2) : '1.54'
const hasSpeech = !!(window.SpeechRecognition || window.webkitSpeechRecognition)
useEffect(() => {
fetchBTC().then(setBtc)
const iv = setInterval(()=>fetchBTC().then(setBtc), 180000)
return ()=>clearInterval(iv)
}, [])
useEffect(() => {
endRef.current?.scrollIntoView({ behavior:'smooth' })
}, [display, loading])
const startMic = useCallback(() => {
const SR = window.SpeechRecognition || window.webkitSpeechRecognition
if (!SR) { setMicErr('Voice not supported. Please type.'); return }
setMicErr('')
const go = () => {
const r = new SR()
r.lang = { en:'en-NG', ha:'ha', yo:'yo', ig:'ig', pc:'en-NG' }[lang] || 'en-NG'

r.continuous = false; r.interimResults = false
r.onstart = () => setRecording(true)
r.onresult = e => { const t=Array.from(e.results).map(x=>x[0].transcript).join(''); setInput(t) }
r.onspeechend = () => r.stop()
r.onend = () => { setRecording(false); recogRef.current=null }
r.onerror = e => {
setRecording(false); recogRef.current=null
setMicErr(e.error==='not-allowed'?'Mic blocked — allow in browser settings.':'Voice error. Please type.')
}
recogRef.current = r
try { r.start() } catch { setMicErr('Could not start mic.') }
}
if (navigator.mediaDevices?.getUserMedia)
navigator.mediaDevices.getUserMedia({audio:true}).then(go).catch(()=>setMicErr('Mic access denied.'))
else go()
}, [lang])
const stopMic = useCallback(() => { recogRef.current?.stop(); setRecording(false) }, [])
const toggleMic = useCallback(() => { if (recording) stopMic(); else startMic() }, [recording,startMic,stopMic])
const handleFile = async e => {
const file = e.target.files[0]; if (!file) return
const isImg = file.type.startsWith('image/')
const isPDF = file.type==='application/pdf'
if (!isImg && !isPDF) return
const b64 = await fileToBase64(file)
setAttached({ type:isImg?'image':'pdf', b64, mime:file.type, name:file.name, preview:isImg?URL.createObjectURL(file):null })
e.target.value=''
}
const send = async textOverride => {
const text = (textOverride||input).trim()
if (text==='__MERCHANT__') { setMode('merchant'); return }
if (text==='__MEMBER__') { setMode('member'); return }
const file = attached
if (!text && !file) return
if (loading) return
if (messages.length===0 && text) { const d=detectLang(text); if (d!=='en') setLang(d) }
setInput(''); setAttached(null); setMicErr('')
setDisplay(p=>[...p,{r:'user',c:text,file}])
const parts=[]
if (file) {
if (file.type==='image') parts.push({type:'image',source:{type:'base64',media_type:file.mime,data:file.b64}})
else parts.push({type:'document',source:{type:'base64',media_type:'application/pdf',data:file.b64}})
}
parts.push({type:'text',text:text||'Please look at this.'})
const newHist=[...messages,{role:'user',content:parts}]

setMessages(newHist); setLoading(true)
try {
const {text:reply,audio}=await sendToAI(newHist,btc,lang)
logConvo(lang)
setMessages(p=>[...p,{role:'assistant',content:[{type:'text',text:reply}]}])
setDisplay(p=>[...p,{r:'bot',c:reply}])
if (audio) {
setSpeaking(true); await playAudio(audio); setSpeaking(false)
} else {
setSpeaking(true); speakFallback(reply,lang)
const chk=setInterval(()=>{ if (!window.speechSynthesis?.speaking){setSpeaking(false);clearInterval(chk)} },300)
}
} catch {
const err={en:"Sabi couldn't respond. Check your connection.",ha:"Sabi bai iya amsa. Duba hadin ku.",yo:"Sabi ko le dahun. Sayewo asopo re.",ig:"Sabi enwehi ike iza. Lelee njiko gi.",pc:"Sabi no fit answer. Check your connection."}
setDisplay(p=>[...p,{r:'error',c:err[lang]||err.en}])
}
setLoading(false)
}
const PROMPTS = {
en:[{label:'Sat price in Naira',msg:'What is 1 sat worth in Naira right now?'},{label:'Buy Bitcoin with Naira',msg:'How do I buy Bitcoin with Naira on Fedi?'},{label:'Accept Bitcoin at my shop',msg:'__MERCHANT__'},{label:'New to Bitcoin? Start here',msg:'__MEMBER__'}],
ha:[{label:'Farashin sat a Naira',msg:'Nawa ne 1 sat a Naira yanzu?'},{label:'Saya Bitcoin da Naira',msg:'Ta yaya zan saya Bitcoin da Naira a Fedi?'},{label:'Karbi Bitcoin a kantin na',msg:'__MERCHANT__'},{label:'Sabon zuwa Bitcoin?',msg:'__MEMBER__'}],
yo:[{label:'Iye sat ni Naira',msg:'Elo ni 1 sat ni Naira ni bayi?'},{label:'Ra Bitcoin pelu Naira',msg:'Bawo ni mo se le ra Bitcoin pelu Naira lori Fedi?'},{label:'Gba Bitcoin ni ile itaja mi',msg:'__MERCHANT__'},{label:'Tuntun si Bitcoin?',msg:'__MEMBER__'}],
ig:[{label:'Ego sat na Naira',msg:'Ego ole bu 1 sat na Naira ugbu a?'},{label:'Zuo Bitcoin na Naira',msg:'Kedu ka m ga-esi zuo Bitcoin na Naira na Fedi?'},{label:"Nata Bitcoin n'ulo ahia m",msg:'__MERCHANT__'},{label:'Ohuru na Bitcoin?',msg:'__MEMBER__'}],
pc:[{label:'How much be 1 sat',msg:'How much be 1 sat in Naira right now?'},{label:'Buy Bitcoin with Naira',msg:'Abeg how I go take buy Bitcoin with Naira for Fedi?'},{label:'Accept Bitcoin for my shop',msg:'__MERCHANT__'},{label:'New to Bitcoin?',msg:'__MEMBER__'}],
}
const prompts = PROMPTS[lang]||PROMPTS.en
const hasMessages = display.length>0
const wrap = children => (
<div style={{background:C.bg,minHeight:'100dvh',maxWidth:440,margin:'0 auto',fontFamily:"'DM Sans',-apple-system,sans-serif",color:C.white,display:'flex',flexDirection:'column'}}>
<style>{CSS}</style>
{children}
</div>
)
if (mode==='merchant') return wrap(<MerchantOnboarding onBack={()=>setMode('chat')}/>)
if (mode==='member') return wrap(<MemberOnboarding onBack={()=>setMode('chat')}/>)
return wrap(
<>
{/* Header */}
<div style={{padding:'12px 16px',background:C.card,borderBottom:`1px solid ${C.border}`,display:'flex',justifyContent:'space-between',alignItems:'center',position:'sticky',top:0,zIndex:10}}>
<img src={COMMUNITY.appLogo} alt="Sabi AI" style={{height:32,width:'auto',objectFit:'contain'}}/>
<div style={{display:'flex',alignItems:'center',gap:8}}>
{speaking && (

<button className="btn" onClick={()=>{window.speechSynthesis?.cancel();setSpeaking(false)}}
style={{fontSize:10,color:C.teal,background:'rgba(45,212,191,0.08)',border:'1px solid rgba(45,212,191,0.25)',borderRadius:100,padding:'4px 10px',fontFamily:'inherit'}}>
■ Stop
</button>
)}
<div style={{display:'flex',alignItems:'center',gap:6,background:'rgba(212,168,67,0.08)',border:'1px solid rgba(212,168,67,0.2)',borderRadius:100,padding:'5px 12px'}}>
<div style={{width:6,height:6,borderRadius:'50%',background:C.green,animation:'pulse 2s ease infinite'}}/>
<span style={{fontSize:11,fontWeight:600,color:C.gold}}>₦{satNgn} / sat</span>
</div>
</div>
</div>
{/* Language bar */}
<div style={{display:'flex',gap:6,padding:'8px 16px',background:C.card,borderBottom:`1px solid ${C.border}`,overflowX:'auto'}}>
{[['en','EN'],['ha','HA'],['yo','YO'],['ig','IG'],['pc','PID']].map(([code,label])=>(
<button key={code} className="btn" onClick={()=>setLang(code)}
style={{flexShrink:0,padding:'4px 12px',borderRadius:20,fontSize:11,fontWeight:500,border:`1px solid ${lang===code?'rgba(212,168,67,0.5)':'rgba(212,168,67,0.2)'}`,background:lang===code?'rgba(212,168,67,0.12)':'transparent',color:lang===code?C.gold:C.mid,fontFamily:'inherit'}}>
{label}
</button>
))}
</div>
{/* Body */}
<div style={{flex:1,overflowY:'auto',display:'flex',flexDirection:'column'}}>
{!hasMessages && !loading && (
<div className="fade-up" style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'24px 16px 20px',gap:20}}>
<div style={{textAlign:'center'}}>
<h1 style={{fontSize:22,fontWeight:700,color:C.white,marginBottom:8}}>How can I help you?</h1>
<p style={{fontSize:13,color:C.mid,lineHeight:1.6,maxWidth:280}}>Ask me anything about Bitcoin, Fedi, or getting started — in your language.</p>
<p style={{fontSize:11,color:C.dim,marginTop:6}}>Joined by {COMMUNITY.memberCount} members across Nigeria</p>
</div>
<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,width:'100%',maxWidth:360}}>
{prompts.map((p,i)=>{
const isMer=p.msg==='__MERCHANT__', isMem=p.msg==='__MEMBER__'
const accent=isMer?C.teal:isMem?C.orange:C.gold
return (
<button key={i} className="btn" onClick={()=>send(p.msg)}
style={{background:C.card,border:`1px solid ${accent}33`,borderRadius:14,padding:'14px 13px',textAlign:'left',fontFamily:'inherit',boxShadow:'0 2px 10px rgba(0,0,0,0.2)'}}>
<div style={{width:18,height:3,borderRadius:2,background:accent,marginBottom:10}}/>
<div style={{fontSize:13,fontWeight:500,color:C.white,lineHeight:1.4}}>{p.label}</div>
</button>
)
})}
</div>
</div>
)}

{hasMessages && (
<div style={{padding:'16px 16px 8px',display:'flex',flexDirection:'column',gap:14}}>
{display.map((msg,i)=>(
<div key={i} className={msg.r==='user'?'msg-user':'msg-bot'}
style={{display:'flex',justifyContent:msg.r==='user'?'flex-end':'flex-start',alignItems:'flex-start',gap:8}}>
{msg.r!=='user'&&<img src={COMMUNITY.appLogo} alt="Sabi" style={{width:30,height:30,objectFit:'contain',flexShrink:0,marginTop:2}}/>}
<div style={{maxWidth:'80%'}}>
{msg.r==='error'?(
<div style={{padding:'11px 15px',fontSize:13.5,color:C.red,lineHeight:1.6,background:'rgba(248,113,113,0.08)',border:'1px solid rgba(248,113,113,0.25)',borderRadius:'16px 16px 16px 4px'}}>{msg.c}</div>
):(
<div style={{padding:'12px 15px',fontSize:14,lineHeight:1.75,whiteSpace:'pre-wrap',fontFamily:'inherit',
...(msg.r==='user'
?{background:`linear-gradient(135deg,${C.gold},${C.goldD})`,color:'#0D0A00',fontWeight:600,borderRadius:'16px 16px 4px 16px'}
:{background:C.card,color:C.white,borderRadius:'16px 16px 16px 4px',border:`1px solid ${C.border}`})}}>
{msg.file&&(
<div style={{marginBottom:msg.c?8:0}}>
{msg.file.type==='image'&&msg.file.preview
?<img src={msg.file.preview} alt="attachment" style={{maxWidth:180,borderRadius:8,display:'block',objectFit:'cover'}}/>
:<span style={{fontSize:11,color:C.gold}}>{msg.file.name}</span>}
</div>
)}
{msg.c}
</div>
)}
</div>
</div>
))}
{loading&&(
<div className="msg-bot" style={{display:'flex',alignItems:'flex-start',gap:8}}>
<img src={COMMUNITY.appLogo} alt="Sabi" style={{width:30,height:30,objectFit:'contain',flexShrink:0,marginTop:2}}/>
<div style={{background:C.card,borderRadius:'16px 16px 16px 4px',padding:'14px 16px',border:`1px solid ${C.border}`}}>
<div style={{display:'flex',gap:5,alignItems:'center'}}>
{[0,1,2].map(j=><div key={j} style={{width:7,height:7,borderRadius:'50%',background:C.gold,animation:`bounce 1.2s ${j*0.15}s ease-in-out infinite`}}/>)}
</div>
</div>
</div>
)}
<div ref={endRef}/>
</div>
)}
</div>
{/* Input bar */}
<div style={{padding:'10px 16px 20px',background:C.card,borderTop:`1px solid ${C.border}`,position:'sticky',bottom:0}}>
{recording&&(
<div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8,padding:'7px 12px',background:'rgba(212,168,67,0.08)',border:'1px solid rgba(212,168,67,0.2)',borderRadius:10}}>
<div style={{width:7,height:7,borderRadius:'50%',background:C.gold,animation:'pulse 1s ease infinite'}}/>

<span style={{fontSize:12,color:C.gold,fontWeight:500}}>Listening — tap mic to stop</span>
</div>
)}
{micErr&&(
<div style={{marginBottom:8,padding:'7px 12px',background:'rgba(248,113,113,0.08)',border:'1px solid rgba(248,113,113,0.25)',borderRadius:10}}>
<span style={{fontSize:12,color:C.red}}>{micErr}</span>
</div>
)}
{attached&&(
<div style={{display:'flex',alignItems:'center',gap:8,background:C.bg,border:`1px solid ${C.border}`,borderRadius:10,padding:'6px 10px',marginBottom:8,maxWidth:240}}>
{attached.type==='image'&&attached.preview
?<img src={attached.preview} alt="preview" style={{width:32,height:32,borderRadius:6,objectFit:'cover',flexShrink:0}}/>
:<div style={{width:32,height:32,borderRadius:6,background:C.card,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:14}}> </div>}
<span style={{fontSize:11.5,color:C.white,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{attached.name}</span>
<button className="btn" onClick={()=>setAttached(null)}
style={{width:18,height:18,borderRadius:'50%',background:C.card,border:'none',color:C.mid,fontSize:10,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
</div>
)}
<div style={{display:'flex',gap:8,alignItems:'center'}}>
<input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={handleFile} style={{display:'none'}}/>
<button className="btn" onClick={()=>fileRef.current?.click()}
style={{width:40,height:40,borderRadius:10,background:attached?'rgba(212,168,67,0.1)':'transparent',border:`1px solid ${attached?'rgba(212,168,67,0.3)':C.border}`,color:attached?C.gold:C.mid,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
<AttachIcon/>
</button>
<input value={input} onChange={e=>setInput(e.target.value)}
onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}}}
placeholder={recording?'Listening…':attached?'Add a question (optional)':'Ask anything…'}
className="input-field"
style={{flex:1,padding:'12px 16px',background:C.bg,border:`1px solid ${C.border}`,borderRadius:24,fontSize:14,color:C.white,fontFamily:'inherit',transition:'border-color 0.2s,box-shadow 0.2s'}}/>
{hasSpeech&&!input.trim()&&!attached&&(
<button className={`btn${recording?' mic-ring':''}`} onClick={toggleMic}
style={{width:44,height:44,borderRadius:'50%',border:'none',background:recording?`linear-gradient(135deg,${C.gold},${C.goldD})`:'rgba(212,168,67,0.1)',color:recording?'#0D0A00':C.gold,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
<MicIcon/>
</button>
)}
{(input.trim()||attached)&&(
<button className="btn" onClick={()=>send()} disabled={loading}
style={{width:44,height:44,borderRadius:'50%',border:'none',background:!loading?`linear-gradient(135deg,${C.gold},${C.goldD})`:'rgba(255,255,255,0.1)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
<SendIcon color={!loading?'#0D0A00':C.dim}/>
</button>
)}
</div>
<div style={{fontSize:9,color:C.dim,textAlign:'center',marginTop:8,letterSpacing:0.5}}>
Bitcoin Abuja · Powered by Fedi
</div>
</div>
</>

)
}