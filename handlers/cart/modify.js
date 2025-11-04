const { dynamoDb, ExecuteTransactionCommand, ScanCommand  } = require("../../db/dynamoDBClient");
const tables = require("../../db/tables");

exports.handler = async (event) => {
    try {
        const deviceFingerprint = event.headers['x-session-id'];
        const body = JSON.parse(event.body);
        const { cartItems } = body;

        console.log({ cartItems, deviceFingerprint });

        if (!cartItems || cartItems.length == 0 || !deviceFingerprint) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'missing required fields' })
            };
        }

        const transacStatements = [];
        for (let item of cartItems) {
            if (item.action == 'D') {
                transacStatements.push({
                    Statement: `DELETE FROM "${tables.CART_TABLE}" WHERE "cartId" = ?`,
                    Parameters: [item.cartId]
                });
            }
            else {
                transacStatements.push({
                    Statement: `UPDATE "${tables.CART_TABLE}" SET "qty" = ?, "amount" = ? WHERE "cartId" = ?`,
                    Parameters: [
                        item.qty,
                        item.amount,
                        item.cartId
                    ]
                });
            }
        }

        console.log("transacStatements = ",JSON.stringify(transacStatements));

        const params = {
            TransactStatements: transacStatements
        };
        await dynamoDb.send(new ExecuteTransactionCommand(params));

        const listParams = {
            TableName: tables.CART_TABLE,
            FilterExpression: 'deviceFingerprint = :df',
            ExpressionAttributeValues: {
                ':df': deviceFingerprint
            }
        };
        const result = await dynamoDb.send(new ScanCommand(listParams));

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
                items: result.Items || [],
                count: result.Count || 0,
                lastEvaluatedKey: result.LastEvaluatedKey ? encodeURIComponent(JSON.stringify(result.LastEvaluatedKey)) : null
            })
        };
    }
    catch (error) {
        console.error('Modify cart items error:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Could not retrieve cart items' })
        };
    }
}