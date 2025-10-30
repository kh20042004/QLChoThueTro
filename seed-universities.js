/**
 * ===================================
 * SEED UNIVERSITIES DATA
 * Import 10 trường đại học hàng đầu TP.HCM
 * ===================================
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('./src/config/database');
const University = require('./src/models/University');
const colors = require('./src/config/colors');

// Danh sách 10 trường đại học TP.HCM
const universitiesData = [
  {
    ranking: 1,
    name: 'Trường Đại học Ngân hàng TP. Hồ Chí Minh',
    shortName: 'HUB',
    type: 'Công lập',
    address: '36 Tôn Thất Đạm, Phường Nguyễn Thai Bình, Quận 1',
    district: 'Quận 1',
    phone: '(028) 3829 3844',
    email: 'hub@hub.edu.vn',
    website: 'https://hub.edu.vn',
    foundedYear: 2010,
    studentCount: 15000,
    facultyCount: 8,
    description: 'Trường Đại học Ngân hàng TP. Hồ Chí Minh (HUB) là một trường đại học công lập trực thuộc Ngân hàng Nhà nước Việt Nam, nổi tiếng về đào tạo các ngành tài chính - ngân hàng, kinh tế và quản trị kinh doanh. Các ngành mạnh và uy tín nhất của trường bao gồm Tài chính - Ngân hàng, Kế toán và Quản trị kinh doanh. Đặc biệt, ngành Tài chính - Ngân hàng và Kế toán của trường đã được kiểm định và đạt chứng nhận AUN-QA. Theo bảng xếp hạng các trường đại học Việt Nam năm 2022, HUB xếp hạng 63 toàn quốc. Trường có đội ngũ giảng viên chất lượng cao với gần 500 cán bộ, trong đó có 15 Phó Giáo sư, 93 Tiến sĩ và 250 Thạc sĩ.',
    specialties: ['Tài chính ngân hàng', 'Kế toán', 'Quản trị kinh doanh', 'Kinh tế'],
    location: { type: 'Point', coordinates: [106.6970, 10.7707] },
    programs: [
      {
        name: 'Chương trình đại học chính quy chuẩn',
        tuition: '10.557.000 đồng/học kỳ (năm 2024-2025)',
        majors: [
          'Tài chính - Ngân hàng',
          'Kế toán',
          'Kiểm toán (mới)',
          'Hệ thống thông tin quản lý',
          'Kinh doanh quốc tế',
          'Marketing',
          'Công nghệ tài chính',
          'Kinh tế quốc tế',
          'Luật kinh tế',
          'Ngôn ngữ Anh',
          'Khoa học dữ liệu',
          'Logistics và Quản lý chuỗi cung ứng',
          'Thương mại điện tử (mới)',
          'Luật (mới)',
          'Trí tuệ nhân tạo (mới)'
        ],
        description: 'Tăng khoảng 50% so với năm 2023-2024 (7.050.000 đồng/học kỳ)'
      },
      {
        name: 'Chương trình chất lượng cao (tiếng Anh bán phần)',
        tuition: '20.267.500 đồng/học kỳ (năm 2024-2025)',
        majors: [
          'Tài chính - Ngân hàng',
          'Kế toán',
          'Quản trị kinh doanh',
          'Hệ thống thông tin quản lý',
          'Kinh tế quốc tế',
          'Ngôn ngữ Anh (chương trình đặc biệt)',
          'Luật kinh tế'
        ],
        description: 'Tăng khoảng 12% so với năm 2023-2024 (18.000.000 đồng/học kỳ)'
      },
      {
        name: 'Chương trình quốc tế cấp song bằng',
        tuition: '27.000.000 đồng/học kỳ (năm 2024-2025)',
        majors: [
          'Quản trị kinh doanh (ĐH Bolton - Anh cấp bằng)',
          'Tài chính - Ngân hàng (ĐH Toulon - Pháp cấp bằng)'
        ],
        description: 'Tổng học phí toàn khóa: 216.5 triệu đồng. Tăng khoảng 2% so với năm 2023-2024'
      },
      {
        name: 'Chương trình cử nhân Pathway (du học chuyển tiếp)',
        tuition: 'Giai đoạn 1: khoảng 100 triệu đồng/2 năm (học tại HUB)',
        majors: ['Chuyển tiếp sang các trường đối tác ở Úc, Anh, New Zealand'],
        description: 'Học 2 năm tại HUB và chuyển tiếp du học nước ngoài. Giai đoạn 2: Học phí tùy theo từng trường đối tác'
      }
    ],
    admissionInfo: {
      methods: [
        'Xét tuyển thẳng và ưu tiên xét tuyển theo quy chế của Bộ GD&ĐT',
        'Xét tuyển tổng hợp kết quả học tập THPT (Điểm TB ≥ 6.5, Điểm quy đổi ≥ 72)',
        'Xét tuyển dựa vào kết quả thi V-SAT năm 2025',
        'Xét tuyển dựa vào kết quả thi tốt nghiệp THPT năm 2025 (Ngưỡng: 18 điểm)',
        'Xét tuyển học bạ THPT và phỏng vấn (chương trình quốc tế)'
      ],
      requirements: [
        'Tốt nghiệp THPT hoặc tương đương',
        'Điểm trung bình học tập từ 6.5 trở lên',
        'Đáp ứng điểm chuẩn theo từng phương thức'
      ],
      examSubjects: [
        'A00: Toán, Vật lý, Hóa học',
        'A01: Toán, Vật lý, Tiếng Anh',
        'A03: Toán, Vật lý, Lịch sử',
        'A04: Toán, Vật lý, Địa lý',
        'A05: Toán, Hóa học, Lịch sử',
        'A07: Toán, Lịch sử, Địa lý',
        'D01: Ngữ văn, Toán, Tiếng Anh',
        'D07: Toán, Hóa học, Tiếng Anh',
        'D09: Toán, Lịch sử, Tiếng Anh',
        'D10: Toán, Địa lý, Tiếng Anh',
        'D14: Ngữ văn, Lịch sử, Tiếng Anh',
        'D15: Ngữ văn, Địa lý, Tiếng Anh'
      ],
      priority: 'Xét tuyển tổng hợp > V-SAT > Kết quả thi THPT',
      description: 'HUB sử dụng 5 phương thức xét tuyển với 12 tổ hợp môn. Phương thức xét tuyển tổng hợp và V-SAT là phương thức xét tuyển sớm, được thực hiện trước thời điểm xét tuyển bằng điểm thi tốt nghiệp THPT.'
    },
    admissionScores: [
      { major: 'Kinh doanh quốc tế', score: '26.36', year: 2024 },
      { major: 'Marketing', score: '26.10', year: 2024 },
      { major: 'Logistics và Quản lý chuỗi cung ứng', score: '25.80', year: 2024 },
      { major: 'Kinh tế quốc tế', score: '25.50', year: 2024 },
      { major: 'Tài chính - Ngân hàng', score: '25.47', year: 2024 },
      { major: 'Công nghệ tài chính', score: '25.43', year: 2024 },
      { major: 'Kế toán', score: '25.29', year: 2024 },
      { major: 'Hệ thống thông tin quản lý', score: '25.24', year: 2024 },
      { major: 'Ngôn ngữ Anh', score: '25.05', year: 2024 },
      { major: 'Quản trị kinh doanh', score: '24.80', year: 2024 },
      { major: 'Khoa học dữ liệu', score: '24.75', year: 2024 },
      { major: 'Quốc tế cấp song bằng - Quản trị kinh doanh', score: '24.50', year: 2024 },
      { major: 'Luật kinh tế', score: '24.35', year: 2024 },
      { major: 'Tài chính - Ngân hàng (CLC)', score: '24.10', year: 2024 },
      { major: 'Ngôn ngữ Anh (Đặc biệt)', score: '24.05', year: 2024 }
    ],
    changes2025: 'Năm 2025, HUB mở thêm 4 ngành đào tạo mới: Trí tuệ nhân tạo, Kiểm toán, Thương mại điện tử và Luật. Trường cung cấp học bổng đầu vào cho tân sinh viên, học bổng học tập xuất sắc mỗi học kỳ và học bổng tham gia khóa nghiên cứu ngắn hạn tại Đại học Quốc gia Singapore. Sinh viên từ năm 2 có cơ hội đăng ký Chương trình cử nhân Pathway để du học chuyển tiếp tại các trường đối tác ở Úc, Anh, New Zealand.'
  },
  {
    ranking: 2,
    name: 'Trường Đại học Giao thông vận tải',
    shortName: 'UTC',
    type: 'Công lập',
    address: '450-451 Lê Văn Việt, Phường Tăng Nhơn Phú A, Thành phố Thủ Đức',
    district: 'Thành phố Thủ Đức',
    phone: '(028) 3896 5426',
    email: 'dhgtvt@utc.edu.vn',
    website: 'https://utc.edu.vn',
    foundedYear: 1962,
    studentCount: 25000,
    facultyCount: 12,
    description: 'Trường Đại học Giao thông vận tải (UTC) là trường đại học công lập hàng đầu Việt Nam trong lĩnh vực giao thông vận tải. UTC nổi tiếng về đào tạo các ngành kỹ thuật và công nghệ liên quan đến giao thông vận tải. Các ngành mạnh và uy tín nhất của trường bao gồm: Kỹ thuật xây dựng công trình giao thông, Logistics và quản lý chuỗi cung ứng, và Kỹ thuật cơ khí động lực. Theo bảng xếp hạng QS Asia University Rankings năm 2025, UTC được xếp hạng trong nhóm 481-490 các trường đại học hàng đầu châu Á, tăng 170 bậc so với năm trước. Trường cũng nằm trong top 11 các trường đại học tốt nhất Việt Nam và top 83 trường đại học hàng đầu khu vực Đông Nam Á.',
    specialties: ['Kỹ thuật xây dựng', 'Logistics', 'Kỹ thuật cơ khí', 'Quản lý chuỗi cung ứng'],
    location: { type: 'Point', coordinates: [106.7628, 10.8509] }
  },
  {
    ranking: 3,
    name: 'Trường Đại Học Mỹ Thuật TPHCM',
    shortName: 'HCMUFA',
    type: 'Công lập',
    address: '1522 Huỳnh Tấn Phát, Phường Phú Mỹ, Quận 7',
    district: 'Quận 7',
    phone: '(028) 3771 4000',
    email: 'hcmufa@hcmufa.edu.vn',
    website: 'https://hcmufa.edu.vn',
    foundedYear: 1913,
    studentCount: 3500,
    facultyCount: 5,
    description: 'Trường Đại học Mỹ thuật TP.HCM (HCMUFA) là một trong những trường đại học hàng đầu về đào tạo mỹ thuật tại Việt Nam. Trường nổi tiếng về chất lượng đào tạo và truyền thống lâu đời trong lĩnh vực nghệ thuật tạo hình. Các ngành nổi tiếng và mạnh nhất của trường bao gồm: Hội họa, Đồ họa tạo hình và Điêu khắc. Trong các bảng xếp hạng đại học, HCMUFA thường nằm trong top 10 trường đại học về đào tạo mỹ thuật và nghệ thuật tại Việt Nam. Trường có lịch sử lâu đời từ năm 1913 và đã đào tạo ra nhiều họa sĩ, nghệ sĩ tài năng cho đất nước. HCMUFA cũng được đánh giá cao về cơ sở vật chất, đội ngũ giảng viên giàu kinh nghiệm và chương trình đào tạo cập nhật.',
    specialties: ['Nghệ thuật', 'Thiết kế', 'Hội họa', 'Đồ họa', 'Điêu khắc'],
    location: { type: 'Point', coordinates: [106.7195, 10.7321] }
  },
  {
    ranking: 4,
    name: 'Học viện Kỹ thuật Mật mã',
    shortName: 'KMA',
    type: 'Công lập',
    address: '141 Chiến Thắng, Phường Tân Triều, Quận Tân Phú',
    district: 'Quận Tân Phú',
    phone: '(028) 3815 5052',
    email: 'kma@acrypt.edu.vn',
    website: 'https://acrypt.edu.vn',
    foundedYear: 2004,
    studentCount: 5000,
    facultyCount: 6,
    description: 'Học viện Kỹ thuật Mật mã (KMA) là một trường đại học công lập trực thuộc Ban Cơ yếu Chính phủ, nổi tiếng về đào tạo các ngành liên quan đến an ninh mạng, mật mã và công nghệ thông tin. Học viện là cơ sở duy nhất tại Việt Nam đào tạo chuyên sâu về kỹ thuật mật mã, và được chính phủ chọn là một trong 8 cơ sở trọng điểm đào tạo nhân lực an toàn thông tin quốc gia. Các ngành mạnh và uy tín nhất của KMA bao gồm: An toàn thông tin, Công nghệ thông tin và Kỹ thuật điện tử - viễn thông. Học viện đặt mục tiêu đến năm 2030 sẽ nằm trong top 10 trường đại học định hướng ứng dụng hàng đầu Việt Nam và nhóm đầu về đào tạo an toàn thông tin trong khu vực.',
    specialties: ['An ninh mạng', 'Mật mã', 'An toàn thông tin', 'Công nghệ thông tin', 'Điện tử viễn thông'],
    location: { type: 'Point', coordinates: [106.6273, 10.7967] }
  },
  {
    ranking: 5,
    name: 'Trường Đại học Kinh tế - Tài chính TP.HCM',
    shortName: 'UEF',
    type: 'Tư thục',
    address: '141-145 Điện Biên Phủ, Phường Đakao, Quận 1',
    district: 'Quận 1',
    phone: '(028) 3930 0124',
    email: 'info@uef.edu.vn',
    website: 'https://uef.edu.vn',
    foundedYear: 2005,
    studentCount: 20000,
    facultyCount: 10,
    description: 'Trường Đại học Kinh tế - Tài chính TP.HCM (UEF) nổi tiếng về đào tạo các ngành thuộc lĩnh vực kinh tế, tài chính và quản trị kinh doanh theo chuẩn quốc tế. UEF có thế mạnh về chương trình đào tạo song ngữ, chú trọng thực hành và hợp tác doanh nghiệp. Các ngành nổi bật nhất của trường bao gồm: Tài chính (xếp hạng 38 thế giới theo ShanghaiRanking 2024), Kinh tế (xếp hạng 201-300 thế giới) và Quản trị kinh doanh (xếp hạng 301-400 thế giới). Ngoài ra, UEF cũng được xếp hạng thứ 9 trong các trường đại học tại Việt Nam và đứng đầu các trường đại học về kinh tế, quản lý, kinh doanh theo bảng xếp hạng Webometrics.',
    specialties: ['Kinh tế', 'Tài chính', 'Quản trị kinh doanh', 'Kế toán'],
    location: { type: 'Point', coordinates: [106.6928, 10.7883] }
  },
  {
    ranking: 6,
    name: 'Trường Đại học Khoa học Xã hội và Nhân văn ĐHQG TPHCM',
    shortName: 'USSH',
    type: 'Công lập',
    address: '10-12 Đinh Tiên Hoàng, Phường Bến Nghé, Quận 1',
    district: 'Quận 1',
    phone: '(028) 3829 8433',
    email: 'ussh@hcmussh.edu.vn',
    website: 'https://hcmussh.edu.vn',
    foundedYear: 1957,
    studentCount: 12000,
    facultyCount: 15,
    description: 'Trường Đại học Khoa học Xã hội và Nhân văn, ĐHQG TP.HCM (VNUHCM-USSH) nổi tiếng là trung tâm đào tạo và nghiên cứu hàng đầu về khoa học xã hội và nhân văn ở miền Nam Việt Nam. Trường có thế mạnh về các ngành khoa học xã hội, ngôn ngữ, văn hóa và truyền thông. Các ngành nổi tiếng và uy tín nhất của trường bao gồm: Báo chí, Quan hệ quốc tế và Việt Nam học. Trường thường xuyên nằm trong top 5 trường đại học hàng đầu Việt Nam và top 1000 trường đại học tốt nhất thế giới theo các bảng xếp hạng uy tín như QS World University Rankings. Trường cũng được xếp vào nhóm 801-1000 trường đại học tốt nhất thế giới về lĩnh vực Khoa học xã hội theo Times Higher Education World University Rankings.',
    specialties: ['Khoa học xã hội', 'Báo chí', 'Quan hệ quốc tế', 'Việt Nam học', 'Ngôn ngữ'],
    location: { type: 'Point', coordinates: [106.7027, 10.7756] }
  },
  {
    ranking: 7,
    name: 'Trường Đại học Sư phạm Kỹ thuật Thành phố Hồ Chí Minh',
    shortName: 'HCMUTE',
    type: 'Công lập',
    address: '01 Võ Văn Ngân, Phường Linh Chiểu, Thành phố Thủ Đức',
    district: 'Thành phố Thủ Đức',
    phone: '(028) 3897 2092',
    email: 'hcmute@hcmute.edu.vn',
    website: 'https://hcmute.edu.vn',
    foundedYear: 1962,
    studentCount: 30000,
    facultyCount: 18,
    description: 'Trường Đại học Sư phạm Kỹ thuật Thành phố Hồ Chí Minh (HCMUTE) là một trong những đại học hàng đầu về các ngành kỹ thuật, công nghệ và sư phạm kỹ thuật ở miền Nam Việt Nam. Trường nổi tiếng đặc biệt với các chương trình đào tạo ứng dụng thực tiễn và các ngành công nghệ tiên tiến. Những ngành nổi bật nhất tại HCMUTE bao gồm Công nghệ kỹ thuật ô tô, đứng đầu về số sinh viên theo học, Sư phạm tiếng Anh, và Kinh doanh quốc tế với điểm chuẩn hàng đầu trong trường. Theo các bảng xếp hạng gần đây, HCMUTE nằm trong top 10 trường đại học tốt nhất tại Việt Nam theo Webometrics và cũng có ngành Kỹ thuật Dầu khí lọt vào top 101-150 trên bảng xếp hạng toàn cầu của QS.',
    specialties: ['Kỹ thuật kỹ sư', 'Công nghệ ô tô', 'Sư phạm kỹ thuật', 'Kinh doanh quốc tế'],
    location: { type: 'Point', coordinates: [106.7717, 10.8501] }
  },
  {
    ranking: 8,
    name: 'Trường Đại học An ninh Nhân dân',
    shortName: 'VPSU',
    type: 'Công lập',
    address: '125 Trần Quang Khải, Phường Tân Định, Quận 1',
    district: 'Quận 1',
    phone: '(028) 3824 8481',
    email: 'daihocanninhndvn@mps.gov.vn',
    website: 'https://vpsu.edu.vn',
    foundedYear: 1975,
    studentCount: 8000,
    facultyCount: 10,
    description: 'Trường Đại học An ninh Nhân dân (VPSU) là một trong những trường công an nhân dân hàng đầu của Việt Nam, nổi tiếng về đào tạo các chuyên ngành nghiệp vụ an ninh và cảnh sát. Trường được biết đến với chất lượng đào tạo cao, cơ sở vật chất hiện đại và đội ngũ giảng viên giàu kinh nghiệm trong lĩnh vực an ninh. Các ngành nổi bật và uy tín nhất của trường bao gồm: Trinh sát An ninh, Điều tra Hình sự và An ninh mạng và phòng chống tội phạm sử dụng công nghệ cao. Mặc dù không được xếp hạng chính thức trong các bảng xếp hạng đại học thông thường do tính chất đặc thù, VPSU vẫn được coi là một trong những cơ sở đào tạo hàng đầu về an ninh, quốc phòng của Việt Nam.',
    specialties: ['An ninh', 'Công an', 'Quân sự', 'An ninh mạng', 'Điều tra hình sự'],
    location: { type: 'Point', coordinates: [106.6927, 10.7916] }
  },
  {
    ranking: 9,
    name: 'Trường Đại học Ngoại ngữ - Tin học TP.HCM',
    shortName: 'HUFLIT',
    type: 'Tư thục',
    address: '155 Sư Vạn Hạnh, Phường 12, Quận 10',
    district: 'Quận 10',
    phone: '(028) 3862 8011',
    email: 'info@huflit.edu.vn',
    website: 'https://huflit.edu.vn',
    foundedYear: 1995,
    studentCount: 18000,
    facultyCount: 8,
    description: 'Trường Đại học Ngoại ngữ - Tin học TP.HCM (HUFLIT) nổi tiếng về đào tạo các ngành ngoại ngữ, công nghệ thông tin và kinh doanh. HUFLIT là một trong những trường đại học dân lập uy tín hàng đầu tại Việt Nam trong các lĩnh vực này. Các ngành mạnh và nổi tiếng nhất của trường bao gồm: Ngôn ngữ Anh, Công nghệ thông tin và Quản trị kinh doanh. Theo bảng xếp hạng Webometrics năm 2022, HUFLIT xếp hạng thứ 23 trong các trường đại học tại Việt Nam. Trường được đánh giá cao về chất lượng đào tạo, đội ngũ giảng viên giỏi và chương trình học được cập nhật liên tục theo xu hướng thị trường và khung giáo dục quốc tế. HUFLIT cũng có mạng lưới liên kết rộng với các doanh nghiệp và trường đại học trong nước và quốc tế.',
    specialties: ['Ngôn ngữ', 'Tiếng Anh', 'Công nghệ thông tin', 'Quản trị kinh doanh'],
    location: { type: 'Point', coordinates: [106.6643, 10.7714] }
  },
  {
    ranking: 10,
    name: 'Trường Đại Học Công Thương TPHCM',
    shortName: 'HUIT',
    type: 'Công lập',
    address: '140 Lê Trọng Tấn, Phường Tây Thạnh, Quận Tân Phú',
    district: 'Quận Tân Phú',
    phone: '(028) 3816 5673',
    email: 'huit@huit.edu.vn',
    website: 'https://huit.edu.vn',
    foundedYear: 1982,
    studentCount: 22000,
    facultyCount: 14,
    description: 'Trường Đại học Công Thương TP.HCM (HUIT) là một trường đại học công lập nổi tiếng về đào tạo trong lĩnh vực công nghiệp và thương mại. Trường được thành lập từ năm 1982, hiện có 34 ngành đào tạo đại học và nổi bật với các ngành như Công nghệ thực phẩm, Marketing và Quản trị kinh doanh. Chế độ học tập và nghiên cứu tại đây được đánh giá cao với nhiều chương trình chất lượng, trong đó ngành Công nghệ thực phẩm luôn duy trì điểm chuẩn cao nhất. Về xếp hạng, HUIT đứng thứ 47 trong bảng xếp hạng các trường đại học tại Việt Nam năm 2025, cho thấy vị trí đáng kể và mức độ uy tín trong hệ thống giáo dục đại học Việt Nam hiện nay.',
    specialties: ['Kỹ thuật kỹ sư', 'Công nghệ thực phẩm', 'Marketing', 'Quản trị kinh doanh'],
    location: { type: 'Point', coordinates: [106.6273, 10.7867] }
  },
  {
    ranking: 11,
    name: 'Trường Đại học Khoa học Tự nhiên ĐHQG TPHCM',
    shortName: 'HCMUS',
    type: 'Công lập',
    address: '227 Nguyễn Văn Cừ, Phường 4, Quận 5',
    district: 'Quận 5',
    phone: '(028) 3835 1002',
    email: 'hcmus@hcmus.edu.vn',
    website: 'https://hcmus.edu.vn',
    foundedYear: 1957,
    studentCount: 18000,
    facultyCount: 16,
    description: 'Trường Đại học Khoa học Tự nhiên, ĐHQG TP.HCM (HCMUS) là một trong những trường đại học hàng đầu Việt Nam về khoa học tự nhiên và công nghệ. Trường nổi tiếng với chất lượng đào tạo cao trong các lĩnh vực toán học, vật lý, hóa học, sinh học và công nghệ thông tin. HCMUS được xếp hạng trong top 3 trường đại học tốt nhất Việt Nam và nằm trong nhóm 500 trường đại học hàng đầu châu Á theo QS Rankings. Trường có đội ngũ giảng viên uy tín với nhiều giáo sư, phó giáo sư và tiến sĩ đầu ngành. Sinh viên HCMUS thường đạt thành tích cao tại các kỳ thi Olympic quốc tế và có tỷ lệ việc làm cao sau tốt nghiệp.',
    specialties: ['Toán học', 'Vật lý', 'Hóa học', 'Sinh học', 'Công nghệ thông tin', 'Khoa học máy tính'],
    location: { type: 'Point', coordinates: [106.6631, 10.7625] }
  },
  {
    ranking: 12,
    name: 'Trường Đại học Bách Khoa ĐHQG TPHCM',
    shortName: 'HCMUT',
    type: 'Công lập',
    address: '268 Lý Thường Kiệt, Phường 14, Quận 10',
    district: 'Quận 10',
    phone: '(028) 3864 7256',
    email: 'daihoc@hcmut.edu.vn',
    website: 'https://hcmut.edu.vn',
    foundedYear: 1957,
    studentCount: 35000,
    facultyCount: 20,
    description: 'Trường Đại học Bách Khoa, ĐHQG TP.HCM (HCMUT) là trường đại học kỹ thuật hàng đầu Việt Nam với lịch sử gần 70 năm đào tạo. HCMUT nổi tiếng về chất lượng đào tạo các ngành kỹ thuật, công nghệ cao và được biết đến là "Đại học Bách Khoa TP.HCM". Trường thường xuyên nằm trong top 2 trường đại học tốt nhất Việt Nam và top 400 trường công nghệ hàng đầu thế giới. Các ngành mạnh của trường bao gồm: Kỹ thuật cơ khí, Kỹ thuật điện - điện tử, Công nghệ thông tin, Kỹ thuật hóa học và Kỹ thuật xây dựng. Sinh viên HCMUT được các doanh nghiệp trong và ngoài nước đánh giá cao về kiến thức chuyên môn và kỹ năng thực hành.',
    specialties: ['Kỹ thuật cơ khí', 'Kỹ thuật điện', 'Công nghệ thông tin', 'Kỹ thuật xây dựng', 'Kỹ thuật hóa học'],
    location: { type: 'Point', coordinates: [106.6598, 10.7721] }
  },
  {
    ranking: 13,
    name: 'Trường Đại học Kinh tế ĐHQG TPHCM',
    shortName: 'UEH',
    type: 'Công lập',
    address: '59C Nguyễn Đình Chiểu, Phường Võ Thị Sáu, Quận 3',
    district: 'Quận 3',
    phone: '(028) 3930 0998',
    email: 'ueh@ueh.edu.vn',
    website: 'https://ueh.edu.vn',
    foundedYear: 1976,
    studentCount: 40000,
    facultyCount: 18,
    description: 'Trường Đại học Kinh tế TP.HCM (UEH) là trường đại học kinh tế hàng đầu khu vực phía Nam với hơn 45 năm kinh nghiệm đào tạo. UEH nổi tiếng về các chương trình đào tạo kinh tế, quản trị kinh doanh và tài chính theo chuẩn quốc tế. Trường được xếp hạng trong top 5 trường đại học tốt nhất Việt Nam và top 500 trường kinh tế hàng đầu thế giới theo QS Rankings. UEH có mạng lưới liên kết rộng với hơn 200 trường đại học và tổ chức quốc tế. Các ngành đào tạo mạnh của trường bao gồm: Kinh tế học, Tài chính - Ngân hàng, Quản trị kinh doanh, Kế toán và Kiểm toán. Tỷ lệ sinh viên UEH có việc làm sau 6 tháng tốt nghiệp đạt trên 90%.',
    specialties: ['Kinh tế học', 'Tài chính ngân hàng', 'Quản trị kinh doanh', 'Kế toán', 'Marketing'],
    location: { type: 'Point', coordinates: [106.6910, 10.7881] }
  },
  {
    ranking: 14,
    name: 'Trường Đại học Sư phạm TPHCM',
    shortName: 'HCMUE',
    type: 'Công lập',
    address: '280 An Dương Vương, Phường 4, Quận 5',
    district: 'Quận 5',
    phone: '(028) 3835 5271',
    email: 'dhsp@hcmue.edu.vn',
    website: 'https://hcmue.edu.vn',
    foundedYear: 1957,
    studentCount: 25000,
    facultyCount: 22,
    description: 'Trường Đại học Sư phạm TP.HCM (HCMUE) là trường sư phạm hàng đầu khu vực phía Nam với 65 năm lịch sử đào tạo. Trường chuyên đào tạo giáo viên chất lượng cao cho các cấp học từ mầm non đến trung học phổ thông. HCMUE được xếp hạng trong top 10 trường đại học tốt nhất Việt Nam và là trường sư phạm đa ngành có uy tín nhất miền Nam. Các ngành đào tạo mạnh của trường bao gồm: Sư phạm Toán, Sư phạm Văn, Sư phạm Anh, Sư phạm Hóa, Sư phạm Sinh và Giáo dục Mầm non. Trường có đội ngũ giảng viên giàu kinh nghiệm với nhiều nhà giáo ưu tú, giáo sư và phó giáo sư. Sinh viên tốt nghiệp HCMUE được đánh giá cao về năng lực sư phạm và chuyên môn.',
    specialties: ['Sư phạm', 'Giáo dục', 'Sư phạm toán', 'Sư phạm văn', 'Sư phạm anh'],
    location: { type: 'Point', coordinates: [106.6508, 10.7538] }
  },
  {
    ranking: 15,
    name: 'Trường Đại học Công nghệ Thông tin ĐHQG TPHCM',
    shortName: 'UIT',
    type: 'Công lập',
    address: 'Khu phố 6, Phường Linh Trung, Thành phố Thủ Đức',
    district: 'Thành phố Thủ Đức',
    phone: '(028) 3725 2002',
    email: 'uit@uit.edu.vn',
    website: 'https://uit.edu.vn',
    foundedYear: 2006,
    studentCount: 15000,
    facultyCount: 12,
    description: 'Trường Đại học Công nghệ Thông tin, ĐHQG TP.HCM (UIT) là trường chuyên về công nghệ thông tin hàng đầu Việt Nam. Mặc dù còn trẻ so với các trường khác, UIT đã nhanh chóng khẳng định vị thế với chất lượng đào tạo xuất sắc trong lĩnh vực CNTT. Trường được xếp hạng trong top 15 trường đại học công nghệ tốt nhất Việt Nam và có nhiều sinh viên đạt giải cao tại các cuộc thi lập trình quốc tế. Các ngành đào tạo nổi bật của UIT bao gồm: Khoa học máy tính, Kỹ thuật phần mềm, An toàn thông tin, Trí tuệ nhân tạo và Khoa học dữ liệu. UIT có quan hệ hợp tác chặt chẽ với các công ty công nghệ lớn như Google, Microsoft, FPT và Viettel, tạo cơ hội thực tập và việc làm tốt cho sinh viên.',
    specialties: ['Công nghệ thông tin', 'Khoa học máy tính', 'An toàn thông tin', 'Trí tuệ nhân tạo', 'Khoa học dữ liệu'],
    location: { type: 'Point', coordinates: [106.8030, 10.8700] }
  },
  {
    ranking: 16,
    name: 'Trường Đại học Y Dược TPHCM',
    shortName: 'UMP',
    type: 'Công lập',
    address: '217 Hồng Bàng, Phường 11, Quận 5',
    district: 'Quận 5',
    phone: '(028) 3855 4269',
    email: 'ump@ump.edu.vn',
    website: 'https://ump.edu.vn',
    foundedYear: 1976,
    studentCount: 12000,
    facultyCount: 14,
    description: 'Trường Đại học Y Dược TP.HCM (UMP) là cơ sở đào tạo y dược hàng đầu khu vực phía Nam Việt Nam với gần 50 năm kinh nghiệm. Trường đào tạo bác sĩ, dược sĩ và các chuyên ngành y tế chất lượng cao, đáp ứng nhu cầu chăm sóc sức khỏe của xã hội. UMP được xếp hạng trong top 3 trường y dược tốt nhất Việt Nam và có nhiều chương trình đào tạo đạt chuẩn quốc tế. Các ngành đào tạo mạnh của trường bao gồm: Y khoa, Dược học, Y học cổ truyền, Điều dưỡng và Y tế công cộng. Trường có đội ngũ giảng viên là các bác sĩ, dược sĩ giàu kinh nghiệm lâm sàng và hệ thống bệnh viện, phòng khám thực hành hiện đại. Sinh viên tốt nghiệp UMP có tỷ lệ việc làm cao và được đánh giá cao về chuyên môn.',
    specialties: ['Y khoa', 'Dược học', 'Y học cổ truyền', 'Điều dưỡng', 'Y tế công cộng'],
    location: { type: 'Point', coordinates: [106.6562, 10.7599] }
  },
  {
    ranking: 17,
    name: 'Trường Đại học Luật TPHCM',
    shortName: 'HCMULAW',
    type: 'Công lập',
    address: '02 Nguyễn Tất Thành, Phường 12, Quận 4',
    district: 'Quận 4',
    phone: '(028) 3940 8924',
    email: 'hcmulaw@hcmulaw.edu.vn',
    website: 'https://hcmulaw.edu.vn',
    foundedYear: 1996,
    studentCount: 16000,
    facultyCount: 10,
    description: 'Trường Đại học Luật TP.HCM (HCMULAW) là trường luật hàng đầu khu vực phía Nam, chuyên đào tạo cử nhân luật, luật sư và các chuyên gia pháp lý chất lượng cao. Trường được thành lập năm 1996 và nhanh chóng trở thành một trong những cơ sở đào tạo luật uy tín nhất Việt Nam. HCMULAW được xếp hạng trong top 5 trường luật tốt nhất Việt Nam với nhiều chương trình đào tạo đạt chuẩn AUN-QA. Các ngành đào tạo nổi bật của trường bao gồm: Luật kinh tế, Luật dân sự, Luật hình sự, Luật quốc tế và Luật tư pháp. Trường có đội ngũ giảng viên là các luật sư, thẩm phán, kiểm sát viên giàu kinh nghiệm thực tiễn. Sinh viên HCMULAW thường đạt kết quả cao trong kỳ thi tuyển luật sư và có cơ hội việc làm tốt tại các văn phòng luật, tòa án, viện kiểm sát và doanh nghiệp.',
    specialties: ['Luật', 'Luật kinh tế', 'Luật dân sự', 'Luật hình sự', 'Luật quốc tế'],
    location: { type: 'Point', coordinates: [106.7057, 10.7569] }
  },
  {
    ranking: 18,
    name: 'Trường Đại học Tôn Đức Thắng',
    shortName: 'TDTU',
    type: 'Công lập',
    address: '19 Nguyễn Hữu Thọ, Phường Tân Phong, Quận 7',
    district: 'Quận 7',
    phone: '(028) 3775 5037',
    email: 'info@tdtu.edu.vn',
    website: 'https://tdtu.edu.vn',
    foundedYear: 1997,
    studentCount: 32000,
    facultyCount: 16,
    description: 'Trường Đại học Tôn Đức Thắng (TDTU) là một trong những trường đại học công lập phát triển nhanh nhất Việt Nam với cơ sở vật chất hiện đại bậc nhất. Trường được xếp hạng trong top 10 trường đại học tốt nhất Việt Nam và top 500 trường đại học châu Á theo QS Rankings. TDTU nổi tiếng với mô hình đào tạo định hướng ứng dụng, chú trọng kỹ năng thực hành và liên kết chặt chẽ với doanh nghiệp. Các ngành mạnh của trường bao gồm: Kỹ thuật điện - điện tử, Công nghệ thông tin, Quản trị kinh doanh, Kế toán và Luật. TDTU có cơ sở vật chất khang trang với thư viện hiện đại, phòng thí nghiệm tiên tiến và ký túc xá đạt chuẩn quốc tế. Trường cũng có nhiều chương trình liên kết quốc tế và tỷ lệ sinh viên có việc làm sau tốt nghiệp đạt trên 85%.',
    specialties: ['Kỹ thuật điện', 'Công nghệ thông tin', 'Quản trị kinh doanh', 'Kế toán', 'Luật'],
    location: { type: 'Point', coordinates: [106.7022, 10.7311] }
  },
  {
    ranking: 19,
    name: 'Trường Đại học Văn Lang',
    shortName: 'VLU',
    type: 'Tư thục',
    address: '45 Nguyễn Khắc Nhu, Phường Cô Giang, Quận 1',
    district: 'Quận 1',
    phone: '(028) 3838 8805',
    email: 'info@vanlanguni.edu.vn',
    website: 'https://vanlanguni.edu.vn',
    foundedYear: 1995,
    studentCount: 28000,
    facultyCount: 14,
    description: 'Trường Đại học Văn Lang (VLU) là một trong những trường đại học tư thục uy tín hàng đầu tại TP.HCM với gần 30 năm phát triển. VLU được xếp hạng trong top 15 trường đại học tốt nhất Việt Nam và là trường tư thục có số lượng sinh viên đông nhất cả nước. Trường nổi tiếng với chất lượng đào tạo đa ngành, cơ sở vật chất hiện đại và môi trường học tập năng động. Các ngành đào tạo mạnh của VLU bao gồm: Kiến trúc, Thiết kế đồ họa, Công nghệ thông tin, Quản trị kinh doanh, Kế toán và Truyền thông đa phương tiện. VLU có nhiều cơ sở đào tạo hiện đại tại các quận trung tâm TP.HCM với trang thiết bị tiên tiến. Trường chú trọng đào tạo kỹ năng thực hành và có mạng lưới liên kết rộng với doanh nghiệp, tạo cơ hội thực tập và việc làm cho sinh viên.',
    specialties: ['Kiến trúc', 'Thiết kế', 'Công nghệ thông tin', 'Quản trị kinh doanh', 'Truyền thông'],
    location: { type: 'Point', coordinates: [106.6925, 10.7649] }
  },
  {
    ranking: 20,
    name: 'Trường Đại học Hồng Bàng',
    shortName: 'HBU',
    type: 'Tư thục',
    address: '215 Điện Biên Phủ, Phường 15, Quận Bình Thạnh',
    district: 'Quận Bình Thạnh',
    phone: '(028) 3512 3188',
    email: 'info@hbu.edu.vn',
    website: 'https://hbu.edu.vn',
    foundedYear: 1997,
    studentCount: 20000,
    facultyCount: 12,
    description: 'Trường Đại học Hồng Bàng (HBU) là trường đại học tư thục uy tín tại TP.HCM với hơn 25 năm kinh nghiệm đào tạo. Trường được biết đến với chất lượng đào tạo tốt trong các lĩnh vực kỹ thuật, công nghệ và kinh tế. HBU được xếp hạng trong top 20 trường đại học tốt nhất Việt Nam và là một trong những trường tư thục có uy tín cao nhất cả nước. Các ngành đào tạo mạnh của trường bao gồm: Kỹ thuật xây dựng, Công nghệ thông tin, Kế toán, Quản trị kinh doanh và Logistics. HBU có cơ sở vật chất khang trang với các phòng thí nghiệm, xưởng thực hành hiện đại. Trường chú trọng đào tạo theo định hướng thực tiễn với nhiều chương trình liên kết doanh nghiệp. Tỷ lệ sinh viên HBU có việc làm sau tốt nghiệp đạt trên 80%.',
    specialties: ['Kỹ thuật xây dựng', 'Công nghệ thông tin', 'Kế toán', 'Quản trị kinh doanh', 'Logistics'],
    location: { type: 'Point', coordinates: [106.7074, 10.8022] }
  },
  {
    ranking: 21,
    name: 'Trường Đại học FPT TP.HCM',
    shortName: 'FPT HCM',
    type: 'Tư thục',
    address: 'Lô E2a-7, Đường D1, Khu Công nghệ cao, Thành phố Thủ Đức',
    district: 'Thành phố Thủ Đức',
    phone: '(028) 7300 5588',
    email: 'daihocfpt@fpt.edu.vn',
    website: 'https://hcm.fpt.edu.vn',
    foundedYear: 2006,
    studentCount: 16000,
    facultyCount: 8,
    description: 'Trường Đại học FPT TP.HCM là cơ sở đào tạo công nghệ thông tin hàng đầu Việt Nam, trực thuộc Tập đoàn FPT. Trường nổi tiếng với mô hình đào tạo độc đáo "Học đi đôi với hành", chú trọng thực hành dự án thực tế ngay từ năm nhất. ĐH FPT được xếp hạng trong top 15 trường CNTT tốt nhất Việt Nam với tỷ lệ sinh viên có việc làm 100% trước khi tốt nghiệp. Các ngành đào tạo mạnh bao gồm: Kỹ thuật phần mềm, An toàn thông tin, Trí tuệ nhân tạo, Thiết kế đồ họa số và Kinh doanh quốc tế. Trường có cơ sở vật chất hiện đại tại Khu Công nghệ cao TP.HCM, quan hệ chặt chẽ với các công ty công nghệ lớn trong và ngoài nước.',
    specialties: ['Kỹ thuật phần mềm', 'An toàn thông tin', 'Trí tuệ nhân tạo', 'Thiết kế đồ họa', 'Kinh doanh quốc tế'],
    location: { type: 'Point', coordinates: [106.8070, 10.8412] },
    programs: [
      {
        name: 'Chương trình đại học chính quy',
        tuition: '19.500.000 đồng/học kỳ (năm 2024-2025)',
        majors: ['Kỹ thuật phần mềm', 'An toàn thông tin', 'Trí tuệ nhân tạo', 'Thiết kế đồ họa số', 'Marketing', 'Kinh doanh quốc tế', 'Quản trị kinh doanh', 'Ngôn ngữ Anh', 'Ngôn ngữ Nhật', 'Ngôn ngữ Hàn'],
        description: 'Học phí ổn định, có thể trả góp qua 3 đợt trong học kỳ'
      },
      {
        name: 'Chương trình đào tạo quốc tế',
        tuition: '27.000.000 đồng/học kỳ',
        majors: ['Software Engineering (ĐH Greenwich - Anh)', 'Information Technology (ĐH Carnegie Mellon - Mỹ)'],
        description: 'Cấp bằng quốc tế, toàn bộ bằng tiếng Anh'
      }
    ],
    admissionScores: [
      { major: 'Kỹ thuật phần mềm', score: '24.50', year: 2024 },
      { major: 'An toàn thông tin', score: '24.20', year: 2024 },
      { major: 'Trí tuệ nhân tạo', score: '24.00', year: 2024 },
      { major: 'Thiết kế đồ họa số', score: '23.50', year: 2024 },
      { major: 'Kinh doanh quốc tế', score: '23.00', year: 2024 }
    ],
    changes2025: 'Năm 2025, FPT tiếp tục mở rộng chương trình học bổng toàn phần cho thí sinh có thành tích xuất sắc. Trường cung cấp học bổng 100% học phí cho thí sinh đạt 27 điểm trở lên và học bổng 50% cho thí sinh đạt từ 24-26.99 điểm. Sinh viên được đảm bảo việc làm tại hệ sinh thái FPT sau khi tốt nghiệp.'
  },
  {
    ranking: 22,
    name: 'Trường Đại học Quốc tế - ĐHQG TPHCM',
    shortName: 'HCMIU',
    type: 'Công lập',
    address: 'Khu phố 6, Phường Linh Trung, Thành phố Thủ Đức',
    district: 'Thành phố Thủ Đức',
    phone: '(028) 3724 4270',
    email: 'info@hcmiu.edu.vn',
    website: 'https://hcmiu.edu.vn',
    foundedYear: 2003,
    studentCount: 6000,
    facultyCount: 10,
    description: 'Trường Đại học Quốc tế, ĐHQG TP.HCM (HCMIU) là trường đại học công lập đào tạo hoàn toàn bằng tiếng Anh theo chuẩn quốc tế. Trường được thành lập với sứ mệnh tạo ra một thế hệ công dân toàn cầu có trình độ chuyên môn cao. HCMIU được xếp hạng trong top 10 trường đại học tốt nhất Việt Nam với các chương trình đạt chuẩn AUN-QA và ABET. Các ngành đào tạo mạnh bao gồm: Kỹ thuật Cơ điện tử, Kỹ thuật Sinh học, Công nghệ thông tin, Quản trị kinh doanh và Quan hệ quốc tế. Trường có đội ngũ giảng viên quốc tế, cơ sở vật chất hiện đại và nhiều chương trình trao đổi sinh viên với các trường đại học hàng đầu thế giới.',
    specialties: ['Kỹ thuật cơ điện tử', 'Kỹ thuật sinh học', 'Công nghệ thông tin', 'Quản trị kinh doanh', 'Quan hệ quốc tế'],
    location: { type: 'Point', coordinates: [106.8030, 10.8700] },
    programs: [
      {
        name: 'Chương trình đại học (100% tiếng Anh)',
        tuition: '32.000.000 đồng/học kỳ (năm 2024-2025)',
        majors: ['Kỹ thuật Cơ điện tử', 'Kỹ thuật Sinh học', 'Kỹ thuật Y sinh', 'Công nghệ thông tin', 'Khoa học máy tính', 'Quản trị kinh doanh', 'Tài chính', 'Quan hệ quốc tế'],
        description: 'Toàn bộ chương trình giảng dạy bằng tiếng Anh theo chuẩn quốc tế'
      }
    ],
    admissionScores: [
      { major: 'Kỹ thuật Cơ điện tử', score: '26.00', year: 2024 },
      { major: 'Công nghệ thông tin', score: '25.50', year: 2024 },
      { major: 'Quản trị kinh doanh', score: '25.20', year: 2024 },
      { major: 'Quan hệ quốc tế', score: '25.00', year: 2024 }
    ],
    changes2025: 'Năm 2025, HCMIU mở rộng chương trình học bổng Merit-based lên đến 100% học phí cho sinh viên xuất sắc. Trường cũng tăng cường hợp tác quốc tế với các trường đại học hàng đầu ở Mỹ, Úc, Anh để sinh viên có cơ hội du học chuyển tiếp và nhận bằng kép.'
  },
  {
    ranking: 23,
    name: 'Trường Đại học Nguyễn Tất Thành',
    shortName: 'NTTU',
    type: 'Tư thục',
    address: '300A Nguyễn Tất Thành, Phường 13, Quận 4',
    district: 'Quận 4',
    phone: '(028) 3940 1979',
    email: 'nttu@ntt.edu.vn',
    website: 'https://ntt.edu.vn',
    foundedYear: 1995,
    studentCount: 24000,
    facultyCount: 14,
    description: 'Trường Đại học Nguyễn Tất Thành (NTTU) là trường đại học tư thục uy tín với gần 30 năm đào tạo tại TP.HCM. Trường được xếp hạng trong top 20 trường đại học tốt nhất Việt Nam và là trường tư thục lớn thứ hai cả nước. NTTU nổi tiếng với chất lượng đào tạo đa ngành, cơ sở vật chất hiện đại và học phí hợp lý. Các ngành đào tạo mạnh bao gồm: Công nghệ thông tin, Kế toán, Quản trị kinh doanh, Luật và Điều dưỡng. Trường có 5 cơ sở đào tạo tại TP.HCM, đội ngũ giảng viên chất lượng cao và tỷ lệ sinh viên có việc làm sau tốt nghiệp đạt 85%. NTTU cũng có nhiều chương trình liên kết quốc tế và học bổng cho sinh viên.',
    specialties: ['Công nghệ thông tin', 'Kế toán', 'Quản trị kinh doanh', 'Luật', 'Điều dưỡng'],
    location: { type: 'Point', coordinates: [106.7088, 10.7553] },
    programs: [
      {
        name: 'Chương trình đại học chính quy',
        tuition: '15.500.000 đồng/học kỳ (năm 2024-2025)',
        majors: ['Công nghệ thông tin', 'Kế toán', 'Quản trị kinh doanh', 'Luật', 'Điều dưỡng', 'Y học cổ truyền', 'Dược học', 'Ngôn ngữ Anh', 'Thiết kế đồ họa', 'Marketing'],
        description: 'Học phí cạnh tranh, có chính sách hỗ trợ sinh viên khó khăn'
      }
    ],
    admissionScores: [
      { major: 'Công nghệ thông tin', score: '23.50', year: 2024 },
      { major: 'Kế toán', score: '23.20', year: 2024 },
      { major: 'Luật', score: '23.00', year: 2024 },
      { major: 'Quản trị kinh doanh', score: '22.80', year: 2024 },
      { major: 'Điều dưỡng', score: '22.50', year: 2024 }
    ],
    changes2025: 'Năm 2025, NTTU mở thêm 3 ngành mới: Khoa học dữ liệu, An toàn thông tin và Y dược cổ truyền. Trường cũng triển khai chương trình học bổng toàn phần cho 100 sinh viên có hoàn cảnh khó khăn nhưng học tập xuất sắc.'
  },
  {
    ranking: 24,
    name: 'Trường Đại học Công nghiệp TP.HCM',
    shortName: 'IUH',
    type: 'Công lập',
    address: '12 Nguyễn Văn Bảo, Phường 4, Quận Gò Vấp',
    district: 'Quận Gò Vấp',
    phone: '(028) 3894 0390',
    email: 'iuh@iuh.edu.vn',
    website: 'https://iuh.edu.vn',
    foundedYear: 2004,
    studentCount: 28000,
    facultyCount: 16,
    description: 'Trường Đại học Công nghiệp TP.HCM (IUH) là trường đại học công lập chuyên đào tạo các ngành kỹ thuật công nghiệp. Trường được xếp hạng trong top 25 trường đại học tốt nhất Việt Nam với thế mạnh về đào tạo ứng dụng và liên kết doanh nghiệp. Các ngành đào tạo mạnh bao gồm: Kỹ thuật Cơ khí, Kỹ thuật Điện - Điện tử, Công nghệ thông tin, Công nghệ Sinh học và Quản trị kinh doanh. IUH có cơ sở vật chất hiện đại với nhiều phòng thí nghiệm, xưởng thực hành và trung tâm đào tạo nghề. Trường hợp tác chặt chẽ với các khu công nghiệp lớn tại TP.HCM, đảm bảo sinh viên có cơ hội thực tập và việc làm tốt sau tốt nghiệp.',
    specialties: ['Kỹ thuật cơ khí', 'Kỹ thuật điện', 'Công nghệ thông tin', 'Công nghệ sinh học', 'Quản trị kinh doanh'],
    location: { type: 'Point', coordinates: [106.6817, 10.8194] },
    programs: [
      {
        name: 'Chương trình đại học chính quy',
        tuition: '12.000.000 đồng/học kỳ (năm 2024-2025)',
        majors: ['Kỹ thuật Cơ khí', 'Kỹ thuật Điện - Điện tử', 'Công nghệ thông tin', 'Công nghệ Sinh học', 'Kỹ thuật Xây dựng', 'Quản trị kinh doanh', 'Kế toán', 'Logistics'],
        description: 'Học phí công lập, phù hợp với đa số sinh viên'
      },
      {
        name: 'Chương trình chất lượng cao',
        tuition: '18.000.000 đồng/học kỳ',
        majors: ['Kỹ thuật Cơ điện tử', 'Công nghệ thông tin (English Program)', 'Quản trị kinh doanh (English Program)'],
        description: 'Chương trình tiên tiến với giảng viên quốc tế'
      }
    ],
    admissionScores: [
      { major: 'Công nghệ thông tin', score: '23.00', year: 2024 },
      { major: 'Kỹ thuật Cơ khí', score: '22.50', year: 2024 },
      { major: 'Kỹ thuật Điện - Điện tử', score: '22.30', year: 2024 },
      { major: 'Quản trị kinh doanh', score: '22.00', year: 2024 }
    ],
    changes2025: 'Năm 2025, IUH tăng cường đầu tư vào các phòng thí nghiệm công nghệ cao và mở rộng hợp tác với các doanh nghiệp công nghiệp lớn. Trường cũng triển khai chương trình đào tạo theo đơn đặt hàng của doanh nghiệp, đảm bảo 100% sinh viên có việc làm trước khi tốt nghiệp.'
  },
  {
    ranking: 25,
    name: 'Trường Đại học Nông Lâm TP.HCM',
    shortName: 'NLU',
    type: 'Công lập',
    address: 'Khu phố 6, Phường Linh Trung, Thành phố Thủ Đức',
    district: 'Thành phố Thủ Đức',
    phone: '(028) 3896 7901',
    email: 'nlu@hcmuaf.edu.vn',
    website: 'https://hcmuaf.edu.vn',
    foundedYear: 1955,
    studentCount: 18000,
    facultyCount: 14,
    description: 'Trường Đại học Nông Lâm TP.HCM (NLU) là trường đại học nông nghiệp hàng đầu khu vực phía Nam với hơn 65 năm lịch sử đào tạo. Trường được xếp hạng trong top 30 trường đại học tốt nhất Việt Nam và là trường duy nhất chuyên sâu về nông - lâm - ngư nghiệp tại miền Nam. Các ngành đào tạo mạnh bao gồm: Công nghệ Sinh học, Công nghệ Thực phẩm, Thú y, Nông học và Lâm nghiệp. NLU có cơ sở vật chất rộng lớn với nhiều vườn thí nghiệm, trang trại thực hành và phòng thí nghiệm hiện đại. Trường hợp tác chặt chẽ với các viện nghiên cứu, doanh nghiệp nông nghiệp công nghệ cao, tạo cơ hội nghiên cứu và phát triển sản phẩm cho sinh viên.',
    specialties: ['Công nghệ sinh học', 'Công nghệ thực phẩm', 'Thú y', 'Nông học', 'Lâm nghiệp'],
    location: { type: 'Point', coordinates: [106.8030, 10.8700] },
    programs: [
      {
        name: 'Chương trình đại học chính quy',
        tuition: '10.000.000 đồng/học kỳ (năm 2024-2025)',
        majors: ['Công nghệ Sinh học', 'Công nghệ Thực phẩm', 'Thú y', 'Nông học', 'Lâm nghiệp', 'Môi trường', 'Kinh tế nông nghiệp'],
        description: 'Học phí ưu đãi cho ngành nông nghiệp'
      }
    ],
    admissionScores: [
      { major: 'Công nghệ Sinh học', score: '22.50', year: 2024 },
      { major: 'Thú y', score: '22.00', year: 2024 },
      { major: 'Công nghệ Thực phẩm', score: '21.50', year: 2024 },
      { major: 'Nông học', score: '20.50', year: 2024 }
    ],
    changes2025: 'Năm 2025, NLU đầu tư mạnh vào nghiên cứu nông nghiệp công nghệ cao và nông nghiệp thông minh. Trường mở thêm các chương trình liên kết với các viện nghiên cứu quốc tế và cung cấp học bổng cho sinh viên tham gia các dự án nghiên cứu khoa học.'
  },
  {
    ranking: 26,
    name: 'Trường Đại học Hoa Sen',
    shortName: 'HSU',
    type: 'Tư thục',
    address: '08 Nguyễn Văn Tráng, Phường Bến Thành, Quận 1',
    district: 'Quận 1',
    phone: '(028) 3838 6666',
    email: 'info@hoasen.edu.vn',
    website: 'https://hoasen.edu.vn',
    foundedYear: 1991,
    studentCount: 15000,
    facultyCount: 10,
    description: 'Trường Đại học Hoa Sen (HSU) là trường đại học tư thục lâu đời nhất tại TP.HCM với hơn 30 năm kinh nghiệm đào tạo. Trường được xếp hạng trong top 25 trường đại học tốt nhất Việt Nam và nổi tiếng với triết lý giáo dục nhân văn, chú trọng phát triển toàn diện con người. Các ngành đào tạo mạnh bao gồm: Quản trị kinh doanh, Marketing, Truyền thông đa phương tiện, Thiết kế đồ họa và Ngôn ngữ Anh. HSU có cơ sở vật chất hiện đại tại trung tâm TP.HCM, đội ngũ giảng viên giàu kinh nghiệm và môi trường học tập năng động. Trường chú trọng đào tạo kỹ năng mềm, tư duy phản biện và khả năng thích ứng với môi trường làm việc quốc tế.',
    specialties: ['Quản trị kinh doanh', 'Marketing', 'Truyền thông', 'Thiết kế đồ họa', 'Ngôn ngữ anh'],
    location: { type: 'Point', coordinates: [106.6925, 10.7707] },
    programs: [
      {
        name: 'Chương trình đại học chính quy',
        tuition: '16.500.000 đồng/học kỳ (năm 2024-2025)',
        majors: ['Quản trị kinh doanh', 'Marketing', 'Truyền thông đa phương tiện', 'Thiết kế đồ họa', 'Ngôn ngữ Anh', 'Tâm lý học', 'Luật', 'Kế toán'],
        description: 'Học phí ổn định với nhiều chính sách hỗ trợ'
      },
      {
        name: 'Chương trình quốc tế',
        tuition: '25.000.000 đồng/học kỳ',
        majors: ['Business Administration (100% English)', 'International Marketing'],
        description: 'Chương trình giảng dạy hoàn toàn bằng tiếng Anh'
      }
    ],
    admissionScores: [
      { major: 'Quản trị kinh doanh', score: '23.00', year: 2024 },
      { major: 'Marketing', score: '22.50', year: 2024 },
      { major: 'Truyền thông đa phương tiện', score: '22.00', year: 2024 },
      { major: 'Thiết kế đồ họa', score: '21.50', year: 2024 }
    ],
    changes2025: 'Năm 2025, HSU tăng cường chương trình đào tạo theo định hướng nghề nghiệp với nhiều hoạt động thực tế tại doanh nghiệp. Trường cũng mở rộng các chương trình trao đổi sinh viên và học bổng du học ngắn hạn tại các trường đối tác ở Mỹ, Úc, Anh.'
  },
  {
    ranking: 27,
    name: 'Trường Đại học Công nghệ Sài Gòn',
    shortName: 'STU',
    type: 'Công lập',
    address: '180 Cao Lỗ, Phường 4, Quận 8',
    district: 'Quận 8',
    phone: '(028) 3850 5520',
    email: 'stu@stu.edu.vn',
    website: 'https://stu.edu.vn',
    foundedYear: 1995,
    studentCount: 14000,
    facultyCount: 12,
    description: 'Trường Đại học Công nghệ Sài Gòn (STU) là trường đại học công lập chuyên về công nghệ và kỹ thuật tại TP.HCM. Trường được xếp hạng trong top 30 trường đại học tốt nhất Việt Nam với thế mạnh về đào tạo kỹ thuật ứng dụng. Các ngành đào tạo mạnh bao gồm: Công nghệ thông tin, Kỹ thuật Điện - Điện tử, Kỹ thuật Cơ khí, Công nghệ Hóa học và Môi trường. STU có cơ sở vật chất hiện đại với các phòng thí nghiệm, xưởng thực hành được trang bị thiết bị tiên tiến. Trường chú trọng đào tạo theo nhu cầu thực tế của thị trường lao động, hợp tác chặt chẽ với các doanh nghiệp công nghệ và sản xuất.',
    specialties: ['Công nghệ thông tin', 'Kỹ thuật điện', 'Kỹ thuật cơ khí', 'Công nghệ hóa học', 'Môi trường'],
    location: { type: 'Point', coordinates: [106.6753, 10.7379] },
    programs: [
      {
        name: 'Chương trình đại học chính quy',
        tuition: '11.500.000 đồng/học kỳ (năm 2024-2025)',
        majors: ['Công nghệ thông tin', 'Kỹ thuật Điện - Điện tử', 'Kỹ thuật Cơ khí', 'Công nghệ Hóa học', 'Kỹ thuật Môi trường', 'Quản trị kinh doanh'],
        description: 'Học phí công lập hợp lý'
      }
    ],
    admissionScores: [
      { major: 'Công nghệ thông tin', score: '22.00', year: 2024 },
      { major: 'Kỹ thuật Điện - Điện tử', score: '21.50', year: 2024 },
      { major: 'Kỹ thuật Cơ khí', score: '21.00', year: 2024 }
    ],
    changes2025: 'Năm 2025, STU đầu tư nâng cấp phòng thí nghiệm và trang thiết bị thực hành. Trường cũng mở rộng hợp tác với các doanh nghiệp để triển khai chương trình đào tạo song hành với làm việc.'
  },
  {
    ranking: 28,
    name: 'Trường Đại học Mở TP.HCM',
    shortName: 'OU',
    type: 'Công lập',
    address: '97 Võ Văn Tần, Phường 6, Quận 3',
    district: 'Quận 3',
    phone: '(028) 3930 0280',
    email: 'ou@ou.edu.vn',
    website: 'https://ou.edu.vn',
    foundedYear: 1990,
    studentCount: 40000,
    facultyCount: 18,
    description: 'Trường Đại học Mở TP.HCM (OU) là trường đại học công lập lớn nhất TP.HCM với hơn 30 năm đào tạo đa ngành. Trường được xếp hạng trong top 30 trường đại học tốt nhất Việt Nam và là lựa chọn hàng đầu cho người đi làm muốn học song hành. Các ngành đào tạo mạnh bao gồm: Quản trị kinh doanh, Kế toán, Luật, Công nghệ thông tin và Ngôn ngữ. OU có 5 cơ sở đào tạo tại các quận trung tâm TP.HCM, linh hoạt về thời gian học và phương thức đào tạo. Trường cung cấp cả chương trình chính quy và vừa làm vừa học, phù hợp với đa dạng đối tượng học viên. Tỷ lệ sinh viên có việc làm sau tốt nghiệp đạt 82%.',
    specialties: ['Quản trị kinh doanh', 'Kế toán', 'Luật', 'Công nghệ thông tin', 'Ngôn ngữ'],
    location: { type: 'Point', coordinates: [106.6910, 10.7881] },
    programs: [
      {
        name: 'Chương trình đại học chính quy',
        tuition: '9.500.000 đồng/học kỳ (năm 2024-2025)',
        majors: ['Quản trị kinh doanh', 'Kế toán', 'Luật', 'Công nghệ thông tin', 'Ngôn ngữ Anh', 'Tài chính - Ngân hàng', 'Marketing'],
        description: 'Học phí thấp nhất trong các trường công lập tại TP.HCM'
      },
      {
        name: 'Chương trình vừa làm vừa học',
        tuition: '8.000.000 đồng/học kỳ',
        majors: ['Quản trị kinh doanh', 'Kế toán', 'Luật'],
        description: 'Lịch học linh hoạt buổi tối và cuối tuần'
      }
    ],
    admissionScores: [
      { major: 'Quản trị kinh doanh', score: '21.50', year: 2024 },
      { major: 'Kế toán', score: '21.00', year: 2024 },
      { major: 'Luật', score: '20.50', year: 2024 },
      { major: 'Công nghệ thông tin', score: '21.00', year: 2024 }
    ],
    changes2025: 'Năm 2025, OU tăng cường chuyển đổi số trong giảng dạy với nhiều khóa học trực tuyến và hybrid. Trường cũng mở rộng các chương trình đào tạo ngắn hạn và chứng chỉ nghề nghiệp để đáp ứng nhu cầu đào tạo lại và nâng cao trình độ của người lao động.'
  },
  {
    ranking: 29,
    name: 'Trường Đại học Thể dục Thể thao TP.HCM',
    shortName: 'UPES',
    type: 'Công lập',
    address: '01 Lê Lợi, Phường Bến Thành, Quận 1',
    district: 'Quận 1',
    phone: '(028) 3829 4534',
    email: 'upes@upes.edu.vn',
    website: 'https://upes.edu.vn',
    foundedYear: 1976,
    studentCount: 5000,
    facultyCount: 8,
    description: 'Trường Đại học Thể dục Thể thao TP.HCM (UPES) là trường đại học thể thao hàng đầu khu vực phía Nam với gần 50 năm kinh nghiệm đào tạo. Trường chuyên đào tạo giáo viên thể dục, huấn luyện viên thể thao và các chuyên gia về khoa học thể thao. UPES được xếp hạng trong top 3 trường thể thao tốt nhất Việt Nam. Các ngành đào tạo bao gồm: Giáo dục Thể chất, Huấn luyện Thể thao, Quản lý Thể dục Thể thao và Y học Thể thao. Trường có cơ sở vật chất hiện đại với sân thi đấu, phòng gym, bể bơi và phòng thí nghiệm khoa học thể thao tiêu chuẩn quốc tế. Sinh viên UPES thường đạt thành tích cao tại các giải thể thao và có cơ hội làm việc tại các câu lạc bộ thể thao chuyên nghiệp.',
    specialties: ['Giáo dục thể chất', 'Huấn luyện thể thao', 'Quản lý thể thao', 'Y học thể thao'],
    location: { type: 'Point', coordinates: [106.6925, 10.7707] },
    programs: [
      {
        name: 'Chương trình đại học chính quy',
        tuition: '8.500.000 đồng/học kỳ (năm 2024-2025)',
        majors: ['Giáo dục Thể chất', 'Huấn luyện Thể thao', 'Quản lý Thể dục Thể thao', 'Y học Thể thao'],
        description: 'Học phí ưu đãi cho ngành thể thao'
      }
    ],
    admissionScores: [
      { major: 'Giáo dục Thể chất', score: '19.50', year: 2024 },
      { major: 'Huấn luyện Thể thao', score: '19.00', year: 2024 },
      { major: 'Quản lý Thể dục Thể thao', score: '18.50', year: 2024 }
    ],
    changes2025: 'Năm 2025, UPES tăng cường đầu tư vào khoa học thể thao và y học thể thao. Trường cũng mở rộng hợp tác với các câu lạc bộ thể thao chuyên nghiệp để tạo cơ hội thực tập và việc làm cho sinh viên.'
  },
  {
    ranking: 30,
    name: 'Trường Đại học Tài chính - Marketing',
    shortName: 'UFM',
    type: 'Công lập',
    address: '2/4 Trần Xuân Soạn, Phường Tân Thuận Tây, Quận 7',
    district: 'Quận 7',
    phone: '(028) 3771 6115',
    email: 'ufm@ufm.edu.vn',
    website: 'https://ufm.edu.vn',
    foundedYear: 2004,
    studentCount: 16000,
    facultyCount: 10,
    description: 'Trường Đại học Tài chính - Marketing (UFM) là trường đại học công lập chuyên sâu về tài chính và marketing tại TP.HCM. Trường được xếp hạng trong top 30 trường đại học tốt nhất Việt Nam với thế mạnh về đào tạo các ngành kinh tế ứng dụng. Các ngành đào tạo mạnh bao gồm: Tài chính - Ngân hàng, Marketing, Kế toán, Quản trị kinh doanh và Thương mại điện tử. UFM có đội ngũ giảng viên giàu kinh nghiệm thực tiễn, nhiều chương trình liên kết với doanh nghiệp và cơ sở vật chất hiện đại. Trường chú trọng đào tạo kỹ năng thực hành, phân tích dữ liệu và marketing số. Tỷ lệ sinh viên UFM có việc làm sau 6 tháng tốt nghiệp đạt 88%.',
    specialties: ['Tài chính ngân hàng', 'Marketing', 'Kế toán', 'Quản trị kinh doanh', 'Thương mại điện tử'],
    location: { type: 'Point', coordinates: [106.7195, 10.7321] },
    programs: [
      {
        name: 'Chương trình đại học chính quy',
        tuition: '11.000.000 đồng/học kỳ (năm 2024-2025)',
        majors: ['Tài chính - Ngân hàng', 'Marketing', 'Kế toán', 'Quản trị kinh doanh', 'Thương mại điện tử', 'Kinh doanh quốc tế', 'Bảo hiểm'],
        description: 'Học phí công lập phù hợp'
      },
      {
        name: 'Chương trình chất lượng cao',
        tuition: '17.500.000 đồng/học kỳ',
        majors: ['Tài chính - Ngân hàng (CLC)', 'Marketing (CLC)', 'Digital Marketing'],
        description: 'Chương trình tiên tiến với nhiều hoạt động thực tế'
      }
    ],
    admissionScores: [
      { major: 'Tài chính - Ngân hàng', score: '23.50', year: 2024 },
      { major: 'Marketing', score: '23.00', year: 2024 },
      { major: 'Kế toán', score: '22.50', year: 2024 },
      { major: 'Thương mại điện tử', score: '22.00', year: 2024 }
    ],
    changes2025: 'Năm 2025, UFM mở thêm các ngành mới: Digital Marketing, Fintech và Data Analytics. Trường cũng tăng cường hợp tác với các ngân hàng, công ty tài chính và doanh nghiệp thương mại điện tử để sinh viên có cơ hội thực tập từ năm 2.'
  },
  {
    ranking: 31,
    name: 'Trường Đại học Kiến trúc TP.HCM',
    shortName: 'UAH',
    type: 'Công lập',
    address: '196 Pasteur, Phường 6, Quận 3',
    district: 'Quận 3',
    phone: '(028) 3829 0279',
    email: 'uah@uah.edu.vn',
    website: 'https://uah.edu.vn',
    foundedYear: 1976,
    studentCount: 8000,
    facultyCount: 10,
    description: 'Trường Đại học Kiến trúc TP.HCM (UAH) là trường kiến trúc hàng đầu khu vực phía Nam với gần 50 năm đào tạo. Trường nổi tiếng về đào tạo kiến trúc sư và các chuyên gia quy hoạch đô thị chất lượng cao. UAH được xếp hạng trong top 3 trường kiến trúc tốt nhất Việt Nam. Các ngành đào tạo mạnh bao gồm: Kiến trúc, Quy hoạch đô thị và nông thôn, Kiến trúc cảnh quan và Thiết kế nội thất. Trường có đội ngũ giảng viên là các kiến trúc sư uy tín, cơ sở vật chất với xưởng thực hành, studio thiết kế hiện đại. Sinh viên UAH thường đạt giải cao tại các cuộc thi kiến trúc trong nước và quốc tế.',
    specialties: ['Kiến trúc', 'Quy hoạch đô thị', 'Kiến trúc cảnh quan', 'Thiết kế nội thất'],
    location: { type: 'Point', coordinates: [106.6910, 10.7881] },
    programs: [
      {
        name: 'Chương trình đại học chính quy',
        tuition: '13.500.000 đồng/học kỳ (năm 2024-2025)',
        majors: ['Kiến trúc', 'Quy hoạch đô thị và nông thôn', 'Kiến trúc cảnh quan', 'Thiết kế nội thất', 'Xây dựng dân dụng và công nghiệp'],
        description: 'Đào tạo 5 năm cho bằng kiến trúc sư'
      }
    ],
    admissionScores: [
      { major: 'Kiến trúc', score: '25.00', year: 2024 },
      { major: 'Quy hoạch đô thị', score: '24.50', year: 2024 },
      { major: 'Thiết kế nội thất', score: '24.00', year: 2024 }
    ],
    changes2025: 'Năm 2025, UAH tăng cường đào tạo về kiến trúc xanh, kiến trúc bền vững và ứng dụng công nghệ BIM. Trường cũng mở rộng hợp tác quốc tế với các trường kiến trúc hàng đầu ở châu Âu và Nhật Bản.'
  },
  {
    ranking: 32,
    name: 'Trường Đại học Yersin Đà Lạt - Phân hiệu TP.HCM',
    shortName: 'YDS',
    type: 'Tư thục',
    address: '02 Đường số 8, Khu dân cư Trung Sơn, Quận Bình Chánh',
    district: 'Quận Bình Thạnh',
    phone: '(028) 5413 6666',
    email: 'yds@yds.edu.vn',
    website: 'https://yds.edu.vn',
    foundedYear: 2018,
    studentCount: 3000,
    facultyCount: 6,
    description: 'Trường Đại học Yersin Đà Lạt - Phân hiệu TP.HCM (YDS) là trường đại học tư thục chất lượng cao được thành lập năm 2018. Trường theo mô hình đại học nghiên cứu, chú trọng đào tạo theo hướng quốc tế với quy mô nhỏ nhưng chất lượng cao. YDS có các ngành đào tạo: Y khoa, Dược học, Điều dưỡng, Công nghệ Sinh học và Quản trị Y tế. Trường có cơ sở vật chất hiện đại với phòng thí nghiệm, bệnh viện thực hành đạt chuẩn quốc tế. Đội ngũ giảng viên là các bác sĩ, dược sĩ có trình độ cao, nhiều người từng học tập và làm việc ở nước ngoài.',
    specialties: ['Y khoa', 'Dược học', 'Điều dưỡng', 'Công nghệ sinh học', 'Quản trị y tế'],
    location: { type: 'Point', coordinates: [106.7074, 10.8022] },
    programs: [
      {
        name: 'Chương trình đại học y dược',
        tuition: '45.000.000 đồng/học kỳ (năm 2024-2025)',
        majors: ['Y khoa (6 năm)', 'Dược học (5 năm)', 'Điều dưỡng (4 năm)', 'Công nghệ Sinh học', 'Quản trị Y tế'],
        description: 'Học phí cao nhưng chất lượng đào tạo theo chuẩn quốc tế'
      }
    ],
    admissionScores: [
      { major: 'Y khoa', score: '27.00', year: 2024 },
      { major: 'Dược học', score: '26.50', year: 2024 },
      { major: 'Điều dưỡng', score: '24.00', year: 2024 }
    ],
    changes2025: 'Năm 2025, YDS mở rộng chương trình học bổng toàn phần cho sinh viên xuất sắc và có nhiều chương trình trao đổi sinh viên với các trường y dược hàng đầu thế giới.'
  },
  {
    ranking: 33,
    name: 'Trường Đại học Công nghệ TP.HCM - HUTECH',
    shortName: 'HUTECH',
    type: 'Tư thục',
    address: '475A Điện Biên Phủ, Phường 25, Quận Bình Thạnh',
    district: 'Quận Bình Thạnh',
    phone: '(028) 5445 7777',
    email: 'hutech@hutech.edu.vn',
    website: 'https://hutech.edu.vn',
    foundedYear: 1995,
    studentCount: 30000,
    facultyCount: 16,
    description: 'Trường Đại học Công nghệ TP.HCM (HUTECH) là trường đại học tư thục lớn với 30 năm đào tạo đa ngành. Trường được xếp hạng trong top 25 trường đại học tốt nhất Việt Nam. Các ngành đào tạo mạnh bao gồm: Công nghệ thông tin, Kỹ thuật Cơ điện tử, Quản trị kinh doanh, Thiết kế đồ họa và Dược học. HUTECH có 3 cơ sở đào tạo tại TP.HCM với cơ sở vật chất hiện đại, đội ngũ giảng viên chất lượng cao. Trường chú trọng đào tạo ứng dụng, liên kết với doanh nghiệp và có tỷ lệ sinh viên có việc làm cao sau tốt nghiệp.',
    specialties: ['Công nghệ thông tin', 'Kỹ thuật cơ điện tử', 'Quản trị kinh doanh', 'Thiết kế đồ họa', 'Dược học'],
    location: { type: 'Point', coordinates: [106.7074, 10.8022] },
    programs: [
      {
        name: 'Chương trình đại học chính quy',
        tuition: '17.000.000 đồng/học kỳ (năm 2024-2025)',
        majors: ['Công nghệ thông tin', 'Kỹ thuật Cơ điện tử', 'Quản trị kinh doanh', 'Thiết kế đồ họa', 'Dược học', 'Kế toán', 'Marketing', 'Luật'],
        description: 'Học phí trung bình trong các trường tư thục'
      },
      {
        name: 'Chương trình quốc tế',
        tuition: '28.000.000 đồng/học kỳ',
        majors: ['Software Engineering (English Program)', 'Business Administration (English Program)'],
        description: 'Giảng dạy 100% bằng tiếng Anh'
      }
    ],
    admissionScores: [
      { major: 'Công nghệ thông tin', score: '22.50', year: 2024 },
      { major: 'Dược học', score: '22.00', year: 2024 },
      { major: 'Quản trị kinh doanh', score: '21.50', year: 2024 }
    ],
    changes2025: 'Năm 2025, HUTECH mở thêm ngành Trí tuệ nhân tạo và An toàn thông tin. Trường cũng triển khai chương trình đào tạo theo mô hình CDIO với nhiều dự án thực tế từ doanh nghiệp.'
  },
  {
    ranking: 34,
    name: 'Trường Đại học Thủ Dầu Một',
    shortName: 'TDMU',
    type: 'Công lập',
    address: '06 Trần Văn Ơn, Phường Phú Hòa, Thành phố Thủ Dầu Một, Bình Dương',
    district: 'Thành phố Thủ Đức',
    phone: '(0274) 3822 201',
    email: 'tdmu@tdmu.edu.vn',
    website: 'https://tdmu.edu.vn',
    foundedYear: 2009,
    studentCount: 12000,
    facultyCount: 10,
    description: 'Trường Đại học Thủ Dầu Một (TDMU) là trường đại học công lập đa ngành tại tỉnh Bình Dương, gần TP.HCM. Trường được thành lập năm 2009 và phát triển nhanh chóng, phục vụ nhu cầu đào tạo nhân lực cho các khu công nghiệp. Các ngành đào tạo mạnh bao gồm: Kỹ thuật Cơ khí, Kỹ thuật Điện - Điện tử, Công nghệ thông tin, Quản trị kinh doanh và Kế toán. TDMU có cơ sở vật chất khang trang, học phí công lập hợp lý và liên kết chặt chẽ với các doanh nghiệp trong khu công nghiệp, tạo cơ hội việc làm tốt cho sinh viên.',
    specialties: ['Kỹ thuật cơ khí', 'Kỹ thuật điện', 'Công nghệ thông tin', 'Quản trị kinh doanh', 'Kế toán'],
    location: { type: 'Point', coordinates: [106.6598, 10.9800] },
    programs: [
      {
        name: 'Chương trình đại học chính quy',
        tuition: '9.000.000 đồng/học kỳ (năm 2024-2025)',
        majors: ['Kỹ thuật Cơ khí', 'Kỹ thuật Điện - Điện tử', 'Công nghệ thông tin', 'Quản trị kinh doanh', 'Kế toán', 'Ngôn ngữ Anh'],
        description: 'Học phí thấp, phù hợp sinh viên'
      }
    ],
    admissionScores: [
      { major: 'Công nghệ thông tin', score: '20.50', year: 2024 },
      { major: 'Kỹ thuật Cơ khí', score: '20.00', year: 2024 },
      { major: 'Quản trị kinh doanh', score: '19.50', year: 2024 }
    ],
    changes2025: 'Năm 2025, TDMU mở rộng hợp tác với các khu công nghiệp để triển khai chương trình đào tạo gắn với nhu cầu tuyển dụng. Sinh viên được đảm bảo việc làm ngay sau tốt nghiệp.'
  },
  {
    ranking: 35,
    name: 'Trường Đại học Ngoại Thương - Cơ sở 2 TP.HCM',
    shortName: 'FTU2',
    type: 'Công lập',
    address: '15 Đường D5, Phường 25, Quận Bình Thạnh',
    district: 'Quận Bình Thạnh',
    phone: '(028) 6268 3801',
    email: 'cs2@ftu.edu.vn',
    website: 'https://cs2.ftu.edu.vn',
    foundedYear: 2008,
    studentCount: 10000,
    facultyCount: 8,
    description: 'Trường Đại học Ngoại Thương - Cơ sở 2 TP.HCM (FTU2) là phân hiệu của Đại học Ngoại Thương Hà Nội, một trong những trường kinh tế hàng đầu Việt Nam. Cơ sở 2 được thành lập năm 2008 để đào tạo nhân lực ngoại thương, kinh tế quốc tế cho khu vực phía Nam. Các ngành đào tạo mạnh bao gồm: Kinh tế đối ngoại, Kinh doanh quốc tế, Tài chính - Ngân hàng quốc tế, Luật kinh tế quốc tế và Ngôn ngữ Anh thương mại. FTU2 kế thừa chất lượng đào tạo và uy tín của trường gốc, có đội ngũ giảng viên chất lượng cao và nhiều chương trình liên kết quốc tế.',
    specialties: ['Kinh tế đối ngoại', 'Kinh doanh quốc tế', 'Tài chính ngân hàng quốc tế', 'Luật kinh tế', 'Ngôn ngữ anh'],
    location: { type: 'Point', coordinates: [106.7074, 10.8022] },
    programs: [
      {
        name: 'Chương trình đại học chính quy',
        tuition: '12.500.000 đồng/học kỳ (năm 2024-2025)',
        majors: ['Kinh tế đối ngoại', 'Kinh doanh quốc tế', 'Tài chính - Ngân hàng quốc tế', 'Luật kinh tế quốc tế', 'Ngôn ngữ Anh thương mại'],
        description: 'Chất lượng đào tạo cao theo chuẩn FTU'
      }
    ],
    admissionScores: [
      { major: 'Kinh tế đối ngoại', score: '25.50', year: 2024 },
      { major: 'Kinh doanh quốc tế', score: '25.00', year: 2024 },
      { major: 'Tài chính quốc tế', score: '24.50', year: 2024 }
    ],
    changes2025: 'Năm 2025, FTU2 tăng cường các chương trình liên kết quốc tế và học bổng du học ngắn hạn. Trường cũng mở thêm các chương trình song ngữ Anh - Việt cho nhiều ngành.'
  },
  {
    ranking: 36,
    name: 'Trường Đại học Khoa học Xã hội và Nhân văn - ĐH Quốc gia Hà Nội (Phân hiệu HCM)',
    shortName: 'USSH HN',
    type: 'Công lập',
    address: '10-12 Đinh Tiên Hoàng, Phường Bến Nghé, Quận 1',
    district: 'Quận 1',
    phone: '(028) 3829 8433',
    email: 'ussh@vnu.edu.vn',
    website: 'https://ussh.vnu.edu.vn',
    foundedYear: 2013,
    studentCount: 4000,
    facultyCount: 6,
    description: 'Phân hiệu TP.HCM của Trường Đại học Khoa học Xã hội và Nhân văn - ĐHQG Hà Nội là cơ sở đào tạo khoa học xã hội và nhân văn chất lượng cao tại miền Nam. Trường đào tạo các ngành: Triết học, Xã hội học, Tâm lý học, Ngôn ngữ Anh và Việt Nam học. Kế thừa chất lượng đào tạo của trường gốc, phân hiệu có đội ngũ giảng viên uy tín, chương trình đào tạo cập nhật theo chuẩn quốc tế. Sinh viên có cơ hội nghiên cứu khoa học, tham gia các dự án xã hội và có tỷ lệ việc làm tốt trong các lĩnh vực nghiên cứu, giáo dục và tư vấn.',
    specialties: ['Triết học', 'Xã hội học', 'Tâm lý học', 'Ngôn ngữ anh', 'Việt Nam học'],
    location: { type: 'Point', coordinates: [106.7027, 10.7756] },
    programs: [
      {
        name: 'Chương trình đại học chính quy',
        tuition: '11.000.000 đồng/học kỳ (năm 2024-2025)',
        majors: ['Triết học', 'Xã hội học', 'Tâm lý học', 'Ngôn ngữ Anh', 'Việt Nam học', 'Văn hóa học'],
        description: 'Chất lượng đào tạo theo chuẩn ĐHQG'
      }
    ],
    admissionScores: [
      { major: 'Tâm lý học', score: '24.00', year: 2024 },
      { major: 'Ngôn ngữ Anh', score: '23.50', year: 2024 },
      { major: 'Xã hội học', score: '23.00', year: 2024 }
    ],
    changes2025: 'Năm 2025, trường tăng cường nghiên cứu khoa học xã hội và nhân văn phục vụ phát triển khu vực phía Nam. Nhiều chương trình hợp tác quốc tế được mở rộng.'
  },
  {
    ranking: 37,
    name: 'Trường Đại học Lao động - Xã hội (Cơ sở 2)',
    shortName: 'ULSA2',
    type: 'Công lập',
    address: '232 Võ Thị Sáu, Phường Võ Thị Sáu, Quận 3',
    district: 'Quận 3',
    phone: '(028) 3930 3531',
    email: 'cs2@ulsa.edu.vn',
    website: 'https://cs2.ulsa.edu.vn',
    foundedYear: 2007,
    studentCount: 8000,
    facultyCount: 8,
    description: 'Trường Đại học Lao động - Xã hội Cơ sở 2 là phân hiệu của ĐHLD-XH Hà Nội tại TP.HCM, chuyên đào tạo các ngành về lao động, xã hội và quản lý nhân sự. Các ngành đào tạo mạnh bao gồm: Công tác xã hội, Quản trị nhân lực, Quan hệ lao động, Bảo hiểm và An toàn lao động. Trường có thế mạnh về đào tạo nhân lực cho các lĩnh vực phúc lợi xã hội, quản lý lao động và phát triển cộng đồng. Đội ngũ giảng viên có trình độ cao, nhiều người từng học tập và làm việc ở nước ngoài. Sinh viên có cơ hội thực tập tại các tổ chức xã hội, doanh nghiệp và cơ quan nhà nước.',
    specialties: ['Công tác xã hội', 'Quản trị nhân lực', 'Quan hệ lao động', 'Bảo hiểm', 'An toàn lao động'],
    location: { type: 'Point', coordinates: [106.6910, 10.7881] },
    programs: [
      {
        name: 'Chương trình đại học chính quy',
        tuition: '10.500.000 đồng/học kỳ (năm 2024-2025)',
        majors: ['Công tác xã hội', 'Quản trị nhân lực', 'Quan hệ lao động', 'Bảo hiểm', 'An toàn lao động', 'Tâm lý học lao động'],
        description: 'Học phí công lập hợp lý'
      }
    ],
    admissionScores: [
      { major: 'Quản trị nhân lực', score: '21.50', year: 2024 },
      { major: 'Công tác xã hội', score: '21.00', year: 2024 },
      { major: 'Bảo hiểm', score: '20.50', year: 2024 }
    ],
    changes2025: 'Năm 2025, trường mở rộng các chương trình đào tạo về phát triển nguồn nhân lực và chuyển đổi số trong quản lý lao động. Nhiều dự án hợp tác với doanh nghiệp được triển khai.'
  },
  {
    ranking: 38,
    name: 'Trường Đại học Văn Hiến',
    shortName: 'VHU',
    type: 'Tư thục',
    address: '665-667-669 Điện Biên Phủ, Phường 1, Quận 3',
    district: 'Quận 3',
    phone: '(028) 3930 7115',
    email: 'vhu@vhu.edu.vn',
    website: 'https://vhu.edu.vn',
    foundedYear: 2008,
    studentCount: 10000,
    facultyCount: 8,
    description: 'Trường Đại học Văn Hiến (VHU) là trường đại học tư thục với 17 năm đào tạo tại TP.HCM. Trường có vị trí thuận lợi tại trung tâm thành phố, cơ sở vật chất hiện đại và học phí hợp lý. Các ngành đào tạo mạnh bao gồm: Quản trị kinh doanh, Kế toán, Công nghệ thông tin, Ngôn ngữ Anh và Luật. VHU chú trọng đào tạo kỹ năng thực hành, liên kết với doanh nghiệp và tạo môi trường học tập năng động. Trường có nhiều câu lạc bộ, hoạt động ngoại khóa phong phú và tỷ lệ sinh viên có việc làm sau tốt nghiệp đạt 80%.',
    specialties: ['Quản trị kinh doanh', 'Kế toán', 'Công nghệ thông tin', 'Ngôn ngữ anh', 'Luật'],
    location: { type: 'Point', coordinates: [106.6910, 10.7881] },
    programs: [
      {
        name: 'Chương trình đại học chính quy',
        tuition: '14.500.000 đồng/học kỳ (năm 2024-2025)',
        majors: ['Quản trị kinh doanh', 'Kế toán', 'Công nghệ thông tin', 'Ngôn ngữ Anh', 'Luật', 'Marketing', 'Tài chính'],
        description: 'Học phí tư thục hợp lý'
      }
    ],
    admissionScores: [
      { major: 'Quản trị kinh doanh', score: '20.50', year: 2024 },
      { major: 'Kế toán', score: '20.00', year: 2024 },
      { major: 'Công nghệ thông tin', score: '20.00', year: 2024 }
    ],
    changes2025: 'Năm 2025, VHU đầu tư nâng cấp cơ sở vật chất và tăng cường chương trình học bổng cho sinh viên. Trường cũng mở rộng hợp tác quốc tế với các trường đại học ở châu Á.'
  },
  {
    ranking: 39,
    name: 'Trường Đại học Gia Định',
    shortName: 'GDU',
    type: 'Tư thục',
    address: '371 Nguyễn Kiệm, Phường 3, Quận Gò Vấp',
    district: 'Quận Gò Vấp',
    phone: '(028) 3984 4139',
    email: 'gdu@gdu.edu.vn',
    website: 'https://gdu.edu.vn',
    foundedYear: 2007,
    studentCount: 12000,
    facultyCount: 10,
    description: 'Trường Đại học Gia Định (GDU) là trường đại học tư thục với 18 năm đào tạo đa ngành tại TP.HCM. Trường có cơ sở vật chất khang trang, môi trường học tập hiện đại và học phí phù hợp. Các ngành đào tạo mạnh bao gồm: Quản trị kinh doanh, Kế toán, Công nghệ thông tin, Luật và Y Dược. GDU chú trọng đào tạo ứng dụng với nhiều chương trình thực tập tại doanh nghiệp. Trường có đội ngũ giảng viên có trình độ cao, nhiều tiến sĩ và chuyên gia đầu ngành. Sinh viên GDU có cơ hội tham gia nhiều hoạt động ngoại khóa, câu lạc bộ chuyên môn và tình nguyện.',
    specialties: ['Quản trị kinh doanh', 'Kế toán', 'Công nghệ thông tin', 'Luật', 'Y dược'],
    location: { type: 'Point', coordinates: [106.6817, 10.8194] },
    programs: [
      {
        name: 'Chương trình đại học chính quy',
        tuition: '15.000.000 đồng/học kỳ (năm 2024-2025)',
        majors: ['Quản trị kinh doanh', 'Kế toán', 'Công nghệ thông tin', 'Luật', 'Dược học', 'Điều dưỡng', 'Marketing'],
        description: 'Học phí ổn định với nhiều ưu đãi'
      }
    ],
    admissionScores: [
      { major: 'Dược học', score: '21.00', year: 2024 },
      { major: 'Quản trị kinh doanh', score: '20.00', year: 2024 },
      { major: 'Kế toán', score: '19.50', year: 2024 }
    ],
    changes2025: 'Năm 2025, GDU mở rộng cơ sở đào tạo và tăng cường chương trình liên kết doanh nghiệp. Trường cũng triển khai nhiều học bổng cho sinh viên có hoàn cảnh khó khăn.'
  },
  {
    ranking: 40,
    name: 'Trường Đại học Tài nguyên và Môi trường TP.HCM',
    shortName: 'HCMUNRE',
    type: 'Công lập',
    address: '236B Lê Văn Sỹ, Phường 1, Quận Tân Bình',
    district: 'Quận Tân Bình',
    phone: '(028) 3844 8310',
    email: 'hcmunre@hcmunre.edu.vn',
    website: 'https://hcmunre.edu.vn',
    foundedYear: 1970,
    studentCount: 9000,
    facultyCount: 10,
    description: 'Trường Đại học Tài nguyên và Môi trường TP.HCM (HCMUNRE) là trường đại học công lập chuyên về tài nguyên và môi trường với hơn 50 năm lịch sử. Trường là cơ sở đào tạo hàng đầu về địa chất, khảo sát, quy hoạch và quản lý tài nguyên thiên nhiên. Các ngành đào tạo mạnh bao gồm: Địa chất, Kỹ thuật Địa chất, Kỹ thuật Môi trường, Kỹ thuật Xây dựng và Địa chính. HCMUNRE có đội ngũ giảng viên chuyên sâu, phòng thí nghiệm hiện đại và nhiều dự án nghiên cứu thực địa. Sinh viên có cơ hội tham gia các dự án khảo sát địa chất, quy hoạch đô thị và quản lý môi trường.',
    specialties: ['Địa chất', 'Kỹ thuật địa chất', 'Kỹ thuật môi trường', 'Kỹ thuật xây dựng', 'Địa chính'],
    location: { type: 'Point', coordinates: [106.6598, 10.7995] },
    programs: [
      {
        name: 'Chương trình đại học chính quy',
        tuition: '10.000.000 đồng/học kỳ (năm 2024-2025)',
        majors: ['Địa chất', 'Kỹ thuật Địa chất', 'Kỹ thuật Môi trường', 'Kỹ thuật Xây dựng', 'Địa chính', 'Quy hoạch vùng và đô thị'],
        description: 'Học phí công lập ưu đãi'
      }
    ],
    admissionScores: [
      { major: 'Kỹ thuật Môi trường', score: '21.00', year: 2024 },
      { major: 'Kỹ thuật Xây dựng', score: '20.50', year: 2024 },
      { major: 'Địa chất', score: '20.00', year: 2024 }
    ],
    changes2025: 'Năm 2025, HCMUNRE tăng cường nghiên cứu về biến đổi khí hậu, quản lý tài nguyên bền vững và công nghệ xanh. Trường cũng mở rộng hợp tác quốc tế trong lĩnh vực môi trường.'
  },
  {
    ranking: 41,
    name: 'Trường Đại học Sài Gòn',
    shortName: 'SGU',
    type: 'Công lập',
    address: '273 An Dương Vương, Phường 3, Quận 5',
    district: 'Quận 5',
    phone: '(028) 3835 8806',
    email: 'sgu@sgu.edu.vn',
    website: 'https://sgu.edu.vn',
    foundedYear: 1994,
    studentCount: 15000,
    facultyCount: 12,
    description: 'Trường Đại học Sài Gòn (SGU) là trường đại học công lập đa ngành với 30 năm đào tạo tại TP.HCM. Trường có vị trí thuận lợi tại trung tâm thành phố, đó là một trong những trường lớn và có uy tín cao. Các ngành đào tạo mạnh bao gồm: Quản trị kinh doanh, Kế toán, Ngoại ngữ, Công nghệ thông tin và Du lịch - Khách sạn. SGU có cơ sở vật chất khang trang, đội ngũ giảng viên chất lượng cao và nhiều chương trình liên kết quốc tế. Trường chú trọng đào tạo kỹ năng thực hành, gắn với nhu cầu nhân lực thị trường. Tỷ lệ sinh viên SGU có việc làm sau tốt nghiệp đạt 82%.',
    specialties: ['Quản trị kinh doanh', 'Kế toán', 'Ngoại ngữ', 'Công nghệ thông tin', 'Du lịch khách sạn'],
    location: { type: 'Point', coordinates: [106.6736, 10.7496] },
    programs: [
      {
        name: 'Chương trình đại học chính quy',
        tuition: '11.500.000 đồng/học kỳ (năm 2024-2025)',
        majors: ['Quản trị kinh doanh', 'Kế toán', 'Tiếng Anh', 'Tiếng Hàn', 'Công nghệ thông tin', 'Du lịch', 'Khách sạn', 'Phục vụ ăn uống'],
        description: 'Học phí công lập phù hợp'
      },
      {
        name: 'Chương trình song ngữ',
        tuition: '16.000.000 đồng/học kỳ',
        majors: ['Business Administration (Song ngữ)', 'Tourism Management (Song ngữ)'],
        description: 'Giảng dạy song ngữ Anh - Việt'
      }
    ],
    admissionScores: [
      { major: 'Quản trị kinh doanh', score: '20.50', year: 2024 },
      { major: 'Kế toán', score: '20.00', year: 2024 },
      { major: 'Tiếng Anh', score: '19.50', year: 2024 }
    ],
    changes2025: 'Năm 2025, SGU mở thêm ngành Quản trị khách sạn 4 sao và chương trình học bổng du học ngắn hạn. Trường cũng tăng cường hợp tác với các tập đoàn khách sạn, du lịch quốc tế.'
  },
  {
    ranking: 42,
    name: 'Trường Đại học Thương mại TP.HCM',
    shortName: 'UTM',
    type: 'Tư thục',
    address: '154/4 Nguyễn Văn Quỳ, Phường An Khánh, Quận 2',
    district: 'Quận 2',
    phone: '(028) 7301 0222',
    email: 'utm@utm.edu.vn',
    website: 'https://utm.edu.vn',
    foundedYear: 2000,
    studentCount: 11000,
    facultyCount: 9,
    description: 'Trường Đại học Thương mại TP.HCM (UTM) là trường đại học tư thục chuyên sâu về kinh tế và thương mại với 25 năm đào tạo. Trường được xếp hạng trong top 50 trường đại học tốt nhất Việt Nam. Các ngành đào tạo mạnh bao gồm: Kinh doanh thương mại, Logistics và Vận tải, Xuất nhập khẩu, Marketing và Thương mại điện tử. UTM có đội ngũ giảng viên giàu kinh nghiệm, cơ sở vật chất hiện đại và nhiều liên kết với các doanh nghiệp lớn. Sinh viên UTM có cơ hội thực tập tại các công ty logistics, ngân hàng, doanh nghiệp thương mại điện tử lớn.',
    specialties: ['Kinh doanh thương mại', 'Logistics vận tải', 'Xuất nhập khẩu', 'Marketing', 'Thương mại điện tử'],
    location: { type: 'Point', coordinates: [106.7749, 10.7919] },
    programs: [
      {
        name: 'Chương trình đại học chính quy',
        tuition: '14.000.000 đồng/học kỳ (năm 2024-2025)',
        majors: ['Kinh doanh thương mại', 'Logistics và Vận tải', 'Xuất nhập khẩu', 'Marketing', 'Thương mại điện tử', 'Quản lý chuỗi cung ứng'],
        description: 'Học phí tư thục hợp lý'
      }
    ],
    admissionScores: [
      { major: 'Logistics vận tải', score: '21.00', year: 2024 },
      { major: 'Marketing', score: '20.50', year: 2024 },
      { major: 'Kinh doanh thương mại', score: '20.00', year: 2024 }
    ],
    changes2025: 'Năm 2025, UTM mở ngành Supply Chain Management và tăng cường chương trình liên kết với các công ty logistics hàng đầu châu Á. Sinh viên được đảm bảo thực tập có lương từ năm 2.'
  },
  {
    ranking: 43,
    name: 'Trường Đại học Tôn Đức Thắng - Cơ sở 2',
    shortName: 'TDTU2',
    type: 'Công lập',
    address: '19 Nguyễn Hữu Thọ, Phường Tân Phong, Quận 7',
    district: 'Quận 7',
    phone: '(028) 5403 3333',
    email: 'tdtu2@tdtu.edu.vn',
    website: 'https://cs2.tdtu.edu.vn',
    foundedYear: 2010,
    studentCount: 13000,
    facultyCount: 11,
    description: 'Trường Đại học Tôn Đức Thắng Cơ sở 2 (TDTU2) là phân hiệu của ĐHDT Hà Nội tại TP.HCM, một trường đại học công lập danh tiếng với truyền thống 70 năm. Cơ sở 2 được thành lập năm 2010 để đào tạo nhân lực kỹ thuật cho khu vực phía Nam. Các ngành đào tạo mạnh bao gồm: Kỹ thuật Điện - Điện tử, Kỹ thuật Cơ khí, Công nghệ thông tin, Xây dựng dân dụng và Cơ sở hạ tầng. TDTU2 có phòng thí nghiệm hiện đại, workshop thực hành, đối tác với nhiều công ty công nghiệp lớn. Sinh viên có cơ hội thực tập tại các doanh nghiệp Samsung, Siemens, Sony và các công ty Việt hàng đầu.',
    specialties: ['Kỹ thuật điện', 'Kỹ thuật cơ khí', 'Công nghệ thông tin', 'Xây dựng dân dụng', 'Cơ sở hạ tầng'],
    location: { type: 'Point', coordinates: [106.7195, 10.7321] },
    programs: [
      {
        name: 'Chương trình đại học chính quy',
        tuition: '11.500.000 đồng/học kỳ (năm 2024-2025)',
        majors: ['Kỹ thuật Điện - Điện tử', 'Kỹ thuật Cơ khí', 'Công nghệ thông tin', 'Xây dựng dân dụng', 'Kỹ thuật Cơ sở hạ tầng'],
        description: 'Chất lượng đào tạo TDTU'
      }
    ],
    admissionScores: [
      { major: 'Công nghệ thông tin', score: '22.00', year: 2024 },
      { major: 'Kỹ thuật Điện', score: '21.50', year: 2024 },
      { major: 'Kỹ thuật Cơ khí', score: '21.00', year: 2024 }
    ],
    changes2025: 'Năm 2025, TDTU2 mở thêm ngành Kỹ thuật Tự động hóa và Trí tuệ nhân tạo ứng dụng. Trường cũng triển khai chương trình thực tập có lương từ năm thứ 2.'
  },
  {
    ranking: 44,
    name: 'Trường Đại học Hùng Vương TP.HCM',
    shortName: 'HVU',
    type: 'Tư thục',
    address: '140 Tô Hiến Thành, Phường 15, Quận 10',
    district: 'Quận 10',
    phone: '(028) 3861 5555',
    email: 'hvu@hvu.edu.vn',
    website: 'https://hvu.edu.vn',
    foundedYear: 2005,
    studentCount: 9000,
    facultyCount: 8,
    description: 'Trường Đại học Hùng Vương TP.HCM (HVU) là trường đại học tư thục với 20 năm đào tạo đa ngành. Trường có vị trí lý tưởng ở khu vực Q.10, cơ sở vật chất hiện đại và học phí hợp lý. Các ngành đào tạo mạnh bao gồm: Quản trị kinh doanh, Kế toán, Luật, Ngôn ngữ Anh và Công nghệ thông tin. HVU chú trọng đào tạo ứng dụng, liên kết với doanh nghiệp và có nhiều chương trình học bổng cho sinh viên. Trường có tỷ lệ sinh viên có việc làm sau tốt nghiệp đạt 81%.',
    specialties: ['Quản trị kinh doanh', 'Kế toán', 'Luật', 'Ngôn ngữ anh', 'Công nghệ thông tin'],
    location: { type: 'Point', coordinates: [106.6652, 10.7720] },
    programs: [
      {
        name: 'Chương trình đại học chính quy',
        tuition: '13.500.000 đồng/học kỳ (năm 2024-2025)',
        majors: ['Quản trị kinh doanh', 'Kế toán', 'Luật', 'Ngôn ngữ Anh', 'Công nghệ thông tin', 'Hành chính nhân sự', 'Tài chính'],
        description: 'Học phí tư thục hợp lý'
      }
    ],
    admissionScores: [
      { major: 'Luật', score: '21.50', year: 2024 },
      { major: 'Quản trị kinh doanh', score: '20.50', year: 2024 },
      { major: 'Kế toán', score: '20.00', year: 2024 }
    ],
    changes2025: 'Năm 2025, HVU mở thêm ngành Luật Quốc tế và Luật Doanh nghiệp. Trường cũng tăng cường hợp tác với các công ty luật hàng đầu để sinh viên có cơ hội thực tập chuyên nghiệp.'
  },
  {
    ranking: 45,
    name: 'Trường Cao đẳng Bách khoa TP.HCM',
    shortName: 'BKTP',
    type: 'Công lập',
    address: '1132 Nguyễn Văn Linh, Phường Tân Phong, Quận 7',
    district: 'Quận 7',
    phone: '(028) 5400 6666',
    email: 'bktp@bktp.edu.vn',
    website: 'https://bktp.edu.vn',
    foundedYear: 2008,
    studentCount: 7000,
    facultyCount: 7,
    description: 'Trường Cao đẳng Bách khoa TP.HCM (BKTP) là trường cao đẳng công lập chất lượng cao chuyên đào tạo nhân lực kỹ thuật ứng dụng. Trường kế thừa chất lượng đào tạo của Bách Khoa Hà Nội, có các ngành đào tạo mạnh: Kỹ thuật Điện - Điện tử, Cơ khí tự động, Công nghệ thông tin, Quản lý xây dựng. BKTP có phòng thí nghiệm hiện đại, workshop thực hành và liên kết chặt chẽ với các doanh nghiệp. Sinh viên được tuyên thẳng lên đại học hoặc có việc làm ngay sau tốt nghiệp.',
    specialties: ['Kỹ thuật điện', 'Cơ khí tự động', 'Công nghệ thông tin', 'Quản lý xây dựng'],
    location: { type: 'Point', coordinates: [106.7195, 10.7321] },
    programs: [
      {
        name: 'Chương trình cao đẳng 3 năm',
        tuition: '8.500.000 đồng/học kỳ (năm 2024-2025)',
        majors: ['Kỹ thuật Điện - Điện tử', 'Cơ khí tự động', 'Công nghệ thông tin', 'Quản lý xây dựng', 'Công nghệ ô tô', 'Quản lý khách sạn'],
        description: 'Học phí công lập, tuyên thẳng lên đại học'
      }
    ],
    admissionScores: [
      { major: 'Công nghệ thông tin', score: '19.50', year: 2024 },
      { major: 'Kỹ thuật Điện', score: '19.00', year: 2024 },
      { major: 'Cơ khí tự động', score: '18.50', year: 2024 }
    ],
    changes2025: 'Năm 2025, BKTP mở chương trình tuyên thẳng 2+2 (2 năm cao đẳng + 2 năm đại học). Trường cũng triển khai chương trình đào tạo liên kết với các trường cao đẳng Hàn Quốc và Nhật Bản.'
  },
  {
    ranking: 46,
    name: 'Trường Đại học Phương Đông (Oriental University)',
    shortName: 'OU HCM',
    type: 'Tư thục',
    address: '66 Đào Tông Nguyên, Phường Tân Phú, Quận Tân Phú',
    district: 'Quận Tân Phú',
    phone: '(028) 3809 2000',
    email: 'ou@ou.edu.vn',
    website: 'https://ou.edu.vn',
    foundedYear: 2009,
    studentCount: 5000,
    facultyCount: 6,
    description: 'Trường Đại học Phương Đông (OU) là trường đại học tư thục chất lượng cao với 16 năm đào tạo theo hướng quốc tế. Trường chuyên đào tạo các ngành kinh tế, quản lý kinh doanh và ngoại ngữ với quy mô vừa và chất lượng cao. Các ngành đào tạo mạnh bao gồm: Quản trị kinh doanh quốc tế, Marketing quốc tế, Ngoại thương và Tài chính - Ngân hàng. OU có đội ngũ giảng viên đa quốc gia, cơ sở vật chất hiện đại và môi trường học tập quốc tế. Sinh viên OU có cơ hội trao đổi học tập ở nước ngoài, tham gia các cuộc thi kinh tế quốc tế.',
    specialties: ['Quản trị kinh doanh quốc tế', 'Marketing quốc tế', 'Ngoại thương', 'Tài chính ngân hàng', 'Ngoại ngữ'],
    location: { type: 'Point', coordinates: [106.6461, 10.8044] },
    programs: [
      {
        name: 'Chương trình đại học quốc tế',
        tuition: '22.000.000 đồng/học kỳ (năm 2024-2025)',
        majors: ['Business Administration (International)', 'International Marketing', 'International Trade', 'Finance and Banking', 'English for Business'],
        description: 'Giảng dạy 100% bằng tiếng Anh'
      }
    ],
    admissionScores: [
      { major: 'Business Administration', score: '23.00', year: 2024 },
      { major: 'International Marketing', score: '22.50', year: 2024 },
      { major: 'Finance', score: '22.00', year: 2024 }
    ],
    changes2025: 'Năm 2025, OU mở rộng chương trình trao đổi sinh viên với 15 nước. Trường cũng triển khai chương trình double degree với các trường đại học uy tín châu Âu.'
  },
  {
    ranking: 47,
    name: 'Trường Đại học Chánh Kỳ',
    shortName: 'CKU',
    type: 'Tư thục',
    address: '123 Trương Văn Lý, Phường Tân Thành, Quận 4',
    district: 'Quận 4',
    phone: '(028) 3622 8988',
    email: 'cku@cku.edu.vn',
    website: 'https://cku.edu.vn',
    foundedYear: 2006,
    studentCount: 8000,
    facultyCount: 8,
    description: 'Trường Đại học Chánh Kỳ (CKU) là trường đại học tư thục với 19 năm đào tạo các ngành kinh tế và kỹ thuật. Trường có vị trí lý tưởng ở Q.4 gần trung tâm, cơ sở vật chất khang trang. Các ngành đào tạo mạnh bao gồm: Quản trị kinh doanh, Kế toán, Công nghệ thông tin, Kỹ thuật công nghệ thực phẩm và Du lịch. CKU chú trọng đào tạo ứng dụng, gắn với nhu cầu nhân lực thị trường. Sinh viên CKU có cơ hội thực tập tại các công ty lớn và có tỷ lệ việc làm cao sau tốt nghiệp.',
    specialties: ['Quản trị kinh doanh', 'Kế toán', 'Công nghệ thông tin', 'Công nghệ thực phẩm', 'Du lịch'],
    location: { type: 'Point', coordinates: [106.7027, 10.7493] },
    programs: [
      {
        name: 'Chương trình đại học chính quy',
        tuition: '13.000.000 đồng/học kỳ (năm 2024-2025)',
        majors: ['Quản trị kinh doanh', 'Kế toán', 'Công nghệ thông tin', 'Công nghệ thực phẩm', 'Du lịch', 'Khách sạn'],
        description: 'Học phí tư thục phù hợp'
      }
    ],
    admissionScores: [
      { major: 'Công nghệ thực phẩm', score: '20.50', year: 2024 },
      { major: 'Quản trị kinh doanh', score: '20.00', year: 2024 },
      { major: 'Du lịch', score: '19.50', year: 2024 }
    ],
    changes2025: 'Năm 2025, CKU mở ngành Food Innovation và Digital Business Management. Trường cũng tăng cường liên kết với các nhà máy thực phẩm và khách sạn 5 sao.'
  },
  {
    ranking: 48,
    name: 'Trường Đại học Xuân Thủy',
    shortName: 'XTU',
    type: 'Tư thục',
    address: '210-212 Hoàng Hoa Thám, Phường 7, Quận Bình Thạnh',
    district: 'Quận Bình Thạnh',
    phone: '(028) 6263 1111',
    email: 'xtu@xtu.edu.vn',
    website: 'https://xtu.edu.vn',
    foundedYear: 2004,
    studentCount: 6000,
    facultyCount: 6,
    description: 'Trường Đại học Xuân Thủy (XTU) là trường đại học tư thục với 21 năm đào tạo các ngành kinh tế, quản lý và ngoại ngữ. Trường có cơ sở vật chất hiện đại, vị trí tốt tại Q.Bình Thạnh, môi trường học tập lành mạnh. Các ngành đào tạo mạnh bao gồm: Quản trị kinh doanh, Ngoại thương, Ngoại ngữ, Marketing và Tài chính. XTU chú trọng đào tạo kỹ năng mềm, giao tiếp quốc tế, liên kết với doanh nghiệp. Sinh viên XTU có tỷ lệ việc làm cao và nhiều đều được nhận vào các công ty toàn cầu.',
    specialties: ['Quản trị kinh doanh', 'Ngoại thương', 'Ngoại ngữ', 'Marketing', 'Tài chính'],
    location: { type: 'Point', coordinates: [106.7145, 10.8143] },
    programs: [
      {
        name: 'Chương trình đại học chính quy',
        tuition: '12.500.000 đồng/học kỳ (năm 2024-2025)',
        majors: ['Quản trị kinh doanh', 'Ngoại thương', 'Tiếng Anh', 'Tiếng Hàn', 'Marketing', 'Tài chính'],
        description: 'Học phí hợp lý'
      }
    ],
    admissionScores: [
      { major: 'Ngoại thương', score: '22.00', year: 2024 },
      { major: 'Tiếng Anh', score: '21.50', year: 2024 },
      { major: 'Marketing', score: '21.00', year: 2024 }
    ],
    changes2025: 'Năm 2025, XTU tăng cường chương trình học bổng du học Hàn Quốc, Nhật Bản. Trường cũng mở chương trình training cho kỹ năng làm việc toàn cầu.'
  },
  {
    ranking: 49,
    name: 'Trường Đại học Ngôn ngữ - Tin học TP.HCM (HULIT)',
    shortName: 'HULIT',
    type: 'Công lập',
    address: '575 Sư Vạn Hạnh, Phường 12, Quận 10',
    district: 'Quận 10',
    phone: '(028) 3864 8888',
    email: 'hulit@hulit.edu.vn',
    website: 'https://hulit.edu.vn',
    foundedYear: 2011,
    studentCount: 7000,
    facultyCount: 7,
    description: 'Trường Đại học Ngôn ngữ - Tin học TP.HCM (HULIT) là trường đại học công lập chuyên về đào tạo ngoại ngữ và công nghệ thông tin. Trường được thành lập năm 2011 để phục vụ nhu cầu nhân lực ngôn ngữ và công nghệ tại TP.HCM. Các ngành đào tạo mạnh bao gồm: Tiếng Anh, Tiếng Trung, Tiếng Hàn, Tiếng Nhật, Công nghệ thông tin, Hệ thống thông tin. HULIT có giảng viên nước ngoài bản ngữ, phòng thí nghiệm máy tính hiện đại. Sinh viên có tỷ lệ việc làm cao trong lĩnh vực giáo dục, công nghệ, ngoại giao.',
    specialties: ['Tiếng anh', 'Tiếng trung', 'Tiếng hàn', 'Tiếng nhật', 'Công nghệ thông tin'],
    location: { type: 'Point', coordinates: [106.6652, 10.7720] },
    programs: [
      {
        name: 'Chương trình đại học chính quy',
        tuition: '10.500.000 đồng/học kỳ (năm 2024-2025)',
        majors: ['Tiếng Anh', 'Tiếng Trung', 'Tiếng Hàn', 'Tiếng Nhật', 'Công nghệ thông tin', 'Hệ thống thông tin'],
        description: 'Học phí công lập'
      }
    ],
    admissionScores: [
      { major: 'Tiếng Anh', score: '22.00', year: 2024 },
      { major: 'Công nghệ thông tin', score: '21.00', year: 2024 },
      { major: 'Tiếng Hàn', score: '20.50', year: 2024 }
    ],
    changes2025: 'Năm 2025, HULIT mở ngành Dịch máy và Xử lý ngôn ngữ tự nhiên. Trường cũng triển khai chương trình giáo dục trực tuyến cho các ngoại ngữ chính.'
  },
  {
    ranking: 50,
    name: 'Trường Đại học Quốc tế (Global University)',
    shortName: 'GU HCM',
    type: 'Tư thục',
    address: '8 Tôn Thất Tuyết, Phường 4, Quận Tân Bình',
    district: 'Quận Tân Bình',
    phone: '(028) 3949 9999',
    email: 'gu@gu.edu.vn',
    website: 'https://gu.edu.vn',
    foundedYear: 2008,
    studentCount: 4500,
    facultyCount: 5,
    description: 'Trường Đại học Quốc tế (Global University) là trường đại học tư thục chất lượng cao với định hướng giáo dục quốc tế. Trường được thành lập năm 2008 với sứ mệnh cung cấp giáo dục kỹ năng cao cho sinh viên Việt Nam và quốc tế. Các ngành đào tạo mạnh bao gồm: Business Administration, International Relations, Environmental Science, Computer Science, và English Studies. GU có cơ sở vật chất hiện đại, giảng viên đa quốc gia, nhiều chương trình trao đổi sinh viên. Sinh viên GU được dạy 100% bằng tiếng Anh và có cơ hội học tập tại các trường đối tác trên thế giới.',
    specialties: ['Business administration', 'International relations', 'Environmental science', 'Computer science', 'English studies'],
    location: { type: 'Point', coordinates: [106.6598, 10.7995] },
    programs: [
      {
        name: 'Chương trình đại học quốc tế',
        tuition: '25.000.000 đồng/học kỳ (năm 2024-2025)',
        majors: ['Business Administration (International)', 'International Relations', 'Environmental Science', 'Computer Science', 'English Studies', 'Psychology'],
        description: 'Giảng dạy 100% bằng tiếng Anh, học phí cao'
      }
    ],
    admissionScores: [
      { major: 'Business Administration', score: '24.00', year: 2024 },
      { major: 'Computer Science', score: '23.50', year: 2024 },
      { major: 'International Relations', score: '23.00', year: 2024 }
    ],
    changes2025: 'Năm 2025, GU triển khai chương trình 3+1 (3 năm tại GU + 1 năm tại trường đối tác nước ngoài). Trường cũng mở rộng học bổng cho sinh viên xuất sắc từ 50% lên 75% chi phí học tập.'
  }
];

async function seedUniversities() {
  try {
    // Kết nối database
    console.log(colors.info, '📡 Đang kết nối database...');
    await connectDB();

    // Xóa dữ liệu cũ
    console.log(colors.warning, '🗑️  Đang xóa dữ liệu cũ...');
    await University.deleteMany({});
    console.log(colors.success, '✅ Đã xóa dữ liệu cũ');

    // Thêm dữ liệu mới
    console.log(colors.info, '📥 Đang import dữ liệu...');
    const universities = await University.insertMany(universitiesData);
    console.log(colors.success, `✅ Đã import thành công ${universities.length} trường đại học`);

    // Hiển thị danh sách
    console.log(colors.info, '\n📋 DANH SÁCH TRƯỜNG ĐẠI HỌC:');
    universities.forEach((uni, index) => {
      console.log(colors.data, `#${uni.ranking} - ${uni.name} (${uni.shortName}) - ${uni.type}`);
    });

    console.log(colors.success, '\n🎉 Seed dữ liệu thành công!');
    process.exit(0);
  } catch (error) {
    console.error(colors.error, '❌ Lỗi:', error.message);
    process.exit(1);
  }
}

seedUniversities();
