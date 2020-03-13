<script>
  import TimeLine from './TimeLine.svelte';

  import { xhr } from '../utils';
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  export let curRoute;
  export let session;

  let username = '';
  let password = '';
  let description = '';
  let avatar = '';
  let invite = '';

  async function login(event) {
    const profile = await xhr(base_url + '/@' + username).catch(error => {
      console.log(error);
    });

    const token = await xhr(profile.endpoints.oauthTokenEndpoint, {
      method: 'POST',
      body: JSON.stringify({ username: username, password: password }),
    });

    if (token.access_token) {
      $: session.user = profile;
      $: session.token = token.access_token;
    }
    dispatch('updatesession', session);
  }

  async function logout(event) {
    $: session = {};
    dispatch('updatesession', session);
  }

  async function register(event) {
    let user_data = {
      username: username,
      password: password,
      invite: invite,
      profile: {
        type: 'Person',
        name: username,
        summary: description,
        icon: {
          type: 'Image',
          mediaType: 'image/jpeg',
          url: avatar,
        },
      },
    };

    const create_user = await fetch(base_url + '/user', {
      method: 'POST',
      body: JSON.stringify(user_data),
    }).then(d => d.json());

    if (create_user.profile) {
      await login({});
    }
  }
</script>

{#if session.user}
  <button class="btn btn-sm pull-xs-right btn-info" on:click={logout}>
    Logout
  </button>
  <TimeLine {curRoute} {session} />
{:else}
  <div class="form-group">
    Sign-in ( ActivityPub compatible, OAuth2 password grant )
  </div>

  <form on:submit|preventDefault={login}>
    <fieldset class="form-group">
      <input
        class="form-control form-control-lg"
        type="username"
        placeholder="Username"
        bind:value={username} />
    </fieldset>
    <fieldset class="form-group">
      <input
        class="form-control form-control-lg"
        type="password"
        placeholder="Password"
        bind:value={password} />
    </fieldset>
    <button
      class="btn btn-sm pull-xs-right btn-info"
      type="submit"
      disabled={!username || !password}>
      Sign in
    </button>
  </form>
  <br />
  <br />
  or register ( PubGate only )
  <br />
  <form on:submit|preventDefault={register}>
    <fieldset class="form-group">
      <input
        class="form-control form-control-lg"
        type="text"
        placeholder="Username"
        bind:value={username} />
    </fieldset>
    <fieldset class="form-group">
      <input
        class="form-control form-control-lg"
        type="password"
        placeholder="Password"
        bind:value={password} />
    </fieldset>
    <fieldset class="form-group">
      <textarea
        class="form-control"
        rows="8"
        placeholder="Profile Description"
        bind:value={description} />
    </fieldset>
    <fieldset class="form-group">
      <input
        class="form-control form-control-lg"
        type="text"
        placeholder="Avatar URL"
        bind:value={avatar} />
    </fieldset>
    <fieldset class="form-group">
      <input
        class="form-control form-control-lg"
        type="text"
        placeholder="Invite code"
        bind:value={invite} />
    </fieldset>

    <button
      class="btn btn-sm pull-xs-right btn-info"
      type="submit"
      disabled={!username || !password}>
      Register
    </button>
  </form>
{/if}
