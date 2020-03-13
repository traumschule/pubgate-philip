<script>
  import { routes, curRoute } from "./store";
  import { Navigation, Footer } from "./components";
  import Router from "./Router.svelte";

  export let name;

  let session = {};
  let pgi = pubgate_instance;

  // if (session.user) active_tab.set("inbox");
  // else active_tab.set(pgi ? "local" : "about");

  function selectTab(target) {
    const path = target.pathname;
    Array.prototype.forEach.call(
      target.parentNode.parentNode.children,
      (el, i) => {
        if (el.firstChild.href.split("/")[1] !== path) {
          el.firstChild.classList.remove("header-selected");
        }
      }
    );
    target.classList.add("header-selected");
  }

  const updateSession = e => {
    $: session = e.detail;
  };
</script>

<style>

</style>

<Navigation {routes} {curRoute} {selectTab} {session} {pgi} />
<Router {routes} {curRoute} {session} {updateSession} />
<Footer />
