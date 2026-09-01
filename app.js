let shotCounter = 0;

// Initialize the dashboard layout on complete content load
document.addEventListener('DOMContentLoaded', () => {
    // Attach trigger event rules to primary utility buttons
    document.getElementById('add-shot-btn').addEventListener('click', addShotRow);
    document.getElementById('export-pdf-btn').addEventListener('click', exportToPDF);

    // Populate interface with 3 workspace rows on execution startup
    for (let i = 0; i < 3; i++) {
        addShotRow();
    }
});

// Function to generate a structural layout item for text details and media items
function addShotRow() {
    shotCounter++;
    const container = document.getElementById('storyboard-container');
    
    const row = document.createElement('div');
    row.className = 'storyboard-row grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-gray-200 rounded-lg bg-gray-50 relative group';
    row.id = `shot-row-${shotCounter}`;

    row.innerHTML = `
        <!-- Left Column: Details Input Panels -->
        <div class="space-y-3">
            <div class="flex justify-between items-center">
                <span class="text-sm font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    Shot #${shotCounter}
                </span>
                <button data-row-id="${row.id}" class="delete-btn no-print text-red-500 hover:text-red-700 text-sm font-medium opacity-0 group-hover:opacity-100 transition">
                    Delete
                </button>
            </div>
            <div>
                <label class="block text-xs font-semibold text-gray-500 uppercase">Description / Action</label>
                <textarea rows="3" placeholder="Describe the movement, action, or setting..." class="w-full mt-1 p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none text-sm resize-none"></textarea>
            </div>
            <div>
                <label class="block text-xs font-semibold text-gray-500 uppercase">Dialogue / Audio</label>
                <textarea rows="2" placeholder="Voiceover, sound effects, or character lines..." class="w-full mt-1 p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none text-sm resize-none"></textarea>
            </div>
        </div>

        <!-- Right Column: Visual Dropzone and Rendering Context -->
        <div class="flex flex-col justify-center items-center border-2 border-dashed border-gray-300 rounded-lg bg-white p-4 min-h-[220px] relative overflow-hidden">
            <input type="file" accept="image/*, image/gif" class="file-input no-print absolute inset-0 opacity-0 cursor-pointer z-10">
            <img id="${row.id}-img" class="hidden max-h-[200px] w-full object-contain rounded" src="" alt="Shot Preview">
            <div id="${row.id}-placeholder" class="text-center pointer-events-none">
                <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                <p class="mt-1 text-sm text-gray-600">Click to upload Image or GIF</p>
            </div>
        </div>
    `;
    
    // Bind click deletion handling event specifically onto localized row components
    row.querySelector('.delete-btn').addEventListener('click', (e) => {
        const targetId = e.target.getAttribute('data-row-id');
        document.getElementById(targetId).remove();
    });

    // Setup asset pipeline tracking whenever user assigns files to workspace frames
    row.querySelector('.file-input').addEventListener('change', (e) => {
        const file = e.target.files;
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                const img = document.getElementById(`${row.id}-img`);
                const placeholder = document.getElementById(`${row.id}-placeholder`);
                img.src = event.target.result;
                img.classList.remove('hidden');
                placeholder.classList.add('hidden');
            };
            reader.readAsDataURL(file);
        }
    });

    container.appendChild(row);
}

// Convert global layout structure into static file configuration output
function exportToPDF() {
    const element = document.body;
    const opt = {
        margin:       0.5,
        filename:     'my-storyboard.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'landscape' }
    };

    html2pdf().set(opt).from(element).save();
}
