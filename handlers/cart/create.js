const { generateId } = require("../../utils/functions");
const { dynamoDb, PutCommand } = require("../../db/dynamoDBClient");
const tables = require("../../db/tables");

exports.handler = async (event) => {
    try {
        const body = event.body ? JSON.parse(event.body) : {};
        const { 
            deviceFingerprint,
            craftId,
            craftName,
            category,
            image,
            qty,
            amount
        } = body;

        if (!deviceFingerprint || !craftId || !craftName || !qty || !amount) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'Missing required fields: deviceFingerprint, craftId, qty, amount' })
            };
        }

        const qtyParsed = parseInt(qty);
        const amountParsed = parseInt(amount);

        if (Number.isNaN(qtyParsed) || qtyParsed <= 0) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'qty must be a positive integer' })
            };
        }
        if (Number.isNaN(amountParsed) || amountParsed < 0) {
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
            deviceFingerprint: String(deviceFingerprint),
            craft: {
                craftId,
                name: craftName,
                category,
                image
            },
            qty: qtyParsed,
            amount: amountParsed,
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