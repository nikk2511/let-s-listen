// Let's Listen - Music Discovery App
console.log('🎵 Let\'s Listen loading...');

class LetsListenPlayer {
    constructor() {
        this.baseUrl = '/api';
        this.currentTracks = [];
        this.currentTrackIndex = 0;
        this.isPlaying = false;
        this.audio = null;
        this.volume = 0.5;
        
        this.initializeElements();
        this.initializeEventListeners();
        this.initializeAudio();
        
        console.log('✅ Let\'s Listen initialized successfully');
    }

    initializeElements() {
        // Search elements
        this.searchInput = document.getElementById('searchInput');
        this.searchBtn = document.getElementById('searchBtn');
        
        // State containers
        this.loadingState = document.getElementById('loadingState');
        this.errorState = document.getElementById('errorState');
        this.noResultsState = document.getElementById('noResultsState');
        this.resultsSection = document.getElementById('resultsSection');
        
        // Results elements
        this.resultsCount = document.getElementById('resultsCount');
        this.tracksList = document.getElementById('tracksList');
        
        // Audio player elements
        this.audioPlayer = document.getElementById('audioPlayer');
        this.audioElement = document.getElementById('audioElement');
        this.playerArtwork = document.getElementById('playerArtwork');
        this.playerTitle = document.getElementById('playerTitle');
        this.playerArtist = document.getElementById('playerArtist');
        
        // Player controls
        this.playPauseBtn = document.getElementById('playPauseBtn');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.closePlayer = document.getElementById('closePlayer');
        
        // Progress elements
        this.progress = document.getElementById('progress');
        this.progressSlider = document.getElementById('progressSlider');
        this.currentTime = document.getElementById('currentTime');
        this.duration = document.getElementById('duration');
        
        // Volume elements
        this.volumeSlider = document.getElementById('volumeSlider');
        
        // Modal elements
        this.trackModal = document.getElementById('trackModal');
        this.artistModal = document.getElementById('artistModal');
        this.closeModal = document.getElementById('closeModal');
        this.closeArtistModal = document.getElementById('closeArtistModal');
        this.modalContent = document.getElementById('modalContent');
        this.artistModalContent = document.getElementById('artistModalContent');
        
        // Retry button
        this.retryBtn = document.getElementById('retryBtn');
    }

    initializeEventListeners() {
        // Search functionality
        this.searchBtn.addEventListener('click', () => this.handleSearch());
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSearch();
            }
        });

        // Player controls
        this.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
        this.prevBtn.addEventListener('click', () => this.playPrevious());
        this.nextBtn.addEventListener('click', () => this.playNext());
        this.closePlayer.addEventListener('click', () => this.closeAudioPlayer());

        // Progress bar
        this.progressSlider.addEventListener('input', (e) => this.seekTo(e.target.value));
        this.progressSlider.addEventListener('change', (e) => this.seekTo(e.target.value));

        // Volume control
        this.volumeSlider.addEventListener('input', (e) => this.setVolume(e.target.value / 100));

        // Modal controls
        this.closeModal.addEventListener('click', () => this.closeModal('trackModal'));
        this.closeArtistModal.addEventListener('click', () => this.closeModal('artistModal'));

        // Retry button
        this.retryBtn.addEventListener('click', () => this.handleSearch());

        // Close modals when clicking outside
        this.trackModal.addEventListener('click', (e) => {
            if (e.target === this.trackModal) {
                this.closeModal('trackModal');
            }
        });

        this.artistModal.addEventListener('click', (e) => {
            if (e.target === this.artistModal) {
                this.closeModal('artistModal');
            }
        });

        // Audio events
        this.audioElement.addEventListener('loadedmetadata', () => this.updateDuration());
        this.audioElement.addEventListener('timeupdate', () => this.updateProgress());
        this.audioElement.addEventListener('ended', () => this.playNext());
        this.audioElement.addEventListener('error', (e) => this.handleAudioError(e));
    }

    initializeAudio() {
        this.audioElement.volume = this.volume;
        this.volumeSlider.value = this.volume * 100;
    }

    async handleSearch() {
        const query = this.searchInput.value.trim();
        
        if (!query) {
            this.showError('Please enter a search term');
            return;
        }
        
        console.log('🔍 Searching for:', query);
        this.showLoading();

        try {
            const tracks = await this.searchTracks(query);
            this.displayTracks(tracks);
        } catch (error) {
            console.error('❌ Search error:', error);
            this.showError('Failed to search for tracks. Please try again.');
        }
    }

    async searchTracks(query) {
        const url = `${this.baseUrl}/audius?query=${encodeURIComponent(query)}&limit=20`;
        
        console.log('📡 API URL:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.details || `HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📊 API Response:', data);
        
        // Handle different response formats
        if (Array.isArray(data)) {
                return data;
        } else if (data.data && Array.isArray(data.data)) {
            return data.data;
            } else {
            throw new Error('Invalid response format from API');
        }
    }

    displayTracks(tracks) {
        console.log('🎵 Displaying tracks:', tracks.length);
        
        this.currentTracks = tracks;
        this.hideAllStates();

        if (tracks.length === 0) {
            this.showNoResults();
            return;
        }

        this.resultsCount.textContent = `${tracks.length} tracks found`;
        this.tracksList.innerHTML = '';

        tracks.forEach((track, index) => {
            const trackElement = this.createTrackElement(track, index);
            this.tracksList.appendChild(trackElement);
        });

        this.resultsSection.classList.remove('hidden');
    }

    createTrackElement(track, index) {
        const trackDiv = document.createElement('div');
        trackDiv.className = 'track-item';
        trackDiv.addEventListener('click', () => this.playTrack(index));

        const artwork = track.artwork ? 
            `<img src="${track.artwork['150x150']}" alt="Track artwork" class="track-artwork">` :
            `<div class="track-artwork"><i class="fas fa-music"></i></div>`;

        trackDiv.innerHTML = `
            ${artwork}
            <div class="track-info">
                <div class="track-title">${this.escapeHtml(track.title)}</div>
                <div class="track-artist" onclick="event.stopPropagation(); app.showArtistDetails('${track.user.id}')">
                    ${this.escapeHtml(track.user.name)}
                </div>
                <div class="track-duration">${this.formatDuration(track.duration)}</div>
            </div>
            <div class="track-actions">
                <button class="action-btn ${track.is_streamable ? 'play-btn' : 'disabled-btn'}" 
                        onclick="event.stopPropagation(); app.playTrack(${index})"
                        ${!track.is_streamable ? 'disabled title="This track is not available for streaming"' : ''}>
                    <i class="fas fa-${track.is_streamable ? 'external-link-alt' : 'ban'}"></i>
                    ${track.is_streamable ? 'Stream on Audius' : 'Not Available'}
                </button>
                <button class="action-btn" onclick="event.stopPropagation(); app.showTrackDetails(${index})">
                    <i class="fas fa-info-circle"></i>
                    Details
                </button>
            </div>
        `;

        return trackDiv;
    }

    playTrack(index) {
        if (index < 0 || index >= this.currentTracks.length) {
            console.error('❌ Invalid track index:', index);
            return;
        }

        const track = this.currentTracks[index];
        console.log('▶️ Playing track:', track.title);

        this.currentTrackIndex = index;
        this.updatePlayerInfo(track);
        this.loadAudio(track);
        this.showAudioPlayer();
    }

    loadAudio(track) {
        console.log('🎵 Loading audio for track:', track.title);
        console.log('📊 Track data:', {
            preview_url: track.preview_url,
            permalink: track.permalink,
            is_streamable: track.is_streamable,
            is_downloadable: track.is_downloadable,
            track_cid: track.track_cid
        });

        // Check if track is streamable
        if (!track.is_streamable) {
            this.showError('This track is not available for streaming');
            return;
        }

        // For now, show a message that direct streaming is not available
        // and provide a link to the Audius page
        this.showStreamingInfo(track);
    }

    showStreamingInfo(track) {
        // Hide error state and show custom streaming info
        this.hideAllStates();
        
        const streamingInfo = document.createElement('div');
        streamingInfo.className = 'streaming-info';
        streamingInfo.innerHTML = `
            <div class="streaming-content">
                <div class="streaming-icon">
                    <i class="fas fa-music"></i>
                </div>
                <h3>Stream on Audius</h3>
                <p>This track is available for streaming on Audius. Click the button below to open it in a new tab.</p>
                <div class="streaming-actions">
                    <a href="https://audius.co${track.permalink}" target="_blank" class="stream-btn">
                        <i class="fas fa-external-link-alt"></i>
                        Open on Audius
                    </a>
                    <button class="stream-btn secondary" onclick="app.closeStreamingInfo()">
                        <i class="fas fa-times"></i>
                        Close
                    </button>
                </div>
                <div class="track-preview">
                    <div class="track-artwork">
                        ${track.artwork ? 
                            `<img src="${track.artwork['150x150']}" alt="Track artwork">` :
                            `<i class="fas fa-music"></i>`
                        }
                    </div>
                    <div class="track-details">
                        <h4>${this.escapeHtml(track.title)}</h4>
                        <p>by ${this.escapeHtml(track.user.name)}</p>
                        <p class="duration">${this.formatDuration(track.duration)}</p>
                    </div>
                </div>
            </div>
        `;
        
        // Add to main content
        const mainContent = document.querySelector('.main-content');
        mainContent.appendChild(streamingInfo);
        
        // Show the audio player with disabled controls
        this.updatePlayerInfo(track);
        this.showAudioPlayer();
        this.disablePlayerControls();
    }

    closeStreamingInfo() {
        const streamingInfo = document.querySelector('.streaming-info');
        if (streamingInfo) {
            streamingInfo.remove();
        }
        this.closeAudioPlayer();
    }

    disablePlayerControls() {
        this.playPauseBtn.disabled = true;
        this.prevBtn.disabled = true;
        this.nextBtn.disabled = true;
        this.progressSlider.disabled = true;
        this.volumeSlider.disabled = true;
        
        this.playPauseBtn.style.opacity = '0.5';
        this.prevBtn.style.opacity = '0.5';
        this.nextBtn.style.opacity = '0.5';
        this.progressSlider.style.opacity = '0.5';
        this.volumeSlider.style.opacity = '0.5';
    }

    enablePlayerControls() {
        this.playPauseBtn.disabled = false;
        this.prevBtn.disabled = false;
        this.nextBtn.disabled = false;
        this.progressSlider.disabled = false;
        this.volumeSlider.disabled = false;
        
        this.playPauseBtn.style.opacity = '1';
        this.prevBtn.style.opacity = '1';
        this.nextBtn.style.opacity = '1';
        this.progressSlider.style.opacity = '1';
        this.volumeSlider.style.opacity = '1';
    }

    updatePlayerInfo(track) {
        this.playerTitle.textContent = track.title;
        this.playerArtist.textContent = track.user.name;
        
        if (track.artwork && track.artwork['150x150']) {
            this.playerArtwork.src = track.artwork['150x150'];
            this.playerArtwork.style.display = 'block';
            this.playerArtwork.nextElementSibling.style.display = 'none';
        } else {
            this.playerArtwork.style.display = 'none';
            this.playerArtwork.nextElementSibling.style.display = 'flex';
        }
    }

    togglePlayPause() {
        if (this.isPlaying) {
            this.audioElement.pause();
            this.isPlaying = false;
        } else {
            this.audioElement.play().then(() => {
                this.isPlaying = true;
            }).catch(error => {
                console.error('❌ Play error:', error);
                this.showError('Could not play this track. It may not be available for streaming.');
            });
        }
        this.updatePlayPauseButton();
    }

    playPrevious() {
        if (this.currentTrackIndex > 0) {
            this.playTrack(this.currentTrackIndex - 1);
        }
    }

    playNext() {
        if (this.currentTrackIndex < this.currentTracks.length - 1) {
            this.playTrack(this.currentTrackIndex + 1);
        }
    }

    updatePlayPauseButton() {
        const icon = this.playPauseBtn.querySelector('i');
        if (this.isPlaying) {
            icon.className = 'fas fa-pause';
        } else {
            icon.className = 'fas fa-play';
        }
    }

    updateProgress() {
        if (this.audioElement.duration) {
            const progress = (this.audioElement.currentTime / this.audioElement.duration) * 100;
            this.progress.style.width = `${progress}%`;
            this.progressSlider.value = progress;
            this.currentTime.textContent = this.formatTime(this.audioElement.currentTime);
        }
    }

    updateDuration() {
        if (this.audioElement.duration) {
            this.duration.textContent = this.formatTime(this.audioElement.duration);
        }
    }

    seekTo(percentage) {
        if (this.audioElement.duration) {
            const time = (percentage / 100) * this.audioElement.duration;
            this.audioElement.currentTime = time;
        }
    }

    setVolume(volume) {
        this.volume = volume;
        this.audioElement.volume = volume;
    }

    showAudioPlayer() {
        this.audioPlayer.classList.remove('hidden');
    }

    closeAudioPlayer() {
        this.audioPlayer.classList.add('hidden');
        this.audioElement.pause();
        this.isPlaying = false;
        this.updatePlayPauseButton();
    }

    showTrackDetails(index) {
        const track = this.currentTracks[index];
        console.log('📋 Showing track details:', track.title);

        const artwork = track.artwork ? 
            `<img src="${track.artwork['640x640']}" alt="Track artwork" style="width: 200px; height: 200px; border-radius: 10px; margin: 0 auto 20px; display: block;">` :
            `<div style="width: 200px; height: 200px; border-radius: 10px; background: #f0f0f0; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; font-size: 48px; color: #666;"><i class="fas fa-music"></i></div>`;

        this.modalContent.innerHTML = `
            <div class="track-details">
                ${artwork}
                <h4>${this.escapeHtml(track.title)}</h4>
                <p><strong>Artist:</strong> ${this.escapeHtml(track.user.name)}</p>
                <p><strong>Duration:</strong> <span class="duration">${this.formatDuration(track.duration)}</span></p>
                <p><strong>Genre:</strong> ${track.genre || 'Not specified'}</p>
                <p><strong>Release Date:</strong> ${track.release_date ? new Date(track.release_date).toLocaleDateString() : 'Not specified'}</p>
                <p><strong>Description:</strong> ${track.description || 'No description available'}</p>
                <div style="margin-top: 20px;">
                    <button class="action-btn play-btn" onclick="app.playTrack(${index})" style="font-size: 16px; padding: 12px 20px;">
                        <i class="fas fa-play"></i>
                        Play Track
                        </button>
                        </div>
            </div>
        `;
        
        this.trackModal.classList.remove('hidden');
    }

    async showArtistDetails(artistId) {
        console.log('👤 Showing artist details for:', artistId);
        this.showLoading();

        try {
            const artist = await this.fetchArtistDetails(artistId);
            this.displayArtistDetails(artist);
        } catch (error) {
            console.error('❌ Artist fetch error:', error);
            this.showError('Failed to load artist details');
        }
    }

    async fetchArtistDetails(artistId) {
        const url = `${this.baseUrl}/audius?artistId=${artistId}`;
        
        console.log('📡 Artist API URL:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.details || `HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('👤 Artist API Response:', data);
        
        if (data && typeof data === 'object' && !Array.isArray(data)) {
            return data.data || data;
        } else {
            throw new Error('Invalid response format from API');
        }
    }

    displayArtistDetails(artist) {
        console.log('👤 Displaying artist details:', artist.name);
        this.hideAllStates();
        
        const avatar = artist.profile_picture ? 
            `<img src="${artist.profile_picture['150x150']}" alt="Artist avatar" class="artist-avatar">` :
            `<div class="artist-avatar"><i class="fas fa-user"></i></div>`;

        this.artistModalContent.innerHTML = `
            <div class="artist-info">
                ${avatar}
                <div class="artist-details">
                    <h4>${this.escapeHtml(artist.name)}</h4>
                    <p class="artist-bio">${artist.bio || 'No bio available'}</p>
                    <p><strong>Followers:</strong> ${(artist.follower_count || 0).toLocaleString()}</p>
                    <p><strong>Following:</strong> ${(artist.following_count || 0).toLocaleString()}</p>
                    <p><strong>Track Count:</strong> ${(artist.track_count || 0).toLocaleString()}</p>
                    ${artist.location ? `<p><strong>Location:</strong> ${this.escapeHtml(artist.location)}</p>` : ''}
                    ${artist.website ? `<p><strong>Website:</strong> <a href="${artist.website}" target="_blank">${this.escapeHtml(artist.website)}</a></p>` : ''}
                </div>
            </div>
        `;

        this.artistModal.classList.remove('hidden');
    }

    tryAlternativeAudioSources(track) {
        console.log('🔄 Trying alternative audio sources...');
        
        if (!track.track_cid) {
            this.showError('No audio source available for this track');
            return;
        }
        
        // Show loading state while trying alternative sources
        this.showError('Trying alternative audio sources...');

        const cdnEndpoints = [
            'https://audius-creator-6.theblueprint.xyz',
            'https://audius-content-13.figment.io',
            'https://blockdaemon-audius-content-08.bdnodes.net',
            'https://audius-content-14.cultur3stake.com'
        ];

        let currentEndpointIndex = 0;

        const tryNextEndpoint = () => {
            if (currentEndpointIndex >= cdnEndpoints.length) {
                this.showError('Could not find a working audio source for this track');
                return;
            }

            const audioUrl = `${cdnEndpoints[currentEndpointIndex]}/content/${track.track_cid}`;
            console.log(`🔄 Trying endpoint ${currentEndpointIndex + 1}/${cdnEndpoints.length}:`, audioUrl);

            this.audioElement.src = audioUrl;
            this.audioElement.load();

            this.audioElement.play().then(() => {
                console.log('✅ Audio started playing with alternative source');
                this.isPlaying = true;
                this.updatePlayPauseButton();
                this.hideAllStates(); // Hide error message when audio starts
            }).catch(error => {
                console.error(`❌ Endpoint ${currentEndpointIndex + 1} failed:`, error);
                currentEndpointIndex++;
                tryNextEndpoint();
            });
        };

        tryNextEndpoint();
    }

    handleAudioError(error) {
        console.error('❌ Audio error:', error);
        this.showError('Could not play this track. It may not be available for streaming.');
    }

    // Utility functions
    formatDuration(seconds) {
        if (!seconds || seconds === 0) return '0:00';
        
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return '0:00';
        
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // State management
    showLoading() {
        this.hideAllStates();
        this.loadingState.classList.remove('hidden');
    }

    showError(message) {
        this.hideAllStates();
        document.getElementById('errorMessage').textContent = message;
        this.errorState.classList.remove('hidden');
    }
    
    showNoResults() {
        this.hideAllStates();
        this.noResultsState.classList.remove('hidden');
    }

    hideAllStates() {
        this.loadingState.classList.add('hidden');
        this.errorState.classList.add('hidden');
        this.noResultsState.classList.add('hidden');
        this.resultsSection.classList.add('hidden');
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM loaded, initializing Let\'s Listen...');
    try {
        window.app = new LetsListenPlayer();
        console.log('✅ Let\'s Listen ready!');
    } catch (error) {
        console.error('❌ Error initializing app:', error);
    }
});