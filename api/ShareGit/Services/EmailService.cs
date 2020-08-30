using Core.Util;
using MailKit.Net.Smtp;
using Microsoft.Extensions.Options;
using MimeKit;
using ShareGit.Settings;
using System;
using System.Threading.Tasks;

namespace ShareGit.Services
{
    public class EmailService : IEmailService
    {
        private MailboxAddress SenderAddr { get; }
        private NoreplyEmailSettings EmailConf { get; }

        public EmailService(IOptions<NoreplyEmailSettings> emailConf)
        {
            EmailConf = emailConf.Value;
            SenderAddr = new MailboxAddress(EmailConf.SenderName, EmailConf.SenderAddress);
        }

        public async Task SendMailAsync(string name, string targetEmail, string subject, string message)
        {
            var msg = new MimeMessage();
            msg.From.Add(SenderAddr);

            msg.To.Add(new MailboxAddress(name, targetEmail));
            msg.Subject = subject;

            msg.Body = new TextPart(MimeKit.Text.TextFormat.Html)
            {
                Text = message
            };

            try
            {
                using var client = new SmtpClient()
                {
                    ServerCertificateValidationCallback = (s, c, ch, e) => true
                };

                await client.ConnectAsync(EmailConf.SMTPAddress, EmailConf.Port, MailKit.Security.SecureSocketOptions.StartTls);

                var psw = RollingEnv.Get("SHARE_GIT_SMTP_PSW");
                await client.AuthenticateAsync(EmailConf.SenderAddress, psw);

                await client.SendAsync(msg);

                await client.DisconnectAsync(true);
            }
            catch (Exception e)
            {
                throw;
            }
        }
    }
}
