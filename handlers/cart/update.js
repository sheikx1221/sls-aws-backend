const { dynamoDb, GetCommand, UpdateCommand } = require("../../db/dynamoDBClient");
const tables = require("../../db/tables");

exports.handler = async (event) => {
    try {
        const body = event.body ? JSON.parse(event.body) : {};
        const cartId = body.cartId || event?.queryStringParameters?.cartId;
        const newQtyRaw = body.qty ?? event?.queryStringParameters?.qty;

        if (!cartId || newQtyRaw === undefined) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'Missing required fields: cartId and qty' })
            };
        }

        const newQty = parseInt(newQtyRaw, 10);
        if (Number.isNaN(newQty) || newQty <= 0) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'qty must be a positive integer' })
            };
        }

        const getParams = {
            TableName: tables.CART_TABLE,
            Key: { cartId }
        };

        const getResult = await dynamoDb.send(new GetCommand(getParams));
        const item = getResult && getResult.Item;
        if (!item) {
            return {
                statusCode: 404,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'Cart item not found' })
            };
        }

        const previousQty = item.qty || 1;
        const previousTotal = item.amount || item.total || 0;
        const unitPrice = previousQty > 0 ? (previousTotal / previousQty) : previousTotal;
        const newTotal = unitPrice * newQty;

        const updateParams = {
            TableName: tables.CART_TABLE,
            Key: { cartId },
            UpdateExpression: 'SET qty = :q, amount = :tot',
            ExpressionAttributeValues: {
                ':q': newQty,
                ':tot': newTotal
            },
            ReturnValues: 'ALL_NEW'
        };

        const updateResult = await dynamoDb.send(new UpdateCommand(updateParams));

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ message: 'Cart item updated', item: updateResult.Attributes })
        };

    } catch (error) {
        console.error('Update cart item error:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Could not update cart item' })
        };
    }
};