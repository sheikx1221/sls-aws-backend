const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, QueryCommand, UpdateCommand, DeleteCommand, ScanCommand, GetCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient();
const dynamoDb = DynamoDBDocumentClient.from(client);

module.exports = {
    dynamoDb,
    PutCommand,
    QueryCommand,
    UpdateCommand,
    DeleteCommand,
    ScanCommand,
    GetCommand
}