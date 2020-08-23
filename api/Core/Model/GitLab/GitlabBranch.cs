namespace Core.Model.GitLab
{
    public class GitlabBranch
    {
        public class CommitObject
        {
            public string Id { get; set; }
        }
        public string Name { get; set; }
        public CommitObject Commit { get; set; }
    }
}
