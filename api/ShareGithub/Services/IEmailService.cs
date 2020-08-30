using System.Threading.Tasks;

namespace ShareGithub.Services
{
    public interface IEmailService
    {
        Task SendMailAsync(string name, string targetEmail, string subject, string message);
    }
}
