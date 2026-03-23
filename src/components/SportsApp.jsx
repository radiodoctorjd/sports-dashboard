import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const leagues = ["NHL", "MLB", "NFL", "NBA", "WNBA", "NCAAMB"];

export default function SportsApp() {
  const [games, setGames] = useState({ yesterday: [], today: [], tomorrow: [] });
  const [league, setLeague] = useState("NHL");
  const [teamFilter, setTeamFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);

  const getScoreboardUrl = (league, offsetDays = 0) => {
    const date = new Date();
    date.setHours(0,0,0,0);
    date.setDate(date.getDate() + offsetDays);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}${mm}${dd}`;

    return {
      NBA: `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${dateStr}`,
      WNBA: `https://site.api.espn.com/apis/site/v2/sports/basketball/wnba/scoreboard?dates=${dateStr}`,
      MLB: `https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard?dates=${dateStr}`,
      NHL: `https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard?dates=${dateStr}`,
      NCAAMB: `https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard?dates=${dateStr}`,
      NFL: `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=${dateStr}`,
    }[league];
  };

  const normalizeGame = (event) => {
    const comp = event.competitions[0];
    const home = comp.competitors.find(t => t.homeAway === "home");
    const away = comp.competitors.find(t => t.homeAway === "away");
    const homeScore = parseInt(home.score, 10);
    const awayScore = parseInt(away.score, 10);
    let score = null;
    if (['in', 'complete', 'post'].includes(comp.status.type.state) && !isNaN(homeScore) && !isNaN(awayScore)) {
      const homeFull = `${home.team.location} ${home.team.name}`;
      const awayFull = `${away.team.location} ${away.team.name}`;
      score = homeScore >= awayScore ? `${homeFull} ${homeScore}\n${awayFull} ${awayScore}` : `${awayFull} ${awayScore}\n${homeFull} ${homeScore}`;
    }

    const broadcast = (comp.broadcasts || []).map(b => b.names).join(", ").split(",").map(s=>s.trim()).join(", ") || null;

    return {
      homeFullName: `${home.team.location} ${home.team.name}`,
      awayFullName: `${away.team.location} ${away.team.name}`,
      homeLogo: home.team.logo,
      awayLogo: away.team.logo,
      homeAbbr: home.team.abbreviation,
      awayAbbr: away.team.abbreviation,
      score,
      status: comp.status.type.shortDetail || comp.status.type.description,
      broadcast,
      eventId: comp.id,
      date: new Date(event.date).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
      state: comp.status.type.state,
      startTime: new Date(event.date).getTime()
    };
  };

  // Initial fetch for all games (full data)
  useEffect(() => {
    const fetchFullGames = async () => {
      setLoading(true);
      try {
        const [yesterdayRes, todayRes, tomorrowRes] = await Promise.all([
          fetch(getScoreboardUrl(league, -1)),
          fetch(getScoreboardUrl(league, 0)),
          fetch(getScoreboardUrl(league, 1))
        ]);
        const [yesterdayData, todayData, tomorrowData] = await Promise.all([
          yesterdayRes.json(), todayRes.json(), tomorrowRes.json()
        ]);
        const sortGames = (list) => list.map(normalizeGame).sort((a, b) => (b.state==='in'?1:0) - (a.state==='in'?1:0) || a.startTime - b.startTime);
        setGames({
          yesterday: sortGames(yesterdayData.events || []),
          today: sortGames(todayData.events || []),
          tomorrow: sortGames(tomorrowData.events || [])
        });
      } catch(err) {
        console.error(err);
      }
      setLoading(false);
    };
    fetchFullGames();
  }, [league]);

  // Live updater: only update scores and status every 15s
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const todayRes = await fetch(getScoreboardUrl(league, 0));
        const todayData = await todayRes.json();
        const sortGames = (list) => list.map(normalizeGame).sort((a, b) => (b.state==='in'?1:0) - (a.state==='in'?1:0) || a.startTime - b.startTime);
        setGames(prev => ({
          ...prev,
          today: sortGames(todayData.events || [])
        }));
      } catch(err) {
        console.error(err);
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [league]);

  const renderGameCard = (g) => (
    <Card key={g.eventId} onClick={() => setSelectedGame(g)} className="cursor-pointer hover:shadow-lg transition-shadow duration-200">
      <CardContent className="p-4 space-y-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            {g.state === 'in' && (
              <span className="flex items-center gap-1 text-xs font-semibold text-red-500">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                </span>
                LIVE
              </span>
            )}
            <img src={g.awayLogo} alt={g.awayAbbr} className="w-6 h-6" />
            <span>{g.awayAbbr}</span>
            <span>@</span>
            <img src={g.homeLogo} alt={g.homeAbbr} className="w-6 h-6" />
            <span>{g.homeAbbr}</span>
          </div>
        </div>
        {g.date && <div className="text-xs text-gray-400">{g.date}</div>}
        {g.state === 'in' && <hr className="border-t border-gray-300 my-1" />}
        {g.score && <div className="whitespace-pre-line font-semibold">{g.score}</div>}
        {g.status && g.state !== 'pre' && <div className="text-xs text-gray-500">{g.status}</div>}
        {(g.broadcast && (g.state === 'in' || g.state === 'pre')) && <div className="text-xs text-gray-500">Watch on: {g.broadcast}</div>}
      </CardContent>
    </Card>
  );

  const renderGamesSection = (title, list) => (
    list.length > 0 && (
      <>
        <div className="text-center font-bold text-lg my-4">{title}</div>
        <div className="grid md:grid-cols-2 gap-4">
          {list.filter(g => {
            const filterText = teamFilter.toLowerCase();
            return (
              filterText === '' ||
              g.homeFullName.toLowerCase().includes(filterText) ||
              g.awayFullName.toLowerCase().includes(filterText) ||
              g.homeAbbr.toLowerCase().includes(filterText) ||
              g.awayAbbr.toLowerCase().includes(filterText)
            );
          }).map(renderGameCard)}
        </div>
      </>
    )
  );

  return (
    <div className={`${darkMode ? 'bg-gray-900 text-white' : 'bg-yellow-100 text-black'} min-h-screen p-6`}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Sports Dashboard</h1>
        <button onClick={() => setDarkMode(!darkMode)} className="border px-3 py-1 rounded">{darkMode ? 'Light' : 'Dark'}</button>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {leagues.map(l => (<button key={l} onClick={() => setLeague(l)} className={`px-3 py-1 rounded border ${league === l ? 'bg-blue-500 text-white' : ''}`}>{l}</button>))}
        <Input placeholder="Search team..." value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)} className="ml-2 flex-1" />
      </div>

      {loading && <p>Loading...</p>}

      {renderGamesSection("Today's Games", games.today)}
      {renderGamesSection("Tomorrow's Games", games.tomorrow)}
      {renderGamesSection("Yesterday's Games", games.yesterday)}

      {selectedGame && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white text-black p-6 rounded-xl w-96">
            {/* Modal content */}
            <button onClick={() => setSelectedGame(null)} className="mt-4 border px-3 py-1">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
