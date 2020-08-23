using System;
using System.Collections.Generic;
using System.Text;

namespace ShareGithub.Models
{
    public class GithubConnectedService
    {
        public string Login { get; set; }
        public int GithubId { get; set; }
        public string EncodedAccessToken { get; set; }
        public string EncodedRefreshToken { get; set; }
        public long AccessTokenExp { get; set; }
        public long RefreshTokenExp { get; set; }
    }
}
