'use strict';

const { CosmosClient } = require('@azure/cosmos');

let client;
let database;

function getClient() {
  if (!client) {
    client = new CosmosClient(process.env.COSMOS_CONNECTION_STRING);
  }
  return client;
}

function getDatabase() {
  if (!database) {
    database = getClient().database(process.env.COSMOS_DATABASE_NAME);
  }
  return database;
}

function getUsersContainer() {
  return getDatabase().container('users');
}

function getTokensContainer() {
  return getDatabase().container('magic_tokens');
}

function getMatchesContainer() {
  return getDatabase().container('matches');
}

function getPredictionsContainer() {
  return getDatabase().container('predictions');
}

function getAccessRequestsContainer() {
  return getDatabase().container('access_requests');
}

module.exports = {
  getUsersContainer,
  getTokensContainer,
  getMatchesContainer,
  getPredictionsContainer,
  getAccessRequestsContainer,
};
