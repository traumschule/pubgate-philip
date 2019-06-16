<script>
	import TimeLine from "./TimeLine.svelte";

	const fetchTimeline = (isLocal, path) => isLocal
	?  fetch(base_url + path).then(d => d.json()).then(d => d.first).then(d => d.orderedItems) : [];
    export let localTimeline = fetchTimeline(pubgate_instance, "/timeline/local?cached=1");
    export let federatedTimeline = fetchTimeline(pubgate_instance, "/timeline/federated?cached=1");
    export let pgi = pubgate_instance;
</script>

<style>
</style>

<header>
	<ul>
	    {#if pgi == true }
		<li><a href="/local">Local Timeline</a></li>
		<li><a href="/fed">Federated Timeline</a></li>
		{/if}
		<li><a href="/home">Home</a></li>
		<li><a href="/about">About</a></li>
		<li><a href="/dot-dot-dot">...</a></li>
	</ul>
</header>

<div id="local" class="hidden content">
    <TimeLine posts={localTimeline} />
</div>

<div id="fed" class="hidden content">
    <TimeLine posts={federatedTimeline} />
</div>

<div id="home" class="hidden content">
</div>

<div id="about" class="hidden content">
	<span class="about-greeting">Hi!</span>
	<p>DESCRIPTION</p>
</div>

<div id="dot-dot-dot" class="hidden content">
</div>

<hr class="separator" />
<footer class="content">
    <div class="left-column">
        <h2>PubGate-Philip</h2>
        <p>Gotta<br>go<br>Fast</p>
    </div>
    <div class="right-column">
        <h2>Contact</h2>
        <p></p>
    </div>
</footer>

