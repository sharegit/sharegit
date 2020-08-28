using System.Collections.Generic;

namespace Core.Model
{
    public class APIResponse<T>
    {
        public string RAW { get; set; }
        public string Err { get; set; }
        public T Value { get; set; }
        public int RemainingLimit { get; set; }
        public Dictionary<string, string> Headers { get; set; }
    }
}
