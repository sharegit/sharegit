using System.Threading.Tasks;

namespace ShareGit.Services.Google
{
    public interface IMeasurementService
    {
        Task Hit(string path, string clientId);
    }
}
