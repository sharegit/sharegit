namespace Core.Model.Github
{
    public class GithubTree
    {
        public class Node
        {
            public string Path { get; set; }
            public string Type { get; set; }
            public string Sha { get; set; }
        }
        public string Sha { get; set; }
        public Node[] Tree { get; set; }
    }
}
