import { useApiResource } from '../api/useApiResource.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };
type LeaderboardResponse = { leaderboard: LeaderboardEntry[] };

export default function Leaderboard() {
  const { data, error, loading } = useApiResource<LeaderboardResponse>('/api/leaderboard');
  const entries = data?.leaderboard ?? [];

  return <section className="card h-100"><div className="card-body">
    <h2 className="h4">Leaderboard</h2>
    <p>Compare team point totals.</p>
    {loading ? <p role="status">Loading leaderboard...</p> : error ? <p role="alert">{error}</p> : entries.length === 0 ? <p>No leaderboard rankings yet.</p> : (
      <ol className="list-group list-group-numbered list-group-flush">
        {entries.map((entry) => <li className="list-group-item px-0" key={`${entry.rank}-${entry.teamName}`}>
          <span className="ms-2">{entry.teamName}</span><strong className="float-end">{entry.totalPoints} points</strong>
        </li>)}
      </ol>
    )}
  </div></section>;
}
