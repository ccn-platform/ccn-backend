  const FaceBiometric = require("../models/FaceBiometric");
const User = require("../models/User");

const crypto = require("crypto");
const {
  SearchFacesByImageCommand,
  IndexFacesCommand,
  CreateCollectionCommand,
} = require("@aws-sdk/client-rekognition");

const client = require("./awsClient");

const COLLECTION_ID = "ccn-users";
const BIOMETRIC_EXPIRY_MINUTES = 10;

// Create AWS collection once
async function ensureCollection() {
  try {
    await client.send(
      new CreateCollectionCommand({
        CollectionId: COLLECTION_ID,
      })
    );
    console.log("AWS face collection ready");
  } catch (err) {
    if (err.name !== "ResourceAlreadyExistsException") {
      console.error(err);
    }
  }
}

class BiometricService {
  async verifyCustomerFace(imageBase64) {
    if (!imageBase64) throw new Error("Face image required");

   const cleanImage = imageBase64.replace(/^data:image\/\w+;base64,/, "");
   const buffer = Buffer.from(cleanImage, "base64");


    // 🔎 CHECK DUPLICATE FACE AWS
    const search = await client.send(
      new SearchFacesByImageCommand({
        CollectionId: COLLECTION_ID,
        Image: { Bytes: buffer },
       FaceMatchThreshold: Number(process.env.FACE_MATCH_THRESHOLD) || 90,

        MaxFaces: 1,
      })
    );

    if (search.FaceMatches.length > 0) {
      return {
        allowed: false,
        reason: "Tayari una account, huwezi kujisajili mara mbili.",
      };
    }


    // temporary biometric record
    const faceHash = crypto
      .createHash("sha256")
      .update(cleanImage)
      .digest("hex");

    const biometric = await FaceBiometric.create({
      faceHash,
      faceImage: cleanImage,
      status: "pending",
      expiresAt: new Date(Date.now() + BIOMETRIC_EXPIRY_MINUTES * 60000),
   });

    return { allowed: true, biometricId: biometric._id };
  }

  async attachBiometricToUser({ biometricId, userId, imageBase64 }) {
    const biometric = await FaceBiometric.findById(biometricId);
    if (!biometric) throw new Error("Biometric not found");
   
    if (!imageBase64) {
    throw new Error("Face image missing");
  }

   const cleanImage = imageBase64.replace(/^data:image\/\w+;base64,/, "");
   const buffer = Buffer.from(cleanImage, "base64");


    // SAVE FACE AWS
    await client.send(
      new IndexFacesCommand({
        CollectionId: COLLECTION_ID,
        Image: { Bytes: buffer },
        ExternalImageId: userId.toString(),
      })
    );

    biometric.userId = userId;
    biometric.status = "linked";
    // 🔴 MUHIMU SANA → FUTA PICHA BAADA YA KUTUMA AWS
    biometric.faceImage = null;
    await biometric.save();

    return true;
  }
}

const biometricService = new BiometricService();
module.exports = biometricService;
module.exports.ensureCollection = ensureCollection;
