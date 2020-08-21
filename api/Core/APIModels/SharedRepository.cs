namespace Core.APIModels
{
    public class SharedRepository
    {
        public string Owner { get; set; }
        public string Repo { get; set; }
        public string Provider { get; set; }
        public string Description { get; set; }
        public Branch[] Branches { get; set; }
    }
}
