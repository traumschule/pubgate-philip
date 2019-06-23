<script>
    export let active_tab;
	import TimeLine from "./TimeLine.svelte"
	import { writable } from 'svelte/store';

	const session = writable({});
	let username = '';
	let password = '';
	let errors = null;
	async function submit(event) {
		const response = await post(`auth/login`, { email, password });
		// TODO handle network errors
		errors = response.errors;
		if (response.user) {
			$session.user = response.user;
			goto('/');
		}
	}


</script>

{#if active_tab == 'profile'}
    {#if session.user }
        <TimeLine active_tab={active_tab} />
    {:else}
        <form on:submit|preventDefault={submit}>
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