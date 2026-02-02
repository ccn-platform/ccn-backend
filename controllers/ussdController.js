// controllers/ussdController.js

const ussdService = require("../services/ussdService");

/**
 * ======================================================
 * USSD CONTROLLER — CCN (*212*88#)
 * ======================================================
 *
 * Expected provider payload (standard):
 * - sessionId
 * - phoneNumber
 * - text
 *
 * Response format:
 * - CON <message>
 * - END <message>
 */

exports.handleUssd = async (req, res) => {
  try {
    /**
     * Providers tofauti hutuma payload kwa majina tofauti,
     * hivyo tunazi-support zote bila kuvunja chochote.
     */
    const sessionId =
      req.body.sessionId ||
      req.body.session_id ||
      req.body.SESSIONID ||
      "";

    const phoneNumber =
      req.body.phoneNumber ||
      req.body.msisdn ||
      req.body.MSISDN ||
      "";

    const text =
      req.body.text ||
      req.body.ussdString ||
      req.body.USSDSTRING ||
      "";

    const result = await ussdService.handleUssd({
      sessionId,
      phoneNumber,
      text,
    });

    /**
     * USSD providers wanahitaji plain text response
     */
    return res
      .status(200)
      .set("Content-Type", "text/plain")
      .send(`${result.type} ${result.message}`);
  } catch (error) {
    return res
      .status(200)
      .set("Content-Type", "text/plain")
      .send("END Hitilafu ya mfumo, jaribu tena baadaye.");
  }
};
