const tables = require('../../db/tables');
const { QueryCommand, PutCommand, UpdateCommand, dynamoDb } = require('../../db/dynamoDBClient');
const { generateId } = require('../../utils/functions');

exports.handler = async (event) => {
    if ('x-session-id' in event.headers) {
        const validate = validateSessionKey(event.headers['x-session-id']);
        if (validate) {
            return generatePolicy('user', 'Allow', event.routeArn, {
                userId: event.headers['x-session-id'],
                roles: ['admin']
            });
        }
    }

    return generatePolicy('user', 'Deny', event.routeArn);
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

const validateSessionKey = async (sessionKey) => {
        const params = {
            TableName: tables.SESSIONS_TABLE,
            KeyConditionExpression: 'deviceFingerprint = :id',
            ExpressionAttributeValues: {
                ':id': sessionKey,
            },
            Limit: 1,
        }

        try {
            const result = await dynamoDb.send(new QueryCommand(params));
            const item = result && result.Items && result.Items.length ? result.Items[0] : null;

            if (!item) return await createSession(sessionKey);

            // invocations  sessionEnd      result
            // < 100        > 1s        true invocation+1
            // < 100        < 1s        reset invocation=0,sessionEnd=true
            // > 100        > 1s        false
            // > 100        < 1s        reset invocation=0,sessionEnd=true

            if (item.invocations < 100) {
                if (Date.now() < new Date(item.sessionEnd).getTime()) return await updateSession(sessionKey, item.api_invocations+1);
                else return await updateSession(sessionKey, 0, true);
            }
            else {
                if (Date.now() < new Date(item.sessionEnd).getTime()) return await updateSession(sessionKey, 0, true);
                else return false;
            }
        }
        catch(err) {
            console.log("error while connecting to sessionTable in validateSessionKey = ",err.message || err.description || err);
            return false;
        }
}

const createSession = async (sessionKey) => {
    try {
        const sessionEnd = new Date(Date.now() + 86400000).toISOString();
        const item = {
            sessionId: generateId("session_"),
            deviceFingerprint: sessionKey,
            invocations: 1,
            sessionEnd: sessionEnd
        }

        await dynamoDb.send(new PutCommand({
            TableName: tables.SESSIONS_TABLE,
            Item: item
        }));
        return true;
    }
    catch(err) {
        console.log("error while connecting to sessionTable in createSession= ",err.message || err.description || err);
        return false;
    }
}

const updateSession = async (sessionKey, invocations, sessionEnd) => {
    try {
        const updateParams = {
            TableName: tables.SESSIONS_TABLE,
            Key: { deviceFingerprint: sessionKey },
            UpdateExpression: '',
            ExpressionAttributeValues: {},
            ReturnValues: 'ALL_NEW'
        };

        if (sessionEnd) {
            const newSessionEnd = new Date(Date.now() + 86400000).toISOString();
            updateParams.UpdateExpression = `SET invocations = :inv, sessionEnd = :se`;
            ExpressionAttributeValues = {
                ':inv': invocations,
                ':se': newSessionEnd
            }
        }
        else {
            updateParams.UpdateExpression = `SET invocations = :inv`;
            ExpressionAttributeValues = {
                ':inv': invocations
            }
        }

        await dynamoDb.send(new UpdateCommand(updateParams));
        return true;
    }
    catch (err) {
        console.log("error while connecting to sessionTable in updateSession = ",err.message || err.description || err);
        return false;
    }
}