const Tour = require('./../models/tourModel');
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

// const tours = JSON.parse(fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`, 'utf-8'));

exports.aliasTopTours = (req, res, next) => {
    req.query.limit = '5';
    req.query.sort = '-ratingsAverage,price';
    req.query.fields = 'name,price,ratingsAverage,summary,difficulty';

    next();
};

exports.getAllTours = catchAsync(async (req, res, next) => {
    console.log(req.query);

    // METHODS FOR QUERY:
    // query.sort().select().skip().limit()
    // EXECUTE QUERY
    const features = new APIFeatures(Tour.find(), req.query).filter().sort().limitFields().paginate();
    const tours = await features.query;

    // SEND RESPONSE
    res.status(200).json({
        status: 'succes',
        results: tours.length,
        data: {
            tours
        }
    });
});
  
exports.getTour = catchAsync(async (req, res, next) => {
    // cu req.params luam parametrul :id din url de exemplu www.example.com/example/5
    // Daca dupa un parametru de ex :x urmeaza ? (:x?) atunci parametrul e pus optional in url, si functioneaza si fara
    const tour = await Tour.findById(req.params.id);

    if(!tour) {
       return next(new AppError('No tour found with that ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: tour
    });
});

exports.createTour = catchAsync(async (req, res, next) => {
        // const newTour = new Tour({});
    // newTour.save();
    // SAU: 
    const newTour = await Tour.create(req.body);


    res.status(201).json({
        status: 'success',
        data: {
            tour: newTour
        }
    });
});

exports.updateTour = catchAsync(async (req, res, next) => {
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
        new: true, // folosim true cand vrem findByIdAnd.. sa returneze ceva intr-o variabila
        runValidators: true // folosim true cand vrem sa verifice daca datele sunt bune inainte de update (conform validators)
    });

    if(!tour) {
        return next(new AppError('No tour found with that ID', 404));
     }

    res.status(200).json({
        status: 'success',
        data: {
            tour
        }
    });
});
  
exports.deleteTour = catchAsync(async (req, res, next) => {
    const tour = await Tour.findByIdAndDelete(req.params.id);

    if(!tour) {
        return next(new AppError('No tour found with that ID', 404));
     }

    res.status(204).json({
        status: 'success',
        data: null
    })
});

exports.getTourStats = catchAsync(async (req, res, next) => {
    const stats = await Tour.aggregate([
        {
            $match: { ratingsAverage: { $gte: 4.5 } }
        },
        {
            $group: {
                _id: { $toUpper: '$difficulty'},
                // _id: '$difficulty',
                numTours: { $sum: 1 },
                numRatings: { $sum: '$ratingsQuantity' },
                avgRating: { $avg: '$ratingsAverage' },
                avgPrice: { $avg: '$price' },
                minPrice: { $min: '$price' },
                maxPrice: { $max: '$price' },
            }
        },
        {
            $sort: { avgPrice: 1 }
        }
        // {
        //     $match: { _id: { $ne: 'EASY' } }
        //     // $ne = not equal
        // }
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            stats
        }
    })
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
    const year = req.params.year * 1;

    const plan = await Tour.aggregate([
        {
            $unwind: '$startDates'
        },
        {
            $match: {
                startDates: {
                    $gte: new Date(`${year}-01-01`),
                    $lte: new Date(`${year}-12-31`),
                }
            }
        },
        {
            $group: {
                _id: { $month: '$startDates' },
                numTourStarts: { $sum: 1 },
                tours: { $push: '$name' }
            }
        },
        {
            $addFields: { month: '$_id' }
        },
        {
            $project: {
                // 1 - field ul va aparea, la 0 campul nu apare
                _id: 0
            }
        },
        {
            // -1 descrescator, 1 crescator
            $sort: { numTourStarts: -1 }
        },
        {
            $limit: 12
        }
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            plan
        }
    })
});