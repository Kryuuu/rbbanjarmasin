export default (req, res) => {
  res.json({
    hasId: !!process.env.GITHUB_CLIENT_ID,
    hasSecret: !!process.env.GITHUB_CLIENT_SECRET
  });
};
