/**
 * ===================================
 * SEED UNIVERSITIES DATA
 * Import danh sách tất cả trường đại học TP.HCM
 * ===================================
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('./src/config/database');
const University = require('./src/models/University');
const colors = require('./src/config/colors');

// Danh sách các trường đại học TP.HCM
const universitiesData = [
  {
    name: 'Đại học Quốc gia TP.HCM',
    shortName: 'HCMU',
    address: '227 Nguyễn Văn Cừ, Quận 5, TP.HCM',
    district: 'Quận 5',
    phone: '(028) 38 655 101',
    email: 'info@hcmu.edu.vn',
    website: 'https://www.hcmu.edu.vn',
    foundedYear: 1994,
    studentCount: 45000,
    facultyCount: 12,
    description: 'Đại học hàng đầu của Việt Nam với nhiều ngành học đa dạng',
    specialties: ['Khoa học tự nhiên', 'Khoa học xã hội', 'Kinh tế', 'Quản lý công', 'Tài chính - Ngân hàng', 'Luật'],
    location: { type: 'Point', coordinates: [106.6631, 10.7569] }
  },
  {
    name: 'Đại học Bách Khoa TP.HCM',
    shortName: 'HCMUT',
    address: '268 Lý Thường Kiệt, Quận 10, TP.HCM',
    district: 'Quận 10',
    phone: '(028) 38 647 256',
    email: 'daihoc@hcmut.edu.vn',
    website: 'https://www.hcmut.edu.vn',
    foundedYear: 1957,
    studentCount: 35000,
    facultyCount: 15,
    description: 'Trường đại học công nghệ hàng đầu tại Việt Nam',
    specialties: ['Kỹ thuật điện', 'Kỹ thuật cơ khí', 'Kỹ thuật xây dựng', 'Công nghệ thông tin', 'Kỹ thuật hoá', 'Tự động hoá'],
    location: { type: 'Point', coordinates: [106.6668, 10.7749] }
  },
  {
    name: 'Đại học Kinh Tế TP.HCM',
    shortName: 'UEH',
    address: '59C Nguyễn Đình Chiểu, Quận 3, TP.HCM',
    district: 'Quận 3',
    phone: '(028) 38 296 269',
    email: 'info@ueh.edu.vn',
    website: 'https://www.ueh.edu.vn',
    foundedYear: 1956,
    studentCount: 25000,
    facultyCount: 8,
    description: 'Trường đại học kinh tế hàng đầu tại Việt Nam',
    specialties: ['Kinh tế', 'Tài chính - Ngân hàng', 'Kế toán', 'Quản lý kinh doanh', 'Luật kinh tế'],
    location: { type: 'Point', coordinates: [106.6929, 10.7850] }
  },
  {
    name: 'Đại học Sư Phạm TP.HCM',
    shortName: 'HCMUE',
    address: '1 Võ Văn Ngân, Phường Linh Chiểu, Quận Thủ Đức, TP.HCM',
    district: 'Thành phố Thủ Đức',
    phone: '(028) 37 244 270',
    email: 'info@hcmue.edu.vn',
    website: 'https://www.hcmue.edu.vn',
    foundedYear: 1965,
    studentCount: 30000,
    facultyCount: 20,
    description: 'Trường đại học sư phạm tạo ra những nhà giáo dục',
    specialties: ['Sư phạm tiếng Việt', 'Sư phạm toán', 'Sư phạm tiếng Anh', 'Sư phạm lịch sử', 'Sư phạm địa lý', 'Sư phạm hoá học', 'Sư phạm vật lý'],
    location: { type: 'Point', coordinates: [106.7559, 10.8734] }
  },
  {
    name: 'Đại học Y Dược TP.HCM',
    shortName: 'HCMMU',
    address: '202 Nguyễn Thị Minh Khai, Quận 3, TP.HCM',
    district: 'Quận 3',
    phone: '(028) 38 227 777',
    email: 'info@ump.edu.vn',
    website: 'https://www.hcmmu.edu.vn',
    foundedYear: 1847,
    studentCount: 8000,
    facultyCount: 10,
    description: 'Trường y dược lâu đời và uy tín nhất Việt Nam',
    specialties: ['Y học', 'Dược học', 'Stomatology', 'Y học cổ truyền', 'Điều dưỡng'],
    location: { type: 'Point', coordinates: [106.6833, 10.7897] }
  },
  {
    name: 'Trường Đại học Ngoại thương TP.HCM',
    shortName: 'UFMVN',
    address: '91 Nguyễn Hữu Cảnh, Quận Bình Thạnh, TP.HCM',
    district: 'Quận Bình Thạnh',
    phone: '(028) 35 129 170',
    email: 'info@ufm.edu.vn',
    website: 'https://www.ufmvn.edu.vn',
    foundedYear: 1991,
    studentCount: 12000,
    facultyCount: 6,
    description: 'Trường đại học chuyên đào tạo ngoại thương hàng đầu',
    specialties: ['Ngoại thương', 'Quản lý thương mại', 'Kinh tế quốc tế', 'Quản lý du lịch'],
    location: { type: 'Point', coordinates: [106.7211, 10.8036] }
  },
  {
    name: 'Đại học Công Nghệ Thông Tin TP.HCM',
    shortName: 'HUTECH',
    address: '475A Điện Biên Phủ, Quận 3, TP.HCM',
    district: 'Quận 3',
    phone: '(028) 38 969 269',
    email: 'info@hutech.edu.vn',
    website: 'https://www.hutech.edu.vn',
    foundedYear: 2008,
    studentCount: 20000,
    facultyCount: 8,
    description: 'Trường chuyên đào tạo công nghệ thông tin và quản lý',
    specialties: ['Công nghệ thông tin', 'Hệ thống thông tin', 'Kỹ thuật phần mềm', 'Quản lý dự án'],
    location: { type: 'Point', coordinates: [106.6795, 10.7929] }
  },
  {
    name: 'Đại học Văn Lang TP.HCM',
    shortName: 'VLU',
    address: '69/68 Đinh Tiên Hoàng, Quận Bình Thạnh, TP.HCM',
    district: 'Quận Bình Thạnh',
    phone: '(028) 35 129 388',
    email: 'info@vanlanguni.edu.vn',
    website: 'https://www.vanlanguni.edu.vn',
    foundedYear: 2008,
    studentCount: 25000,
    facultyCount: 10,
    description: 'Trường đại học cộng lập hiện đại tại TP.HCM',
    specialties: ['Kỹ thuật', 'Công nghệ thông tin', 'Kinh doanh', 'Ngoại ngữ', 'Du lịch'],
    location: { type: 'Point', coordinates: [106.7124, 10.7945] }
  },
  {
    name: 'Đại học Mở TP.HCM',
    shortName: 'OU',
    address: '97 Võ Văn Tần, Quận 3, TP.HCM',
    district: 'Quận 3',
    phone: '(028) 38 396 094',
    email: 'info@ou.edu.vn',
    website: 'https://www.ou.edu.vn',
    foundedYear: 1993,
    studentCount: 28000,
    facultyCount: 10,
    description: 'Trường đại học công lập hiện đại với chương trình đa dạng',
    specialties: ['Quản lý công', 'Phát triển bền vững', 'Giáo dục', 'Kinh tế', 'Công nghệ'],
    location: { type: 'Point', coordinates: [106.6879, 10.7825] }
  },
  {
    name: 'Đại học Sài Gòn',
    shortName: 'SGU',
    address: '273 An Dương Vương, Quận 5, TP.HCM',
    district: 'Quận 5',
    phone: '(028) 38 350 269',
    email: 'info@sgu.edu.vn',
    website: 'https://www.sgu.edu.vn',
    foundedYear: 1995,
    studentCount: 22000,
    facultyCount: 8,
    description: 'Trường đại học cộng lập đa chuyên ngành',
    specialties: ['Kinh tế', 'Quản lý kinh doanh', 'Kỹ thuật', 'Công nghệ thông tin', 'Quản lý du lịch'],
    location: { type: 'Point', coordinates: [106.6570, 10.7505] }
  },
  {
    name: 'Trường Đại học Công nghiệp Thực phẩm TP.HCM',
    shortName: 'HUFI',
    address: '140 Lê Trọng Tấn, Quận Tân Phú, TP.HCM',
    district: 'Quận Tân Phú',
    phone: '(028) 37 745 777',
    email: 'info@hufi.edu.vn',
    website: 'https://www.hufi.edu.vn',
    foundedYear: 1957,
    studentCount: 5000,
    facultyCount: 5,
    description: 'Trường chuyên đào tạo về công nghiệp thực phẩm',
    specialties: ['Công nghệ thực phẩm', 'Kỹ thuật lạnh', 'Quản lý chất lượng', 'Vệ sinh an toàn thực phẩm'],
    location: { type: 'Point', coordinates: [106.6303, 10.8095] }
  },
  {
    name: 'Đại học Tài chính - Marketing',
    shortName: 'UFM',
    address: '2/F Lô 6 Khu Công nghiệp Tân Tạo, Quận 8, TP.HCM',
    district: 'Quận 8',
    phone: '(028) 37 722 333',
    email: 'info@ufm.edu.vn',
    website: 'https://www.ufm.edu.vn',
    foundedYear: 2008,
    studentCount: 8000,
    facultyCount: 4,
    description: 'Trường đại học chuyên đào tạo tài chính và marketing',
    specialties: ['Tài chính', 'Marketing', 'Ngân hàng', 'Kinh doanh quốc tế'],
    location: { type: 'Point', coordinates: [106.6357, 10.7262] }
  },
  {
    name: 'Đại học Hòa Sen',
    shortName: 'HSU',
    address: '8 Nguễn Văn Trỗi, Quận Phú Nhuận, TP.HCM',
    district: 'Quận Phú Nhuận',
    phone: '(028) 62 826 666',
    email: 'info@hsu.edu.vn',
    website: 'https://www.hsu.edu.vn',
    foundedYear: 1994,
    studentCount: 15000,
    facultyCount: 6,
    description: 'Trường đại học tư thục uy tín với đào tạo quốc tế',
    specialties: ['Kinh doanh', 'Kỹ thuật', 'Ngoại ngữ', 'Du lịch', 'Quản lý'],
    location: { type: 'Point', coordinates: [106.7069, 10.8083] }
  },
  {
    name: 'Đại học Cần Thơ - Cơ sở TP.HCM',
    shortName: 'CANTHO-HCM',
    address: '169 Tôn Đức Thắng, Quận 1, TP.HCM',
    district: 'Quận 1',
    phone: '(028) 38 219 211',
    email: 'info@ctu.edu.vn',
    website: 'https://www.ctu.edu.vn',
    foundedYear: 1956,
    studentCount: 8000,
    facultyCount: 6,
    description: 'Cơ sở TP.HCM của Đại học Cần Thơ',
    specialties: ['Nông nghiệp', 'Thủy lợi', 'Kỹ thuật', 'Kinh tế'],
    location: { type: 'Point', coordinates: [106.7282, 10.7590] }
  },
  {
    name: 'Đại học Tôn Đức Thắng',
    shortName: 'TDTU',
    address: '19 Nguyễn Hữu Thọ, Phường Tân Phong, Quận 7, TP.HCM',
    district: 'Quận 7',
    phone: '(028) 37 755 061',
    email: 'info@tdtu.edu.vn',
    website: 'https://www.tdtu.edu.vn',
    foundedYear: 1997,
    studentCount: 20000,
    facultyCount: 8,
    description: 'Trường đại học cộng lập hiện đại tại TP.HCM',
    specialties: ['Kỹ thuật', 'Công nghệ thông tin', 'Kinh doanh', 'Ngoại ngữ', 'Khoa học'],
    location: { type: 'Point', coordinates: [106.7270, 10.7408] }
  },
  {
    name: 'Đại học Kinh tế - Kỹ thuật Công nghiệp',
    shortName: 'UNETI',
    address: '475A Điện Biên Phủ, Quận 3, TP.HCM',
    district: 'Quận 3',
    phone: '(028) 38 969 269',
    email: 'info@uneti.edu.vn',
    website: 'https://www.uneti.edu.vn',
    foundedYear: 2009,
    studentCount: 18000,
    facultyCount: 7,
    description: 'Trường đại học chuyên đào tạo kinh tế - kỹ thuật',
    specialties: ['Kinh tế', 'Kỹ thuật', 'Công nghệ thông tin', 'Quản lý dự án'],
    location: { type: 'Point', coordinates: [106.6795, 10.7929] }
  },
  {
    name: 'Đại học Xây Dựng TP.HCM',
    shortName: 'NUCE',
    address: '274 Nguyễn Tuân, Quận Thanh Xuân, Quận 2, TP.HCM',
    district: 'Quận 2',
    phone: '(028) 37 305 555',
    email: 'info@nuce.edu.vn',
    website: 'https://www.nuce.edu.vn',
    foundedYear: 1950,
    studentCount: 12000,
    facultyCount: 6,
    description: 'Trường đại học chuyên đào tạo xây dựng',
    specialties: ['Kỹ thuật xây dựng', 'Kiến trúc', 'Kỹ thuật cầu đường', 'Quản lý công trình'],
    location: { type: 'Point', coordinates: [106.7624, 10.8200] }
  },
  {
    name: 'Đại học Công Nghệ Giao Thông Vận Tải TP.HCM',
    shortName: 'UNVMC',
    address: '2K Ngã Tư Sở, Quận Bình Thạnh, TP.HCM',
    district: 'Quận Bình Thạnh',
    phone: '(028) 35 180 280',
    email: 'info@unvmc.edu.vn',
    website: 'https://www.unvmc.edu.vn',
    foundedYear: 2013,
    studentCount: 10000,
    facultyCount: 5,
    description: 'Trường đại học chuyên đào tạo giao thông vận tải',
    specialties: ['Giao thông vận tải', 'Hàng hải', 'Logistics', 'Quản lý chuỗi cung ứng'],
    location: { type: 'Point', coordinates: [106.7211, 10.8036] }
  },
  {
    name: 'Đại học Ngoài khóa - Thương mại',
    shortName: 'UNISA',
    address: '649 Nguyễn Kiếm, Phường 2, Quận Gò Vấp, TP.HCM',
    district: 'Quận Gò Vấp',
    phone: '(028) 38 969 288',
    email: 'info@unisa.edu.vn',
    website: 'https://www.unisa.edu.vn',
    foundedYear: 2000,
    studentCount: 14000,
    facultyCount: 5,
    description: 'Trường đại học cộng lập đa ngành đào tạo',
    specialties: ['Kinh doanh', 'Tiếp thị', 'Quản lý nhân sự', 'Tài chính'],
    location: { type: 'Point', coordinates: [106.6640, 10.8350] }
  }
];

const seedUniversities = async () => {
  try {
    console.log(`${colors.yellow}🔄 Bắt đầu seed dữ liệu trường đại học...${colors.reset}`);

    await connectDB();

    const existingCount = await University.countDocuments();
    if (existingCount > 0) {
      console.log(`${colors.yellow}⚠️  Đã tìm thấy ${existingCount} trường đã tồn tại${colors.reset}`);
      console.log(`${colors.yellow}💥 Đang xóa dữ liệu cũ...${colors.reset}`);
      await University.deleteMany({});
    }

    const result = await University.insertMany(universitiesData);

    console.log(`${colors.green}✅ Seed dữ liệu thành công!${colors.reset}`);
    console.log(`${colors.cyan}📚 Đã thêm ${result.length} trường đại học${colors.reset}`);

    result.forEach((uni) => {
      console.log(`${colors.magenta}✓${colors.reset} ${uni.name} (${uni.district})`);
    });

    process.exit(0);
  } catch (error) {
    console.error(`${colors.red}❌ Lỗi seed dữ liệu: ${error.message}${colors.reset}`);
    process.exit(1);
  }
};

seedUniversities();
