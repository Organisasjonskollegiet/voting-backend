import { RsaSigningKey } from 'jwks-rsa';
import jwt, { GetPublicKeyOrSecret } from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

interface DecodedToken {
    iss: string;
    sub: string;
    aud: string[];
    iat: number;
    exp: number;
    azp: string;
    scope: string;
}

const client = jwksClient({
    jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
});
const getJwksClientKey: GetPublicKeyOrSecret = (header, callback) => {
    client.getSigningKey(header.kid || '', (_, key) => {
        const signingKey = key.getPublicKey || (key as RsaSigningKey).rsaPublicKey;
        callback(null, signingKey());
    });
};

export const verifyToken = async (bearerToken: string) => {
    return new Promise<DecodedToken | undefined>((resolve, reject) => {
        jwt.verify(
            bearerToken,
            getJwksClientKey,
            {
                audience: process.env.AUDIENCE,
                algorithms: ['RS256'],
            },
            (err, decoded) => {
                if (err) {
                    reject(err);
                }
                resolve(decoded as DecodedToken);
            }
        );
    });
};
