// src/components/SportsApp.jsx
import React, { useEffect, useState } from 'react';

const leagues = [
  { name: 'NHL', logo: 'https://upload.wikimedia.org/wikipedia/en/3/3a/NHL_Shield.svg' },
  { name: 'MLB', logo: 'https://upload.wikimedia.org/wikipedia/en/a/a6/MLB_logo.svg' },
  { name: 'NFL', logo: 'https://upload.wikimedia.org/wikipedia/en/a/a2/NFL_logo.svg' },
  { name: 'NBA', logo: 'https://upload.wikimedia.org/wikipedia/commons/0/03/National_Basketball_Association_logo.svg' },
  { name: 'WNBA', logo: 'https://upload.wikimedia.org/wikipedia/en/0/03/WNBA_logo.svg' },
  { name: 'NCAAMB', logo: 'https://upload.wikimedia.org/wikipedia/commons/1/10/NCAA_logo.svg' }
];

export default function SportsApp() {
  const [games, setGames] = useState({ yesterday: [], today: [], tomorrow: [] });
  const [league, setLeague] = useState('NHL');
  const [teamFilter, setTeamFilter] = useState('');
  const [selectedGame, setSelectedGame] = useState(null);

  const fetchGames = () => {
    // For demo purposes, static data. Replace with API fetch calls if desired.
    const sampleGame = {
      home: 'Team A',
      away: 'Team B',
      score: 'Team A 3\nTeam B 2',
      status: 'Final',
      broadcast: 'ESPN',
      state: 'post'
    };
    setGames({ yesterday: [sampleGame], today: [sampleGame], tomorrow: [sampleGame] });
  };

  useEffect(() => { fetchGames(); }, [league]);

  const renderGameCard = (g) => (
    <div key={g.home + g.away} className="game-card" onClick={() => setSelectedGame(g)}>
      <div className="game-info">
        {g.state === 'in' && <span className="live-badge"><span className="ping"></span> LIVE</span>}
        {g.away} @ {g.home}
      </div>
      {g.score && <div className="score">{g.score}</div>}
      {g.status && g.state !== 'pre' && <div className="status">{g.status}</div>}
      {g.broadcast && (g.state === 'in' || g.state === 'pre') && <div className="broadcast">Watch on: {g.broadcast}</div>}
    </div>
  );

  const renderGamesSection = (title, list) => (
    list.length > 0 && (
      <div className="section">
        <div className="section-title">{title}</div>
        {list.filter(g => {
          const filterText = teamFilter.toLowerCase();
          return filterText === '' || g.home.toLowerCase().includes(filterText) || g.away.toLowerCase().includes(filterText);
        }).map(renderGameCard)}
      </div>
    )
  );

  return (
    <div className="container">
      <div className="tabs">
        {leagues.map(l => (
          <button key={l.name} className={`tab${l.name === league ? ' active' : ''}`} onClick={() => setLeague(l.name)}>
            <img src={l.logo} width="16" height="16" alt={l.name} /> {l.name}
          </button>
        ))}
      </div>
      <input type="text" className="search-input" placeholder="Search team..." value={teamFilter} onChange={e => setTeamFilter(e.target.value)} />

      {renderGamesSection("Today's Games", games.today)}
      {renderGamesSection("Tomorrow's Games", games.tomorrow)}
      {renderGamesSection("Yesterday's Games", games.yesterday)}

      {selectedGame && (
        <div className="modal" onClick={() => setSelectedGame(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>{selectedGame.home} vs {selectedGame.away}</h3>
            {selectedGame.score && <div className="score">{selectedGame.score}</div>}
            {selectedGame.status && <div className="status">{selectedGame.status}</div>}
            {selectedGame.broadcast && <div className="broadcast">Watch on: {selectedGame.broadcast}</div>}
            <button className="close-btn" onClick={() => setSelectedGame(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}