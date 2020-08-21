namespace Core.Model.Github
{
    public class GithubRepository
    {
        public class OwnerObject
        {
            public string Login { get; set; }
        }
        public int Id { get; set; }
        public string Name { get; set; }
        public OwnerObject Owner { get; set; }
        public string Description { get; set; }
    }
}
