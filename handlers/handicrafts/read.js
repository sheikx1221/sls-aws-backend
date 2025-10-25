const { dynamoDb, QueryCommand } = require("../../db/dynamoDBClient");
const tables = require('../../db/tables');

exports.handler = async (event) => {
    console.log("event.queryStringParams = ",event.queryStringParameters);
    const craftId = event?.queryStringParameters?.craftId;
    if (!craftId) {
        return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'craftId is required' }),
        };
    }

    const params = {
        TableName: tables.HANDICRAFTS_TABLE,
        KeyConditionExpression: 'craftId = :id',
        ExpressionAttributeValues: {
            ':id': craftId,
        },
        Limit: 1,
    };

    try {
        const result = await dynamoDb.send(new QueryCommand(params));
        const item = result && result.Items && result.Items.length ? result.Items[0] : null;

        if (!item) {
            return {
                statusCode: 404,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Handicraft not found' }),
            };
        }

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item),
        };
    } catch (error) {
        console.error('Read handicraft error:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Could not retrieve handicraft' }),
        };
    }
};