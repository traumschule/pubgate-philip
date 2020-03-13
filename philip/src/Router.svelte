<script>
  import { onDestroy } from "svelte";

  export let routes;
  export let curRoute;

  export let updateSession;
  export let session;

  let component;
  const unsubscribe = curRoute.subscribe(value => {
    console.log("route", $curRoute);
    component = routes[$curRoute].component;
  });
  onDestroy(unsubscribe);
</script>

<style>

</style>

<div class="content">
  <svelte:component
    this={component}
    {curRoute}
    {session}
    on:updatesession={updateSession} />
</div>
