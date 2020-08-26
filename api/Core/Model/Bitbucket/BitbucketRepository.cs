namespace Core.Model.Bitbucket
{
    public class BitbucketRepository
    {
        public class OwnerObject
        {
            public string NickName { get; set; }
        }
        public class WorkspaceObject
        {
            public string Slug { get; set; }
        }
        public string Slug { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public string UUID { get; set; }
        public OwnerObject Owner { get; set; }
        public WorkspaceObject Workspace { get; set; }
    }
}
