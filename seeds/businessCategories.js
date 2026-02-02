 
 // seed/businessCategories.js

const MONGO_URI = "mongodb://127.0.0.1:27017/ccn_database";

const mongoose = require("mongoose");
const BusinessCategory = require("../models/businessCategory");

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB..."))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

/**
 * ======================================================
 * 🇹🇿 BUSINESS CATEGORIES – TANZANIA (NORMALIZED)
 * - Majina yanayoeleweka kitaifa
 * - Maduka yameunganishwa (short list)
 * - Inafaa kwa mikopo, risk & scale
 * ======================================================
 */
const categories = [

/* =====================================================
 A️⃣ MADUKA (RETAIL & WHOLESALE)
===================================================== */
"Duka la Rejareja",
"Duka la Jumla",
"Duka la Vyakula",
"Duka la Vinywaji",
"Duka la Maji",
"Duka la Gesi na Mafuta ya Taa",
"Duka la Mkaa na Kuni",
"Duka la Nyama na Samaki",
"Duka la Matunda na Mboga",
"Duka la Nguo na Viatu",
"Duka la Vipodozi na Manukato",
"Duka la Vifaa vya Simu na Elektroniki",
"Duka la Samani na Vifaa vya Nyumbani",
"Duka la Vifaa vya Ujenzi (Hardware)",
"Kiosk / Kibanda cha Mtaa",

/* =====================================================
 B️⃣ CHAKULA & VINYWAJI
===================================================== */
"Huduma za Chakula cha Mtaa (Mama Lishe)",
"Huduma za Chakula cha Haraka",
"Huduma za Mgahawa",
"Huduma za Hoteli",
"Huduma za Vinywaji",
"Huduma za Catering na Matukio",

/* =====================================================
 C️⃣ HUDUMA ZA KILA SIKU
===================================================== */
"Huduma za Urembo (Salon & Kinyozi)",
"Huduma za Matengenezo ya Simu",
"Huduma za Matengenezo ya Vifaa vya Umeme",
"Huduma za Matengenezo ya Magari na Pikipiki",
"Huduma za Usafi (Car Wash & Laundry)",
"Huduma za Ulinzi",
"Huduma za Usambazaji wa Maji",

/* =====================================================
 D️⃣ TEKNOLOJIA & OFISI
===================================================== */
"Huduma za Mtandao na Ofisi",
"Huduma za Uchapishaji na Photocopy",
"Huduma za Ubunifu na Branding",
"Huduma za Media (Picha & Video)",
"Huduma za IT na Software",
"Biashara ya Vifaa vya Teknolojia",

/* =====================================================
 E️⃣ USAFIRI & LOGISTICS
===================================================== */
"Huduma za Usafiri wa Abiria",
"Huduma za Usafiri wa Mizigo",
"Huduma za Delivery na Courier",
"Biashara ya Vyombo vya Usafiri",
"Huduma za Matengenezo ya Vyombo",

/* =====================================================
 F️⃣ KILIMO & MIFUGO
===================================================== */
"Biashara ya Mazao ya Kilimo",
"Huduma za Kilimo cha Umwagiliaji",
"Biashara ya Mifugo",
"Huduma za Ufugaji wa Samaki",
"Duka la Pembezoni za Kilimo",

/* =====================================================
 G️⃣ UJENZI & MALI ISIYOHAMISHIKA
===================================================== */
"Huduma za Ujenzi",
"Huduma za Ufundi",
"Biashara ya Mali Isiyohamishika",

/* =====================================================
 H️⃣ AFYA
===================================================== */
"Duka la Dawa na Afya",
"Huduma za Afya Binafsi",
"Huduma za Maabara",

/* =====================================================
 I️⃣ FEDHA & MIKOPO
===================================================== */
"Huduma za Malipo ya Kidijitali",
"Huduma za Uwakala wa Fedha",
"Huduma za Akiba na Mikopo",
"Huduma za Bima",

/* =====================================================
 O️⃣ 🔥 WAKOPESHAJI WA VYOMBO (KUNDI MAALUM)
===================================================== */
"Mkopeshaji wa Vyombo vya Usafiri",
"Mkopeshaji wa Mashine za Biashara",
"Mkopeshaji wa Vifaa vya Kazi",
"Mkopeshaji wa Nishati (Solar & Generator)",

/* =====================================================
 P️⃣ BIASHARA ZA KISASA & ZINAZOIBUKA
===================================================== */
"Biashara ya Mtandaoni (Online Retail)",
"Huduma za Masoko ya Kidijitali",
"Huduma za Uzalishaji wa Maudhui",
"Huduma za Kukodisha Vifaa vya Biashara",
"Huduma za Nishati Mbadala",
"Huduma za Usimamizi wa Taka",
"Huduma za Usafi wa Mazingira",
];

async function seed() {
  try {
    console.log("⏳ Clearing previous categories...");
    await BusinessCategory.deleteMany({});

    console.log("⏳ Inserting normalized Tanzania business categories...");
    const docs = categories.map((name) => ({ name: name.trim() }));
    await BusinessCategory.insertMany(docs);

    console.log("✅ Successfully inserted", categories.length, "categories!");
  } catch (err) {
    console.error("❌ Error seeding categories:", err);
  } finally {
    mongoose.connection.close();
  }
}

seed();
