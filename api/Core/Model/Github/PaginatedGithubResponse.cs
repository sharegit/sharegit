using Newtonsoft.Json;
using System;
using System.Collections.Generic;

namespace Core.Model.Github
{
    public class PaginatedGithubResponse<T>
    {
        public int TotalCount { get; set; }
        [NonSerialized]
        [JsonIgnore]
        public T[] Values = null;
        public virtual T[] Get() => Values;
    }
}
