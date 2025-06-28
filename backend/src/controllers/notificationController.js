import Notification from '../models/Notification.js';

// Get user notifications
export const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, isRead, type } = req.query;

    const filter = { recipient: req.user.id };
    if (isRead !== undefined) filter.isRead = isRead === 'true';
    if (type) filter.type = type;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Notification.countDocuments(filter);
    const unreadCount = await Notification.countDocuments({
      recipient: req.user.id,
      isRead: false
    });

    res.status(200).json({
      status: 'success',
      data: {
        notifications,
        unreadCount,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Ошибка получения уведомлений:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipient: req.user.id },
      { 
        isRead: true,
        readAt: new Date()
      },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        status: 'error',
        message: 'Уведомление не найдено'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Уведомление отмечено как прочитанное',
      data: { notification }
    });

  } catch (error) {
    console.error('Ошибка отметки уведомления:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, isRead: false },
      { 
        isRead: true,
        readAt: new Date()
      }
    );

    res.status(200).json({
      status: 'success',
      message: 'Все уведомления отмечены как прочитанные'
    });

  } catch (error) {
    console.error('Ошибка отметки всех уведомлений:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};

// Delete notification
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOneAndDelete({
      _id: id,
      recipient: req.user.id
    });

    if (!notification) {
      return res.status(404).json({
        status: 'error',
        message: 'Уведомление не найдено'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Уведомление удалено'
    });

  } catch (error) {
    console.error('Ошибка удаления уведомления:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};

// Create notification (admin/system)
export const createNotification = async (req, res) => {
  try {
    const notification = await Notification.create(req.body);

    res.status(201).json({
      status: 'success',
      message: 'Уведомление создано',
      data: { notification }
    });

  } catch (error) {
    console.error('Ошибка создания уведомления:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};

// Send notification to user
export const sendNotification = async (userId, notificationData) => {
  try {
    const notification = await Notification.create({
      recipient: userId,
      ...notificationData
    });

    // Here you could add real-time notification via WebSocket
    // or push notification service

    return notification;

  } catch (error) {
    console.error('Ошибка отправки уведомления:', error);
    throw error;
  }
};

// Send bulk notifications
export const sendBulkNotifications = async (req, res) => {
  try {
    const { recipients, notification } = req.body;

    const notifications = recipients.map(recipientId => ({
      recipient: recipientId,
      ...notification
    }));

    await Notification.insertMany(notifications);

    res.status(201).json({
      status: 'success',
      message: `Отправлено ${notifications.length} уведомлений`
    });

  } catch (error) {
    console.error('Ошибка массовой отправки уведомлений:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};