namespace Core.APIModels
{
    public class CreateToken
    {
        public class Repository
        {
            public string Owner { get; set; }
            public string Repo { get; set; }
            public Branch[] Branches { get; set; }
        }
        public string Stamp { get; set; }
        public Repository[] Repositories { get; set; }
    }
}
