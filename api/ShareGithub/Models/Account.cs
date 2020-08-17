﻿using System.Collections.Generic;

namespace ShareGithub.Models
{
    public class Account : DbItemBase
    {
        public int GithubId { get; set; }
        public string Name { get; set; }
        public string Login { get; set; }
        public string AccessToken { get; set; }
        public List<SharedToken> SharedTokens { get; set; }
    }
}