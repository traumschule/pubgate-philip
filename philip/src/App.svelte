<script>
	import Tab from "./Tab.svelte";

	import { writable } from 'svelte/store';

	let session = {};

	let active_tab = 'local';
    let pgi = pubgate_instance;

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

    const updateSession = e => {
        $: session = e.detail;
    };

</script>

<style>
</style>

<header>
	<ul>
	    {#if pgi == true }
		<li><a href="#local" class="header-selected" on:click="{selectTab}">Local Timeline</a></li>
		<li><a href="#federated" on:click="{selectTab}">Federated Timeline</a></li>
		{/if}
		{#if session.user }
		<li><a href="#inbox" on:click="{selectTab}">Inbox</a></li>
		<li><a href="#create" on:click="{selectTab}">Create</a></li>
		{/if}
		<li><a href="#profile" on:click="{selectTab}">{#if session.user }Profile{:else}Login{/if}</a></li>
		<li><a href="#about" on:click="{selectTab}">About</a></li>
	</ul>
</header>

<div class="content">
    <Tab active_tab={active_tab}
         session={session}
         on:updatesession={updateSession}/>
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

