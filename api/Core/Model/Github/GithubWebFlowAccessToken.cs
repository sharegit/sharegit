using System;
using System.Collections.Generic;
using System.Text;

namespace Core.Model.Github
{
    public class GithubWebFlowAccessToken
    {
        public string AccessToken { get; set; }
        public long ExpiresIn { get; set; }
        public string RefreshToken { get; set; }
        public long RefreshTokenExpiresIn { get; set; }
    }
}
