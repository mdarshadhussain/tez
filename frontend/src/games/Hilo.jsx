import React, { useState } from 'react';
import { Shield, HelpCircle, Trophy, RefreshCw, Volume2, VolumeX, ArrowUp, ArrowDown } from 'lucide-react';

const CARD_SUITS = ['♠', '♥', '♦', '♣'];
const CARD_VALUES = [
  { label: '2', val: 2 },
  { label: '3', val: 3 },
  { label: '4', val: 4 },
  { label: '5', val: 5 },
  { label: '6', val: 6 },
  { label: '7', val: 7 },
  { label: '8', val: 8 },
  { label: '9', val: 9 },
  { label: '10', val: 10 },
  { label: 'J', val: 11 },
  { label: 'Q', val: 12 },
  { label: 'K', val: 13 },
  { label: 'A', val: 14 }
];

export default function Hilo({ token, playableBalance, setPlayableBalance, isDemo }) {
  const [betAmount, setBetAmount] = useState('50');
  const [gameActive, setGameActive] = useState(false);
  const [currentCard, setCurrentCard] = useState({ label: 'A', val: 14, suit: '♠', color: 'white' });
  const [nextCard, setNextCard] = useState(null);
  const [multiplier, setMultiplier] = useState(1.00);
  const [history, setHistory] = useState([]);
  const [isFlipping, setIsFlipping] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  // Generate random card
  const drawRandomCard = () => {
    const valObj = CARD_VALUES[Math.floor(Math.random() * CARD_VALUES.length)];
    const suit = CARD_SUITS[Math.floor(Math.random() * CARD_SUITS.length)];
    const color = (suit === '♥' || suit === '♦') ? '#FF3B30' : '#ffffff';
    return { ...valObj, suit, color };
  };

  const startGame = () => {
    const amt = parseFloat(betAmount);
    if (isNaN(amt) || amt < 10) return alert('Minimum bet is ₹10.00');
    if (amt > playableBalance) return alert('Insufficient balance');

    setPlayableBalance(playableBalance - amt);
    const startCard = drawRandomCard();
    setCurrentCard(startCard);
    setNextCard(null);
    setMultiplier(1.00);
    setHistory([startCard]);
    setGameActive(true);
  };

  const makeGuess = async (guess) => {
    if (!gameActive || isFlipping) return;

    setIsFlipping(true);
    const newCard = drawRandomCard();

    // Spribe Hilo logic
    let won = false;
    if (guess === 'high') {
      won = newCard.val >= currentCard.val;
    } else if (guess === 'low') {
      won = newCard.val <= currentCard.val;
    }

    // Small delay to simulate flipping card
    setTimeout(async () => {
      setNextCard(newCard);
      setIsFlipping(false);

      if (won) {
        // Multiplier scaling matches Spribe Hilo mechanics
        let hitChance = 0.5;
        if (guess === 'high') {
          hitChance = (15 - currentCard.val) / 13;
        } else {
          hitChance = (currentCard.val - 1) / 13;
        }
        if (hitChance <= 0) hitChance = 0.08;
        const rewardMult = parseFloat((0.97 / hitChance).toFixed(2));
        const nextMult = parseFloat((multiplier * rewardMult).toFixed(2));

        setMultiplier(nextMult);
        setCurrentCard(newCard);
        setHistory(prev => [newCard, ...prev]);
      } else {
        // Lost!
        setGameActive(false);
        if (!isDemo) {
          await fetch('http://localhost:3001/api/games/record-bet', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              game: 'hilo',
              bet_amount: parseFloat(betAmount),
              payout_multiplier: 0.00,
              payout_amount: 0.00,
              is_won: false,
              raw_selection: { history: history.map(c => c.label) }
            })
          });
        }
        alert(`Ouch! Next card was ${newCard.label}${newCard.suit}. Round lost!`);
      }
    }, 400);
  };

  const cashOut = async () => {
    if (!gameActive || isFlipping) return;

    const payout = parseFloat((parseFloat(betAmount) * multiplier).toFixed(2));
    setGameActive(false);

    if (isDemo) {
      setPlayableBalance(playableBalance + payout);
      alert(`Success! Won ₹${payout.toFixed(2)} (${multiplier}x)`);
      return;
    }

    try {
      const res = await fetch('http://localhost:3001/api/games/record-bet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          game: 'hilo',
          bet_amount: parseFloat(betAmount),
          payout_multiplier: multiplier,
          payout_amount: payout,
          is_won: true,
          raw_selection: { history: history.map(c => c.label) }
        })
      });
      const data = await res.json();
      if (data.success) {
        setPlayableBalance(data.balance);
        alert(`Success! Won ₹${payout.toFixed(2)} (${multiplier}x)`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto', paddingBottom: '100px' }}>
      
      {/* Game Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={20} color="var(--action-highlight)" />
          <span style={{ fontWeight: 900, color: '#fff', fontSize: '18px', letterSpacing: '0.5px' }}>SPRIBE HILO</span>
          <span style={{ fontSize: '9px', background: 'rgba(255,149,0,0.1)', color: '#ff9500', padding: '3px 8px', borderRadius: '6px', fontWeight: 800 }}>PROVABLY FAIR</span>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => setShowHowToPlay(!showHowToPlay)} 
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', color: '#8a9ca8', padding: '6px 12px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
          >
            <HelpCircle size={14} /> How to play
          </button>
        </div>
      </div>

      {showHowToPlay && (
        <div className="frosted-card" style={{ marginBottom: '20px', padding: '16px', background: 'rgba(255,149,0,0.03)', borderColor: 'rgba(255,149,0,0.1)' }}>
          <h4 style={{ color: '#fff', fontWeight: 800, fontSize: '14px', marginBottom: '6px' }}>Game Instructions</h4>
          <p style={{ fontSize: '12px', color: '#8a9ca8', lineHeight: 1.5 }}>
            A random starting card is drawn. Choose if the next card will be <strong>Higher or Equal</strong> or <strong>Lower or Equal</strong> than the current card. If you guess right, the multiplier climbs! Cash out at any step to claim your accumulated winnings.
          </p>
        </div>
      )}

      {/* Main Grid Area */}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px' }}>
        
        {/* Left Side: Betting and Controls */}
        <div className="frosted-card" style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: '16px', height: 'fit-content' }}>
          <div>
            <span style={{ fontSize: '11px', color: '#8a9ca8', fontWeight: 700 }}>BET AMOUNT</span>
            <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
              <input
                type="number"
                className="form-input"
                style={{ padding: '10px', fontSize: '15px' }}
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                disabled={gameActive}
              />
              <button 
                className="cyan-btn" 
                style={{ width: '45px', padding: 0, borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}
                onClick={() => setBetAmount(prev => String(Math.max(10, parseFloat(prev) / 2)))}
                disabled={gameActive}
              >
                ½
              </button>
              <button 
                className="cyan-btn" 
                style={{ width: '45px', padding: 0, borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}
                onClick={() => setBetAmount(prev => String(parseFloat(prev) * 2))}
                disabled={gameActive}
              >
                2x
              </button>
            </div>
          </div>

          {!gameActive ? (
            <button className="action-btn" style={{ background: '#ff9500', color: '#000', fontWeight: 900 }} onClick={startGame}>
              Place Bet (₹{betAmount})
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button 
                  onClick={() => makeGuess('high')}
                  style={{ background: 'rgba(48,209,88,0.15)', border: '1px solid #30d158', color: '#30d158', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px', borderRadius: '12px', cursor: 'pointer', fontWeight: 800 }}
                >
                  <ArrowUp size={20} />
                  <span style={{ fontSize: '12px', marginTop: '4px' }}>High or Equal</span>
                </button>
                <button 
                  onClick={() => makeGuess('low')}
                  style={{ background: 'rgba(255,59,48,0.15)', border: '1px solid #ff3b30', color: '#ff3b30', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px', borderRadius: '12px', cursor: 'pointer', fontWeight: 800 }}
                >
                  <ArrowDown size={20} />
                  <span style={{ fontSize: '12px', marginTop: '4px' }}>Low or Equal</span>
                </button>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.01)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#8a9ca8' }}>ACCUMULATED MULTIPLIER</div>
                <div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--success-layer)', marginTop: '4px' }}>{multiplier}x</div>
              </div>

              <button 
                onClick={cashOut}
                className="action-btn" 
                style={{ background: 'var(--success-layer)', color: '#000', fontWeight: 900 }}
              >
                Cash Out (₹{(parseFloat(betAmount) * multiplier).toFixed(2)})
              </button>
            </div>
          )}
        </div>

        {/* Right Side: Playing board & card slot */}
        <div className="frosted-card" style={{ margin: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '340px' }}>
          
          {/* Card Slots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', alignItems: 'center', flex: 1 }}>
            
            {/* Current card */}
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '11px', color: '#8a9ca8', display: 'block', marginBottom: '8px' }}>CURRENT CARD</span>
              <div 
                style={{
                  width: '120px',
                  height: '170px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #201335 0%, #0c0816 100%)',
                  border: '2px solid rgba(255,149,0,0.4)',
                  boxShadow: '0 0 20px rgba(255,149,0,0.15)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '16px',
                  position: 'relative',
                  transform: isFlipping ? 'rotateY(180deg)' : 'none',
                  transition: 'transform 0.4s'
                }}
              >
                <div style={{ fontSize: '24px', fontWeight: 900, color: currentCard.color, textAlign: 'left' }}>
                  {currentCard.label}
                </div>
                <div style={{ fontSize: '48px', color: currentCard.color, alignSelf: 'center' }}>
                  {currentCard.suit}
                </div>
                <div style={{ fontSize: '24px', fontWeight: 900, color: currentCard.color, textAlign: 'right' }}>
                  {currentCard.label}
                </div>
              </div>
            </div>

            {/* Indicator separator */}
            <div style={{ fontSize: '24px', color: '#8a9ca8', fontWeight: 800 }}>➜</div>

            {/* Next card reveal */}
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '11px', color: '#8a9ca8', display: 'block', marginBottom: '8px' }}>NEXT CARD</span>
              <div 
                style={{
                  width: '120px',
                  height: '170px',
                  borderRadius: '16px',
                  background: nextCard ? 'linear-gradient(135deg, #201335 0%, #0c0816 100%)' : 'rgba(255,255,255,0.01)',
                  border: nextCard ? '2px solid rgba(255,255,255,0.1)' : '2px dashed rgba(255,255,255,0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '16px',
                  alignItems: nextCard ? 'stretch' : 'center',
                  justifyContent: nextCard ? 'space-between' : 'center'
                }}
              >
                {nextCard ? (
                  <>
                    <div style={{ fontSize: '24px', fontWeight: 900, color: nextCard.color, textAlign: 'left' }}>
                      {nextCard.label}
                    </div>
                    <div style={{ fontSize: '48px', color: nextCard.color, alignSelf: 'center' }}>
                      {nextCard.suit}
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 900, color: nextCard.color, textAlign: 'right' }}>
                      {nextCard.label}
                    </div>
                  </>
                ) : (
                  <span style={{ color: '#4d5c68', fontSize: '28px', fontWeight: 900 }}>?</span>
                )}
              </div>
            </div>

          </div>

          {/* History Ribbon */}
          <div style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
            <span style={{ fontSize: '10px', color: '#8a9ca8', display: 'block', marginBottom: '6px' }}>ROUND HISTORY</span>
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
              {history.map((c, i) => (
                <div 
                  key={i} 
                  style={{
                    minWidth: '36px',
                    height: '48px',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 800,
                    color: c.color
                  }}
                >
                  <div>{c.label}</div>
                  <div style={{ fontSize: '10px', marginTop: '-2px' }}>{c.suit}</div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
