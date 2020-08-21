namespace Core.APIModels
{
    public class JWTResponse
    {
        public string Token { get; set; }
        public long Exp { get; set; }
    }
}
