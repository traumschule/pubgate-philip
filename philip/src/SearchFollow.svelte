<script>
	export let session;
	import xhr from "./utils/xhr";
	import TimeLine from "./TimeLine.svelte";

	let username = '';
	let outbox_collection = null;
	let searched_profile = null;
    async function search(event) {
        $: outbox_collection = null;
        let pair = username.split("@");
        let profile_url = "https://" + pair[1] + "/@" + pair[0];
        let collection;
        if (pubgate_instance) {
            const profile = await fetch(base_url + "/proxy", {
                method: 'POST',
                body: JSON.stringify({url: profile_url})
            }).then(d => d.json());

            $: searched_profile = profile;
            const outbox = await fetch(base_url + "/proxy", {
                method: 'POST',
                body: JSON.stringify({url: profile.outbox})
            }).then(d => d.json());

            if (typeof outbox.first === "string") {
                collection = await fetch(base_url + "/proxy", {
                    method: 'POST',
                    body: JSON.stringify({url: outbox.first})
                }).then(d => d.json());
            } else {
                collection = outbox.first
            }
            $: outbox_collection = collection;


        } else {
            const profile = await fetch(profile_url, { headers: {
                "Accept": "application/activity+json"
            }}).then(d => d.json());

            if (profile.outbox) {
                $: outbox_collection = profile.outbox
            }
        }
    }

    async function follow(event) {
        if (pubgate_instance) {
            let ap_object = {
                "type": "Follow",
                "object": searched_profile.id ,
            };
            const response = await fetch(session.user.outbox, {
                method: 'POST',
                body: JSON.stringify(ap_object),
                headers : {'Authorization': "Bearer " + session.token}
            }).then(d => d.json());
        }
    }

</script>

<br>
<form on:submit|preventDefault={search}>
    <fieldset class="form-group">
        <input class="form-control form-control-lg" type="text" placeholder="Search format: username@domain" bind:value={username}>
    </fieldset>
    <button class="btn btn-sm pull-xs-right btn-info" type="submit" disabled='{!username}'>
        Search
    </button>
</form>
<br><br>

{#if outbox_collection}
    <button class="btn btn-sm pull-xs-right btn-info" on:click={follow}>Follow {username}</button>
    <TimeLine active_tab="search"
              session={session}
              outbox_collection={outbox_collection}/>
{/if}
