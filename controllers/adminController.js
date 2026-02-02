  const adminService = require("../services/adminService");
const controlNumberService = require("../services/controlNumberService");

class AdminController {

  // 1️⃣ BLOCK USER
  async blockUser(req, res) {
    try {
      const { userId } = req.params;
      const user = await adminService.blockUser(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
      res.json({ success: true, data: user });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // 🔎 GET SINGLE AGENT DETAILS (✅ ADD-ONLY & FIXED)
  async getAgentDetails(req, res) {
    try {
      const { agentId } = req.params;

      // ✅ METHOD ILIYOPO KWENYE SERVICE
      const agent = await adminService.getAgentById(agentId);

      if (!agent) {
        return res.status(404).json({
          success: false,
          message: "Agent not found",
        });
      }

      res.json({ success: true, data: agent });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // 2️⃣ UNBLOCK USER
  async unblockUser(req, res) {
    try {
      const { userId } = req.params;
      const user = await adminService.unblockUser(userId);
      res.json({ success: true, data: user });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // 3️⃣ GET ALL AGENTS
  async getAllAgents(req, res) {
    try {
      const agents = await adminService.getAllAgents();
      res.json({ success: true, total: agents.length, data: agents });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // 4️⃣ APPROVE AGENT
  async approveAgent(req, res) {
    try {
      const { agentId } = req.params;
      const agent = await adminService.approveAgent(agentId);
      res.json({ success: true, data: agent });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // 5️⃣ SUSPEND AGENT
  async suspendAgent(req, res) {
    try {
      const { agentId } = req.params;
      const agent = await adminService.suspendAgent(agentId);
      res.json({ success: true, data: agent });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // 6️⃣ SYSTEM STATS
  async getSystemStats(req, res) {
    try {
      const stats = await adminService.getSystemStats();
      res.json({ success: true, data: stats });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // 7️⃣ AGENTS BY CATEGORY
  async getAgentsByCategory(req, res) {
    try {
      const { categoryId } = req.params;
      const agents = await adminService.getAgentsByCategory(categoryId);
      res.json({ success: true, total: agents.length, data: agents });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // 8️⃣ DELETE USER
  async deleteUser(req, res) {
    try {
      const { userId } = req.params;
      const result = await adminService.deleteUser(userId);
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // 9️⃣ GET ALL CUSTOMERS
  async getAllCustomers(req, res) {
    try {
      const customers = await adminService.getAllCustomers();
      res.json({ success: true, total: customers.length, data: customers });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // 🔟 CUSTOMER PROFILE
  async getCustomerProfile(req, res) {
    try {
      const { customerId } = req.params;
      const customer = await adminService.getCustomerProfile(customerId);
      res.json({ success: true, data: customer });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // 1️⃣1️⃣ ALL LOANS
  async getAllLoans(req, res) {
    try {
      const loans = await adminService.getAllLoans(req.query);
      res.json({ success: true, total: loans.length, data: loans });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // 1️⃣2️⃣ LOAN DETAILS
  async getLoanDetails(req, res) {
    try {
      const { loanId } = req.params;
      const details = await adminService.getLoanDetails(loanId);
      if (!details) {
        return res.status(404).json({ success: false, message: "Loan not found" });
      }
      res.json({ success: true, data: details });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // 1️⃣3️⃣ FORCE CLOSE LOAN
  async forceCloseLoan(req, res) {
    try {
      const { loanId } = req.params;
      const { reason } = req.body;
      const loan = await adminService.forceCloseLoan(loanId, reason);
      res.json({ success: true, data: loan });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // 1️⃣4️⃣ OVERDUE LOANS
  async getOverdueLoans(req, res) {
    try {
      const loans = await adminService.getOverdueLoans();
      res.json({ success: true, total: loans.length, data: loans });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // 1️⃣5️⃣ REVENUE REPORT
  async getRevenueReport(req, res) {
    try {
      const report = await adminService.getRevenueReport(req.query);
      res.json({ success: true, data: report });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // 1️⃣6️⃣ AUDIT LOGS
  async getAuditLogs(req, res) {
    try {
      const logs = await adminService.getAuditLogs(req.query);
      res.json({ success: true, total: logs.length, data: logs });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // 🚨 DELETE AGENT
  async deleteAgent(req, res) {
    try {
      const { agentId } = req.params;
      const { reason } = req.body;
      const result = await adminService.deleteAgent(agentId, reason);
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
   
  // 🚨 DELETE CUSTOMER
  async deleteCustomer(req, res) {
    try {
      const { customerId } = req.params;
      const { reason } = req.body;
      const result = await adminService.deleteCustomer(customerId, reason);
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  // 🚨 DELETE LOAN
  async deleteLoan(req, res) {
    try {
      const { loanId } = req.params;
      const { reason } = req.body;
      const result = await adminService.deleteLoan(loanId, reason);
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
}

module.exports = new AdminController();
