const { generateId } = require("../../utils/functions");
const { dynamoDb, PutCommand } = require("../../db/dynamoDBClient");
const tables = require("../../db/tables");

exports.handler = async (event) => {
    try {
        const body = event.body ? JSON.parse(event.body) : {};
        const deviceFingerprint = body.deviceFingerprint || event?.queryStringParameters?.deviceFingerprint;
        const craftId = body.craftId || event?.queryStringParameters?.craftId;
        const qtyRaw = body.qty ?? event?.queryStringParameters?.qty;
        const amountRaw = body.amount ?? event?.queryStringParameters?.amount;

        if (!deviceFingerprint || !craftId || qtyRaw === undefined || amountRaw === undefined) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'Missing required fields: deviceFingerprint, craftId, qty, amount' })
            };
        }

        const qty = parseInt(qtyRaw, 10);
        const amount = parseFloat(amountRaw);
        if (Number.isNaN(qty) || qty <= 0) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'qty must be a positive integer' })
            };
        }
        if (Number.isNaN(amount) || amount < 0) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'amount must be a non-negative number' })
            };
        }

        const now = new Date().toISOString();
        const cartId = generateId('cart');

        const item = {
            cartId,
            deviceFingerprint,
            craftId,
            qty,
            amount,
            createdAt: now,
            updatedAt: now
        };

        await dynamoDb.send(new PutCommand({
            TableName: tables.CART_TABLE,
            Item: item
        }));

        return {
            statusCode: 201,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ message: 'Item added to cart', item })
        };
    } catch (error) {
        console.error('Add to cart error:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Could not add item to cart' })
        };
    }
};