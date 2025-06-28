import PickupPoint from '../models/PickupPoint.js';

// Get all pickup points
export const getPickupPoints = async (req, res) => {
  try {
    const { city, region, latitude, longitude, radius = 10 } = req.query;

    let filter = { isActive: true };

    // Filter by city or region
    if (city) filter['address.city'] = new RegExp(city, 'i');
    if (region) filter['address.region'] = new RegExp(region, 'i');

    let pickupPoints;

    // If coordinates provided, search by location
    if (latitude && longitude) {
      pickupPoints = await PickupPoint.find({
        ...filter,
        'address.coordinates': {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [parseFloat(longitude), parseFloat(latitude)]
            },
            $maxDistance: parseInt(radius) * 1000 // Convert km to meters
          }
        }
      }).populate('manager', 'firstName lastName phone');
    } else {
      pickupPoints = await PickupPoint.find(filter)
        .populate('manager', 'firstName lastName phone')
        .sort({ 'address.city': 1, name: 1 });
    }

    res.status(200).json({
      status: 'success',
      data: { pickupPoints }
    });

  } catch (error) {
    console.error('Ошибка получения точек выдачи:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};

// Get pickup point by ID
export const getPickupPoint = async (req, res) => {
  try {
    const { id } = req.params;

    const pickupPoint = await PickupPoint.findOne({ _id: id, isActive: true })
      .populate('manager', 'firstName lastName phone email');

    if (!pickupPoint) {
      return res.status(404).json({
        status: 'error',
        message: 'Точка выдачи не найдена'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { pickupPoint }
    });

  } catch (error) {
    console.error('Ошибка получения точки выдачи:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};

// Create pickup point (admin only)
export const createPickupPoint = async (req, res) => {
  try {
    const pickupPoint = await PickupPoint.create(req.body);

    res.status(201).json({
      status: 'success',
      message: 'Точка выдачи создана',
      data: { pickupPoint }
    });

  } catch (error) {
    console.error('Ошибка создания точки выдачи:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};

// Update pickup point (admin only)
export const updatePickupPoint = async (req, res) => {
  try {
    const { id } = req.params;

    const pickupPoint = await PickupPoint.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!pickupPoint) {
      return res.status(404).json({
        status: 'error',
        message: 'Точка выдачи не найдена'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Точка выдачи обновлена',
      data: { pickupPoint }
    });

  } catch (error) {
    console.error('Ошибка обновления точки выдачи:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};

// Delete pickup point (admin only)
export const deletePickupPoint = async (req, res) => {
  try {
    const { id } = req.params;

    const pickupPoint = await PickupPoint.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!pickupPoint) {
      return res.status(404).json({
        status: 'error',
        message: 'Точка выдачи не найдена'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Точка выдачи удалена'
    });

  } catch (error) {
    console.error('Ошибка удаления точки выдачи:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};