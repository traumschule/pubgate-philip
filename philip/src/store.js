import {
  TimeLine,
  Publish,
  Search,
  Profile,
  About,
  User,
  Object,
  Error,
} from "./components";
import { writable } from "svelte/store";

const curRoute = writable(window.location.pathname);

const routes = {
  "/local": { name: "Local Timeline", component: TimeLine },
  "/federated": { name: "Federated Timeline", component: TimeLine },
  "/create": { name: "Create", component: Publish },
  "/search": { name: "Search", component: Search },
  "/inbox": { name: "Inbox", component: TimeLine },
  "/profile": { name: "Profile", component: Profile },
  "/about": { name: "About", component: About },
  user: { component: User },
  object: { component: Object },
  error: { component: Error },
};

const session = writable({});

export { curRoute, routes, session };
