const azure = require('azure-storage');
const crypto = require('crypto');
const request = require('request');

const ExpiryIntervalMinutes = 4320;

const devStoreCreds = azure.generateDevelopmentStorageCredentials('http://azurite');
const blobService = azure.createBlobService(devStoreCreds);

// Given a Buffer or string, return the hex encoded MD5
function getBinaryMD5(data) {
  return crypto.createHash('md5')
    .update(data, 'binary')
    .digest('hex');
}

function createContainerIfNotExists(containerName) {
  return new Promise((resolve) => {
    blobService.createContainerIfNotExists(containerName, function(error, result, response) { 
      if (!error) {
        resolve({
          response: response,
          result: result
        });
      } else {
        resolve({
          response: response,
          error: error
        });
      }
    })
  });
}

function azureRequest(url, body, headers) {
  return new Promise((resolve) => {
    request({method: 'PUT', url: url, body: body, headers: headers}, function(error, result, response) {
      if (!error) {
        resolve({
          response: response,
          result: result
        });
      } else {
        resolve({
          response: response,
          error: error
        });
      }
    });
  });
}

function writeBlock(blockId, containerName, blob, content, options) {
  return new Promise((resolve) => {
    blobService.createBlockFromText(blockId, containerName, blob, content, options, function(error, result, response) { 
      if (!error) {
        resolve({
          response: response,
          result: result
        });
      } else {
        resolve({
          response: response,
          error: error
        });
      }
    })
  });
}

function getBlobs(containerName) {
  return new Promise((resolve) => {
    blobService.listBlobsSegmented(containerName, null, function(error, result, response) {
      if (!error) {
        resolve({
          response: response,
          result: result
        });
      } else {
        resolve({
          response: response,
          error: error
        });
      }
    });
  });
}

function getBlocks(containerName, blob) {
  return new Promise((resolve) => {
    blobService.listBlocks(containerName, blob, azure.BlobUtilities.BlockListFilter.ALL, function(error, result, response) {
      if (!error) {
        resolve({
          response: response,
          result: result
        });
      } else {
        resolve({
          response: response,
          error: error
        });
      }
    });
  });
}

async function asyncMain() {
  const container = "container";
  const createContainerResponse = await createContainerIfNotExists(container);

  const data = 'Lorem ipsum dolor sit amet';
  const size = 26;
  const md5 = getBinaryMD5(data);
  const blob = "new_file";
  const partIndex = 1;
  const blockId = blobService.getBlockId(md5, partIndex);

  const writeBlobResponse = await writeBlock(blockId, container, blob, data, {useTransactionalMD5: true, transactionalContentMD5: Buffer.from(md5, 'hex').toString('base64')});
  console.log(writeBlobResponse);

  let getAllBlocksResponse = await getBlocks(container, blob);
  console.log(getAllBlocksResponse);
  console.log(`getAllBlocksResponse.response.body: ${JSON.stringify(getAllBlocksResponse.response.body)}`);

  const badData = 'Asdfg asdfg asdfg asd asdf';
  const badWriteBlobResponse = await writeBlock(blockId, container, blob, badData, {useTransactionalMD5: true, transactionalContentMD5: Buffer.from(md5, 'hex').toString('base64')});
  console.log("badWriteBlobResponse");
  console.log(badWriteBlobResponse);

  getAllBlocksResponse = await getBlocks(container, blob);
  console.log(getAllBlocksResponse);
  console.log(`getAllBlocksResponse.response.body: ${JSON.stringify(getAllBlocksResponse.response.body)}`);
}

asyncMain();
