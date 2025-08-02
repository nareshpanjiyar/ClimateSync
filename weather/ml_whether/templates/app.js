// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Set current date
    const now = new Date();
    document.getElementById('current-date').textContent = now.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    // Set last updated time
    updateLastUpdated();
    
    // Initialize charts
    initForecastChart();
    initPerformanceChart();
    
    // Set up event listeners
    document.getElementById('generateForecastBtn').addEventListener('click', generateForecast);
    document.getElementById('searchBtn').addEventListener('click', searchLocation);
    
    // Also allow Enter key in search field
    document.getElementById('locationInput').addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            searchLocation();
        }
    });
    
    // CSV Upload functionality
    setupCsvUpload();
    
    // Initial forecast for default location
    generateForecast();
});

// Weather icons mapping
const weatherIcons = {
    'clear': 'fas fa-sun',
    'clouds': 'fas fa-cloud',
    'rain': 'fas fa-cloud-rain',
    'drizzle': 'fas fa-cloud-sun-rain',
    'thunderstorm': 'fas fa-bolt',
    'snow': 'fas fa-snowflake',
    'mist': 'fas fa-smog',
    'smoke': 'fas fa-smog',
    'haze': 'fas fa-smog',
    'dust': 'fas fa-smog',
    'fog': 'fas fa-smog',
    'sand': 'fas fa-smog',
    'ash': 'fas fa-smog',
    'squall': 'fas fa-wind',
    'tornado': 'fas fa-wind'
};

// Update last updated time
function updateLastUpdated() {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    document.getElementById('lastUpdated').textContent = timeString;
}

// Initialize forecast chart
function initForecastChart() {
    const ctx = document.getElementById('forecastChart').getContext('2d');
    window.forecastChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'ML Forecast',
                    data: [],
                    borderColor: '#4361ee',
                    backgroundColor: 'rgba(67, 97, 238, 0.1)',
                    tension: 0.3,
                    fill: true,
                    pointRadius: 6,
                    pointBackgroundColor: '#4361ee',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                },
                {
                    label: 'API Forecast',
                    data: [],
                    borderColor: '#4cc9f0',
                    backgroundColor: 'rgba(76, 201, 240, 0.1)',
                    tension: 0.3,
                    fill: false,
                    pointRadius: 6,
                    pointBackgroundColor: '#4cc9f0',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    borderDash: [5, 5]
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        font: {
                            size: 14
                        },
                        usePointStyle: true,
                        padding: 20
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleFont: {
                        size: 14
                    },
                    bodyFont: {
                        size: 13
                    },
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.parsed.y}°C`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    title: {
                        display: true,
                        text: 'Temperature (°C)',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        font: {
                            size: 12
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            size: 12
                        }
                    }
                }
            },
            interaction: {
                mode: 'index',
                intersect: false
            },
            animation: {
                duration: 1000,
                easing: 'easeOutQuart'
            }
        }
    });
}

// Initialize performance chart
function initPerformanceChart() {
    const ctx = document.getElementById('performanceChart').getContext('2d');
    window.performanceChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Accuracy', 'MAE', 'RMSE', 'R²'],
            datasets: [{
                label: 'Model Performance',
                data: [87, 1.2, 1.8, 92],
                backgroundColor: [
                    'rgba(67, 97, 238, 0.7)',
                    'rgba(76, 201, 240, 0.7)',
                    'rgba(255, 152, 0, 0.7)',
                    'rgba(76, 175, 80, 0.7)'
                ],
                borderColor: [
                    'rgb(67, 97, 238)',
                    'rgb(76, 201, 240)',
                    'rgb(255, 152, 0)',
                    'rgb(76, 175, 80)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += context.parsed.y + (context.dataIndex === 0 ? '%' : context.dataIndex === 3 ? '%' : '°C');
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Score',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Search location
function searchLocation() {
    const location = document.getElementById('locationInput').value;
    if (location.trim() === '') {
        alert('Please enter a location');
        return;
    }
    
    document.getElementById('cityName').textContent = location;
    generateForecast();
}

// Get weather icon class
function getWeatherIcon(condition) {
    condition = condition.toLowerCase();
    for (const key in weatherIcons) {
        if (condition.includes(key)) {
            return weatherIcons[key];
        }
    }
    return 'fas fa-cloud';
}

// Generate forecast with API integration
function generateForecast() {
    const btn = document.getElementById('generateForecastBtn');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Processing...';
    
    const location = document.getElementById('locationInput').value.trim();
    document.getElementById('cityName').textContent = location;
    
    // The original code was using a hardcoded API key in the frontend, which is not secure.
    // For this demonstration, we'll assume the Python backend handles the API call.
    // We'll call a Python endpoint instead of the OpenWeatherMap API directly.
    fetch(`http://localhost:5000/weather/ml_whether/?location=${encodeURIComponent(location)}`)

        .then(response => {
            if (!response.ok) {
                throw new Error('City not found or API error');
            }
            return response.json();
        })
        .then(data => {
            // Update last updated time
            updateLastUpdated();
            
            // Update current weather display
            document.getElementById('currentTemp').textContent = `${data.current.temp}°C`;
            document.getElementById('currentCondition').textContent = data.current.condition;
            document.getElementById('weatherIcon').innerHTML = `<i class="${getWeatherIcon(data.current.condition)}"></i>`;
            document.getElementById('humidity').textContent = `${data.current.humidity}%`;
            document.getElementById('windSpeed').textContent = `${data.current.windSpeed} km/h`;
            document.getElementById('pressure').textContent = `${data.current.pressure} hPa`;
            document.getElementById('highTemp').textContent = data.current.highTemp;
            document.getElementById('lowTemp').textContent = data.current.lowTemp;
            
            const forecastDays = data.forecast.map(f => f.date);
            const mlForecast = data.forecast.map(f => f.mlTemp);
            const apiForecast = data.forecast.map(f => f.apiTemp);
            
            // Update chart
            window.forecastChart.data.labels = forecastDays;
            window.forecastChart.data.datasets[0].data = mlForecast;
            window.forecastChart.data.datasets[1].data = apiForecast;
            window.forecastChart.update();
            
            /// Update forecast table for 5 days max
const tableBody = document.getElementById('forecastTableBody');
tableBody.innerHTML = '';

data.forecast.slice(0, 5).forEach(f => {
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${f.date}</td>
        <td>${f.mlTemp}°C</td>
        <td>${f.apiTemp}°C</td>
        <td><span class="variance-badge ${f.varianceClass}">${f.varianceText}</span></td>
    `;
    tableBody.appendChild(row);
});

            // Update insights based on variance
            const varianceInsights = document.querySelectorAll('.alert-panel');
            const maxVariance = data.forecast.reduce((max, f) => Math.max(max, Math.abs(f.mlTemp - f.apiTemp)), 0);

            if (maxVariance > 3) {
                varianceInsights[0].innerHTML = `<span class="insight-badge badge-high">Alert</span> Significant variance (up to ${maxVariance}°C) between ML and API forecasts`;
            } else if (maxVariance > 2) {
                varianceInsights[0].innerHTML = `<span class="insight-badge badge-medium">Notice</span> Moderate variance (up to ${maxVariance}°C) between forecasts`;
            } else {
                varianceInsights[0].innerHTML = `<span class="insight-badge badge-low">Info</span> Minimal variance between forecasts`;
            }
            
            // Show success message
            btn.innerHTML = '<i class="fas fa-check me-2"></i>Forecast Generated!';
            btn.classList.add('btn-success');
            
            // Reset after 2 seconds
            setTimeout(() => {
                btn.disabled = false;
                btn.innerHTML = originalText;
                btn.classList.remove('btn-success');
            }, 2000);
        })
        .catch(error => {
            console.error('Error fetching weather data:', error);
            alert('Error fetching weather data: ' + error.message);
            
            btn.disabled = false;
            btn.innerHTML = originalText;
        });
}

// Setup CSV upload functionality
function setupCsvUpload() {
    const fileUploadBox = document.getElementById('fileUploadBox');
    const fileInput = document.getElementById('csvFile');
    const uploadStatus = document.getElementById('uploadStatus');
    const csvPreview = document.getElementById('csvPreview');
    const csvPreviewHead = document.getElementById('csvPreviewHead');
    const csvPreviewBody = document.getElementById('csvPreviewBody');
    const csvActions = document.getElementById('csvActions');
    const processCsvBtn = document.getElementById('processCsvBtn');
    const analyzeCsvBtn = document.getElementById('analyzeCsvBtn');
    const clearCsvBtn = document.getElementById('clearCsvBtn');
    
    // Click handler for file upload box
    fileUploadBox.addEventListener('click', () => {
        fileInput.click();
    });
    
    // Drag and drop functionality
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        fileUploadBox.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        fileUploadBox.addEventListener(eventName, () => {
            fileUploadBox.classList.add('drag-over');
        }, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        fileUploadBox.addEventListener(eventName, () => {
            fileUploadBox.classList.remove('drag-over');
        }, false);
    });
    
    fileUploadBox.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }
    
    // File input change handler
    fileInput.addEventListener('change', () => {
        if (fileInput.files.length) {
            handleFiles(fileInput.files);
        }
    });
    
    // Handle uploaded files
    function handleFiles(files) {
        const file = files[0];
        
        // Validate file type
        if (!file.name.toLowerCase().endsWith('.csv')) {
            showUploadStatus('Please upload a CSV file', 'error');
            return;
        }
        
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            showUploadStatus('File size exceeds 5MB limit', 'error');
            return;
        }
        
        // Read the file
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const contents = e.target.result;
                const rows = contents.split('\n');
                
                // Validate we have at least 2 rows (header + data)
                if (rows.length < 2) {
                    showUploadStatus('CSV file is empty or has no data rows', 'error');
                    return;
                }
                
                // Parse CSV
                const headers = rows[0].split(',').map(h => h.trim());
                const dataRows = rows.slice(1, 6).filter(row => row.trim() !== '');
                
                // Validate we have data
                if (dataRows.length === 0) {
                    showUploadStatus('No data found in CSV file', 'error');
                    return;
                }
                
                // Show preview
                showCsvPreview(headers, dataRows);
                
                // Show success message
                showUploadStatus(`Successfully loaded CSV: ${file.name} (${file.size} bytes)`, 'success');
                
                // Show action buttons
                csvActions.classList.remove('d-none');
            } catch (error) {
                showUploadStatus(`Error parsing CSV: ${error.message}`, 'error');
            }
        };
        
        reader.readAsText(file);
    }
    
    // Show CSV preview
    function showCsvPreview(headers, rows) {
        // Clear previous preview
        csvPreviewHead.innerHTML = '';
        csvPreviewBody.innerHTML = '';
        
        // Create header row
        const headRow = document.createElement('tr');
        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            headRow.appendChild(th);
        });
        csvPreviewHead.appendChild(headRow);
        
        // Create data rows
        rows.forEach(row => {
            const cells = row.split(',');
            const tr = document.createElement('tr');
            
            cells.forEach(cell => {
                const td = document.createElement('td');
                td.textContent = cell.trim();
                tr.appendChild(td);
            });
            
            csvPreviewBody.appendChild(tr);
        });
        
        // Show preview
        csvPreview.classList.remove('d-none');
    }
    
    // Show upload status message
    function showUploadStatus(message, type) {
        uploadStatus.innerHTML = '';
        
        const div = document.createElement('div');
        div.classList.add('upload-status');
        
        if (type === 'success') {
            div.classList.add('csv-success');
            div.innerHTML = `
                <i class="fas fa-check-circle text-success"></i>
                <span>${message}</span>
            `;
        } else {
            div.classList.add('csv-error');
            div.innerHTML = `
                <i class="fas fa-exclamation-triangle text-danger"></i>
                <span>${message}</span>
            `;
        }
        
        uploadStatus.appendChild(div);
    }
    
    // Process CSV button handler
    processCsvBtn.addEventListener('click', () => {
        processCsvBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Processing...';
        
        // Simulate processing
        setTimeout(() => {
            showUploadStatus('CSV data processed successfully. Added to analysis.', 'success');
            processCsvBtn.innerHTML = '<i class="fas fa-cogs me-2"></i>Processed!';
            
            // Update insights with CSV data
            document.querySelector('.alert-panel.alert-low').innerHTML = `
                <span class="insight-badge badge-low">Info</span>
                CSV data integrated. Historical patterns show 87% correlation with current forecasts.
            `;
            
            // Update stats
            document.querySelectorAll('.stat-value')[0].textContent = '89%';
            document.querySelectorAll('.stat-value')[1].textContent = '1.1°C';
            
            // Reset button after 3 seconds
            setTimeout(() => {
                processCsvBtn.innerHTML = '<i class="fas fa-cogs me-2"></i> Process Data';
            }, 3000);
        }, 2000);
    });
    
    // Analyze CSV button handler
    analyzeCsvBtn.addEventListener('click', () => {
        analyzeCsvBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Analyzing...';
        
        // Simulate analysis
        setTimeout(() => {
            showUploadStatus('Analysis complete. Historical trends identified.', 'success');
            analyzeCsvBtn.innerHTML = '<i class="fas fa-chart-bar me-2"></i> Analyze';
            
            // Add new insight
            const insightsContainer = document.querySelector('.card-body > .row');
            const newInsight = document.createElement('div');
            newInsight.className = 'alert-panel alert-low';
            newInsight.innerHTML = `
                <span class="insight-badge badge-low">CSV Analysis</span>
                Historical data shows temperature patterns matching current forecast with 92% accuracy.
            `;
            insightsContainer.parentNode.insertBefore(newInsight, insightsContainer);
        }, 2500);
    });
    
    // Clear CSV button handler
    clearCsvBtn.addEventListener('click', () => {
        fileInput.value = '';
        uploadStatus.innerHTML = '';
        csvPreview.classList.add('d-none');
        csvActions.classList.add('d-none');
        
        // Reset upload box
        fileUploadBox.innerHTML = `
            <i class="fas fa-cloud-upload-alt fa-3x text-muted mb-3"></i>
            <h5 class="mb-2">Drag & Drop your CSV file here</h5>
            <p class="text-muted mb-0">or click to browse</p>
            <input type="file" id="csvFile" accept=".csv" style="display: none;">
        `;
        
        // Reattach event listeners
        document.getElementById('csvFile').addEventListener('change', () => {
            if (fileInput.files.length) {
                handleFiles(fileInput.files);
            }
        });
    });
}