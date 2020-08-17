using System;
using System.Collections.Generic;
using System.Text;

namespace Core.APIModels
{
    public class CreateToken
    {
        public class Repository
        {
            public string Owner { get; set; }
            public string Repo { get; set; }
            public string Description { get; set; }
        }
        public string Stamp { get; set; }
        public Repository[] Repositories {get;set;}
    }
}
