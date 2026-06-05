import React, { useState, useEffect } from 'react';
import { Shuffle } from 'lucide-react';

export default function Roulette({ socket, user, playableBalance, setPlayableBalance, isDemo }) {
  const [timer, setTimer] = useState(15);
  const [history, setHistory] = useState([]);
  const [betAmount, setBetAmount] = useState('20');
  const [selectedBet, setSelectedBet] = useState(null); // red, black, gold
  const [spinning, setSpinning] = useState(false);
  const [spinOffset, setSpinOffset] = useState(0);
  const [winSector, setWinSector] = useState(null);

  // Stale closure escape container for demo bets
  const demoBetRef = React.useRef(null);

  // Generate repeated roulette layout for the horizontal wheel strip
  const strip = ['red', 'black', 'red', 'black', 'red', 'black', 'red', 'black', 'red', 'black', 'red', 'black', 'red', 'black', 'gold'];

  useEffect(() => {
    if (!socket) return;

    socket.on('game_timers', (timers) => {
      setTimer(timers.roulette);
      if (timers.roulette === 14) {
        // new round started
        setSpinning(false);
        setWinSector(null);
      }
    });

    socket.on('init_data', (data) => {
      if (data && data.roulette) {
        setHistory(data.roulette);
      }
    });

    socket.on('roulette_resolution', (data) => {
      setWinSector(data.lastOutcome);
      setSpinning(true);
      
      // Select index matching outcome
      const outcomeIdx = strip.lastIndexOf(data.lastOutcome);
      // set animation offset to align the chosen slot to center
      setSpinOffset(-(outcomeIdx * 60) + 170); // slot is 60px wide, offset relative to container center
      
      // Evaluate demo bet
      if (isDemo && demoBetRef.current) {
        const { selection, amount } = demoBetRef.current;
        const won = (selection === data.lastOutcome);
        const mult = (data.lastOutcome === 'gold') ? 14 : 2;
        const payout = won ? parseFloat((amount * mult).toFixed(2)) : 0;

        setTimeout(() => {
          setHistory(data.history);
          setSelectedBet(null);
          
          if (won) {
            setPlayableBalance(prev => prev + payout);
            alert(`Congratulations! Won ₹${payout.toFixed(2)} on Roulette (Demo)!`);
          } else {
            alert(`Round settled. Landed on ${data.lastOutcome}. Better luck next time in Roulette (Demo)!`);
          }
        }, 3000);
        demoBetRef.current = null;
      } else {
        setTimeout(() => {
          setHistory(data.history);
          setSelectedBet(null);
        }, 3000);
      }
    });

    socket.on('bet_placed_success', (data) => {
      if (data.game === 'roulette' && !isDemo) {
        setPlayableBalance(data.balance);
      }
    });

    socket.on('bet_result', (data) => {
      if (data.game === 'roulette' && !isDemo) {
        if (data.won) {
          alert(`Congratulations! Won ₹${data.payout.toFixed(2)} on Roulette!`);
          setPlayableBalance(data.balance);
        }
      }
    });

    return () => {
      socket.off('game_timers');
      socket.off('init_data');
      socket.off('roulette_resolution');
      socket.off('bet_placed_success');
      socket.off('bet_result');
    };
  }, [socket, setPlayableBalance, isDemo]);

  const placeBet = () => {
    if (!selectedBet) return alert('Select red, black, or gold first');
    const amt = parseFloat(betAmount);
    if (isNaN(amt) || amt < 10) return alert('Minimum bet is ₹10.00');
    if (amt > playableBalance) return alert('Insufficient balance');

    if (timer <= 3) return alert('Betting closed for this round (3s lock)');

    if (isDemo) {
      setPlayableBalance(playableBalance - amt);
      demoBetRef.current = { selection: selectedBet, amount: amt };
      alert(`Demo Bet of ₹${amt} placed on ${selectedBet}!`);
      return;
    }

    socket.emit('place_bet', {
      userId: user.id,
      game: 'roulette',
      selection: selectedBet,
      amount: amt
    });
  };

  return (
    <div style={{ padding: '16px', paddingBottom: '80px' }}>
      {/* Timer Header */}
      <div className="frosted-card row">
        <div>
          <span style={{ fontSize: '11px', color: '#8a8a93', fontWeight: 600 }}>Double Roulette</span>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', marginTop: '4px' }}>Multiplayer Slider</h2>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '11px', color: '#8a8a93', fontWeight: 600 }}>COUNTDOWN</div>
          <div className="monospace-ledger" style={{ fontSize: '28px', fontWeight: 800, color: 'var(--success-layer)' }}>
            00:{timer < 10 ? `0${timer}` : timer}
          </div>
        </div>
      </div>

      {/* Slider Viewport */}
      <div
        className="frosted-card"
        style={{
          padding: 0,
          background: '#0e0e11',
          overflow: 'hidden',
          position: 'relative',
          height: '90px',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        {/* Center pointer */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 0,
            transform: 'translateX(-50%)',
            width: '4px',
            height: '100%',
            background: 'var(--action-highlight)',
            zIndex: 10,
            boxShadow: '0 0 10px var(--action-highlight)'
          }}
        />

        {/* Sliding strip container */}
        <div
          style={{
            display: 'flex',
            transition: spinning ? 'transform 3s cubic-bezier(0.1, 0.8, 0.1, 1)' : 'none',
            transform: `translateX(${spinning ? spinOffset : 0}px)`
          }}
        >
          {strip.map((color, idx) => (
            <div
              key={idx}
              style={{
                width: '60px',
                height: '60px',
                background: color === 'red' ? '#FF3B30' : color === 'black' ? '#1c1c1e' : 'var(--vip-status)',
                margin: '0 4px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '11px',
                fontWeight: 800,
                flexShrink: 0,
                border: '1px solid var(--border-glass)'
              }}
            >
              {color === 'gold' ? '★' : ''}
            </div>
          ))}
        </div>
      </div>

      {/* Inputs (Ergonomic bottom 40%) */}
      <div className="frosted-card">
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          {['red', 'black', 'gold'].map((c) => (
            <button
              key={c}
              onClick={() => setSelectedBet(c)}
              style={{
                flex: 1,
                background: c === 'red' ? '#FF3B30' : c === 'black' ? '#1c1c1e' : 'var(--vip-status)',
                border: selectedBet === c ? '3px solid #fff' : 'none',
                borderRadius: '12px',
                height: '45px',
                color: '#fff',
                fontWeight: 800,
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              {c.toUpperCase()} {c === 'gold' ? '14x' : '2x'}
            </button>
          ))}
        </div>

        <div className="row" style={{ gap: '10px' }}>
          <input
            type="number"
            className="form-input"
            style={{ flex: 1 }}
            placeholder="Stake (₹)"
            value={betAmount}
            onChange={(e) => setBetAmount(e.target.value)}
          />
          <button className="action-btn" onClick={placeBet} style={{ flex: 1.5 }}>
            Bet Roulette
          </button>
        </div>
      </div>

      {/* History */}
      <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>
        RECENT RESULTS
      </h3>

      <div className="frosted-card" style={{ padding: '12px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {history.map((h, i) => (
            <span
              key={i}
              className={`trend-dot ${h}`}
              style={{ width: '16px', height: '16px' }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
