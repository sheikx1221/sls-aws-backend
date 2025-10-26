const { generateId } = require("../../utils/functions");
const { dynamoDb, PutCommand } = require("../../db/dynamoDBClient");
const tables = require("../../db/tables");

exports.handler = async (event) => {
    try {
        const body = JSON.parse(event.body);

        if (!body.name || !body.category || !body.price) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    error: 'Missing required fields: name, category, and price are required'
                })
            };
        }

        const handicraftId = generateId("hc");
        const item = {
            craftId: handicraftId,
            name: body.name,
            category: body.category,
            price: parseFloat(body.price),
            description: body.description || '',
            materials: body.materials || [],
            inStock: body.inStock !== undefined ? body.inStock : true,
            images: body.images || [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        if (isNaN(item.price) || item.price < 0) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'Price must be a positive number' })
            };
        }

        await dynamoDb.send(new PutCommand({
            TableName: tables.HANDICRAFTS_TABLE,
            Item: item
        }));

        return {
            statusCode: 201,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                message: 'Handicraft created successfully',
                handicraft: item
            })
        };

    } catch (error) {
        console.error('Error creating handicraft:', error);

        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                error: 'Could not create handicraft item',
                details: error.message
            })
        };
    }
};