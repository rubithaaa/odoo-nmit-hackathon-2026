const express = require('express');
const router = express.Router();
const {
  getMyPayroll,
  getAllPayroll,
  getPayslipById,
  updateSalaryStructure,
  generatePayrollBatch,
} = require('../controllers/payrollController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.get('/my-payroll', getMyPayroll);
router.get('/all', authorize('admin'), getAllPayroll);
router.get('/slip/:id', getPayslipById);
router.put('/structure/:userId', authorize('admin'), updateSalaryStructure);
router.post('/generate-batch', authorize('admin'), generatePayrollBatch);

module.exports = router;
