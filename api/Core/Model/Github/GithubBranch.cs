namespace Core.Model.Github
{
    public class GithubBranch
    {
        public class CommitShort
        {
            public string Sha { get; set; }
        }
        public string Name { get; set; }
        public CommitShort Commit { get; set; }
    }
}
