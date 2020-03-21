<script>
  import { getCreateObject, getHashTag, getMention } from "../utils/pubGate";
  import { getUserId } from "../utils";

  export let reply = null;
  export let session;
  export let curRoute;

  let inProgress = false;
  let content = "";

  const hashTagMatcher = /(^|\W)(#[^#\s]+)/gi;
  const mentionMatcher = /(^|\W)@([^@\s]+)/gi;

  const wrapHashTagsWithLink = text =>
    text.match(hashTagMatcher)
      ? text.replace(hashTagMatcher, '$1<a href="" rel="tag">$2</a>')
      : text;
  const wrapMentions = text =>
    text.match(mentionMatcher)
      ? text.replace(
          mentionMatcher,
          "$1<span class='h-card'><a href='" +
            getUserId("$2") +
            "' class='u-url mention'>@<span>$2</span></a></span>"
        )
      : text;

  const getAllHashTags = text => text.match(hashTagMatcher) || [];
  const getAllMentions = text => text.match(mentionMatcher) || [];

  const wrapLinksWithTags = text =>
    text.replace(/(https?:\/\/([^\s]+))/gi, '<a href="$1">$2</a>');

  const publish = async ev => {
    ev.preventDefault();

    inProgress = true;
    let tags = getAllHashTags(content)
      .map(v => v.trim())
      .map(getHashTag);
    let mentions = getAllMentions(content)
      .map(m => m.trim())
      .map(m => getMention(m, getUserId(m)));

    const data = wrapMentions(wrapHashTagsWithLink(wrapLinksWithTags(content)));
    let ap_object = getCreateObject(data, tags.concat(mentions));
    ap_object.cc = mentions.map(m => m.href);

    if (reply) {
      ap_object.object.inReplyTo = reply.id;
      ap_object.cc = ap_object.cc.concat(reply.attributedTo);
    }

    try {
      const response = await fetch($session.user.outbox, {
        method: "POST",
        body: JSON.stringify(ap_object),
        headers: { Authorization: "Bearer " + $session.token },
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
    class="btn btn-sm pull-xs-right btn-info"
    disabled={!content || inProgress}>
    Publish
  </button>

</form>
