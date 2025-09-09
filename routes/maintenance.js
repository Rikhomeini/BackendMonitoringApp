// routes/maintenance.js
const express = require('express');
const router = express.Router();

// GET /api/maintenance - Get all maintenance records
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 1,
        machineId: 'machine-001',
        maintenanceType: 'routine',
        scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'scheduled',
        technician: 'John Doe'
      }
    ],
    message: 'Maintenance records retrieved successfully'
  });
});

// GET /api/maintenance/:id - Get specific maintenance record
router.get('/:id', (req, res) => {
  res.json({
    success: true,
    data: {
      id: req.params.id,
      machineId: 'machine-001',
      maintenanceType: 'routine',
      scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'scheduled',
      technician: 'John Doe',
      description: 'Regular maintenance check'
    },
    message: 'Maintenance record retrieved successfully'
  });
});

// POST /api/maintenance - Create new maintenance record
router.post('/', (req, res) => {
  res.json({
    success: true,
    data: {
      id: Math.floor(Math.random() * 1000),
      ...req.body,
      createdAt: new Date(),
      status: 'scheduled'
    },
    message: 'Maintenance record created successfully'
  });
});

// PUT /api/maintenance/:id - Update maintenance record
router.put('/:id', (req, res) => {
  res.json({
    success: true,
    data: {
      id: req.params.id,
      ...req.body,
      updatedAt: new Date()
    },
    message: 'Maintenance record updated successfully'
  });
});

// DELETE /api/maintenance/:id - Delete maintenance record
router.delete('/:id', (req, res) => {
  res.json({
    success: true,
    message: `Maintenance record ${req.params.id} deleted successfully`,
    deletedId: req.params.id
  });
});

module.exports = router;