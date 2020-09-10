namespace Core.APIModels
{
    public class SharedRepository
    {
        public int Id { get; set; }
        public string Owner { get; set; }
        public string Repo { get; set; }
        public string Provider { get; set; }
        public string Description { get; set; }
        public string Path { get; set; }
        public bool DownloadAllowed { get; set; }
        public Branch[] Branches { get; set; }
    }
}
