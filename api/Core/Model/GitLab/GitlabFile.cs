namespace Core.Model.GitLab
{
    public class GitlabFile
    {
        public string FileName { get; set; }
        public string FilePath { get; set; }
        public int Size { get; set; }
        public string Encoding { get; set; }
        public string Content { get; set; }
    }
}
