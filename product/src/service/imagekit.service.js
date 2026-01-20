const ImageKit = require("imagekit");
const { v4: uuidV4 } = require("uuid");
require("dotenv").config()

const imageKit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

async function uploadImage({ buffer, filename, folder = "/products" }) {
  const res = await imageKit.upload({
    file: buffer,
    fileName: filename || uuidV4(),
    folder,
  });

  return {
    url: res.url,
    thumbnailUrl: res.thumbnailUrl || res.url,
    fileId: res.fileId,
  };
}

module.exports = {
  imageKit,
  uploadImage,
};
