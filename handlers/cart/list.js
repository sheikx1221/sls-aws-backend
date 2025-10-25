const { dynamoDb, ScanCommand } = require("../../db/dynamoDBClient");
const tables = require("../../db/tables");

exports.handler = async (event) => {
    const deviceFingerprint = event?.queryStringParameters?.deviceFingerprint;
    if (!deviceFingerprint) {
        return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'deviceFingerprint is required' })
        };
    }

    const params = {
        TableName: tables.CART_TABLE,
        FilterExpression: 'deviceFingerprint = :df',
        ExpressionAttributeValues: {
            ':df': deviceFingerprint
        }
    };

    try {
        const result = await dynamoDb.send(new ScanCommand(params));

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
                items: result.Items || [],
                count: result.Count || 0,
                lastEvaluatedKey: result.LastEvaluatedKey ? encodeURIComponent(JSON.stringify(result.LastEvaluatedKey)) : null
            })
        };
    } catch (error) {
        console.error('List cart items error:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Could not retrieve cart items' })
        };
    }
};