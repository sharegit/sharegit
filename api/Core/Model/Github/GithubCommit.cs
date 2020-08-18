using System;
using System.Collections.Generic;
using System.Text;

namespace Core.Model.Github
{
    public class GithubCommit
    {
        public class CommitObject
        {
            public class AuthorObject
            {
                public string Name { get; set; }
                public string Date { get; set; }
            }
            public AuthorObject Author { get; set; }
            public string Message { get; set; }
        }
        public string Sha { get; set; }
        public CommitObject Commit { get; set; }
    }
}
