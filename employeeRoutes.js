const express = require('express');
const router = express.Router();
const {
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  createEmployee,
  toggleEmployeeStatus,
} = require('../controllers/employeeController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.route('/')
  .get(getAllEmployees)
  .post(authorize('admin'), createEmployee);

router.route('/:id')
  .get(getEmployeeById)
  .put(updateEmployee);

router.patch('/:id/status', authorize('admin'), toggleEmployeeStatus);

module.exports = router;
