'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, RotateCcw, Trash2, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import { playClick, playWinChime, playLossSound, playWheelTick } from '../utils/audio';

// ─── Data ────────────────────────────────────────────────────────────────────
const WHEEL_SEQ = ['red','black','red','black','red','black','red','black','red','black','red','black','red','black','orange'];
const TILE_W = 92;
const GAP    = 6;
const STEP   = TILE_W + GAP;

const CFG = {
  red:    { label:'RED',    mult:2,  chance:'46.7%', g1:'#c0392b', g2:'#7b241c', glow:'rgba(192,57,43,0.9)',  particle:'#e74c3c', emoji:'🔴' },
  black:  { label:'BLACK',  mult:2,  chance:'46.7%', g1:'#2c2c36', g2:'#0d0d12', glow:'rgba(160,160,200,0.4)',particle:'#95a5a6', emoji:'⚫' },
  orange: { label:'ORANGE', mult:14, chance:'6.7%',  g1:'#f39c12', g2:'#c0392b', glow:'rgba(243,156,18,1.0)', particle:'#f39c12', emoji:'🔥' },
};

const CHIP_VALUES = [10, 50, 100, 500, 1000];
function chipCfg(v) {
  if (v===10)   return { g1:'#14b8a6', g2:'#0f766e', glow:'rgba(20,184,166,0.6)',  text:'#fff', stripe:'rgba(255,255,255,0.35)' };
  if (v===50)   return { g1:'#22c55e', g2:'#15803d', glow:'rgba(34,197,94,0.6)',   text:'#fff', stripe:'rgba(255,255,255,0.35)' };
  if (v===100)  return { g1:'#f97316', g2:'#c2410c', glow:'rgba(249,115,22,0.6)',  text:'#fff', stripe:'rgba(255,255,255,0.35)' };
  if (v===500)  return { g1:'#a855f7', g2:'#7e22ce', glow:'rgba(168,85,247,0.6)',  text:'#fff', stripe:'rgba(255,255,255,0.35)' };
  return          { g1:'#f59e0b', g2:'#b45309', glow:'rgba(245,158,11,0.6)',  text:'#000', stripe:'rgba(0,0,0,0.25)' };
}
const pillBg = c => c==='red'?'#c0392b':c==='orange'?'#e67e22':'#1a1a1f';

// ─── 3D Chip ─────────────────────────────────────────────────────────────────
function Chip({ val, selected, onClick, disabled }) {
  const s = chipCfg(val);
  return (
    <button onClick={onClick} disabled={disabled} className={`w-full aspect-square rounded-full relative border-0 p-0 select-none transition-all duration-300 ${selected?'scale-[1.2] -translate-y-2 z-10 opacity-100':'opacity-60 hover:opacity-90 hover:-translate-y-0.5'} ${disabled?'opacity-30 pointer-events-none':''} cursor-pointer`}
      style={{ filter: selected?`drop-shadow(0 0 14px ${s.glow}) drop-shadow(0 3px 6px rgba(0,0,0,0.6))`:'drop-shadow(0 4px 6px rgba(0,0,0,0.45))' }}>
      {selected && <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rotate-45 bg-[#d4af37] z-20" style={{ boxShadow:'0 0 10px rgba(212,175,55,0.9)', animation:'bounce 1s infinite' }} />}
      <div className="absolute inset-0 rounded-full bg-black/60 translate-y-1" />
      <div className="absolute inset-0 rounded-full border-2 border-black/30 flex items-center justify-center" style={{ background:`linear-gradient(to bottom,${s.g1},${s.g2})` }}>
        <div className="absolute inset-0 rounded-full border-[6px] border-dashed" style={{ borderColor: s.stripe }} />
        {selected && <div className="absolute inset-0.5 rounded-full border border-white" style={{ animation:'pulse 2s infinite' }} />}
        <div className="w-[60%] h-[60%] rounded-full bg-zinc-900 shadow-inner flex flex-col items-center justify-center leading-none">
          <span style={{ color:'#d4af37', fontSize:7, fontWeight:700 }}>₹</span>
          <span style={{ color:s.text, fontSize:10, fontWeight:900, fontFamily:'monospace' }}>{val}</span>
        </div>
      </div>
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Hotline({ token, playableBalance, setPlayableBalance, isDemo }) {
  const [activeChip, setActiveChip] = useState(50);
  const [bets, setBets] = useState({ red:0, black:0, orange:0 });
  const [isSpinning, setIsSpinning] = useState(false);
  const [placedBets, setPlacedBets] = useState(false);
  const [offset, setOffset] = useState(0);
  const [transitionEnabled, setTransitionEnabled] = useState(false);
  const [lastColor, setLastColor] = useState(null);
  const [spinPhase, setSpinPhase] = useState('idle'); // idle|spinning|landing
  const [particles, setParticles] = useState([]);
  const [shaking, setShaking] = useState(false);
  const [flashColor, setFlashColor] = useState(null);
  const [resultModal, setResultModal] = useState({ show:false, won:false, amount:0, color:null });
  const [history, setHistory] = useState([
    {color:'red',id:1},{color:'black',id:2},{color:'red',id:3},
    {color:'orange',id:4},{color:'black',id:5},{color:'red',id:6},{color:'black',id:7},
  ]);
  const [livePool, setLivePool] = useState({ red:312000, black:298000, orange:21000 });
  const [liveWagers, setLiveWagers] = useState([]);
  const [timer, setTimer] = useState(15);
  const timerRef = useRef(null);
  const prevBetsRef = useRef({red:0,black:0,orange:0});
  const betsRef = useRef(bets);
  const placedBetsRef = useRef(placedBets);
  useEffect(() => { betsRef.current = bets; }, [bets]);
  useEffect(() => { placedBetsRef.current = placedBets; }, [placedBets]);

  const totalBet = Object.values(bets).reduce((a,b)=>a+b,0);
  const totalPool = livePool.red+livePool.black+livePool.orange;
  const pctRed    = totalPool>0?Math.round((livePool.red/totalPool)*100):0;
  const pctBlack  = totalPool>0?Math.round((livePool.black/totalPool)*100):0;
  const pctOrange = 100-pctRed-pctBlack;

  // ── 15-second countdown timer ────────────────────────────────────────────
  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimer(15);
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          // Auto-spin with whatever bets are placed at time-0
          setTimeout(() => {
            const currentBets = betsRef.current;
            executeSpin(currentBets, true);
          }, 50);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Start timer on mount
  useEffect(() => {
    startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // Live pool simulation
  useEffect(() => {
    if (isSpinning) return;
    const iv = setInterval(() => {
      setLivePool(p => ({
        red:   p.red   + Math.floor(Math.random()*2000+300),
        black: p.black + Math.floor(Math.random()*2000+300),
        orange:p.orange+ (Math.random()<0.08?Math.floor(Math.random()*120+20):0),
      }));
    }, 320);
    return () => clearInterval(iv);
  }, [isSpinning]);

  // Live wager simulation
  useEffect(() => {
    if (isSpinning) return;
    let h, t;
    const go = () => {
      const d=['6','7','8','9'], ph=`${d[~~(Math.random()*4)]}${~~(Math.random()*10)}XXX${~~(100+Math.random()*900)}`;
      const sel=Math.random()<0.07?'orange':Math.random()<0.5?'red':'black';
      const amt=[10,50,100,200,500,1000,2000,5000,10000][~~(Math.random()*9)];
      setLiveWagers(p=>[{phone:ph,sel,amt,id:Math.random()},...p.slice(0,2)]);
      setLivePool(p=>({...p,[sel]:p[sel]+amt}));
      t = setTimeout(go, 120+Math.random()*200);
    };
    t = setTimeout(go, 400);
    return () => clearTimeout(t);
  }, [isSpinning]);

  useEffect(() => {
    if (resultModal.show) { const t=setTimeout(()=>setResultModal(p=>({...p,show:false})),4500); return()=>clearTimeout(t); }
  }, [resultModal.show]);

  // ── Actions ─────────────────────────────────────────────────────────────────
  const addBet = sector => {
    if (isSpinning||placedBets||timer<=3) return; playClick();
    setBets(prev => {
      const next={...prev,[sector]:prev[sector]+activeChip};
      if (Object.values(next).reduce((a,b)=>a+b,0)>playableBalance){alert('Insufficient balance');return prev;}
      return next;
    });
  };
  const clearBets=()=>{if(isSpinning||placedBets)return;playClick();setBets({red:0,black:0,orange:0});};
  const doubleBets=()=>{if(isSpinning||placedBets)return;playClick();if(totalBet*2>playableBalance){alert('Insufficient balance');return;}setBets(p=>({red:p.red*2,black:p.black*2,orange:p.orange*2}));};
  const halfBets=()=>{if(isSpinning||placedBets)return;playClick();setBets(p=>({red:Math.floor(p.red/2),black:Math.floor(p.black/2),orange:Math.floor(p.orange/2)}));};
  const rebet=()=>{if(isSpinning||placedBets)return;playClick();const pv=prevBetsRef.current;const pt=Object.values(pv).reduce((a,b)=>a+b,0);if(!pt)return alert('No previous bets');if(pt>playableBalance)return alert('Insufficient balance');setBets({...pv});};

  // ── Spin ─────────────────────────────────────────────────────────────────────
  const executeSpin = async (betsSnapshot, isAutoSpin = false) => {
    // If auto-spin and bets weren't locked, spin empty. Otherwise use betsSnapshot/bets
    const activeBets = (isAutoSpin && !placedBetsRef.current) 
      ? { red: 0, black: 0, orange: 0 } 
      : (betsSnapshot || bets);
      
    const activeTotalBet = Object.values(activeBets).reduce((a,b)=>a+b,0);
    
    if (!isAutoSpin && !activeTotalBet) return alert('Place some chips first');
    if (isSpinning || (!isAutoSpin && placedBets)) return;
    // Stop the timer while spinning
    if (timerRef.current) clearInterval(timerRef.current);
    playClick();
    setPlacedBets(true);
    prevBetsRef.current={...activeBets};
    setPlayableBalance(prev=>parseFloat((prev-activeTotalBet).toFixed(2)));
    setIsSpinning(true);
    setSpinPhase('spinning');
    setResultModal({show:false,won:false,amount:0,color:null});
    setFlashColor(null);
    setParticles([]);

    const winIdx = Math.floor(Math.random()*WHEEL_SEQ.length);
    const winColor = WHEEL_SEQ[winIdx];

    // Step 1: Instantly snap back to near-zero (no transition) so every spin
    //         always travels the full distance regardless of previous state.
    setTransitionEnabled(false);
    setOffset(STEP); // park at tile-1 position instantaneously

    // Step 2: After two animation frames (ensures DOM painted the snap),
    //         re-enable transition and set the large target.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTransitionEnabled(true);
        // Travel 28 full wheel loops + landing index = massive visible movement
        const landOffset = 28 * WHEEL_SEQ.length * STEP + winIdx * STEP;
        setOffset(landOffset);
      });
    });

    // Tick sounds perfectly synced to 3.4s cubic-bezier ease-out
    const startT = Date.now();
    const doTick = () => {
       const elapsed = Date.now() - startT;
       if (elapsed < 3350) {
         playWheelTick();
         const progress = elapsed / 3400;
         // Starts at 20ms, drastically slows down to ~600ms at the very end
         const nextTickDelay = 20 + Math.pow(progress, 3.5) * 600;
         setTimeout(doTick, nextTickDelay);
       }
    };
    doTick();

    // Deceleration phase hint at 2.2s
    setTimeout(()=>setSpinPhase('landing'), 2200);

    setTimeout(async()=>{
      setIsSpinning(false);
      setSpinPhase('idle');
      setTransitionEnabled(false); // clean up so next snap is instant
      setLastColor(winColor);

      // Flash
      setFlashColor(CFG[winColor].g1);
      setTimeout(()=>setFlashColor(null),150);

      // Shake
      setShaking(true);
      setTimeout(()=>setShaking(false),500);

      // Particles burst
      const burst = Array.from({length:22},(_,i)=>({
        id:i, angle:(i/22)*360,
        dist: 90+Math.random()*80,
        color: CFG[winColor].particle,
        size: 4+Math.random()*7,
        dur: 0.55+Math.random()*0.3,
      }));
      setParticles(burst);
      setTimeout(()=>setParticles([]),1000);

      const betOnWin=activeBets[winColor]||0;
      const mult=CFG[winColor].mult;
      const won=betOnWin>0;
      const payout=won?parseFloat((betOnWin*mult).toFixed(2)):0;

      if (activeTotalBet > 0) {
        if(won){
          playWinChime();
          if(isDemo) setPlayableBalance(prev=>parseFloat((prev+payout).toFixed(2)));
          else{
            try{
              const res=await fetch('http://localhost:3001/api/games/record-bet',{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`},body:JSON.stringify({game:'hotline',bet_amount:activeTotalBet,payout_multiplier:mult,payout_amount:payout,is_won:true,raw_selection:{bets:activeBets}})});
              const data=await res.json();
              if(data.success)setPlayableBalance(data.balance);
            }catch(e){console.error(e);}
          }
        }else{
          playLossSound();
          if(!isDemo){
            try{await fetch('http://localhost:3001/api/games/record-bet',{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`},body:JSON.stringify({game:'hotline',bet_amount:activeTotalBet,payout_multiplier:0,payout_amount:0,is_won:false,raw_selection:{bets:activeBets}})});}catch(e){console.error(e);}
          }
        }
      } else {
        if (!won) playLossSound();
      }

      setHistory(prev=>[{color:winColor,id:Math.random().toString(36).substring(7)},...prev.slice(0,15)]);
      setResultModal({show:true,won,amount:payout,color:winColor});
      setBets({red:0,black:0,orange:0});
      setPlacedBets(false);
      // Restart timer after spin resolves
      setTimeout(() => startTimer(), 800);
    }, 3600);
  };

  // Build tile strip (30 repetitions is enough to cover the 28-loop animation)
  const tileStrip = Array(30).fill(null).flatMap((_,g)=>WHEEL_SEQ.map((c,i)=>({color:c,key:`${g}-${i}`})));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch w-full h-full select-none">

      <style>{`
        @keyframes speedLine {
          0%   { transform:scaleX(0) translateX(-100%); opacity:0; }
          20%  { opacity:0.7; }
          100% { transform:scaleX(1) translateX(0%); opacity:0; }
        }
        @keyframes drumShake {
          0%,100%{ transform:translateX(0) }
          15%{ transform:translateX(-6px) }
          30%{ transform:translateX(6px) }
          45%{ transform:translateX(-4px) }
          60%{ transform:translateX(4px) }
          75%{ transform:translateX(-2px) }
          90%{ transform:translateX(2px) }
        }
        @keyframes orbitGlow {
          0%   { transform:rotate(0deg); }
          100% { transform:rotate(360deg); }
        }
        @keyframes tileShine {
          0%   { transform:translateX(-150%) skewX(-20deg); }
          100% { transform:translateX(300%) skewX(-20deg); }
        }
        @keyframes flamePulse {
          0%,100%{ filter:drop-shadow(0 0 8px #f39c12) drop-shadow(0 0 16px #e74c3c); transform:scaleY(1); }
          50%    { filter:drop-shadow(0 0 20px #f39c12) drop-shadow(0 0 36px #e74c3c); transform:scaleY(1.08); }
        }
        @keyframes wagerIn {
          from{ opacity:0; transform:translateY(4px); }
          to  { opacity:1; transform:translateY(0); }
        }
        @keyframes resultBurst {
          0%   { transform:scale(0.7) translateY(20px); opacity:0; }
          60%  { transform:scale(1.05) translateY(-4px); opacity:1; }
          100% { transform:scale(1) translateY(0); opacity:1; }
        }
        @keyframes pinPulse {
          0%,100%{ box-shadow:0 0 8px #a826ff,0 0 16px rgba(168,38,255,0.5); }
          50%    { box-shadow:0 0 20px #a826ff,0 0 40px rgba(168,38,255,0.8); }
        }
        @keyframes bgRotate {
          from{ transform:rotate(0deg); }
          to  { transform:rotate(360deg); }
        }
        @keyframes particleFly {
          from{ opacity:1; transform:translate(-50%,-50%) scale(1); }
          to  { opacity:0; transform:translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(0); }
        }
        .landing-tile{
          animation: tileLand 0.4s ease-out;
        }
        @keyframes tileLand {
          0%  { transform:scale(1.25); filter:brightness(1.8); }
          100%{ transform:scale(1);    filter:brightness(1); }
        }
      `}</style>

      {/* ── LEFT PANEL ──────────────────────────────────────────────────── */}
      <div className="lg:col-span-4 bg-[#141622] border border-white/[0.02] p-5 rounded-3xl flex flex-col gap-4 shadow-xl h-full">

        {/* Balance row */}
        <div className="bg-zinc-950/20 border border-white/5 rounded-2xl p-3 flex justify-between items-center">
          <div>
            <span className="text-[8px] text-text-muted font-bold tracking-widest uppercase block leading-none">PLAY BALANCE</span>
            <span className="text-white font-extrabold text-sm block mt-1">₹{playableBalance.toFixed(2)}</span>
          </div>
          <div className="text-right">
            <span className="text-[8px] text-text-muted font-bold tracking-widest uppercase block leading-none">TOTAL BET</span>
            <span className="text-[#3de796] font-black text-sm block mt-1">₹{totalBet}</span>
          </div>
        </div>

        {/* Chip selector */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[9px] text-text-muted font-bold tracking-widest uppercase">Select Chip</span>
            <button onClick={clearBets} disabled={isSpinning||placedBets} className="text-[9px] text-red-400 font-black bg-transparent border-0 cursor-pointer hover:underline disabled:opacity-30 disabled:pointer-events-none">Clear Chips</button>
          </div>
          <div className="grid grid-cols-5 gap-1.5 bg-zinc-950/40 p-2.5 rounded-2xl border border-white/5">
            {CHIP_VALUES.map(v=><Chip key={v} val={v} selected={activeChip===v} onClick={()=>{playClick();setActiveChip(v);}} disabled={isSpinning||placedBets} />)}
          </div>
        </div>

        {/* Live pool */}
        <div className="bg-zinc-950/30 border border-white/5 rounded-2xl p-3.5 space-y-2 flex-1">
          <div className="flex justify-between items-center text-[8px] text-text-muted font-bold tracking-widest uppercase">
            <span>LIVE POOL</span>
            <span className="text-[#3de796] flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#3de796] animate-pulse"/>LIVE</span>
          </div>
          <div className="flex h-2 rounded-full overflow-hidden bg-zinc-900 border border-white/5">
            <div style={{ width:`${pctRed}%`, background:'#c0392b', boxShadow:'0 0 8px rgba(192,57,43,0.5)', transition:'width 0.5s' }} />
            <div style={{ width:`${pctOrange}%`, background:'#e67e22', boxShadow:'0 0 8px rgba(230,126,34,0.5)', transition:'width 0.5s' }} />
            <div style={{ width:`${pctBlack}%`, background:'#1e1e25', borderLeft:'1px solid rgba(255,255,255,0.1)', transition:'width 0.5s' }} />
          </div>
          <div className="grid grid-cols-3 gap-1 text-center">
            {[['red','RED','#c0392b','rgba(192,57,43,0.06)','rgba(192,57,43,0.15)',pctRed,livePool.red],
              ['orange','FIRE','#e67e22','rgba(230,126,34,0.06)','rgba(230,126,34,0.15)',pctOrange,livePool.orange],
              ['black','BLACK','#8a9ca8','rgba(255,255,255,0.02)','rgba(255,255,255,0.06)',pctBlack,livePool.black],
            ].map(([k,lbl,col,bg,bc,pct,pool])=>(
              <div key={k} className="rounded-lg p-1.5 border" style={{background:bg,borderColor:bc}}>
                <span className="block text-[6px] font-bold tracking-wider" style={{color:col}}>{lbl}</span>
                <span className="text-white font-mono text-[8px] font-black block mt-0.5">₹{Number(pool).toLocaleString('en-IN')}</span>
                <span className="text-white/25 text-[5.5px] block">{pct}%</span>
              </div>
            ))}
          </div>
          <div className="w-full h-px bg-white/5" />
          <div>
            <span className="text-[7px] text-text-muted font-bold tracking-widest uppercase block mb-1">RECENT WAGERS</span>
            <div className="space-y-1 max-h-[70px] overflow-hidden">
              {liveWagers.length>0?liveWagers.map(w=>(
                <div key={w.id} className="flex items-center text-[8px] bg-zinc-950/20 border border-white/[0.02] px-2 py-1 rounded-lg font-mono" style={{animation:'wagerIn 0.2s ease-out'}}>
                  <span className="w-16 text-white/70">{w.phone}</span>
                  <span className="w-8 text-white/30 text-[6px] text-center">bet</span>
                  <span className="w-8 flex justify-center"><span className="w-2.5 h-2.5 rounded-full" style={{background:pillBg(w.sel),border:w.sel==='black'?'1.5px solid rgba(255,255,255,0.7)':'none'}} /></span>
                  <span className="flex-1 text-right font-black text-[#3de796] text-[8px]">₹{w.amt.toLocaleString('en-IN')}</span>
                </div>
              )):<div className="text-[7px] text-white/20 italic">Waiting for wagers...</div>}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-4 gap-1.5">
          {[[<Trash2 size={12}/>,'Clear',clearBets],[<RotateCcw size={12}/>,'Rebet',rebet],['×2','Double',doubleBets],['½','Half',halfBets]].map(([ic,lbl,fn],i)=>(
            <button key={i} onClick={fn} disabled={isSpinning||placedBets||timer<=3} className="bg-zinc-900/60 hover:bg-[#3de796]/10 text-white hover:text-[#3de796] border border-white/5 hover:border-[#3de796]/20 py-3 rounded-xl cursor-pointer flex flex-col items-center justify-center gap-1 transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none text-[8px] font-black uppercase tracking-wide">
              <span className="text-[11px]">{ic}</span>{lbl}
            </button>
          ))}
        </div>

        <button onClick={()=>setPlacedBets(true)} disabled={isSpinning||placedBets||!totalBet||timer<=3}
          className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest border-0 cursor-pointer transition-all
            ${isSpinning||placedBets||!totalBet||timer<=3
              ?'bg-zinc-800/80 text-white/20 cursor-not-allowed'
              :'text-white hover:scale-[1.01] active:scale-[0.99]'}`}
          style={isSpinning||placedBets||!totalBet||timer<=3?{}:{background:'linear-gradient(135deg,#e67e22,#c0392b)',boxShadow:'0 4px 24px rgba(230,126,34,0.3)'}}>
          {isSpinning
            ?(<span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"/>SPINNING...</span>)
            :placedBets?'BETS LOCKED'
            :timer<=3?`CLOSING IN ${timer}s...`
            :'PLACE BET'}
        </button>
      </div>

      {/* ── RIGHT PANEL ──────────────────────────────────────────────────── */}
      <div className="lg:col-span-8 flex flex-col gap-4 h-full">

        {/* ═══ WHEEL VIEWPORT ═══════════════════════════════════════════ */}
        <div className="rounded-3xl relative overflow-hidden flex-1 flex flex-col items-center justify-center"
          style={{
            minHeight:280,
            background:'radial-gradient(ellipse 80% 80% at 50% 50%, #120828 0%, #07020f 70%, #030107 100%)',
            border:'2px solid rgba(168,38,255,0.3)',
            boxShadow:'inset 0 0 80px rgba(0,0,0,0.9), 0 0 40px rgba(168,38,255,0.08)',
            animation: shaking ? 'drumShake 0.5s ease-out' : 'none',
          }}>

          {/* Rotating conic gradient ring in BG */}
          <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
            <div style={{
              position:'absolute', width:'200%', height:'200%', top:'-50%', left:'-50%',
              background:'conic-gradient(from 0deg, transparent 0%, rgba(168,38,255,0.04) 15%, transparent 30%, rgba(192,57,43,0.03) 50%, transparent 65%, rgba(243,156,18,0.03) 80%, transparent 100%)',
              animation: isSpinning ? 'bgRotate 1.5s linear infinite' : 'bgRotate 12s linear infinite',
            }} />
          </div>

          {/* Decorative inner frame */}
          <div className="absolute inset-3 rounded-2xl border border-dashed border-[#a826ff]/10 pointer-events-none" />

          {/* ── Timer Progress Bar & Status ── */}
          <div className="absolute top-0 left-0 right-0 z-20 flex flex-col pointer-events-none">
            {/* Glowing neon progress line at the very top edge */}
            <div className="h-1 bg-white/5 w-full relative">
               <div className="absolute top-0 left-0 h-full transition-all duration-1000 ease-linear"
                 style={{ 
                   width: isSpinning ? '100%' : `${(Math.max(0, timer - 3) / 12) * 100}%`,
                   background: isSpinning ? '#f97316' : timer <= 3 ? '#ef4444' : '#a826ff',
                   boxShadow: `0 0 12px ${isSpinning ? '#f97316' : timer <= 3 ? '#ef4444' : '#a826ff'}` 
                 }} 
               />
            </div>
            
            {/* Minimalist Status Text Top Center */}
            <div className="w-full flex justify-center mt-3">
              <div className="bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/5 flex items-center gap-2 shadow-xl">
                <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] ${isSpinning ? 'bg-orange-500 animate-pulse text-orange-500' : timer <= 3 ? 'bg-red-500 animate-pulse text-red-500' : 'bg-[#a826ff] text-[#a826ff]'}`} />
                <span className="text-[9px] font-black tracking-[0.2em] uppercase text-white/90">
                  {isSpinning ? 'WHEEL SPINNING' : timer <= 3 ? 'BETS CLOSED' : 'ACCEPTING BETS'}
                </span>
                {!isSpinning && (
                  <>
                    <span className="text-white/20 ml-1 mr-1">|</span>
                    <span className={`text-[11px] font-mono font-black ${timer <= 3 ? 'text-red-400' : 'text-white'}`}>
                      {`${timer<10?'0':''}${timer}s`}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ── DRUM TRACK ── */}
          <div style={{ position:'relative', width:'100%', height:130, display:'flex', alignItems:'center', perspective:'900px', perspectiveOrigin:'50% 50%' }}>

            {/* Speed lines (only during spin) */}
            {isSpinning && Array.from({length:6},(_,i)=>(
              <div key={i} style={{
                position:'absolute', height:1.5, background:`linear-gradient(to right,transparent,${i%2===0?'rgba(168,38,255,0.6)':'rgba(255,120,40,0.5)'},transparent)`,
                borderRadius:99, pointerEvents:'none', zIndex:7,
                top: `${18+i*14}%`, left:'10%', right:'10%',
                animation:`speedLine ${0.15+i*0.04}s ${i*0.03}s ease-out infinite`,
              }}/>
            ))}

            {/* Edge fade masks */}
            <div style={{position:'absolute',inset:0,zIndex:5,pointerEvents:'none',
              background:'linear-gradient(to right,#07020f 0%,rgba(7,2,15,0.6) 15%,transparent 35%,transparent 65%,rgba(7,2,15,0.6) 85%,#07020f 100%)'}}/>

            {/* Top & bottom gradient to create depth illusion */}
            <div style={{position:'absolute',inset:0,zIndex:4,pointerEvents:'none',
              background:'linear-gradient(to bottom,#07020f 0%,transparent 25%,transparent 75%,#07020f 100%)'}}/>

            {/* Purple center pin */}
            <div style={{position:'absolute',top:0,bottom:0,left:'50%',width:3,transform:'translateX(-50%)',
              background:'linear-gradient(to bottom,transparent,#a826ff 15%,#c060ff 50%,#a826ff 85%,transparent)',
              zIndex:10,borderRadius:3,animation:'pinPulse 1.5s ease-in-out infinite'}}/>

            {/* Top diamond notch */}
            <div style={{position:'absolute',top:-1,left:'50%',transform:'translateX(-50%)',zIndex:11,
              width:0,height:0,borderLeft:'10px solid transparent',borderRight:'10px solid transparent',borderTop:'14px solid #a826ff',
              filter:'drop-shadow(0 0 8px #a826ff)'}}/>
            {/* Bottom diamond notch */}
            <div style={{position:'absolute',bottom:-1,left:'50%',transform:'translateX(-50%)',zIndex:11,
              width:0,height:0,borderLeft:'10px solid transparent',borderRight:'10px solid transparent',borderBottom:'14px solid #a826ff',
              filter:'drop-shadow(0 0 8px #a826ff)'}}/>

            {/* Tile strip with 3D-ish perspective */}
            <div style={{
              display:'flex',gap:GAP,alignItems:'center',
              position:'absolute',top:'50%',left:'50%',
              transform:`translate(calc(-${offset}px - ${TILE_W/2}px),-50%)`,
              // Only apply transition when transitionEnabled — prevents the snap-back from animating
              transition: transitionEnabled
                ? `transform 3.4s cubic-bezier(0.12, 0.0, 0.05, 1.0)`
                : 'none',
              willChange:'transform',
              filter: isSpinning
                ? (spinPhase==='spinning' ? 'blur(5px) brightness(1.2)' : 'blur(2px) brightness(1.08)')
                : 'none',
            }}>
              {tileStrip.map(({color,key},i)=>{
                const c=CFG[color]||CFG.black;
                return (
                  <div key={key} style={{
                    width:TILE_W,height:TILE_W,flexShrink:0,borderRadius:14,
                    background:`linear-gradient(145deg,${c.g1},${c.g2})`,
                    border: color==='orange'
                      ? '1.5px solid rgba(243,156,18,0.7)'
                      : color==='red'
                      ? '1px solid rgba(192,57,43,0.4)'
                      : '1px solid rgba(255,255,255,0.07)',
                    boxShadow: color==='orange'
                      ? '0 0 20px rgba(243,156,18,0.6), inset 0 1px 0 rgba(255,255,255,0.15)'
                      : color==='red'
                      ? 'inset 0 1px 0 rgba(255,255,255,0.08), 0 0 6px rgba(192,57,43,0.15)'
                      : 'inset 0 1px 0 rgba(255,255,255,0.05)',
                    display:'flex',alignItems:'center',justifyContent:'center',
                    position:'relative',overflow:'hidden',
                  }}>
                    {color==='orange' && (
                      <div style={{fontSize:32,animation:'flamePulse 1.2s ease-in-out infinite',lineHeight:1}}>🔥</div>
                    )}
                    {color==='red' && (
                      <div style={{width:16,height:16,borderRadius:'50%',background:'rgba(255,80,60,0.25)',border:'1.5px solid rgba(255,80,60,0.4)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                        <div style={{width:8,height:8,borderRadius:'50%',background:'rgba(255,80,60,0.5)'}}/>
                      </div>
                    )}
                    {color==='black' && (
                      <div style={{width:16,height:16,borderRadius:'50%',background:'rgba(180,180,220,0.08)',border:'1px solid rgba(180,180,220,0.15)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                        <div style={{width:8,height:8,borderRadius:'50%',background:'rgba(180,180,220,0.12)'}}/>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Landing flash overlay */}
            <AnimatePresence>
              {flashColor && (
                <motion.div
                  key="flash"
                  initial={{opacity:0.9}} animate={{opacity:0}} transition={{duration:0.18}}
                  style={{position:'absolute',inset:0,background:flashColor,zIndex:20,borderRadius:12,mixBlendMode:'screen'}}
                />
              )}
            </AnimatePresence>

            {/* Particle burst (positioned at center) */}
            <div style={{position:'absolute',top:'50%',left:'50%',width:0,height:0,zIndex:15,pointerEvents:'none'}}>
              {particles.map(p=>{
                const tx=Math.cos(p.angle*Math.PI/180)*p.dist;
                const ty=Math.sin(p.angle*Math.PI/180)*p.dist;
                return (
                  <div key={p.id} style={{
                    position:'absolute',width:p.size,height:p.size,borderRadius:'50%',
                    background:p.color,
                    '--tx':`${tx}px`,'--ty':`${ty}px`,
                    boxShadow:`0 0 6px ${p.color}`,
                    animation:`particleFly ${p.dur}s ease-out forwards`,
                  }}/>
                );
              })}
            </div>
          </div>

          {/* Orbit glow ring during spin */}
          {isSpinning && (
            <div style={{position:'absolute',inset:0,pointerEvents:'none',zIndex:3}}>
              <div style={{
                position:'absolute',top:'50%',left:'50%',
                width:200,height:60,marginLeft:-100,marginTop:-30,
                border:'1px solid rgba(168,38,255,0.3)',borderRadius:'50%',
                boxShadow:'0 0 20px rgba(168,38,255,0.15)',
                animation:'orbitGlow 2s linear infinite',
              }}/>
            </div>
          )}

          {/* Last result pill (bottom) */}
          <AnimatePresence>
            {lastColor && !isSpinning && (
              <motion.div
                key={lastColor + (history[0]?.id || 'init')}
                initial={{opacity:0,y:8,scale:0.9}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:-4}}
                className="absolute bottom-4 z-20 flex items-center gap-2 px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider text-white"
                style={{background:'rgba(5,2,12,0.9)',border:`1px solid ${CFG[lastColor].g1}40`,boxShadow:`0 0 14px ${CFG[lastColor].glow.replace('0.9','0.2').replace('1.0','0.2').replace('0.4','0.1')}`}}>
                <Sparkles size={9} style={{color:CFG[lastColor].g1}}/>
                <span>Landed:</span>
                <span className="px-1.5 py-0.5 rounded font-black" style={{background:pillBg(lastColor),fontSize:8}}>
                  {CFG[lastColor].label}
                </span>
                <span style={{color:CFG[lastColor].g1}}>{CFG[lastColor].mult}×</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Result modal */}
          <AnimatePresence>
            {resultModal.show && (
              <motion.div
                key="modal" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                className="absolute inset-0 z-30 flex items-center justify-center rounded-3xl"
                onClick={()=>setResultModal(p=>({...p,show:false}))}>
                <div className="absolute inset-0 rounded-3xl" style={{background:'rgba(0,0,0,0.6)',backdropFilter:'blur(8px)'}}/>
                <motion.div
                  initial={{scale:0.7,y:20,opacity:0}} animate={{scale:1,y:0,opacity:1}}
                  transition={{type:'spring',stiffness:300,damping:20}}
                  className="relative z-10 p-6 rounded-3xl text-center flex flex-col items-center gap-3 w-[260px]"
                  style={{
                    background:'linear-gradient(135deg,rgba(24,27,42,0.98),rgba(10,12,22,0.99))',
                    border:`2px solid ${resultModal.color?CFG[resultModal.color].g1:'rgba(168,38,255,0.4)'}`,
                    boxShadow:`0 12px 40px ${resultModal.color?CFG[resultModal.color].glow.replace('0.9','0.3').replace('1.0','0.3').replace('0.4','0.1'):'rgba(168,38,255,0.2)'}`,
                  }}
                  onClick={e=>e.stopPropagation()}>
                  <button onClick={()=>setResultModal(p=>({...p,show:false}))} className="absolute top-3 right-4 text-white/30 hover:text-white bg-transparent border-0 cursor-pointer text-sm font-black">✕</button>

                  <div className="flex items-center gap-2 text-[#a826ff]">
                    <Sparkles size={11} style={{animation:'spin 5s linear infinite'}}/>
                    <span className="text-[7.5px] font-black tracking-[0.2em] uppercase">HOTLINE RESULT</span>
                    <Sparkles size={11} style={{animation:'spin 5s linear infinite reverse'}}/>
                  </div>

                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg"
                    style={{background:`linear-gradient(135deg,${resultModal.color?CFG[resultModal.color].g1:'#333'},${resultModal.color?CFG[resultModal.color].g2:'#111'})`,boxShadow:`0 0 24px ${resultModal.color?CFG[resultModal.color].glow.replace('0.9','0.5').replace('1.0','0.5').replace('0.4','0.2'):''}`}}>
                    {resultModal.color?CFG[resultModal.color].emoji:'?'}
                  </div>

                  {resultModal.won?(
                    <motion.div initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{delay:0.15}} className="flex flex-col items-center gap-1">
                      {[...Array(8)].map((_,i)=>(
                        <motion.div key={i} className="absolute rounded-full" style={{width:6,height:6,background:resultModal.color?CFG[resultModal.color].particle:'#3de796'}}
                          initial={{x:0,y:0,opacity:1,scale:1}}
                          animate={{x:Math.cos((i/8)*Math.PI*2)*70,y:Math.sin((i/8)*Math.PI*2)*70,opacity:0,scale:0}}
                          transition={{duration:0.65,delay:0.05}}/>
                      ))}
                      <div className="text-[#3de796] font-black text-lg tracking-widest">YOU WON!</div>
                      <div className="text-white font-black text-3xl">₹{resultModal.amount.toFixed(2)}</div>
                      <div className="text-white/40 text-[9px] font-bold">{resultModal.color?CFG[resultModal.color].mult:0}× on {resultModal.color?CFG[resultModal.color].label:''}</div>
                    </motion.div>
                  ):(
                    <motion.div initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{delay:0.1}} className="flex flex-col items-center gap-1">
                      <div className="text-red-400 font-black text-base tracking-widest">BETTER LUCK!</div>
                      <div className="text-white/40 text-[9px] font-bold">Keep spinning to win big</div>
                    </motion.div>
                  )}
                  <div className="w-12 h-px" style={{background:`${resultModal.color?CFG[resultModal.color].g1:'#a826ff'}40`}}/>
                  <div className="text-white/20 text-[8px] font-bold tracking-widest">TAP ANYWHERE TO CLOSE</div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ═══ BET GRID ═════════════════════════════════════════════════ */}
        <div className="bg-[#141622] border border-white/[0.02] p-4 rounded-3xl flex flex-col gap-3 shadow-xl">

          <div className="flex justify-between items-center text-[9px] font-black text-text-muted uppercase tracking-widest border-b border-white/5 pb-2">
            <span className="flex items-center gap-3">
              <span>PLACE YOUR BETS</span>
              <span className="text-white/10">|</span>
              <div className="flex items-center gap-1">
                <AnimatePresence mode="popLayout">
                  {history.slice(0,14).map((h,i)=>(
                    <motion.div key={h.id} layout initial={{scale:0,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0,opacity:0}}
                      className="w-3.5 h-3.5 rounded shadow-inner border transition-all hover:scale-110 cursor-default"
                      title={CFG[h.color]?.label}
                      style={{background:pillBg(h.color),borderColor:h.color==='orange'?'#e67e22':'rgba(255,255,255,0.12)'}}/>
                  ))}
                </AnimatePresence>
              </div>
            </span>
            <span className="flex items-center gap-1 text-[#3de796]"><ShieldCheck size={11}/> Provably Fair</span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {Object.entries(CFG).map(([key,cfg])=>{
              const betAmt=bets[key];
              const isActive=betAmt>0;
              return (
                <button key={key} onClick={()=>addBet(key)} disabled={isSpinning||placedBets}
                  className="relative rounded-2xl overflow-hidden cursor-pointer border-0 transition-all duration-200 active:scale-95 hover:scale-[1.02] disabled:opacity-50 disabled:pointer-events-none"
                  style={{
                    height:110,
                    background:isActive?`linear-gradient(160deg,${cfg.g1}55,${cfg.g2}33)`:`linear-gradient(160deg,${cfg.g1}18,${cfg.g2}08)`,
                    border:`1.5px solid ${isActive?cfg.g1:`${cfg.g1}28`}`,
                    boxShadow:isActive?`0 0 24px ${cfg.glow.replace('0.9','0.18').replace('1.0','0.18').replace('0.4','0.08')}`:undefined,
                  }}>

                  {/* Shine sweep on active */}
                  {isActive&&<div style={{position:'absolute',top:0,left:0,width:'40%',height:'100%',background:'linear-gradient(to right,transparent,rgba(255,255,255,0.05),transparent)',animation:'tileShine 2.5s linear infinite',pointerEvents:'none'}}/>}

                  {/* Inner glow when active */}
                  {isActive&&<div style={{position:'absolute',inset:0,background:`radial-gradient(ellipse at 30% 50%,${cfg.g1}20 0%,transparent 70%)`,pointerEvents:'none'}}/>}

                  {/* Color orb top-left */}
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <div style={{width:32,height:32,borderRadius:8,background:`linear-gradient(135deg,${cfg.g1},${cfg.g2})`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,boxShadow:isActive?`0 0 14px ${cfg.glow.replace('0.9','0.5').replace('1.0','0.5').replace('0.4','0.2')}`:undefined}}>
                      {cfg.emoji}
                    </div>
                  </div>

                  {/* Multiplier top-right */}
                  <div className="absolute top-3 right-3 rounded-lg px-2 py-0.5" style={{background:`${cfg.g1}28`,border:`1px solid ${cfg.g1}44`}}>
                    <span style={{color:cfg.g1,fontSize:11,fontWeight:900}}>{cfg.mult}×</span>
                  </div>

                  {/* Label bottom-left */}
                  <div className="absolute bottom-3 left-3 text-left">
                    <div style={{color:isActive?cfg.g1:'#6b7a8d',fontWeight:900,fontSize:12,letterSpacing:'0.04em'}}>{cfg.label}</div>
                    <div style={{color:'#44526a',fontSize:9,fontWeight:600,marginTop:1}}>{cfg.chance}</div>
                  </div>

                  {/* Bet chip bottom-right */}
                  {betAmt>0&&(
                    <motion.div initial={{scale:0}} animate={{scale:1}} transition={{type:'spring',stiffness:400}}
                      className="absolute bottom-3 right-3 w-9 h-9 rounded-full shadow-lg flex items-center justify-center"
                      style={{background:`linear-gradient(135deg,${cfg.g1},${cfg.g2})`,boxShadow:`0 0 14px ${cfg.glow.replace('0.9','0.5').replace('1.0','0.5').replace('0.4','0.2')}`,border:'2px solid rgba(255,255,255,0.15)'}}>
                      <span style={{color:'#fff',fontSize:7,fontWeight:900,fontFamily:'monospace'}}>₹{betAmt}</span>
                    </motion.div>
                  )}

                  {!betAmt&&!isSpinning&&!placedBets&&(
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                      <span style={{color:'rgba(255,255,255,0.3)',fontSize:8,fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase'}}>Click to Bet</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
