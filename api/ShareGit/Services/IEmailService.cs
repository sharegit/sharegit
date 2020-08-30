using System.Threading.Tasks;

namespace ShareGit.Services
{
    public interface IEmailService
    {
        Task SendMailAsync(string name, string targetEmail, string subject, string message);
    }
}
