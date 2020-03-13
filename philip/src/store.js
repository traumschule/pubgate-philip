import { TimeLine, Publish, Search, Profile, About } from "./components";
import { writable } from "svelte/store";

const curRoute = writable("/local");

const routes = {
  "/local": { name: "Local Timeline", component: TimeLine },
  "/federated": { name: "Federated Timeline", component: TimeLine },
  "/create": { name: "Create", component: Publish },
  "/search": { name: "Search", component: Search },
  "/inbox": { name: "Inbox", component: TimeLine },
  "/profile": {
    name: "Profile",
    //name: () => (session.user ? "Profile" : "Login"),
    component: Profile
  },
  "/about": { name: "About", component: About }
};

export { curRoute, routes };
