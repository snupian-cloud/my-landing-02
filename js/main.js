// ===================================
// Global State & Configuration
// ===================================
const APP_STATE = {
    currentFilter: 'all',
    reviewRating: 0,
    isLoading: false
};

// ===================================
// Utility Functions
// ===================================
const showNotification = (message, type = 'success') => {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? '#10b981' : '#ef4444'};
        color: white;
        border-radius: 0.5rem;
        box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 0.8rem;
        font-weight: 500;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
};

const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

const generateStars = (rating) => {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        stars += `<i class="fas fa-star${i <= rating ? '' : ' far'}"></i>`;
    }
    return stars;
};

// ===================================
// Navigation
// ===================================
const initNavigation = () => {
    const navbar = document.getElementById('navbar');
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const navMenu = document.getElementById('navMenu');
    
    // Scroll effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
    
    // Mobile menu toggle
    mobileMenuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });
    
    // Close mobile menu on link click
    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
        });
    });
    
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const offsetTop = target.offsetTop - 70;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
};

// ===================================
// References Section
// ===================================
const loadReferences = async () => {
    const referencesGrid = document.getElementById('referencesGrid');
    
    try {
        const response = await fetch('tables/references?limit=100&sort=-created_at');
        const result = await response.json();
        
        if (result.data && result.data.length > 0) {
            displayReferences(result.data);
        } else {
            referencesGrid.innerHTML = `
                <div class="loading">
                    <i class="fas fa-folder-open"></i>
                    <p>아직 등록된 레퍼런스가 없습니다.</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('레퍼런스 로딩 실패:', error);
        referencesGrid.innerHTML = `
            <div class="loading">
                <i class="fas fa-exclamation-triangle"></i>
                <p>레퍼런스를 불러오는 중 오류가 발생했습니다.</p>
            </div>
        `;
    }
};

const displayReferences = (references) => {
    const referencesGrid = document.getElementById('referencesGrid');
    const filteredRefs = APP_STATE.currentFilter === 'all' 
        ? references 
        : references.filter(ref => ref.category === APP_STATE.currentFilter);
    
    if (filteredRefs.length === 0) {
        referencesGrid.innerHTML = `
            <div class="loading">
                <i class="fas fa-search"></i>
                <p>해당 카테고리의 레퍼런스가 없습니다.</p>
            </div>
        `;
        return;
    }
    
    referencesGrid.innerHTML = filteredRefs.map(ref => `
        <div class="reference-card" data-category="${ref.category}">
            <div class="reference-image">
                ${ref.image_url 
                    ? `<img src="${ref.image_url}" alt="${ref.title}">` 
                    : `<i class="fas fa-${getCategoryIcon(ref.category)}"></i>`
                }
            </div>
            <div class="reference-content">
                <span class="reference-category">${ref.category}</span>
                <h3>${ref.title}</h3>
                <div class="reference-client">
                    <i class="fas fa-building"></i> ${ref.client}
                </div>
                <p class="reference-description">${ref.description}</p>
                <div class="reference-tech">
                    ${ref.tech_stack ? ref.tech_stack.map(tech => `<span class="tag">${tech}</span>`).join('') : ''}
                </div>
                <div class="reference-meta">
                    <span class="reference-duration">
                        <i class="fas fa-calendar"></i> ${ref.duration}
                    </span>
                    ${ref.link_url ? `<a href="${ref.link_url}" class="reference-link" target="_blank">
                        자세히 보기 <i class="fas fa-arrow-right"></i>
                    </a>` : ''}
                </div>
            </div>
        </div>
    `).join('');
};

const getCategoryIcon = (category) => {
    const icons = {
        '강의': 'chalkboard-teacher',
        '프로젝트': 'code',
        '컨설팅': 'handshake',
        '기술블로그': 'blog'
    };
    return icons[category] || 'folder';
};

const initReferenceFilters = () => {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(btn => {
        btn.addEventListener('click', async () => {
            // Update active state
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Update filter and reload
            APP_STATE.currentFilter = btn.dataset.filter;
            
            // Reload references
            const response = await fetch('tables/references?limit=100&sort=-created_at');
            const result = await response.json();
            displayReferences(result.data);
        });
    });
};

// ===================================
// Reviews Section
// ===================================
const loadReviews = async () => {
    const reviewsGrid = document.getElementById('reviewsGrid');
    
    try {
        const response = await fetch('tables/reviews?limit=100&sort=-created_at');
        const result = await response.json();
        
        if (result.data && result.data.length > 0) {
            displayReviews(result.data);
            updateOverallRating(result.data);
        } else {
            reviewsGrid.innerHTML = `
                <div class="loading">
                    <i class="fas fa-comments"></i>
                    <p>아직 등록된 리뷰가 없습니다. 첫 번째 리뷰를 작성해보세요!</p>
                </div>
            `;
            updateOverallRating([]);
        }
    } catch (error) {
        console.error('리뷰 로딩 실패:', error);
        reviewsGrid.innerHTML = `
            <div class="loading">
                <i class="fas fa-exclamation-triangle"></i>
                <p>리뷰를 불러오는 중 오류가 발생했습니다.</p>
            </div>
        `;
    }
};

const displayReviews = (reviews) => {
    const reviewsGrid = document.getElementById('reviewsGrid');
    
    reviewsGrid.innerHTML = reviews.map(review => `
        <div class="review-card">
            <div class="review-header">
                <div class="review-author">
                    <h4>${review.name}</h4>
                    <div class="review-company">${review.company || '개인 수강생'}</div>
                </div>
                <div class="review-stars">${generateStars(review.rating)}</div>
            </div>
            <div class="review-course">
                <i class="fas fa-book"></i> ${review.course}
            </div>
            <p class="review-comment">${review.comment}</p>
            <div class="review-date">
                <i class="fas fa-clock"></i> ${formatDate(review.created_at)}
            </div>
        </div>
    `).join('');
};

const updateOverallRating = (reviews) => {
    const overallRatingEl = document.getElementById('overallRating');
    const overallStarsEl = document.getElementById('overallStars');
    const reviewCountEl = document.getElementById('reviewCount');
    
    if (reviews.length === 0) {
        overallRatingEl.textContent = '0.0';
        overallStarsEl.innerHTML = generateStars(0);
        reviewCountEl.textContent = '0개의 리뷰';
        return;
    }
    
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const avgRating = (totalRating / reviews.length).toFixed(1);
    
    overallRatingEl.textContent = avgRating;
    overallStarsEl.innerHTML = generateStars(Math.round(avgRating));
    reviewCountEl.textContent = `${reviews.length}개의 리뷰`;
};

// ===================================
// Review Modal
// ===================================
const initReviewModal = () => {
    const modal = document.getElementById('reviewModal');
    const addReviewBtn = document.getElementById('addReviewBtn');
    const closeBtn = document.getElementById('closeReviewModal');
    const cancelBtn = document.getElementById('cancelReview');
    const reviewForm = document.getElementById('reviewForm');
    const starRating = document.getElementById('starRating');
    const stars = starRating.querySelectorAll('i');
    
    // Open modal
    addReviewBtn.addEventListener('click', () => {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    });
    
    // Close modal
    const closeModal = () => {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        reviewForm.reset();
        APP_STATE.reviewRating = 0;
        stars.forEach(star => star.classList.remove('active'));
    };
    
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    
    // Star rating
    stars.forEach(star => {
        star.addEventListener('click', () => {
            const rating = parseInt(star.dataset.rating);
            APP_STATE.reviewRating = rating;
            document.getElementById('reviewRating').value = rating;
            
            stars.forEach((s, index) => {
                if (index < rating) {
                    s.classList.remove('far');
                    s.classList.add('fas', 'active');
                } else {
                    s.classList.remove('fas', 'active');
                    s.classList.add('far');
                }
            });
        });
        
        star.addEventListener('mouseenter', () => {
            const rating = parseInt(star.dataset.rating);
            stars.forEach((s, index) => {
                if (index < rating) {
                    s.classList.remove('far');
                    s.classList.add('fas');
                } else {
                    s.classList.remove('fas');
                    s.classList.add('far');
                }
            });
        });
    });
    
    starRating.addEventListener('mouseleave', () => {
        stars.forEach((star, index) => {
            if (index < APP_STATE.reviewRating) {
                star.classList.remove('far');
                star.classList.add('fas', 'active');
            } else {
                star.classList.remove('fas', 'active');
                star.classList.add('far');
            }
        });
    });
    
    // Submit review
    reviewForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (APP_STATE.reviewRating === 0) {
            showNotification('평점을 선택해주세요.', 'error');
            return;
        }
        
        const reviewData = {
            name: document.getElementById('reviewName').value,
            company: document.getElementById('reviewCompany').value,
            course: document.getElementById('reviewCourse').value,
            rating: APP_STATE.reviewRating,
            comment: document.getElementById('reviewComment').value,
            is_featured: false,
            created_at: Date.now()
        };
        
        try {
            const response = await fetch('tables/reviews', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(reviewData)
            });
            
            if (response.ok) {
                showNotification('리뷰가 성공적으로 등록되었습니다!');
                closeModal();
                loadReviews();
            } else {
                throw new Error('리뷰 등록 실패');
            }
        } catch (error) {
            console.error('리뷰 등록 오류:', error);
            showNotification('리뷰 등록 중 오류가 발생했습니다.', 'error');
        }
    });
};

// ===================================
// Contact Form
// ===================================
const initContactForm = () => {
    const contactForm = document.getElementById('contactForm');
    
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const inquiryData = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            company: document.getElementById('company').value,
            subject: document.getElementById('subject').value,
            message: document.getElementById('message').value,
            status: 'pending',
            created_at: Date.now()
        };
        
        try {
            const response = await fetch('tables/inquiries', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(inquiryData)
            });
            
            if (response.ok) {
                showNotification('문의가 성공적으로 접수되었습니다. 빠른 시일 내에 연락드리겠습니다!');
                contactForm.reset();
            } else {
                throw new Error('문의 접수 실패');
            }
        } catch (error) {
            console.error('문의 접수 오류:', error);
            showNotification('문의 접수 중 오류가 발생했습니다. 다시 시도해주세요.', 'error');
        }
    });
};

// ===================================
// Animation Styles (Add to head)
// ===================================
const addAnimationStyles = () => {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
};

// ===================================
// Initialize App
// ===================================
document.addEventListener('DOMContentLoaded', () => {
    addAnimationStyles();
    initNavigation();
    initReferenceFilters();
    initReviewModal();
    initContactForm();
    loadReferences();
    loadReviews();
    
    console.log('MIDASPLAT - 정민수 강사 프로필 사이트 초기화 완료');
});