<script>
    import { createEventDispatcher } from "svelte";
    const dispatch = createEventDispatcher();

    export let active_tab;
    export let session;
	import TimeLine from "./TimeLine.svelte"

	let username = '';
	let password = '';
	async function login(event) {
        const profile = await fetch(base_url + "/@" + username, { headers: {
            "Accept": "application/activity+json"
        }}).then(d => d.json());

        const token = await fetch(profile.endpoints.oauthTokenEndpoint, {
            method: 'POST',
            body: JSON.stringify({username: username, password:password})
        }).then(d => d.json());

        console.log(token.access_token);
		if (token.access_token) {
			$: session.user = profile;
			$: session.token = token.access_token;
		}
		dispatch("updatesession", session);
	}

	async function logout(event) {
	    $: session = {};
	    dispatch("updatesession", session);
	}


</script>

{#if active_tab == 'profile'}
    {#if session.user }
         <button class="btn btn-sm" on:click={logout}>Logout</button>
         <TimeLine active_tab={active_tab} />
    {:else}
        <form on:submit|preventDefault={login}>
            <fieldset class="form-group">
                <input class="form-control form-control-lg" type="username" placeholder="Username" bind:value={username}>
            </fieldset>
            <fieldset class="form-group">
                <input class="form-control form-control-lg" type="password" placeholder="Password" bind:value={password}>
            </fieldset>
            <button class="btn btn-lg btn-primary pull-xs-right" type="submit" disabled='{!username || !password}'>
                Sign in
            </button>
        </form>
    {/if}


{:else}
        <TimeLine active_tab={active_tab} />
{/if}