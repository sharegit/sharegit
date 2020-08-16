using Core.Util;
using Jose;
using Org.BouncyCastle.Crypto;
using Org.BouncyCastle.Crypto.Parameters;
using Org.BouncyCastle.OpenSsl;
using System;
using System.Collections.Generic;
using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;

namespace ShareGithub.GithubAuth
{
    class AppGithubAuth : GithubAuthMode
    {
        private string jwt;

        public AppGithubAuth()
        {
            AsymmetricCipherKeyPair keyPair;

            // TODO: Add private key location configuration
            using (var reader = System.IO.File.OpenText(RollingEnv.Get("SHARE_GITHUB_PRIV_KEY_LOC")))
                keyPair = (AsymmetricCipherKeyPair)new PemReader(reader).ReadObject();

            var payload = new
            {
                iat = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
                exp = DateTimeOffset.UtcNow.AddMinutes(9).AddSeconds(30).ToUnixTimeSeconds(),
                // TODO: Move app ID to configuration
                iss = 76016
            };
            var rsaparams = keyPair.Private as RsaPrivateCrtKeyParameters;
            var par = new RSAParameters
            {
                Modulus = rsaparams.Modulus.ToByteArrayUnsigned(),
                P = rsaparams.P.ToByteArrayUnsigned(),
                Q = rsaparams.Q.ToByteArrayUnsigned(),
                DP = rsaparams.DP.ToByteArrayUnsigned(),
                DQ = rsaparams.DQ.ToByteArrayUnsigned(),
                InverseQ = rsaparams.QInv.ToByteArrayUnsigned(),
                D = rsaparams.Exponent.ToByteArrayUnsigned(),
                Exponent = rsaparams.PublicExponent.ToByteArrayUnsigned()
            };
            var private_key = RSA.Create(par);

            jwt = JWT.Encode(payload, private_key, JwsAlgorithm.RS256);
        }

        public override void AddAuthHeader(HttpRequestHeaders headers)
        {
            headers.Add("Authorization", $"Bearer {jwt}");
        }

    }
}
