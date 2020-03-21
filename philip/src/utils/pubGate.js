export const getHashTag = name => ({ name, href: "", type: "Hashtag" });

export const getMention = (name, href) => ({ name, href, type: "Mention" });

export const getCreateObject = (content, tag) => ({
  type: "Create",
  object: {
    type: "Note",
    attachment: [],
    tag,
    content,
  },
});
