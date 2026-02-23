     const FaceBiometric = require("../models/FaceBiometric");
 
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
 
async verifyCustomerFace(imageBase64, deviceId) {
  try {

    if (!imageBase64) {
      const err = new Error("Face image required");
      err.code = "NO_IMAGE";
      throw err;
    }

    if (!deviceId) {
      const err = new Error("Device ID missing");
      err.code = "NO_DEVICE";
      throw err;
    }
console.log("VERIFY REQUEST:", deviceId);
  // =====================================================
// DEVICE REUSE CHECK (SOFT CHECK ONLY)
// =====================================================
const deviceAlreadyLinked = await FaceBiometric.findOne({
  deviceId,
  status: "linked",
}).lean();

if (deviceAlreadyLinked) {
  console.log("Device reused → allowing new registration (possible new owner)");
  // HATUZUI — face duplicate check ndiyo identity halisi
}

    const cleanImage = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(cleanImage, "base64");

     // =====================================================
// 1️⃣ AWS DUPLICATE CHECK (FIRST LINE OF DEFENSE)
// =====================================================
 const FACE_THRESHOLD =
  Number(process.env.FACE_MATCH_THRESHOLD) || 80;

const search = await client.send(
  new SearchFacesByImageCommand({
    CollectionId: COLLECTION_ID,
    Image: { Bytes: buffer },
    FaceMatchThreshold: FACE_THRESHOLD,
    MaxFaces: 1,
  })
);

if (search.FaceMatches?.length > 0) {
  const err = new Error("Tayari una account");
  err.code = "FACE_DUPLICATE";
  throw err;
}

// =====================================================
// 2️⃣ BLOCK MULTIPLE PENDING FROM SAME DEVICE
// =====================================================
 const existingPending = await FaceBiometric.findOne({
  deviceId,
  status: "pending",
}).lean();

if (existingPending) {
  return { success: true, biometricId: existingPending._id };
}
    // =====================================================
    // 3️⃣ FACE DETECTION
    // =====================================================
    const detect = await client.send(
      new DetectFacesCommand({
        Image: { Bytes: buffer },
        Attributes: ["DEFAULT"],
      })
    );

    if (!detect.FaceDetails?.length) {
      const err = new Error("Face haijaonekana vizuri.");
      err.code = "NO_FACE";
      throw err;
    }

    const faceDetail = detect.FaceDetails[0];

    if (faceDetail?.AgeRange) {
      const ageHigh = faceDetail.AgeRange.High;

      if (ageHigh < 16) {
        const err = new Error("Mtoto haruhusiwi kujisajili.");
        err.code = "UNDERAGE";
        throw err;
      }
    }

    // =====================================================
    // 4️⃣ SAVE TEMP BIOMETRIC
    // =====================================================
    const biometric = await FaceBiometric.create({
      deviceId,
      faceImage: cleanImage.slice(0, 120000),
      status: "pending",
      expiresAt: new Date(Date.now() + BIOMETRIC_EXPIRY_MINUTES * 60000),
    });

    console.log("SAVED BIOMETRIC:", biometric._id);

    return { success: true, biometricId: biometric._id };

  } catch (err) {
    console.error("VERIFY FACE ERROR:", err);

    if (!err.message) {
      err.message = "Face scan imeshindikana. Angalia internet.";
    }

    throw err;
  }
}
  // ====================================================
  // ATTACH FACE AFTER USER CREATED
  // ====================================================
  async attachBiometricToUser({ biometricId, userId, imageBase64 }) {
   
    // 🔴 ADD HII HAPA JUU
  if (!imageBase64) {
    throw new Error("Face image missing");
  }
  const biometric = await FaceBiometric.findOneAndUpdate(
  {
    _id: biometricId,
    status: "pending",
    expiresAt: { $gt: new Date() } // 🔴 muhimu sana
  },
  { status: "processing" },
  { new: true }
);

if (!biometric) {
  throw new Error("Biometric already used or invalid");
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

    // rudisha status kuwa pending ikiwa AWS imefail
     biometric.status = "pending";
     await biometric.save();

     throw new Error("Face save failed.");
  }

   // sasa link user
   biometric.userId = userId;
    biometric.status = "linked";
    biometric.faceImage = null;

    await biometric.save();

    return true;
    
  }
}

const biometricService = new BiometricService();
module.exports = biometricService;
module.exports.ensureCollection = ensureCollection; 
