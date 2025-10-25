const { dynamoDb, ScanCommand } = require("../../db/dynamoDBClient");
const tables = require('../../db/tables');

exports.handler = async (event) => {
    const rawExclusiveStartKey = event?.queryStringParameters?.exclusiveStartKey;
    let exclusiveStartKey;
    if (rawExclusiveStartKey) {
        try {
            exclusiveStartKey = JSON.parse(decodeURIComponent(rawExclusiveStartKey));
        } catch (err) {
            console.warn('Could not parse exclusiveStartKey, ignoring it:', err.message);
            exclusiveStartKey = undefined;
        }
    }

    let limit = event?.queryStringParameters?.limit ? parseInt(event.queryStringParameters.limit, 10) : 20;
    if (Number.isNaN(limit) || limit <= 0) limit = 20;
    limit = limit > 50 ? 50 : limit;

    const params = {
        TableName: tables.HANDICRAFTS_TABLE,
        Limit: limit
    };

    if (exclusiveStartKey) params.ExclusiveStartKey = exclusiveStartKey;

    try {
        const result = await dynamoDb.send(new ScanCommand(params));

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                items: result.Items || [],
                lastEvaluatedKey: result.LastEvaluatedKey ? encodeURIComponent(JSON.stringify(result.LastEvaluatedKey)) : null,
                count: result.Count || 0
            })
        };
    } catch (error) {
        console.error('Error listing handicrafts:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: 'Could not list handicrafts' })
        };
    }
};