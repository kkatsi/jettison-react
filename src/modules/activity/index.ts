// The only door (Chapter 2 §2). Two exports, and both exist for the app shell to
// register — which is exactly what the jettison test removes.

export { activityRoutes } from './routes';
export { registerActivityReactions } from './state/reactions';
