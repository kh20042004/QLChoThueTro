/**
 * ===================================
 * SMART SEARCH - Tìm kiếm thông minh
 * Phân tích ngôn ngữ tự nhiên đơn giản, nhanh
 * ===================================
 */

class SmartSearch {
  constructor() {
    this.properties = [];
  }

  /**
   * Parse câu tìm kiếm thành filters
   */
  parseQuery(query) {
    const filters = {
      propertyType: null,
      location: null,
      priceMin: null,
      priceMax: null,
      area: null,
      bedrooms: null,
      gender: null,
      amenities: []
    };

    const lowerQuery = query.toLowerCase();

    // === LOẠI PHÒNG ===
    if (lowerQuery.match(/phòng trọ|cho thuê phòng|thuê phòng/)) {
      filters.propertyType = 'Phòng trọ';
    } else if (lowerQuery.match(/nhà nguyên căn|nhà riêng|nhà|nguyên căn/)) {
      filters.propertyType = 'Nhà nguyên căn';
    } else if (lowerQuery.match(/căn hộ|chung cư|apartment/)) {
      filters.propertyType = 'Căn hộ';
    } else if (lowerQuery.match(/studio/)) {
      filters.propertyType = 'Studio';
    } else if (lowerQuery.match(/chung cư mini|cc mini|ccmini/)) {
      filters.propertyType = 'Chung cư mini';
    }

    // === VỊ TRÍ - TRƯỜNG ĐẠI HỌC ===
    const universities = {
      'bách khoa|bk|đhbk|bach khoa|hutech': ['Hồ Chí Minh', 'Thủ Đức'],
      'hutech|hu tech': ['Hồ Chí Minh', 'Bình Thạnh'],
      'văn lang|van lang|đhvl': ['Hồ Chí Minh', 'Bình Thạnh'],
      'tôn đức thắng|tdt|ton duc thang': ['Hồ Chí Minh', 'Quận 1'],
      'sư phạm|su pham|đhsp': ['Hồ Chí Minh', 'Quận 5'],
      'ueh|kinh tế|ktế|kinh te': ['Hồ Chí Minh', 'Bình Thạnh'],
      'khtn|khoa học tự nhiên': ['Hồ Chí Minh', 'Thủ Đức'],
      'ngoại ngữ|đhnn|nn': ['Hà Nội', 'Đống Đa']
    };

    for (const [keywords, locations] of Object.entries(universities)) {
      const regex = new RegExp(keywords, 'i');
      if (regex.test(lowerQuery)) {
        filters.location = locations[0]; // Lấy thành phố đầu tiên
        break;
      }
    }

    // === VỊ TRÍ - QUẬN/THÀNH PHỐ ===
    const cities = [
      'hà nội|ha noi|hn',
      'hồ chí minh|hcm|tp\\.?hcm|sài gòn|saigon|sg',
      'đà nẵng|da nang|dn',
      'cần thơ|can tho|ct',
      'hải phòng|hai phong|hp',
      'huế|hue',
      'nha trang',
      'vũng tàu|vung tau',
      'biên hòa|bien hoa|đồng nai'
    ];

    const cityMapping = {
      'hà nội': 'Hà Nội',
      'hồ chí minh': 'Hồ Chí Minh',
      'đà nẵng': 'Đà Nẵng',
      'cần thơ': 'Cần Thơ',
      'hải phòng': 'Hải Phòng',
      'huế': 'Thừa Thiên Huế',
      'nha trang': 'Khánh Hòa',
      'vũng tàu': 'Bà Rịa - Vũng Tàu',
      'biên hòa': 'Đồng Nai',
      'đồng nai': 'Đồng Nai'
    };

    if (!filters.location) {
      for (const cityPattern of cities) {
        const regex = new RegExp(cityPattern, 'i');
        const match = lowerQuery.match(regex);
        if (match) {
          const found = match[0].toLowerCase();
          for (const [key, value] of Object.entries(cityMapping)) {
            if (found.includes(key.replace(/\s/g, ''))) {
              filters.location = value;
              break;
            }
          }
          if (filters.location) break;
        }
      }
    }

    // === GIÁ ===
    // Format: "3tr", "3-4tr", "dưới 5tr", "từ 3 đến 5 triệu"
    const pricePatterns = [
      /(\d+)\s*-\s*(\d+)\s*(?:tr|triệu)/i,  // 3-4tr, 3-5 triệu
      /dưới\s*(\d+)\s*(?:tr|triệu)/i,       // dưới 5tr
      /trên\s*(\d+)\s*(?:tr|triệu)/i,       // trên 10tr
      /từ\s*(\d+)\s*đến\s*(\d+)\s*(?:tr|triệu)/i, // từ 3 đến 5 triệu
      /khoảng\s*(\d+)\s*(?:tr|triệu)/i      // khoảng 4tr
    ];

    for (const pattern of pricePatterns) {
      const match = lowerQuery.match(pattern);
      if (match) {
        if (pattern.toString().includes('dưới')) {
          filters.priceMax = parseFloat(match[1]);
        } else if (pattern.toString().includes('trên')) {
          filters.priceMin = parseFloat(match[1]);
        } else if (pattern.toString().includes('từ.*đến')) {
          filters.priceMin = parseFloat(match[1]);
          filters.priceMax = parseFloat(match[2]);
        } else if (pattern.toString().includes('-')) {
          filters.priceMin = parseFloat(match[1]);
          filters.priceMax = parseFloat(match[2]);
        } else {
          // Khoảng giá với margin ±0.5tr
          const price = parseFloat(match[1]);
          filters.priceMin = price - 0.5;
          filters.priceMax = price + 0.5;
        }
        break;
      }
    }

    // === DIỆN TÍCH ===
    const areaMatch = lowerQuery.match(/(\d+)\s*(?:m2|m²|mét)/i);
    if (areaMatch) {
      filters.area = parseFloat(areaMatch[1]);
    }

    // === PHÒNG NGỦ ===
    const bedroomMatch = lowerQuery.match(/(\d+)\s*(?:phòng ngủ|pn|bedroom)/i);
    if (bedroomMatch) {
      filters.bedrooms = parseInt(bedroomMatch[1]);
    }

    // === GIỚI TÍNH ===
    if (lowerQuery.match(/cho nữ|nữ sinh|sinh viên nữ|nữ|female|girl/)) {
      filters.gender = 'female';
    } else if (lowerQuery.match(/cho nam|nam sinh|sinh viên nam|nam|male|boy/)) {
      filters.gender = 'male';
    }

    // === TIỆN NGHI ===
    const amenityKeywords = {
      'wifi': /wifi|wi-fi|internet|mạng/i,
      'airConditioner': /điều hòa|điều hoà|máy lạnh|ac|air conditioner/i,
      'parking': /gửi xe|đỗ xe|bãi xe|chỗ đỗ xe|parking/i,
      'kitchen': /bếp|nấu ăn|nhà bếp|kitchen/i,
      'waterHeater': /nóng lạnh|bình nóng lạnh|nước nóng|water heater/i,
      'balcony': /ban công|ban công|balcony/i,
      'security': /bảo vệ|an ninh|security|camera/i,
      'laundry': /máy giặt|giặt|washing machine|laundry/i
    };

    for (const [key, pattern] of Object.entries(amenityKeywords)) {
      if (pattern.test(lowerQuery)) {
        filters.amenities.push(key);
      }
    }

    return filters;
  }

  /**
   * Lọc properties theo filters
   */
  filterProperties(properties, filters) {
    return properties.filter(property => {
      // Loại phòng
      if (filters.propertyType) {
        const propertyType = property.propertyType || '';
        const typeMapping = {
          'phong-tro': 'Phòng trọ',
          'nha-nguyen-can': 'Nhà nguyên căn',
          'can-ho': 'Căn hộ',
          'chung-cu-mini': 'Chung cư mini'
        };
        const normalizedType = typeMapping[propertyType] || propertyType;
        if (normalizedType !== filters.propertyType) return false;
      }

      // Vị trí
      if (filters.location) {
        const propertyCity = property.address?.city || property.location?.province || '';
        const normalizedCity = propertyCity.toLowerCase().replace(/\./g, '').replace(/tp\s*/g, '');
        const normalizedFilter = filters.location.toLowerCase().replace(/\./g, '').replace(/tp\s*/g, '');
        
        if (!normalizedCity.includes(normalizedFilter) && !normalizedFilter.includes(normalizedCity)) {
          return false;
        }
      }

      // Giá
      const priceInMillions = property.price / 1000000;
      if (filters.priceMin && priceInMillions < filters.priceMin) return false;
      if (filters.priceMax && priceInMillions > filters.priceMax) return false;

      // Diện tích
      if (filters.area) {
        const areaMargin = 10; // ±10m²
        if (Math.abs(property.area - filters.area) > areaMargin) return false;
      }

      // Phòng ngủ
      if (filters.bedrooms && property.bedrooms !== filters.bedrooms) return false;

      // Giới tính
      if (filters.gender && property.gender && property.gender !== 'both') {
        if (property.gender !== filters.gender) return false;
      }

      // Tiện nghi
      if (filters.amenities.length > 0) {
        for (const amenity of filters.amenities) {
          if (!property.amenities?.[amenity]) return false;
        }
      }

      return true;
    });
  }

  /**
   * Tính điểm relevance (độ phù hợp)
   */
  calculateRelevance(property, query, filters) {
    let score = 0;
    const lowerQuery = query.toLowerCase();

    // Title match
    const lowerTitle = (property.title || '').toLowerCase();
    if (lowerTitle.includes(lowerQuery)) score += 10;

    // Description match
    const lowerDesc = (property.description || '').toLowerCase();
    if (lowerDesc.includes(lowerQuery)) score += 5;

    // Location match
    if (filters.location) {
      const propertyCity = (property.address?.city || '').toLowerCase();
      if (propertyCity.includes(filters.location.toLowerCase())) score += 8;
    }

    // Price match
    if (filters.priceMin || filters.priceMax) {
      const priceInMillions = property.price / 1000000;
      if (filters.priceMin && priceInMillions >= filters.priceMin) score += 3;
      if (filters.priceMax && priceInMillions <= filters.priceMax) score += 3;
    }

    // Amenities match
    score += filters.amenities.filter(a => property.amenities?.[a]).length * 2;

    return score;
  }

  /**
   * Search properties
   */
  search(query, properties) {
    // Parse query
    const filters = this.parseQuery(query);
    
    // Filter properties
    let results = this.filterProperties(properties, filters);

    // Calculate relevance and sort
    results = results.map(property => ({
      ...property,
      _relevance: this.calculateRelevance(property, query, filters)
    })).sort((a, b) => b._relevance - a._relevance);

    return {
      query,
      filters,
      count: results.length,
      data: results
    };
  }

  /**
   * Generate search summary
   */
  generateSummary(filters) {
    const parts = [];

    if (filters.propertyType) parts.push(filters.propertyType);
    if (filters.location) parts.push(`gần ${filters.location}`);
    if (filters.priceMin && filters.priceMax) {
      parts.push(`${filters.priceMin}-${filters.priceMax} triệu`);
    } else if (filters.priceMax) {
      parts.push(`dưới ${filters.priceMax} triệu`);
    } else if (filters.priceMin) {
      parts.push(`trên ${filters.priceMin} triệu`);
    }
    if (filters.area) parts.push(`${filters.area}m²`);
    if (filters.bedrooms) parts.push(`${filters.bedrooms} phòng ngủ`);
    if (filters.gender === 'female') parts.push('cho nữ');
    if (filters.gender === 'male') parts.push('cho nam');
    if (filters.amenities.length > 0) {
      const amenityNames = {
        wifi: 'Wifi',
        airConditioner: 'Điều hòa',
        parking: 'Gửi xe',
        kitchen: 'Bếp',
        waterHeater: 'Nóng lạnh',
        balcony: 'Ban công',
        security: 'Bảo vệ',
        laundry: 'Máy giặt'
      };
      parts.push(filters.amenities.map(a => amenityNames[a]).join(', '));
    }

    return parts.length > 0 ? parts.join(', ') : 'Tất cả phòng';
  }
}

// Export
window.SmartSearch = SmartSearch;
