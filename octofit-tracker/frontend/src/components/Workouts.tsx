import { useApiResource } from '../api/useApiResource.js';

type WorkoutSuggestion = { _id?: string; title: string; focus?: string; minutes?: number; difficulty?: string; reason?: string };
type WorkoutResponse = { suggestions: WorkoutSuggestion[] };

const userEmail = 'mona@example.com';

export default function Workouts() {
  const { data, error, loading } = useApiResource<WorkoutResponse>(`/api/workouts/suggestions/${encodeURIComponent(userEmail)}`);
  const suggestions = data?.suggestions ?? [];

  return <section className="card h-100"><div className="card-body">
    <h2 className="h4">Workout suggestions</h2>
    <p>Recommend workouts from activity patterns.</p>
    {loading ? <p role="status">Loading workout suggestions...</p> : error ? <p role="alert">{error}</p> : suggestions.length === 0 ? <p>No workout suggestions available.</p> : (
      <ul className="list-group list-group-flush">
        {suggestions.map((suggestion, index) => <li className="list-group-item px-0" key={suggestion._id ?? `${suggestion.title}-${index}`}>
          <strong>{suggestion.title}</strong>
          {suggestion.focus && <span> · {suggestion.focus}</span>}
          {suggestion.minutes && <span> · {suggestion.minutes} minutes</span>}
          {suggestion.difficulty && <span> · {suggestion.difficulty}</span>}
          {suggestion.reason && <p className="mb-0 mt-1 text-body-secondary">{suggestion.reason}</p>}
        </li>)}
      </ul>
    )}
  </div></section>;
}
