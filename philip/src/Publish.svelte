<script>
    export let reply = null;
    export let session;

    let inProgress = false;
    let content = '';
    async function publish(event) {
		inProgress = true;
        let tags = [];
		let matches = content.match(/(^|\W)(#[a-z\d][\w-]*)/ig);
		if (matches) {
		    content = content.replace(/(^|\W)(#[a-z\d][\w-]*)/ig, '$1<a href="" rel="tag">$2</a>');
		    tags = matches.map(v => ({
                       "href": "",
                       "name": v.trim(),
                       "type": "Hashtag"
                   } ))
		}
		let ap_object = {
            "type": "Create",
            "object": {
                "type": "Note",
                "content": content,
                "attachment": [],
                "tag": tags,
            }
        };
		if (reply){
		    ap_object.object.inReplyTo = reply.id;
		    ap_object.cc = [reply.attributedTo];
		}

        const response = await fetch(session.user.outbox, {
            method: 'POST',
            body: JSON.stringify(ap_object),
            headers : {'Authorization': "Bearer " + session.token}
        }).then(d => d.json());
		inProgress = false;
		content = ''
	}

</script>


<form>
    <fieldset>

        <fieldset class="form-group">
            <textarea class="form-control" rows="8" placeholder="Write your text here" bind:value={content}/>
        </fieldset>

        <button class="btn btn-lg pull-xs-right btn-primary" type="button" disabled={!content||inProgress} on:click={publish}>
            Publish
        </button>
    </fieldset>
</form>