import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function httpError(message: string, status = 400) {
  return Object.assign(new Error(message), { status });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!isRecord(input)) throw httpError('Activity details are required');
  const { userId, teamId, type, minutes } = input;
  if (typeof userId !== 'string' || !mongoose.isValidObjectId(userId)) throw httpError('A valid userId is required');
  if (typeof teamId !== 'string' || !mongoose.isValidObjectId(teamId)) throw httpError('A valid teamId is required');
  if (typeof type !== 'string' || !type.trim()) throw httpError('An activity type is required');
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) throw httpError('Minutes must be a positive number');

  const [user, team] = await Promise.all([
    User.findById(userId).select('_id').lean(),
    Team.findById(teamId).select('_id').lean(),
  ]);
  if (!user || !team) throw httpError('The referenced user or team does not exist', 404);

  return Activity.create({ user: user._id, team: team._id, type: type.trim(), minutes, points: minutes, occurredAt: new Date() });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!isRecord(input)) throw httpError('Team details are required');
  const { name, mascot } = input;
  if (typeof name !== 'string' || !name.trim()) throw httpError('A team name is required');
  if (typeof mascot !== 'string' || !mascot.trim()) throw httpError('A team mascot is required');

  const rawMembers = input.members ?? [];
  if (!Array.isArray(rawMembers) || rawMembers.some((member) => typeof member !== 'string' || !mongoose.isValidObjectId(member))) {
    throw httpError('Team members must be valid user IDs');
  }
  const memberIds = [...new Set(rawMembers as string[])];
  const users = memberIds.length
    ? await User.find({ _id: { $in: memberIds } }).select('_id team').lean()
    : [];
  if (users.length !== memberIds.length) throw httpError('One or more team members do not exist', 404);

  const team = await Team.create({ name: name.trim(), mascot: mascot.trim(), members: users.map((user) => user._id) });
  if (users.length) {
    const previousTeamIds = [...new Set(users
      .map((user) => user.team?.toString())
      .filter((teamId): teamId is string => Boolean(teamId) && teamId !== team._id.toString()))];
    await Promise.all(previousTeamIds.map((teamId) => Team.updateOne(
      { _id: teamId },
      { $pull: { members: { $in: users.map((user) => user._id) } } },
    )));
    await User.updateMany({ _id: { $in: memberIds } }, { $set: { team: team._id } });
  }
  return team;
}

export async function getLeaderboard() {
  const teams = await Team.aggregate<{ teamName: string; totalPoints: number }>([
    {
      $lookup: {
        from: Activity.collection.name,
        localField: '_id',
        foreignField: 'team',
        as: 'activities',
      },
    },
    { $project: { _id: 0, teamName: '$name', totalPoints: { $sum: '$activities.points' } } },
    { $sort: { totalPoints: -1, teamName: 1 } },
  ]);
  return teams.map((team, index) => ({ ...team, rank: index + 1 }));
}

function focusForActivity(type: string) {
  const normalizedType = type.trim().toLowerCase();
  if (['run', 'running', 'cycle', 'cycling', 'walk', 'walking', 'swim', 'swimming', 'hike'].includes(normalizedType)) return 'endurance';
  if (['strength', 'weightlifting', 'weights'].includes(normalizedType)) return 'strength';
  if (['yoga', 'stretching', 'mobility'].includes(normalizedType)) return 'mobility';
  return normalizedType;
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) throw httpError('No user matches that email address', 404);

  let focus = user.fitnessGoal;
  let reason = `Recommended to support your ${focus} fitness goal.`;
  let workouts = await Workout.find({ focus }).sort({ title: 1 }).limit(3).lean();

  if (!workouts.length) {
    const recentActivities = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(5).select('type').lean();
    if (!recentActivities.length) return [];
    focus = focusForActivity(recentActivities[0].type);
    reason = `Based on your recent ${recentActivities[0].type} activity.`;
    workouts = await Workout.find({ focus }).sort({ title: 1 }).limit(3).lean();
  }

  return workouts.map((workout) => ({ ...workout, reason }));
}

export { User };
