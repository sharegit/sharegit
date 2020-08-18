using System;
using System.Collections.Generic;
using System.Text;

namespace Core.Model.Github
{
    public class GithubUserInfo
    {
        public string Login { get; set; }
        public int Id { get; set; }
        public string Name { get; set; }
        public string Email { get; set; }
        public string Bio { get; set; }
    }
}
