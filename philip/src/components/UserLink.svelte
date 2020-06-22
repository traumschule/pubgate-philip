<script>
  import { fetchJSON } from "../utils";

  const defaultIcon = "favicon.png";

  const getName = id => {
    const name = id.match(/@([^\/]+)$/);
    return name ? name[1] : id;
  };

  const getAvatar = async id => {
    const user = await fetchJSON(id);
    console.log("icon", user.icon, defaultIcon);
    return user.icon.url !== "" ? user.icon.url : defaultIcon;
  };

  export let id;
  const name = getName(id);
  const avatar = getAvatar(id);
</script>

<style>
  div {
    float: left;
    text-align: center;
    background-color: #fff;
    padding: 20px;
  }
  img {
    display: block;
    height: 50px;
  }
</style>

<div>
  <a href={id}>{name}</a>
  {#await avatar then url}
    <img src={url} alt="avatar" />
  {/await}
</div>
