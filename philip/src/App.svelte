<script>
  import Tab from "./Tab.svelte";
  let session = {};
  let active_tab;
  let pgi = pubgate_instance;

  if (pgi) {
    active_tab = "local";
  } else {
    active_tab = "about";
  }

  function selectTab(event) {
    event.preventDefault();
    active_tab = this.href.split("#")[1];
    Array.prototype.forEach.call(
      this.parentNode.parentNode.children,
      (el, i) => {
        if (el.firstChild.href.split("#")[1] !== active_tab) {
          el.firstChild.classList.remove("header-selected");
        }
      }
    );
    this.classList.add("header-selected");
  }

  const updateSession = e => {
    $: session = e.detail;
  };
</script>

<style>

</style>

<header>
  <ul>
    {#if pgi == true}
      <li>
        <a href="#local" class="header-selected" on:click={selectTab}>
          Local Timeline
        </a>
      </li>
      <li>
        <a href="#federated" on:click={selectTab}>Federated Timeline</a>
      </li>
    {/if}
    {#if session.user}
      <li>
        <a href="#inbox" on:click={selectTab}>Inbox</a>
      </li>
      <li>
        <a href="#create" on:click={selectTab}>Create</a>
      </li>
      <li>
        <a href="#search" on:click={selectTab}>Search/Follow</a>
      </li>
    {/if}
    <li>
      <a href="#profile" on:click={selectTab}>
        {#if session.user}Profile{:else}Login{/if}
      </a>
    </li>
    <li>
      <a href="#about" on:click={selectTab}>About</a>
    </li>
  </ul>
</header>

<div class="content">
  <Tab {active_tab} {session} on:updatesession={updateSession} />
</div>

<hr class="separator" />
<footer class="content">
  <div class="left-column">
    <h3>PubGate-Philip</h3>
  </div>
</footer>
