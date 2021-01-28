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
  console.log(createContainerResponse);

  const data = 'Lorem ipsum dolor sit amet';
  const size = 26;
  const md5 = getBinaryMD5(data);
  const blob = "new_file";
  const partIndex = 1;
  const blockId = blobService.getBlockId(md5, partIndex);

  console.log(`md5: ${md5}`);
  console.log(`blockId: ${blockId}`);

  const currentTimestamp = Date.now();
  const startDate = new Date(currentTimestamp);
  const expiryDate = new Date(currentTimestamp + ExpiryIntervalMinutes * 60000);

  const sharedAccessPolicy = {
    AccessPolicy: {
      Permissions: azure.BlobUtilities.SharedAccessPermissions.WRITE,
      Start: startDate,
      Expiry: expiryDate
    }
  };

  const token = blobService.generateSharedAccessSignature(container, blob, sharedAccessPolicy);
  const sasUrl = blobService.getUrl(container, blob, token);
  const blockUrl = sasUrl + "&comp=block&blockid=" + new Buffer(blockId).toString('base64');

  console.log(`sasUrl: ${sasUrl}`);
  console.log(`blockUrl: ${blockUrl}`);

  const headers = {
    'x-ms-blob-type': 'BlockBlob',
    'x-ms-date': startDate.toUTCString(),
    'Content-Length': size.toString(),
    'Content-MD5': new Buffer(md5, 'hex').toString('base64')
  };

  const writeBlobResponse = await azureRequest(blockUrl, data, headers);
  console.log(JSON.stringify(writeBlobResponse));

  const getBlobsResponse = await getBlobs(container);
  console.log(getBlobsResponse);
  console.log(`getBlobsResponse.response.body: ${JSON.stringify(getBlobsResponse.response.body)}`);
  console.log(`getBlobsResponse blob: ${JSON.stringify(getBlobsResponse.response.body.EnumerationResults.Blobs.Blob)}`);

  const getAllBlocksResponse = await getBlocks(container, blob);
  console.log(getAllBlocksResponse);
  console.log(`getAllBlocksResponse.response.body: ${JSON.stringify(getAllBlocksResponse.response.body)}`);
}

asyncMain();
