 
 const DeviceLink = require("../models/DeviceLink");

// similarity ya majina
function similarity(a, b) {
  a = a.toLowerCase();
  b = b.toLowerCase();

  let matches = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] === b[i]) matches++;
  }

  return matches / Math.max(a.length, b.length);
}

async function linkDevice({ deviceId, user }) {
  if (!deviceId) return;

  const existing = await DeviceLink.find({
    deviceId,
    status: "linked",
  }).populate("userId", "fullName");

   
  // 🔴 Similarity check 95%
  for (const record of existing) {
    if (!record.userId) continue;

    const sim = similarity(record.userId.fullName, user.fullName);

    if (sim >= 0.95) {
      throw new Error(
        "Device hii tayari una account ."
      );
    }
  }

  await DeviceLink.create({
    deviceId,
    userId: user._id,
    phone: user.phone,
    nationalId: user.nationalId || null,
    status: "linked",
  });
}

module.exports = { linkDevice };
