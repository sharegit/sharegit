using System.Collections.Generic;

namespace Core.APIModels
{
    public class SharedRepositories
    {
        public string Author { get; set; }
        public string AuthorWebsite { get; set; }
        public string AuthorBio { get; set; }
        public IEnumerable<SharedRepository> Repositories { get; set; }
    }
}
