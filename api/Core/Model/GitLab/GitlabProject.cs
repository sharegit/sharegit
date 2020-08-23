namespace Core.Model.GitLab
{
    public class GitlabProject
    {
        public class OwnerObject
        {
            public string Name { get; set; }
        }
        public int Id { get; set; }
        public string Description { get; set; }
        public string Name { get; set; }
        public string PathWithNamespace { get; set; }
        public OwnerObject Owner { get; set; }
    }
}
