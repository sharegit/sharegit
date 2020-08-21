using System;
using System.Collections.Generic;
using System.Text;

namespace Core.APIModels
{
    public class SharedRepositories
    {
        public string Author { get; set; }
        public IEnumerable<SharedRepository> Repositories { get; set; }
    }
}
