const pinataSDK = require("@pinata/sdk")
const path = require("path")
const fs = require("fs")
require("dotenv").config()

const { PINATA_API_KEY, PINATA_API_SECRET } = process.env
const pinata = new pinataSDK(PINATA_API_KEY, PINATA_API_SECRET)

// STEP 1: store the images in IPFS first so that we can get the IPFS hashes for step 2
// STEP 2: store the tokenURI metadata in IPFS (inludes the IPFS hashes of the images from step 1)

/**
 * @param {string} relativePathToImages
 *
 * @dev uploads images from local folder to pinata
 * @docs https://docs.pinata.cloud/docs/pinata-sdk#pinfiletoipfs
 *
 * @returns
 */
async function storeImages(relativePathToImages) {
    const fullImagesPath = path.resolve(relativePathToImages)
    const files = fs.readdirSync(fullImagesPath)
    const responses = []
    console.log("Uploading to IPFS...")
    for (fileIndex in files) {
        console.log(`Uploading ${files[fileIndex]}...`)
        const readableStreamForFile = fs.createReadStream(`${fullImagesPath}/${files[fileIndex]}`)
        try {
            const options = {
                pinataMetadata: {
                    name: files[fileIndex],
                },
            }

            const response = await pinata.pinFileToIPFS(readableStreamForFile, options)
            responses.push(response)
        } catch (e) {
            console.log(e)
        }
    }

    return { responses, files }
}

async function storeTokenUriMetadata(metadata) {
    try {
        const options = {
            pinataMetadata: {
                name: `${metadata.name}-metadata.json`,
            },
        }

        const response = await pinata.pinJSONToIPFS(metadata, options)
        console.log("response", response)
        return response
    } catch (error) {
        console.log(error)
    }
    return null
}

module.exports = { storeImages, storeTokenUriMetadata }
