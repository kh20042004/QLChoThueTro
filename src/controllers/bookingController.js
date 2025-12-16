const Booking = require('../models/Booking');
const Property = require('../models/Property');
const User = require('../models/User');
const Notification = require('../models/Notification');

/**
 * @desc    Get all bookings (Admin)
 * @route   GET /api/bookings/admin
 * @access  Private/Admin
 */
exports.getAllBookings = async (req, res) => {
    try {
        const { status, page = 1, limit = 10, search, date } = req.query;
        
        // Build filter
        const filter = {};
        if (status) filter.status = status;
        if (date) {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);
            filter.viewingDate = { $gte: startOfDay, $lte: endOfDay };
        }

        // Calculate pagination
        const skip = (page - 1) * limit;

        // Get bookings with populated data
        let query = Booking.find(filter)
            .populate('tenant', 'name email phone avatar')
            .populate('property', 'title address price images')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        let bookings = await query;

        // Search filter (if provided)
        if (search) {
            bookings = bookings.filter(booking => {
                const searchLower = search.toLowerCase();
                return (
                    booking.name?.toLowerCase().includes(searchLower) ||
                    booking.phone?.toLowerCase().includes(searchLower) ||
                    booking.tenant?.name?.toLowerCase().includes(searchLower) ||
                    booking.tenant?.email?.toLowerCase().includes(searchLower) ||
                    booking.property?.title?.toLowerCase().includes(searchLower)
                );
            });
        }

        // Get total count
        const total = await Booking.countDocuments(filter);

        // Get stats
        const stats = {
            total: await Booking.countDocuments(),
            pending: await Booking.countDocuments({ status: 'pending' }),
            confirmed: await Booking.countDocuments({ status: 'confirmed' }),
            cancelled: await Booking.countDocuments({ status: 'cancelled' }),
            completed: await Booking.countDocuments({ status: 'completed' })
        };

        res.json({
            success: true,
            data: bookings,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            },
            stats
        });
    } catch (error) {
        console.error('Error getting bookings:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy danh sách đặt phòng'
        });
    }
};

/**
 * @desc    Create new booking
 * @route   POST /api/bookings
 * @access  Private
 */
exports.createBooking = async (req, res) => {
    try {
        const { property, name, phone, viewingDate, viewingTime, note } = req.body;

        // Validate required fields
        if (!property || !name || !phone || !viewingDate || !viewingTime) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng điền đầy đủ thông tin'
            });
        }

        // Check if property exists
        const propertyExists = await Property.findById(property);
        if (!propertyExists) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bất động sản'
            });
        }

        // Check if property has landlord
        if (!propertyExists.landlord) {
            console.error('Property missing landlord:', property);
            return res.status(400).json({
                success: false,
                message: 'Bất động sản không có thông tin chủ nhà'
            });
        }

        // Check for duplicate booking
        const existingBooking = await Booking.findOne({
            tenant: req.user._id,
            property,
            viewingDate: new Date(viewingDate),
            status: { $in: ['pending', 'confirmed'] }
        });

        if (existingBooking) {
            return res.status(400).json({
                success: false,
                message: 'Bạn đã đặt lịch xem phòng này rồi'
            });
        }

        // Create booking
        const booking = await Booking.create({
            tenant: req.user._id,
            landlord: propertyExists.landlord,
            property,
            name,
            phone,
            viewingDate: new Date(viewingDate),
            viewingTime,
            note,
            status: 'pending'
        });

        // Populate tenant and property
        await booking.populate('tenant', 'name email phone');
        await booking.populate('property', 'title address price images');

        // Tạo thông báo cho chủ nhà
        try {
            await Notification.create({
                user: propertyExists.landlord,
                type: 'booking_new',
                title: 'Có lịch xem phòng mới',
                message: `${name} đã đặt lịch xem phòng "${propertyExists.title}" vào ${new Date(viewingDate).toLocaleDateString('vi-VN')} lúc ${viewingTime}`,
                link: `/landlord-bookings`,
                icon: 'fa-calendar-check',
                color: 'blue',
                data: {
                    bookingId: booking._id,
                    propertyId: property,
                    propertyTitle: propertyExists.title,
                    tenantName: name,
                    viewingDate: viewingDate,
                    viewingTime: viewingTime
                }
            });
        } catch (notifError) {
            console.error('❌ Error creating booking notification:', notifError);
        }

        res.status(201).json({
            success: true,
            message: 'Đặt lịch xem phòng thành công',
            data: booking
        });
    } catch (error) {
        console.error('Error creating booking:', error);
        console.error('Error stack:', error.stack);
        console.error('Error message:', error.message);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi tạo đặt phòng',
            error: error.message
        });
    }
};

/**
 * @desc    Get user's bookings with filters
 * @route   GET /api/bookings
 * @access  Private
 */
exports.getMyBookings = async (req, res) => {
    try {
        const { status, fromDate, toDate } = req.query;
        
        // Build filter
        const filter = { tenant: req.user._id };
        
        if (status) {
            filter.status = status;
        }
        
        if (fromDate || toDate) {
            filter.viewingDate = {};
            if (fromDate) {
                filter.viewingDate.$gte = new Date(fromDate);
            }
            if (toDate) {
                const endDate = new Date(toDate);
                endDate.setHours(23, 59, 59, 999);
                filter.viewingDate.$lte = endDate;
            }
        }

        const bookings = await Booking.find(filter)
            .populate('property', 'title address price images landlord')
            .populate('landlord', 'name phone email')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: bookings
        });
    } catch (error) {
        console.error('Error getting user bookings:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy danh sách đặt phòng'
        });
    }
};

/**
 * @desc    Get single booking
 * @route   GET /api/bookings/:id
 * @access  Private
 */
exports.getBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate('tenant', 'name email phone avatar')
            .populate('property', 'title address price images landlord');

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đặt phòng'
            });
        }

        // Check authorization
        if (booking.tenant._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền truy cập'
            });
        }

        res.json({
            success: true,
            data: booking
        });
    } catch (error) {
        console.error('Error getting booking:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy thông tin đặt phòng'
        });
    }
};

/**
 * @desc    Update booking status
 * @route   PUT /api/bookings/:id/status
 * @access  Private/Admin
 */
exports.updateBookingStatus = async (req, res) => {
    try {
        const { status } = req.body;

        if (!['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Trạng thái không hợp lệ'
            });
        }

        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đặt phòng'
            });
        }

        const oldStatus = booking.status;
        booking.status = status;
        await booking.save();

        await booking.populate('tenant', 'name email phone');
        await booking.populate('property', 'title address price');

        // Tạo thông báo cho người thuê khi trạng thái thay đổi
        if (oldStatus !== status && booking.tenant) {
            try {
                let notifTitle = '';
                let notifMessage = '';
                let notifType = '';
                let notifColor = 'blue';
                let notifIcon = 'fa-calendar';

                if (status === 'confirmed') {
                    notifType = 'booking_confirmed';
                    notifTitle = 'Lịch xem phòng được chấp nhận';
                    notifMessage = `Chủ nhà đã chấp nhận lịch xem phòng "${booking.property.title}" của bạn vào ${new Date(booking.viewingDate).toLocaleDateString('vi-VN')} lúc ${booking.viewingTime}`;
                    notifColor = 'green';
                    notifIcon = 'fa-check-circle';
                } else if (status === 'cancelled') {
                    notifType = 'booking_cancelled';
                    notifTitle = 'Lịch xem phòng bị hủy';
                    notifMessage = `Chủ nhà đã hủy lịch xem phòng "${booking.property.title}" của bạn`;
                    notifColor = 'red';
                    notifIcon = 'fa-times-circle';
                } else if (status === 'completed') {
                    notifType = 'booking_completed';
                    notifTitle = 'Lịch xem phòng đã hoàn thành';
                    notifMessage = `Lịch xem phòng "${booking.property.title}" đã hoàn thành. Hãy để lại đánh giá!`;
                    notifColor = 'green';
                    notifIcon = 'fa-star';
                }

                if (notifType) {
                    await Notification.create({
                        user: booking.tenant._id,
                        type: notifType,
                        title: notifTitle,
                        message: notifMessage,
                        link: `/bookings`,
                        icon: notifIcon,
                        color: notifColor,
                        data: {
                            bookingId: booking._id,
                            propertyId: booking.property._id,
                            propertyTitle: booking.property.title,
                            status: status
                        }
                    });
                }
            } catch (notifError) {
                console.error('❌ Error creating status change notification:', notifError);
            }
        }

        res.json({
            success: true,
            message: 'Cập nhật trạng thái thành công',
            data: booking
        });
    } catch (error) {
        console.error('Error updating booking status:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi cập nhật trạng thái'
        });
    }
};

/**
 * @desc    Update booking (cancel or update status)
 * @route   PUT /api/bookings/:id
 * @access  Private
 */
exports.updateBooking = async (req, res) => {
    try {
        const { status, cancelReason } = req.body;
        
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đặt phòng'
            });
        }

        // Check authorization
        if (booking.tenant.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền thay đổi đặt phòng này'
            });
        }

        // Validate status transitions
        if (status === 'cancelled') {
            if (booking.status === 'completed') {
                return res.status(400).json({
                    success: false,
                    message: 'Không thể hủy đặt phòng đã hoàn thành'
                });
            }
            booking.status = 'cancelled';
            if (cancelReason) {
                booking.cancelReason = cancelReason;
            }

            // Thông báo cho chủ nhà khi người thuê hủy
            try {
                await booking.populate('property', 'title');
                await Notification.create({
                    user: booking.landlord,
                    type: 'booking_cancelled_by_tenant',
                    title: 'Người thuê đã hủy lịch xem',
                    message: `${booking.name} đã hủy lịch xem phòng "${booking.property.title}".${cancelReason ? ` Lý do: ${cancelReason}` : ''}`,
                    link: `/landlord-bookings`,
                    icon: 'fa-calendar-times',
                    color: 'orange',
                    data: {
                        bookingId: booking._id,
                        propertyId: booking.property._id,
                        propertyTitle: booking.property.title,
                        cancelReason: cancelReason
                    }
                });
            } catch (notifError) {
                console.error('❌ Error creating cancellation notification:', notifError);
            }
        } else if (status) {
            booking.status = status;
        }

        await booking.save();

        // Populate đầy đủ thông tin trước khi trả về
        if (!booking.property || typeof booking.property === 'string') {
            await booking.populate('property', 'title address price images');
        }
        if (!booking.landlord || typeof booking.landlord === 'string') {
            await booking.populate('landlord', 'name phone email');
        }

        res.json({
            success: true,
            message: 'Cập nhật đặt phòng thành công',
            data: booking
        });
    } catch (error) {
        console.error('Error updating booking:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi cập nhật đặt phòng'
        });
    }
};

/**
 * @desc    Delete booking (Admin only)
 * @route   DELETE /api/bookings/:id/delete
 * @access  Private/Admin
 */
exports.deleteBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đặt phòng'
            });
        }

        await booking.deleteOne();

        res.json({
            success: true,
            message: 'Xóa đặt phòng thành công'
        });
    } catch (error) {
        console.error('Error deleting booking:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi xóa đặt phòng'
        });
    }
};

/**
 * @desc    Get landlord bookings (bookings for properties owned by current user)
 * @route   GET /api/bookings/landlord
 * @access  Private
 */
exports.getLandlordBookings = async (req, res) => {
    try {
        const userId = req.user._id;
        
        // Get all properties owned by this user
        const properties = await Property.find({ landlord: userId }).select('_id');
        const propertyIds = properties.map(p => p._id);
        
        // Get all bookings for these properties
        const bookings = await Booking.find({ property: { $in: propertyIds } })
            .populate('property', 'title address price images priceUnit')
            .populate('tenant', 'name email phone avatar')
            .sort({ createdAt: -1 });
        
        // Format the response to match frontend expectations
        const formattedBookings = bookings.map(booking => ({
            _id: booking._id,
            property: booking.property,
            visitorName: booking.name || (booking.tenant ? booking.tenant.name : ''),
            visitorPhone: booking.phone || (booking.tenant ? booking.tenant.phone : ''),
            visitorEmail: booking.tenant ? booking.tenant.email : '',
            visitDate: booking.viewingDate || booking.createdAt,
            visitTime: booking.viewingTime || 'Chưa xác định',
            message: booking.note || '',
            status: booking.status,
            createdAt: booking.createdAt,
            updatedAt: booking.updatedAt
        }));
        
        res.json({
            success: true,
            data: formattedBookings
        });
    } catch (error) {
        console.error('Error getting landlord bookings:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy danh sách lịch hẹn'
        });
    }
};
