<script>
	import Page from "./Page.svelte";

	export let active_tab = 'local';
    export let pgi = pubgate_instance;

    function selectTab (event) {
        event.preventDefault();
        active_tab = this.href.split('#')[1];
        Array.prototype.forEach.call(this.parentNode.parentNode.children, (el, i) => {
            if (el.firstChild.href.split('#')[1] !== active_tab) {
                el.firstChild.classList.remove('header-selected')
            }
        });
        this.classList.add('header-selected');
    }

</script>

<style>
</style>

<header>
	<ul>
	    {#if pgi == true }
		<li ><a href="#local" class="header-selected" on:click="{selectTab}">Local Timeline</a></li>
		<li><a href="#federated" on:click="{selectTab}">Federated Timeline</a></li>
		{/if}
		<li><a href="#home" on:click="{selectTab}">Home</a></li>
		<li><a href="#about" on:click="{selectTab}">About</a></li>
		<li><a href="#dot-dot-dot" on:click="{selectTab}">...</a></li>
	</ul>
</header>

<div class="content">
    <Page active_tab={active_tab} />
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

