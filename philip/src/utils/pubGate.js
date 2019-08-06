export const getHashTag = name => ({
  name,
  href: "",
  type: "Hashtag",
});

export const getCreateObject = (content, tag) => ({
  type: "Create",
  object: {
    type: "Note",
    attachment: [],
    tag,
    content,
  },
});
