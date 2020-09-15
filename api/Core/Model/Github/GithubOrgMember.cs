namespace Core.Model.Github
{
    public class GithubOrgMember
    {
        public class OrganizationObject
        {
            public string Login { get; set; }
        }
        public string Role { get; set; }
        public OrganizationObject Organization { get; set; }
    }
}
