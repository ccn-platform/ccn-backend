  const FaceBiometric = require("../models/FaceBiometric");
const crypto = require("crypto");
const {
  SearchFacesByImageCommand,
  IndexFacesCommand,
  CreateCollectionCommand,
  DetectFacesCommand
} = require("@aws-sdk/client-rekognition");

const client = require("./awsClient");

const COLLECTION_ID = "ccn-users";
const BIOMETRIC_EXPIRY_MINUTES = 10;

// ============================================
// CREATE AWS COLLECTION (RUNS ON SERVER START)
// ============================================
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

  // ====================================================
  // VERIFY FACE BEFORE REGISTRATION
  // ====================================================
  async verifyCustomerFace(imageBase64) {
    if (!imageBase64) {
      const err = new Error("Face image required");
      err.code = "NO_IMAGE";
      throw err;
    }

    const cleanImage = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(cleanImage, "base64");

    // ====================================================
    // 1️⃣ CHECK DUPLICATE FACE (CHEAP FIRST)
    // ====================================================
    const search = await client.send(
      new SearchFacesByImageCommand({
        CollectionId: COLLECTION_ID,
        Image: { Bytes: buffer },
        FaceMatchThreshold: Number(process.env.FACE_MATCH_THRESHOLD) || 90,
        MaxFaces: 1,
      })
    );

     if (search.FaceMatches.length > 0) {
        const err = new Error("Tayari una account");
        err.code = "FACE_DUPLICATE";
        err.meta = {
          matchScore: search.FaceMatches[0].Similarity
       };
       throw err;
     }


    // ====================================================
    // 2️⃣ AGE DETECTION
    // ====================================================
    try {
      const detect = await client.send(
        new DetectFacesCommand({
          Image: { Bytes: buffer },
          Attributes: ["DEFAULT"],
        })
      );

      if (!detect.FaceDetails.length) {
        const err = new Error("Face haijaonekana vizuri.");
        err.code = "NO_FACE";
        throw err;
      }

      const ageLow = detect.FaceDetails[0].AgeRange.Low;
      const ageHigh = detect.FaceDetails[0].AgeRange.High;

      // mtoto kabisa
      if (ageHigh < 16) {
        const err = new Error("Mtoto haruhusiwi kujisajili.");
        err.code = "UNDERAGE";
        throw err;
      }

      // doubtful age
      if (ageLow < 18 && ageHigh >= 18) {
        const err = new Error("Thibitisha umri kwa NIDA.");
        err.code = "AGE_UNCERTAIN";
        throw err;
      }

    } catch (err) {
      throw err; // USIFUTE ERROR
    }

    // ====================================================
    // 3️⃣ SAVE TEMP BIOMETRIC
    // ====================================================
    const faceHash = crypto
      .createHash("sha256")
      .update(cleanImage)
      .digest("hex");

    // kama tayari ipo pending
    const existing = await FaceBiometric.findOne({
      faceHash,
      status: "pending",
    });

    if (existing) {
      return { biometricId: existing._id };
    }

    const biometric = await FaceBiometric.create({
      faceHash,
      faceImage: cleanImage,
      status: "pending",
      expiresAt: new Date(Date.now() + BIOMETRIC_EXPIRY_MINUTES * 60000),
    });

    return { biometricId: biometric._id };
  }

  // ====================================================
  // ATTACH FACE AFTER USER CREATED
  // ====================================================
  async attachBiometricToUser({ biometricId, userId, imageBase64 }) {
    const biometric = await FaceBiometric.findById(biometricId);
    if (!biometric) throw new Error("Biometric not found");
// 🔴 muhimu sana
    if (biometric.status === "linked") {
      throw new Error("Biometric already used");
    }

    const cleanImage = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(cleanImage, "base64");

    // save to AWS
    try {
      await client.send(
        new IndexFacesCommand({
          CollectionId: COLLECTION_ID,
          Image: { Bytes: buffer },
          ExternalImageId: userId.toString(),
        })
      );
    } catch (err) {
      console.error("AWS index error", err);
      throw new Error("Face save failed.");
    }

    biometric.userId = userId;
    biometric.status = "linked";
    biometric.faceImage = null; // delete image
    await biometric.save();

    return true;
  }
}

const biometricService = new BiometricService();
module.exports = biometricService;
module.exports.ensureCollection = ensureCollection;
