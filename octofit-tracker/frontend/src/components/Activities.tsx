import { useApiResource } from '../api/useApiResource.js';

type Activity = { _id?: string; type: string; minutes: number; points: number; occurredAt?: string };
type ActivityResponse = { activities: Activity[] };

export default function Activities() {
  const { data, error, loading } = useApiResource<ActivityResponse>('/api/activities');
  const activities = data?.activities ?? [];

  return <section className="card h-100"><div className="card-body">
    <h2 className="h4">Activities</h2>
    <p>Track student activity minutes and points.</p>
    {loading ? <p role="status">Loading activities...</p> : error ? <p role="alert">{error}</p> : activities.length === 0 ? <p>No activities yet.</p> : (
      <ul className="list-group list-group-flush">
        {activities.map((activity, index) => <li className="list-group-item px-0" key={activity._id ?? `${activity.type}-${index}`}>
          <strong>{activity.type}</strong>: {activity.minutes} minutes, {activity.points} points
          {activity.occurredAt && <span className="text-body-secondary"> {' '}({new Date(activity.occurredAt).toLocaleDateString()})</span>}
        </li>)}
      </ul>
    )}
  </div></section>;
}
