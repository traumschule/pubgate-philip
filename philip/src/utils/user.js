export const getUserId = name => {
  // TODO implement webFinger (#26)
  const id = `${base_url}/@${name}`; // FollowYourNose
  return id;
};
