const { dynamoDb, DeleteCommand } = require("../../db/dynamoDBClient");
const tables = require('../../db/tables');

exports.handler = async (event) => {
    const craftId = event?.queryStringParameters?.craftId;
    if (!craftId) {
        return {
            statusCode: 400,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: 'craftId is required' })
        };
    }

    const params = {
        TableName: tables.HANDICRAFTS_TABLE,
        Key: { craftId },
        ReturnValues: 'ALL_OLD'
    };

    try {
        const result = await dynamoDb.send(new DeleteCommand(params));

        if (!result || !result.Attributes) {
            return {
                statusCode: 404,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'Handicraft not found' })
            };
        }

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ message: 'Handicraft deleted successfully', handicraft: result.Attributes })
        };
    } catch (error) {
        console.error('Delete handicraft error:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: 'Could not delete handicraft' })
        };
    }
}