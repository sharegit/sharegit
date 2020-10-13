namespace Core.APIModels
{
    public class TreeResult
    {
        public class TreeNode
        {
            public string Path { get; set; }
            public string Type { get; set; }
            public string Sha { get; set; }
            public string Author { get; set; }
            public string LastModifyDate { get; set; }
            /// <summary> Size in bytes </summary>
            public int Size { get; set; }
            public string LastModifyCommitMessage { get; set; }
        }
        public TreeNode[] TreeNodes { get; set; }
        public string Sha { get; set; }
    }
}
