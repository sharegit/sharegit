namespace Core.Model.GitLab
{
    public class GitlabProject
    {
        public class NameSpaceObject
        {
            public string Path { get; set; }
        }
        public int Id { get; set; }
        public string Description { get; set; }
        public string Path { get; set; }
        public NameSpaceObject Namespace { get; set; }
    }
}
