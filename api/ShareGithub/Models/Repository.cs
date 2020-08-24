﻿namespace ShareGithub.Models
{
    public class Repository : DbItemBase
    {
        public int RepoId { get; set; }
        public string Owner { get; set; }
        public string Repo { get; set; }
        public string Provider { get; set; }
        public string[] Branches { get; set; }
    }
}
