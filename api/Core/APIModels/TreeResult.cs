using System;
using System.Collections.Generic;
using System.Text;

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
            public string LastModifyCommitMessage { get; set; }
        }
        public TreeNode[] TreeNodes { get; set; }
        public string Sha { get; set; }
    }
}
