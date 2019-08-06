<script>
  import { getCreateObject, getHashTag } from "./utils/pubGate";

  export let reply = null;
  export let session;

  let inProgress = false;
  let content = "";

  const hashTagMatcher = /(^|\W)(#[a-z\d][\w-]*)/gi;

  const wrapHashTagsWithLink = text =>
    text.match(hashTagMatcher)
      ? text.replace(hashTagMatcher, '$1<a href="" rel="tag">$2</a>')
      : text;

  const getAllHashTags = text => text.match(hashTagMatcher) || [];

  const publish = async ev => {
    ev.preventDefault();

    inProgress = true;
    let tags = getAllHashTags(content)
      .map(v => v.trim())
      .map(getHashTag);

    const data = wrapHashTagsWithLink(content);

    let ap_object = getCreateObject(data, tags);

    if (reply) {
      ap_object.object.inReplyTo = reply.id;
      ap_object.cc = [reply.attributedTo];
    }

    try {
      const response = await fetch(session.user.outbox, {
        method: "POST",
        body: JSON.stringify(ap_object),
        headers: { Authorization: "Bearer " + session.token },
      });
      const data = await response.json();
    } catch (e) {
      console.log(e);
    }

    inProgress = false;
    content = "";
  };
</script>

<style>
  textarea {
    width: 100%;
  }
</style>

<form on:submit={publish}>

  <fieldset class="form-group">
    <textarea
      class="form-control"
      placeholder="Write your text here"
      bind:value={content} />
  </fieldset>

  <button
    class="btn btn-lg pull-xs-right btn-primary"
    disabled={!content || inProgress}>
    Publish
  </button>

</form>
