using Org.BouncyCastle.Crypto;
using Org.BouncyCastle.Crypto.Parameters;
using Org.BouncyCastle.OpenSsl;
using System.Security.Cryptography;

namespace Core.Util
{
    public static class JWT
    {
        private static object LoadKey(string keyLocation)
        {
            AsymmetricCipherKeyPair keyPair;

            using (var reader = System.IO.File.OpenText(keyLocation))
                keyPair = (AsymmetricCipherKeyPair)new PemReader(reader).ReadObject();

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
            return RSA.Create(par);
        }
        public static string Encode(object payload, string privateKeyLocation)
        {
            var privateKey = LoadKey(privateKeyLocation);
            return Jose.JWT.Encode(payload, privateKey, Jose.JwsAlgorithm.RS256);
        }
        public static T Decode<T>(string jwt, string privateKeyLocation)
        {
            var privateKey = LoadKey(privateKeyLocation);
            return Jose.JWT.Decode<T>(jwt, privateKey, Jose.JwsAlgorithm.RS256);
        }
    }
}
