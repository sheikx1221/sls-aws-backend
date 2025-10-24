const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  PutCommand,
} = require("@aws-sdk/lib-dynamodb");

const express = require("express");
const serverless = require("serverless-http");

const app = express();

const HANDICRAFTS_TABLE = process.env.HANDICRAFTS_TABLE;
const client = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(client);

app.use(express.json());

app.post('/handicrafts', async (req, res, next) => {
  try {
      const body = JSON.parse(req.body);
  
      if (!body.name || !body.category || !body.price) {
          res.status(400).json({
            error: 'Missing required fields: name, category, and price are required'
          });
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
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
      };
  
      if (isNaN(item.price) || item.price < 0) {
          res.status(400).json({
            error: 'Price must be a positive number'
          });
      }
  
      await docClient.send(new PutCommand({
          TableName: HANDICRAFTS_TABLE,
          Item: item
      }));
      
      res.status(201).json({
        message: 'Handicraft created successfully',
        data: item
      });
  
  } catch (error) {
      console.error('Error creating handicraft:', error);
      res.status(500).json({
        error: 'Could not create handicraft item',
        details: error.message
      });
  }
});

exports.handler = serverless(app);
