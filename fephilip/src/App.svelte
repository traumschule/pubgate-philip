<script>
	export let posts;
	import TimeLine from "./TimeLine.svelte"

    export let local_timeline = fetch(base_url + "/timeline/local").then(d => d.json());
	export let federated_timeline = fetch(base_url + "/timeline/federated").then(d => d.json());
</script>

<style>
</style>

<svg class="hidden">
    <symbol id="warning">
        <path fill-rule="evenodd" d="M8.893 1.5c-.183-.31-.52-.5-.887-.5s-.703.19-.886.5L.138 13.499a.98.98 0 0 0 0 1.001c.193.31.53.501.886.501h13.964c.367 0 .704-.19.877-.5a1.03 1.03 0 0 0 .01-1.002L8.893 1.5zm.133 11.497H6.987v-2.003h2.039v2.003zm0-3.004H6.987V5.987h2.039v4.006z"></path>
    </symbol>
</svg>
<header>
	<ul>
		<li><a href="/local">Local Timeline</a></li>
		<li><a href="/fed">Federated Timeline</a></li>
		<li><a href="/home">Home</a></li>
		<li><a href="/about">About</a></li>
		<li><a href="/dot-dot-dot">...</a></li>
	</ul>
</header>
<div id="local" class="hidden content">
    <TimeLine posts={local_timeline} />
</div>

<div id="fed" class="hidden content">
    <TimeLine posts={posts} />
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

