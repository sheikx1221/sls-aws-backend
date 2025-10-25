const { dynamoDb, DeleteCommand } = require("../../db/dynamoDBClient");
const tables = require("../../db/tables");

exports.handler = async (event) => {
    try {
        const body = event.body ? JSON.parse(event.body) : {};
        const cartId = body.cartId || event?.pathParameters?.cartId || event?.queryStringParameters?.cartId;

        if (!cartId) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'cartId is required' })
            };
        }

        const params = {
            TableName: tables.CART_TABLE,
            Key: { cartId },
            ReturnValues: 'ALL_OLD'
        };

        const result = await dynamoDb.send(new DeleteCommand(params));

        if (!result || !result.Attributes) {
            return {
                statusCode: 404,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'Cart item not found' })
            };
        }

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ message: 'Cart item deleted', item: result.Attributes })
        };
    } catch (error) {
        console.error('Delete cart item error:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Could not delete cart item' })
        };
    }
};