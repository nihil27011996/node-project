const express = require('express');
const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController');

const router = express.Router();

// router.param('id', tourController.checkID);

router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats);
router.route('/monthly-plan/:year').get(tourController.getMonthlyPlan);

router.use(authController.protect);

router
  .route('/')
  .get(tourController.getAllTours)
  .post(tourController.createTour);

router.get('/:id', tourController.getTour);

router.use(authController.restrictTo('admin', 'guide'));

router
  .route('/:id')

  .patch(tourController.updateTour)
  .delete(tourController.deleteTour);

module.exports = router;
