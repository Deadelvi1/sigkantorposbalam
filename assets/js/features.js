/**
 * Features JavaScript untuk Rating dan Comments
 */

// Global variables
var currentLocationFid = null;
var currentRating = { average: 0, count: 0 };

// ========== RATING FUNCTIONS ==========

/**
 * Load rating untuk lokasi tertentu
 */
function loadRating(fid) {
    fetch(`api/rating.php?fid=${fid}`)
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                currentRating = data.data;
                renderRating(fid);
            }
        })
        .catch(err => {
            console.error("Error loading rating:", err);
        });
}

/**
 * Render rating widget
 */
function renderRating(fid) {
    const ratingContainer = document.getElementById(`rating-container-${fid}`);
    if (!ratingContainer) return;
    
    const average = currentRating.average || 0;
    const count = currentRating.count || 0;
    const checkResult = canRate(fid);
    const remaining = checkResult.remaining || 0;
    
    let starsHTML = '';
    for (let i = 1; i <= 5; i++) {
        const activeClass = i <= Math.round(average) ? 'active' : '';
        const disabledClass = !checkResult.canRate ? 'disabled' : '';
        starsHTML += `<span class="star ${activeClass} ${disabledClass}" data-rating="${i}" onclick="submitRating(${fid}, ${i})" style="${!checkResult.canRate ? 'cursor: not-allowed; opacity: 0.5;' : ''}">★</span>`;
    }
    
    ratingContainer.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
            <div class="star-rating">
                ${starsHTML}
            </div>
            <div style="flex: 1;">
                <div style="font-size: 24px; font-weight: bold; color: #FFD23F; font-family: 'Space Grotesk', sans-serif;">
                    ${average.toFixed(1)}
                </div>
                <div style="font-size: 12px; color: #9CA3AF; font-family: 'JetBrains Mono', monospace;">
                    ${count} ${count === 1 ? 'rating' : 'ratings'}
                    ${remaining > 0 ? ` • ${remaining} rating tersisa hari ini` : ''}
                </div>
            </div>
        </div>
    `;
}

/**
 * Check if user can rate (batasi 1 rating per 24 jam)
 */
function canRate(fid) {
    const storageKey = `rating_${fid}`;
    const ratingData = localStorage.getItem(storageKey);
    
    if (!ratingData) {
        return { canRate: true, remaining: 1 };
    }
    
    try {
        const data = JSON.parse(ratingData);
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        
        const validRatings = data.ratings.filter(r => (now - r.timestamp) < oneDay);
        
        if (validRatings.length >= 1) {
            const oldestRating = validRatings[0];
            const timeUntilReset = oneDay - (now - oldestRating.timestamp);
            const hoursLeft = Math.ceil(timeUntilReset / (60 * 60 * 1000));
            return { 
                canRate: false, 
                remaining: 0,
                message: `Anda sudah memberikan rating hari ini. Coba lagi dalam ${hoursLeft} jam.`
            };
        }
        
        return { canRate: true, remaining: 1 - validRatings.length };
    } catch (e) {
        localStorage.removeItem(storageKey);
        return { canRate: true, remaining: 1 };
    }
}

/**
 * Record rating di localStorage
 */
function recordRating(fid) {
    const storageKey = `rating_${fid}`;
    const newRating = {
        timestamp: Date.now()
    };
    
    localStorage.setItem(storageKey, JSON.stringify({
        ratings: [newRating]
    }));
}

/**
 * Submit rating dengan spam prevention
 */
function submitRating(fid, rating) {
    const checkResult = canRate(fid);
    
    if (!checkResult.canRate) {
        showNotification(checkResult.message || "Anda sudah memberikan rating cukup banyak. Coba lagi nanti.", "error");
        return;
    }
    
    const starsInModal = document.querySelectorAll(`.star[onclick*="submitRating(${fid}"]`);
    const starsInContainer = document.querySelectorAll(`#rating-container-${fid} .star`);
    const allStars = [...starsInModal, ...starsInContainer];
    
    allStars.forEach(star => {
        star.style.pointerEvents = 'none';
        star.style.opacity = '0.5';
        star.style.cursor = 'wait';
    });
    
    fetch('api/rating.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            fid: fid,
            rating: rating
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            recordRating(fid);
            showNotification("Rating berhasil disimpan!", "success");
            loadRating(fid);
            if (currentLocationFid == fid) {
                setTimeout(() => {
                    openLocationDetail(fid);
                }, 300);
            }
        } else {
            showNotification("Error: " + (data.message || "Gagal menyimpan rating"), "error");
            allStars.forEach(star => {
                star.style.pointerEvents = 'auto';
                star.style.opacity = '1';
                star.style.cursor = checkResult.canRate ? 'pointer' : 'not-allowed';
            });
        }
    })
    .catch(err => {
        console.error("Error submitting rating:", err);
        showNotification("Error: Gagal menyimpan rating", "error");
        allStars.forEach(star => {
            star.style.pointerEvents = 'auto';
            star.style.opacity = '1';
            star.style.cursor = checkResult.canRate ? 'pointer' : 'not-allowed';
        });
    });
}

/**
 * Update rating di popup
 */
function updatePopupRating(fid, ratingData) {
    const popupRatingEl = document.querySelector(`[data-fid="${fid}"] .popup-rating`);
    if (popupRatingEl && ratingData) {
        const average = ratingData.average || 0;
        popupRatingEl.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <span style="color: #FFD23F; font-size: 18px;">★</span>
                <span style="font-weight: 600; color: #FFD23F;">${average.toFixed(1)}</span>
                <span style="font-size: 12px; color: #9CA3AF;">(${ratingData.count || 0})</span>
            </div>
        `;
    }
}

// ========== COMMENTS FUNCTIONS ==========

/**
 * Load comments untuk lokasi tertentu
 */
function loadComments(fid) {
    fetch(`api/comments.php?fid=${fid}`)
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                renderComments(fid, data.data || []);
            }
        })
        .catch(err => {
            console.error("Error loading comments:", err);
        });
}

/**
 * Render comments list
 */
function renderComments(fid, comments) {
    const commentsContainer = document.getElementById(`comments-container-${fid}`);
    if (!commentsContainer) return;
    
    if (!comments || comments.length === 0) {
        commentsContainer.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #9CA3AF; font-family: 'JetBrains Mono', monospace;">
                <p>Belum ada komentar</p>
            </div>
        `;
        return;
    }
    
    let commentsHTML = '<div style="max-height: 400px; overflow-y: auto;">';
    comments.forEach(comment => {
        let ratingHTML = '';
        if (comment.rating) {
            let stars = '';
            for (let i = 1; i <= 5; i++) {
                stars += `<span style="color: ${i <= comment.rating ? '#FFD23F' : '#4B5563'}; font-size: 14px;">★</span>`;
            }
            ratingHTML = `<div style="margin-bottom: 8px;">${stars}</div>`;
        }
        
        commentsHTML += `
            <div class="comment-item">
                <div class="comment-header">
                    <div class="comment-author">${escapeHtml(comment.nama || 'Anonymous')}</div>
                    <div class="comment-date">${formatDate(comment.tanggal)}</div>
                </div>
                ${ratingHTML}
                <div class="comment-text">${escapeHtml(comment.komentar)}</div>
            </div>
        `;
    });
    commentsHTML += '</div>';
    
    commentsContainer.innerHTML = commentsHTML;
}

/**
 * Submit comment
 */
function submitComment(fid) {
    const nama = document.getElementById(`comment-name-${fid}`).value.trim();
    const komentar = document.getElementById(`comment-text-${fid}`).value.trim();
    const rating = document.getElementById(`comment-rating-${fid}`) ? parseInt(document.getElementById(`comment-rating-${fid}`).value) : null;
    
    if (!nama || !komentar) {
        showNotification("Nama dan komentar harus diisi", "error");
        return;
    }
    
    const formData = new FormData();
    formData.append('fid', fid);
    formData.append('nama', nama);
    formData.append('komentar', komentar);
    if (rating) {
        formData.append('rating', rating);
    }
    
    fetch('api/comments.php', {
        method: 'POST',
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showNotification("Komentar berhasil ditambahkan!", "success");
            document.getElementById(`comment-name-${fid}`).value = '';
            document.getElementById(`comment-text-${fid}`).value = '';
            if (document.getElementById(`comment-rating-${fid}`)) {
                document.getElementById(`comment-rating-${fid}`).value = '';
            }
            loadComments(fid);
            if (rating) {
                loadRating(fid);
            }
            if (currentLocationFid == fid) {
                openLocationDetail(fid);
            }
        } else {
            showNotification("Error: " + (data.message || "Gagal menambahkan komentar"), "error");
        }
    })
    .catch(err => {
        console.error("Error submitting comment:", err);
        showNotification("Error: Gagal menambahkan komentar", "error");
    });
}

// ========== HELPER FUNCTIONS ==========

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Format date
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 7) {
        return date.toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
    } else if (days > 0) {
        return `${days} hari yang lalu`;
    } else if (hours > 0) {
        return `${hours} jam yang lalu`;
    } else if (minutes > 0) {
        return `${minutes} menit yang lalu`;
    } else {
        return 'Baru saja';
    }
}

/**
 * Open location detail modal
 */
function openLocationDetail(fid) {
    currentLocationFid = fid;
    
    let feature = null;
    kantorLayer.eachLayer(function(l) {
        if (l.feature && (l.feature.properties.fid == fid || l.feature.properties.id == fid)) {
            feature = l.feature;
        }
    });
    
    if (!feature) {
        showNotification("Data tidak ditemukan", "error");
        return;
    }
    
    const modal = document.getElementById('modalLocationDetail');
    const isModalOpen = modal.classList.contains('active');
    
    if (isModalOpen) {
        const content = document.getElementById('locationDetailContent');
        content.innerHTML = `
            <div style="padding: 40px; text-align: center;">
                <div class="loading-dots" style="display: inline-flex; gap: 8px;">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
                <p style="color: #9CA3AF; margin-top: 16px; font-family: 'JetBrains Mono', monospace;">Memuat data...</p>
            </div>
        `;
    }
    
    const timestamp = new Date().getTime();
    Promise.all([
        fetch(`api/rating.php?fid=${fid}&_t=${timestamp}`).then(r => r.json()),
        fetch(`api/comments.php?fid=${fid}&_t=${timestamp}`).then(r => r.json())
    ]).then(([ratingData, commentsData]) => {
        renderLocationDetail(feature, ratingData, commentsData);
        if (!isModalOpen) {
            modal.classList.add('active');
        }
    }).catch(err => {
        console.error("Error loading location detail:", err);
        showNotification("Error: Gagal memuat detail lokasi", "error");
        if (isModalOpen) {
            const content = document.getElementById('locationDetailContent');
            content.innerHTML = `
                <div style="padding: 40px; text-align: center; color: #DC2626;">
                    <p>Gagal memuat data. Silakan coba lagi.</p>
                </div>
            `;
        }
    });
}

/**
 * Render location detail modal
 */
function renderLocationDetail(feature, ratingData, commentsData) {
    const content = document.getElementById('locationDetailContent');
    const rating = ratingData.success ? ratingData.data : { average: 0, count: 0 };
    const comments = commentsData.success ? (commentsData.data || []) : [];
    
    const fid = feature.properties.fid || feature.properties.id;
    const checkResult = canRate(fid);
    const remaining = checkResult.remaining || 0;
    
    let starsHTML = '';
    for (let i = 1; i <= 5; i++) {
        const activeClass = i <= Math.round(rating.average) ? 'active' : '';
        const disabledClass = !checkResult.canRate ? 'disabled' : '';
        starsHTML += `<span class="star ${activeClass} ${disabledClass}" onclick="submitRating(${fid}, ${i})" style="${!checkResult.canRate ? 'cursor: not-allowed; opacity: 0.5;' : ''}">★</span>`;
    }
    
    let commentsHTML = '';
    comments.forEach(comment => {
        let ratingStars = '';
        if (comment.rating) {
            for (let i = 1; i <= 5; i++) {
                ratingStars += `<span style="color: ${i <= comment.rating ? '#FFD23F' : '#4B5563'}; font-size: 14px;">★</span>`;
            }
        }
        
        commentsHTML += `
            <div class="comment-item">
                <div class="comment-header">
                    <div class="comment-author">${escapeHtml(comment.nama || 'Anonymous')}</div>
                    <div class="comment-date">${formatDate(comment.tanggal)}</div>
                </div>
                ${ratingStars ? `<div style="margin-bottom: 8px;">${ratingStars}</div>` : ''}
                <div class="comment-text">${escapeHtml(comment.komentar)}</div>
            </div>
        `;
    });
    
    content.innerHTML = `
        <div style="padding: 24px;">
            <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 2px dashed rgba(255, 107, 53, 0.3);">
                <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #FF6B35, #FFD23F); border-radius: 16px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 30px rgba(255, 107, 53, 0.5);">
                    <svg style="width: 36px; height: 36px;" fill="white" viewBox="0 0 24 24">
                        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                    </svg>
                </div>
                <div style="flex: 1;">
                    <h1 style="font-size: 24px; font-weight: 700; color: #FFD23F; margin-bottom: 4px; font-family: 'Space Grotesk', sans-serif;">
                        ${escapeHtml(feature.properties.nama)}
                    </h1>
                    <p style="font-size: 12px; color: #888; font-family: 'JetBrains Mono', monospace;">
                        ID: ${fid}
                    </p>
                </div>
            </div>
            
            <div style="margin-bottom: 24px; padding: 16px; background: rgba(255, 107, 53, 0.1); border-left: 4px solid #FF6B35; border-radius: 8px;">
                <div style="display: flex; align-items: start; gap: 10px; font-size: 14px; color: #ccc;">
                    <svg style="width: 20px; height: 20px; color: #FF6B35; margin-top: 2px; flex-shrink: 0;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                    <div>
                        <strong style="color: #FFD23F; display: block; margin-bottom: 4px;">Lokasi</strong>
                        <span>${escapeHtml(feature.properties.lokasi)}</span>
                    </div>
                </div>
            </div>
            
            <div style="margin-bottom: 24px;">
                <h3 style="font-size: 18px; font-weight: 600; color: #FFD23F; margin-bottom: 12px; font-family: 'Space Grotesk', sans-serif;">
                    Rating
                </h3>
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                    <div class="star-rating">
                        ${starsHTML}
                    </div>
                    <div style="flex: 1;">
                        <div style="font-size: 28px; font-weight: bold; color: #FFD23F; font-family: 'Space Grotesk', sans-serif;">
                            ${rating.average.toFixed(1)}
                        </div>
                        <div style="font-size: 12px; color: #9CA3AF; font-family: 'JetBrains Mono', monospace;">
                            ${rating.count} ${rating.count === 1 ? 'rating' : 'ratings'}
                            ${remaining > 0 ? ` • ${remaining} rating tersisa hari ini` : ''}
                        </div>
                    </div>
                </div>
            </div>
            
            <div style="margin-bottom: 24px;">
                <h3 style="font-size: 18px; font-weight: 600; color: #FFD23F; margin-bottom: 12px; font-family: 'Space Grotesk', sans-serif;">
                    Komentar
                </h3>
                <div style="max-height: 400px; overflow-y: auto; margin-bottom: 20px;">
                    ${commentsHTML || '<p style="text-align: center; color: #9CA3AF; padding: 40px;">Belum ada komentar</p>'}
                </div>
                
                <div style="background: rgba(255, 255, 255, 0.05); padding: 16px; border-radius: 12px;">
                    <div style="margin-bottom: 12px;">
                        <input type="text" id="comment-name-${fid}" placeholder="Nama Anda" style="width: 100%; padding: 10px; background: rgba(255, 255, 255, 0.05); border: 2px solid rgba(255, 107, 53, 0.3); border-radius: 8px; color: white; font-family: 'JetBrains Mono', monospace; margin-bottom: 8px;">
                    </div>
                    <div style="margin-bottom: 12px;">
                        <textarea id="comment-text-${fid}" placeholder="Tulis komentar..." rows="3" style="width: 100%; padding: 10px; background: rgba(255, 255, 255, 0.05); border: 2px solid rgba(255, 107, 53, 0.3); border-radius: 8px; color: white; font-family: 'JetBrains Mono', monospace; resize: vertical;"></textarea>
                    </div>
                    <div style="margin-bottom: 12px;">
                        <select id="comment-rating-${fid}" class="form-input" style="width: 100%; padding: 10px; background: rgba(255, 255, 255, 0.05) !important; border: 2px solid rgba(255, 107, 53, 0.3); border-radius: 8px; color: white !important; font-family: 'JetBrains Mono', monospace;">
                            <option value="" style="background: rgba(26, 26, 46, 0.95) !important; color: #9CA3AF !important;">Pilih Rating (Opsional)</option>
                            <option value="5" style="background: rgba(26, 26, 46, 0.95) !important; color: #FFD23F !important;">★★★★★ (5)</option>
                            <option value="4" style="background: rgba(26, 26, 46, 0.95) !important; color: #FFD23F !important;">★★★★☆ (4)</option>
                            <option value="3" style="background: rgba(26, 26, 46, 0.95) !important; color: #FFD23F !important;">★★★☆☆ (3)</option>
                            <option value="2" style="background: rgba(26, 26, 46, 0.95) !important; color: #FFD23F !important;">★★☆☆☆ (2)</option>
                            <option value="1" style="background: rgba(26, 26, 46, 0.95) !important; color: #FFD23F !important;">★☆☆☆☆ (1)</option>
                        </select>
                    </div>
                    <button onclick="submitComment(${fid})" style="width: 100%; padding: 12px; background: linear-gradient(135deg, #FF6B35, #FF8C61); color: white; border: none; border-radius: 8px; cursor: pointer; font-family: 'Space Grotesk', sans-serif; font-weight: 600;">
                        Kirim Komentar
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modalDetailClose').onclick = closeLocationDetail;
    document.getElementById('modalLocationDetail').onclick = (e) => {
        if (e.target.id === 'modalLocationDetail') {
            closeLocationDetail();
        }
    };
}

/**
 * Close location detail modal
 */
function closeLocationDetail() {
    const modal = document.getElementById('modalLocationDetail');
    modal.classList.remove('active');
}

window.submitRating = submitRating;
window.submitComment = submitComment;
window.openLocationDetail = openLocationDetail;
window.closeLocationDetail = closeLocationDetail;
