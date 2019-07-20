<script>
    import { createEventDispatcher } from "svelte";
    const dispatch = createEventDispatcher();

    export let active_tab;
    export let session;
    import TimeLine from "./TimeLine.svelte";
    import Publish from "./Publish.svelte";

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

    let description = '';
    let avatar = '';
    let invite = '';

    async function register(event) {
        let user_data = {
            "username": username,
            "password": password,
            "invite": invite,
            "profile": {
                "type": "Person",
                "name": username,
                "summary": description,
                "icon": {
                    "type": "Image",
                    "mediaType": "image/jpeg",
                    "url": avatar
                }
            }
        };

        const create_user = await fetch(base_url + "/user", {
            method: 'POST',
            body: JSON.stringify(user_data)
        }).then(d => d.json());

        if (create_user.profile) {
            await login({});
        }
    }

</script>

{#if active_tab == 'profile'}
    {#if session.user }
         <button class="btn btn-sm" on:click={logout}>Logout</button>
        <TimeLine active_tab={active_tab}
                  session={session}/>
    {:else}
        Sign-in ( ActivityPub compatible, OAuth2 password grant )
        <br>
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
        <br><br>
        or register ( PubGate only )
        <br>
        <form on:submit|preventDefault={register}>
            <fieldset class="form-group">
                <input class="form-control form-control-lg" type="username" placeholder="Username" bind:value={username}>
            </fieldset>
            <fieldset class="form-group">
                <input class="form-control form-control-lg" type="password" placeholder="Password" bind:value={password}>
            </fieldset>
            <fieldset class="form-group">
                <textarea class="form-control" rows="8" placeholder="Profile Description" bind:value={description}/>
            </fieldset>
            <fieldset class="form-group">
                <input class="form-control form-control-lg" type="username" placeholder="Avatar URL" bind:value={avatar}>
            </fieldset>
            <fieldset class="form-group">
                <input class="form-control form-control-lg" type="username" placeholder="Invite code" bind:value={invite}>
            </fieldset>

            <button class="btn btn-lg btn-primary pull-xs-right" type="submit" disabled='{!username || !password}'>
                Register
            </button>
        </form>
    {/if}
{:else if active_tab == 'create'}
        <Publish session={session}/>
{:else}
        <TimeLine active_tab={active_tab}
                  session={session}/>
{/if}
