// Example in Node.js
exports.handler = async (event) => {
    console.log("event.methodArn = ",event.routeArn);
    if ('x-session-id' in event.headers) {
        return generatePolicy('user', 'Allow', event.routeArn, {
            userId: event.headers['x-session-id'],
            roles: ['admin']
        });
    }
    else {
        return generatePolicy('user', 'Deny', event.routeArn);
    }
};

const generatePolicy = (principalId, effect, resource, context) => {
    const authResponse = {};
    authResponse.principalId = principalId;
    const policyDocument = {};
    if (effect && resource) {
        policyDocument.Version = '2012-10-17';
        policyDocument.Statement = [];

        const statementOne = {};
        statementOne.Action = 'execute-api:Invoke';
        statementOne.Effect = effect;
        statementOne.Resource = resource;
        policyDocument.Statement[0] = statementOne;
    }

    authResponse.policyDocument = policyDocument;
    if (context) {
        authResponse.context = context; // Optional context for downstream Lambda
    }
    return authResponse;
};