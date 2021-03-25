import { RsaSigningKey } from 'jwks-rsa';
import jwt, { GetPublicKeyOrSecret } from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { DecodedToken } from '../types/types';

const client = jwksClient({
    jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
});
const getJwksClientKey: GetPublicKeyOrSecret = (header, callback) => {
    client.getSigningKey(header.kid || '', (_, key) => {
        const signingKey = key.getPublicKey || (key as RsaSigningKey).rsaPublicKey;
        callback(null, signingKey());
    });
};

export const verifyToken = async (bearer_token: string) => {
    return new Promise<DecodedToken | undefined>((resolve, reject) => {
        jwt.verify(
            bearer_token,
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

export const userFromRequest = async (req: any) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        const decoded = await verifyToken(token);
        return decoded ? decoded.sub : null;
    }
    return null;
};
