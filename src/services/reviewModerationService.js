/**
 * ===================================
 * REVIEW MODERATION SERVICE
 * Tự động kiểm duyệt đánh giá
 * ===================================
 */

// Từ khóa cấm và spam patterns
const BANNED_KEYWORDS = [
    // Từ ngữ tục tĩu
    'đụ', 'địt', 'lồn', 'cặc', 'buồi', 'đéo', 'đĩ', 'dmm', 'dm', 'vl', 'vcl', 'cc', 'clgt',
    'fuck', 'shit', 'bitch', 'ass', 'dick', 'pussy',
    
    // Spam/quảng cáo
    'mua ngay', 'giảm giá', 'khuyến mãi', 'liên hệ', 'inbox', 'zalo',
    'đặt hàng', 'website', 'www.', 'http', '.com', '.vn',
    
    // Lừa đảo
    'chuyển khoản', 'bank', 'stk', 'số tài khoản', 'momo', 'chuyển tiền',
    'trúng thưởng', 'miễn phí', 'free'
];

// Spam patterns
const SPAM_PATTERNS = {
    repeatedChars: /(.)\1{4,}/, // aaaaaaa
    allCaps: /^[A-Z\s!]{10,}$/, // ABCDEFGHIJK
    excessivePunctuation: /[!?.]{4,}/, // !!!!????
    phoneNumber: /(?:\+84|0)(?:\d[\s.-]?){9,10}/, // 0123456789
    email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/, // email@example.com
    url: /(https?:\/\/|www\.)[^\s]+/i, // URL
    multipleSpaces: /\s{5,}/ // nhiều space
};

/**
 * Kiểm tra từ khóa cấm
 */
function checkBannedKeywords(text) {
    const lowerText = text.toLowerCase();
    const foundKeywords = BANNED_KEYWORDS.filter(keyword => 
        lowerText.includes(keyword.toLowerCase())
    );
    
    return {
        hasBannedKeywords: foundKeywords.length > 0,
        foundKeywords,
        severity: foundKeywords.length > 2 ? 'high' : 'medium'
    };
}

/**
 * Kiểm tra spam patterns
 */
function checkSpamPatterns(text) {
    const issues = [];
    
    // Kiểm tra từng pattern
    if (SPAM_PATTERNS.repeatedChars.test(text)) {
        issues.push({ type: 'repeatedChars', message: 'Ký tự lặp quá nhiều' });
    }
    
    if (SPAM_PATTERNS.allCaps.test(text)) {
        issues.push({ type: 'allCaps', message: 'Toàn chữ hoa' });
    }
    
    if (SPAM_PATTERNS.excessivePunctuation.test(text)) {
        issues.push({ type: 'excessivePunctuation', message: 'Dấu câu quá nhiều' });
    }
    
    if (SPAM_PATTERNS.phoneNumber.test(text)) {
        issues.push({ type: 'phoneNumber', message: 'Chứa số điện thoại' });
    }
    
    if (SPAM_PATTERNS.email.test(text)) {
        issues.push({ type: 'email', message: 'Chứa email' });
    }
    
    if (SPAM_PATTERNS.url.test(text)) {
        issues.push({ type: 'url', message: 'Chứa link/URL' });
    }
    
    if (SPAM_PATTERNS.multipleSpaces.test(text)) {
        issues.push({ type: 'multipleSpaces', message: 'Nhiều khoảng trắng bất thường' });
    }
    
    return {
        hasSpamPatterns: issues.length > 0,
        issues,
        severity: issues.length > 3 ? 'high' : issues.length > 1 ? 'medium' : 'low'
    };
}

/**
 * Kiểm tra độ dài nội dung
 */
function checkContentLength(comment, title) {
    const totalLength = comment.length + title.length;
    const commentWords = comment.trim().split(/\s+/).length;
    
    const issues = [];
    
    // Quá ngắn (spam)
    if (totalLength < 10) {
        issues.push({ type: 'tooShort', message: 'Nội dung quá ngắn', severity: 'high' });
    } else if (totalLength < 20) {
        issues.push({ type: 'veryShort', message: 'Nội dung rất ngắn', severity: 'medium' });
    }
    
    // Quá dài (có thể spam)
    if (totalLength > 2000) {
        issues.push({ type: 'tooLong', message: 'Nội dung quá dài', severity: 'low' });
    }
    
    // Ít từ (1-2 từ = spam thường)
    if (commentWords < 3) {
        issues.push({ type: 'fewWords', message: 'Quá ít từ', severity: 'high' });
    }
    
    return {
        hasLengthIssues: issues.length > 0,
        issues,
        stats: { totalLength, commentWords }
    };
}

/**
 * Kiểm tra rating logic (suspicious patterns)
 */
function checkRatingLogic(rating, comment, title) {
    const issues = [];
    const totalLength = comment.length + title.length;
    
    // 1 sao + nội dung ngắn = có thể spam/fake
    if (rating === 1 && totalLength < 30) {
        issues.push({ 
            type: 'lowRatingShortContent', 
            message: '1 sao với nội dung quá ngắn (nghi spam)',
            severity: 'high'
        });
    }
    
    // 5 sao + nội dung quá ngắn = có thể fake
    if (rating === 5 && totalLength < 15) {
        issues.push({ 
            type: 'highRatingShortContent', 
            message: '5 sao với nội dung quá ngắn (nghi fake)',
            severity: 'medium'
        });
    }
    
    // 1 sao + chứa từ quảng cáo = spam rõ ràng
    const hasPromoWords = /(mua ngay|giảm giá|khuyến mãi|liên hệ|inbox)/i.test(comment + title);
    if (rating === 1 && hasPromoWords) {
        issues.push({ 
            type: 'lowRatingWithPromo', 
            message: '1 sao + từ quảng cáo (spam)',
            severity: 'high'
        });
    }
    
    return {
        hasSuspiciousRating: issues.length > 0,
        issues
    };
}

/**
 * Tính Trust Score (0-100)
 */
function calculateTrustScore(reviewData, userHistory = {}) {
    let score = 50; // Base score
    
    const { rating, comment, title, reviewType, verified } = reviewData;
    const { totalReviews = 0, approvedReviews = 0, rejectedReviews = 0 } = userHistory;
    
    // === CONTENT QUALITY ===
    const totalLength = comment.length + title.length;
    const commentWords = comment.trim().split(/\s+/).length;
    
    // Độ dài hợp lý
    if (totalLength >= 50 && totalLength <= 500) score += 15;
    else if (totalLength >= 30 && totalLength <= 1000) score += 10;
    else if (totalLength < 20) score -= 20;
    
    // Số từ hợp lý
    if (commentWords >= 10) score += 10;
    else if (commentWords >= 5) score += 5;
    else if (commentWords < 3) score -= 15;
    
    // === RATING LOGIC ===
    // Rating trung bình (3-4) đáng tin hơn
    if (rating >= 3 && rating <= 4) score += 10;
    else if (rating === 5) score += 5; // 5 sao ít tin hơn
    else if (rating === 1) score -= 5; // 1 sao ít tin hơn
    
    // === REVIEW TYPE ===
    if (reviewType === 'rented') score += 15; // Đã thuê = tin cậy hơn
    else if (reviewType === 'viewing') score += 5;
    
    // === VERIFICATION ===
    if (verified) score += 20; // Verified review rất tin cậy
    
    // === USER HISTORY ===
    if (totalReviews > 0) {
        const approvalRate = approvedReviews / totalReviews;
        
        if (approvalRate >= 0.9) score += 15; // 90%+ approval = user tốt
        else if (approvalRate >= 0.7) score += 10;
        else if (approvalRate >= 0.5) score += 5;
        else if (approvalRate < 0.3) score -= 20; // <30% approval = spam user
        
        // User mới (ít reviews) ít tin hơn
        if (totalReviews < 3) score -= 5;
        else if (totalReviews >= 10) score += 5; // Nhiều review = user tích cực
    } else {
        score -= 10; // Review đầu tiên = ít tin
    }
    
    // Rejected nhiều = spam user
    if (rejectedReviews > 3) score -= 25;
    
    // === SPAM DETECTION ===
    const bannedCheck = checkBannedKeywords(comment + ' ' + title);
    if (bannedCheck.hasBannedKeywords) {
        score -= bannedCheck.severity === 'high' ? 40 : 20;
    }
    
    const spamCheck = checkSpamPatterns(comment + ' ' + title);
    if (spamCheck.hasSpamPatterns) {
        if (spamCheck.severity === 'high') score -= 30;
        else if (spamCheck.severity === 'medium') score -= 15;
        else score -= 5;
    }
    
    // Clamp score 0-100
    return Math.max(0, Math.min(100, score));
}

/**
 * Hàm chính: Moderate Review
 */
async function moderateReview(reviewData, userHistory = {}) {
    const { rating, comment, title, reviewType, verified } = reviewData;
    
    // 1. Kiểm tra từ khóa cấm
    const bannedCheck = checkBannedKeywords(comment + ' ' + title);
    
    // 2. Kiểm tra spam patterns
    const spamCheck = checkSpamPatterns(comment + ' ' + title);
    
    // 3. Kiểm tra độ dài
    const lengthCheck = checkContentLength(comment, title);
    
    // 4. Kiểm tra rating logic
    const ratingCheck = checkRatingLogic(rating, comment, title);
    
    // 5. Tính trust score
    const trustScore = calculateTrustScore(reviewData, userHistory);
    
    // === DECISION LOGIC ===
    let status = 'pending';
    let reason = [];
    let autoApproved = false;
    let autoRejected = false;
    
    // AUTO REJECT (từ khóa cấm nghiêm trọng)
    if (bannedCheck.hasBannedKeywords && bannedCheck.severity === 'high') {
        status = 'rejected';
        autoRejected = true;
        reason.push(`Chứa từ ngữ vi phạm: ${bannedCheck.foundKeywords.join(', ')}`);
    }
    
    // AUTO REJECT (spam patterns nhiều)
    else if (spamCheck.hasSpamPatterns && spamCheck.severity === 'high') {
        status = 'rejected';
        autoRejected = true;
        reason.push(`Phát hiện spam: ${spamCheck.issues.map(i => i.message).join(', ')}`);
    }
    
    // AUTO REJECT (nội dung quá ngắn + rating thấp)
    else if (lengthCheck.hasLengthIssues && 
             lengthCheck.issues.some(i => i.severity === 'high') &&
             rating === 1) {
        status = 'rejected';
        autoRejected = true;
        reason.push('Nội dung quá ngắn với đánh giá 1 sao (nghi spam)');
    }
    
    // AUTO REJECT (trust score < 40 - dưới trung bình)
    else if (trustScore < 40) {
        status = 'rejected';
        autoRejected = true;
        reason.push(`Điểm tin cậy thấp (${trustScore}/100). Đánh giá có dấu hiệu spam hoặc không đủ chất lượng.`);
    }
    
    // AUTO APPROVE (trust score >= 70 - tốt)
    else if (trustScore >= 70 && !bannedCheck.hasBannedKeywords && !spamCheck.hasSpamPatterns) {
        status = 'approved';
        autoApproved = true;
        reason.push(`Tự động phê duyệt - Điểm tin cậy cao (${trustScore}/100)`);
    }
    
    // AUTO APPROVE (verified + trust score >= 65)
    else if (verified && trustScore >= 65) {
        status = 'approved';
        autoApproved = true;
        reason.push('Review đã xác minh với điểm tin cậy tốt');
    }
    
    // PENDING (40-69 điểm - khá, cần review thủ công)
    else {
        status = 'pending';
        reason.push(`Cần kiểm duyệt thủ công - Điểm tin cậy: ${trustScore}/100`);
        
        // Thu thập lý do
        if (bannedCheck.hasBannedKeywords) {
            reason.push(`Cảnh báo: Chứa từ nghi vấn (${bannedCheck.foundKeywords.slice(0, 3).join(', ')})`);
        }
        if (spamCheck.hasSpamPatterns) {
            reason.push(`Cảnh báo spam: ${spamCheck.issues.slice(0, 2).map(i => i.message).join(', ')}`);
        }
        if (ratingCheck.hasSuspiciousRating) {
            reason.push(`Cảnh báo: ${ratingCheck.issues[0].message}`);
        }
    }
    
    // Kết quả
    return {
        status, // 'approved', 'rejected', 'pending'
        trustScore,
        autoApproved,
        autoRejected,
        moderationReason: reason.join('. '),
        moderationDetails: {
            bannedKeywords: bannedCheck,
            spamPatterns: spamCheck,
            contentLength: lengthCheck,
            ratingLogic: ratingCheck
        },
        moderatedAt: new Date()
    };
}

module.exports = {
    moderateReview,
    calculateTrustScore,
    checkBannedKeywords,
    checkSpamPatterns,
    checkContentLength,
    checkRatingLogic
};
